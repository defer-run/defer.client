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
import { info } from "../logger.js";
import { randomUUID, sleep, stringify } from "../utils.js";
import version from "../version.js";
import { Counter } from "./local/counter.js";
import { Locker } from "./local/locker.js";

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

const stateLock = new Map<string, Locker>();
const executionState = new Map<string, Execution>();
const functionIdMapping = new Map<string, string>();
const concurrencyCounter = new Counter();

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
  console.log(banner);

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
  while (shouldRun()) {
    const now = new Date();
    for (const executionId of executionState.keys()) {
      let perform: () => Promise<void>;

      const mut = stateLock.get(executionId) as Locker;

      const unlock = await mut.lock();
      try {
        const execution = executionState.get(executionId) as Execution;
        const func = execution.func as DeferredFunction<typeof execution.func>;
        const args = execution.args;
        const shouldDiscard =
          execution.discardAfter !== undefined && execution.discardAfter > now;
        const shouldRun =
          execution.state === "created" &&
          execution.createdAt < now &&
          (func.__metadata.concurrency === undefined ||
            concurrencyCounter.getCount(execution.functionId) <
              func.__metadata.concurrency);

        if (shouldDiscard) {
          execution.state = "discarded";
          execution.updatedAt = new Date();
          executionState.set(executionId, execution);
          continue;
        }

        if (!shouldRun) continue;

        // TODO incr function counter
        await concurrencyCounter.incr(execution.functionId);
        execution.state = "started";
        executionState.set(executionId, execution);

        perform = async () => {
          let result: any;
          let state: ExecutionState;

          try {
            result = await func.__fn(...args);
            state = "succeed";
          } catch (e) {
            state = "failed";
          } finally {
            await concurrencyCounter.decr(execution.functionId);
          }

          const mut = stateLock.get(executionId) as Locker;
          const unlock = await mut.lock();
          try {
            const execution = executionState.get(executionId) as Execution;
            execution.state = state;
            execution.result = stringify(result);
            execution.updatedAt = new Date();
            executionState.set(executionId, execution);
          } finally {
            unlock();
          }
        };
        promisesState.add(perform());
      } finally {
        unlock();
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

  const mut = new Locker();
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

  stateLock.set(execution.id, mut);
  executionState.set(execution.id, execution);

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
  const mut = stateLock.get(id);
  if (mut === undefined) throw new ExecutionNotFound(id);

  const unlock = await mut.lock();
  try {
    const execution = executionState.get(id) as Execution;
    return {
      id,
      state: execution.state,
      functionName: execution.func.name,
      functionId: execution.functionId,
      createdAt: execution.createdAt,
      updatedAt: execution.updatedAt,
    };
  } finally {
    unlock();
  }
}

export async function cancelExecution(
  id: string,
  force: boolean
): Promise<CancelExecutionResult> {
  const mut = stateLock.get(id);
  if (mut === undefined) throw new ExecutionNotFound(id);

  const unlock = await mut.lock();
  try {
    const execution = executionState.get(id) as Execution;

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
    executionState.set(execution.id, execution);

    return {
      id,
      state: execution.state,
      functionName: execution.func.name,
      functionId: execution.functionId,
      createdAt: execution.createdAt,
      updatedAt: execution.updatedAt,
    };
  } finally {
    unlock();
  }
}

export async function rescheduleExecution(
  id: string,
  scheduleFor: Date
): Promise<RescheduleExecutionResult> {
  const mut = stateLock.get(id);
  if (mut === undefined) throw new ExecutionNotFound(id);

  const unlock = await mut.lock();
  try {
    const execution = executionState.get(id) as Execution;

    if (execution.state !== "created")
      throw new ExecutionNotReschedulable(execution.state);

    execution.scheduleFor = scheduleFor;
    execution.updatedAt = new Date();
    executionState.set(execution.id, execution);

    return {
      id,
      state: execution.state,
      functionName: execution.func.name,
      functionId: execution.functionId,
      createdAt: execution.createdAt,
      updatedAt: execution.updatedAt,
    };
  } finally {
    unlock();
  }
}
