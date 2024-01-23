// Copyright (c) 2023 Defer SAS <hello@defer.run>.
//
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
// REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
// AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
// INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
// LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
// OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
// PERFORMANCE OF THIS SOFTWARE.

import {
  CancelExecutionResult,
  EnqueueResult,
  ExecutionAbortingAlreadyInProgress,
  ExecutionNotCancellable,
  ExecutionNotFound,
  ExecutionNotReschedulable,
  ExecutionState,
  GetExecutionResult,
  RescheduleExecutionResult,
} from "../backend.js";
import {
  DeferableFunction,
  DeferredFunction,
  ExecutionMetadata,
} from "../index.js";
import { error, info } from "../logger.js";
import { getEnv, randomUUID, sleep, stringify } from "../utils.js";
import version from "../version.js";
import { Counter } from "./local/counter.js";
import { KV } from "./local/kv.js";

interface Execution {
  id: string;
  args: string;
  func: DeferableFunction;
  functionId: string;
  state: ExecutionState;
  result?: string;
  scheduleFor: Date;
  discardAfter: Date | undefined;
  metadata: ExecutionMetadata;
  createdAt: Date;
  updatedAt: Date;
}

const concurrencyCounter = new Counter();
const executionsStore = new KV<Execution>();
const functionIdMapping = new Map<string, string>();
const promisesState = new Set<Promise<void>>();

const banner = `
   @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
   @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@         Defer ${version}
   @@@@       @@@     @@@@     @@@@         Running in development mode
   @@@@       @@@     @@@@     @@@@
   @@@@       @@@     @@@@     @@@@
   @@@@@@@@@@@@@@     @@@@     @@@@
   @@@@               @@@@     @@@@         Website: https://www.defer.run
   @@@@               @@@@     @@@@         Documentation: https://defer.run/docs
   @@@@@@@@@@@@@@@@@@@@@@@     @@@@
   @@@@@@@@@@@@@@@@@@@@@@@     @@@@
   @@@@                        @@@@
   @@@@                        @@@@
   @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
   @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
`;

export function start(): () => Promise<void> {
  if (getEnv("DEFER_NO_BANNER") === undefined) {
    console.log(banner);
  }

  let runCond = true;
  const getRunCond = (): boolean => runCond;

  info("starting local backend");
  const ref = loop(getRunCond);
  info("local backend started");

  return async function () {
    info("stopping local backend");
    runCond = false;
    await ref;
    info("local backend stopped");
  };
}

async function loop(shouldRun: () => boolean): Promise<void> {
  // TODO handle error in the loop

  while (shouldRun()) {
    const now = new Date();
    for (const executionId of await executionsStore.keys()) {
      let shouldRun: boolean = false;

      const execution = await executionsStore.transaction(
        executionId,
        async (execution) => {
          const func = execution.func as DeferredFunction<
            typeof execution.func
          >;
          const shouldDiscard =
            execution.discardAfter !== undefined &&
            execution.discardAfter > now;

          shouldRun =
            execution.state === "created" &&
            execution.scheduleFor < now &&
            (func.__metadata.concurrency === undefined ||
              concurrencyCounter.getCount(execution.functionId) <
                func.__metadata.concurrency);

          if (shouldDiscard) {
            execution.state = "discarded";
            execution.updatedAt = new Date();
            return execution;
          }

          if (!shouldRun) return execution;

          await concurrencyCounter.incr(execution.functionId);
          execution.state = "started";
          execution.updatedAt = new Date();

          return execution;
        }
      );

      if (shouldRun) {
        const executionId = execution.id;
        const func = execution.func as DeferredFunction<typeof execution.func>;
        const args = JSON.parse(execution.args);

        const perform: () => Promise<void> = async () => {
          let result: any;
          let state: ExecutionState;

          info("starting execution", {
            id: executionId,
            function: func.__fn.name,
            scheduleFor: execution.scheduleFor,
          });

          try {
            result = await func.__fn(...args);
            state = "succeed";
            info("execution succeeded", {
              id: executionId,
              function: func.__fn.name,
            });
          } catch (e) {
            state = "failed";
            error("execution failed", {
              id: executionId,
              function: func.__fn.name,
              cause: (e as any).message,
            });
          } finally {
            await concurrencyCounter.decr(execution.functionId);
          }

          await executionsStore.transaction(executionId, async (execution) => {
            execution.state = state;
            execution.result = stringify(result);
            execution.updatedAt = new Date();
            return execution;
          });
        };

        promisesState.add(perform());
      }
    }

    await sleep(10);
  }

  await Promise.allSettled(promisesState.entries());
}

export async function enqueue<F extends DeferableFunction>(
  func: DeferredFunction<F>,
  args: Parameters<F>,
  scheduleFor: Date,
  discardAfter?: Date
): Promise<EnqueueResult> {
  let functionId = functionIdMapping.get(func.name);
  if (functionId === undefined) {
    functionId = randomUUID();
    functionIdMapping.set(func.name, functionId);
  }

  const now = new Date();
  const execution: Execution = {
    id: randomUUID(),
    state: "created",
    functionId: functionId,
    func,
    args,
    metadata: func.__execOptions?.metadata || {},
    scheduleFor,
    discardAfter,
    createdAt: now,
    updatedAt: now,
  };

  await executionsStore.set(execution.id, execution);

  return {
    id: execution.id,
    state: execution.state,
    functionName: execution.func.name,
    functionId: execution.functionId,
    createdAt: execution.createdAt,
    updatedAt: execution.updatedAt,
  };
}

export async function getExecution(id: string): Promise<GetExecutionResult> {
  const execution = await executionsStore.get(id);
  if (execution === undefined) throw new ExecutionNotFound(id);

  return {
    id,
    state: execution.state,
    functionName: execution.func.name,
    functionId: execution.functionId,
    createdAt: execution.createdAt,
    updatedAt: execution.updatedAt,
  };
}

export async function cancelExecution(
  id: string,
  force: boolean
): Promise<CancelExecutionResult> {
  let execution = await executionsStore.get(id);
  if (execution === undefined) throw new ExecutionNotFound(id);

  execution = await executionsStore.transaction(id, async (execution) => {
    if (force) {
      switch (execution.state) {
        case "aborting":
          throw new ExecutionAbortingAlreadyInProgress();
        case "created":
          execution.state = "cancelled";
          break;
        case "started":
          execution.state = "aborting";
          break;
        default:
          throw new ExecutionNotCancellable(execution.state);
      }
    } else {
      switch (execution.state) {
        case "created":
          execution.state = "cancelled";
          break;
        default:
          throw new ExecutionNotCancellable(execution.state);
      }
    }

    execution.updatedAt = new Date();
    return execution;
  });

  return {
    id,
    state: execution.state,
    functionName: execution.func.name,
    functionId: execution.functionId,
    createdAt: execution.createdAt,
    updatedAt: execution.updatedAt,
  };
}

export async function rescheduleExecution(
  id: string,
  scheduleFor: Date
): Promise<RescheduleExecutionResult> {
  let execution = await executionsStore.get(id);
  if (execution === undefined) throw new ExecutionNotFound(id);

  execution = await executionsStore.transaction(id, async (execution) => {
    if (execution.state !== "created")
      throw new ExecutionNotReschedulable(execution.state);

    execution.scheduleFor = scheduleFor;
    execution.updatedAt = new Date();
    return execution;
  });

  return {
    id,
    state: execution.state,
    functionName: execution.func.name,
    functionId: execution.functionId,
    createdAt: execution.createdAt,
    updatedAt: execution.updatedAt,
  };
}
