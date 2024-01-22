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
import { DeferableFunction, DeferredFunction } from "../index.js";
import { debug, info } from "../logger.js";
import {
  Duration,
  fromDurationToDate,
  randomUUID,
  sanitizeFunctionArguments,
  sleep,
} from "../utils.js";
import version from "../version.js";
import { Locker } from "./local/locker.js";

interface Execution {
  id: string;
  args: any;
  func: DeferableFunction;
  functionId: string;
  state: ExecutionState;
  result?: string;
  scheduleFor: Date;
  createdAt: Date;
  updatedAt: Date;
}

const stateLock = new Map<string, Locker>();
const executionState = new Map<string, Execution>();
const functionIdMapping = new Map<string, string>();
const functionConcurrency = new Map<string, number>();
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
  let ref = loop(getRunCond);
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
        const shouldRun =
          execution.state === "created" &&
          execution.createdAt < now &&
          (func.__metadata.concurrency === undefined ||
            (functionConcurrency.get(execution.functionId) || 0) <
              func.__metadata.concurrency);

        if (!shouldRun) continue;

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
          }

          const mut = stateLock.get(executionId) as Locker;
          const unlock = await mut.lock();
          try {
            const execution = executionState.get(executionId) as Execution;
            execution.state = state;
            execution.result = JSON.stringify(result);
            executionState.set(executionId, execution);
          } finally {
            unlock();
          }
        };
      } finally {
        unlock();
      }

      promisesState.add(perform());
    }

    await sleep(10);
  }

  await Promise.allSettled(promisesState.entries());
}

export async function enqueue<F extends DeferableFunction>(
  func: DeferredFunction<F>,
  args: Parameters<F>
): Promise<EnqueueResult> {
  debug("serializing function arguments", { function: func.name });
  const functionArguments = sanitizeFunctionArguments(args);

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
    func: func,
    args: functionArguments,
    scheduleFor: now,
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
  scheduleFor: Duration | Date | undefined
): Promise<RescheduleExecutionResult> {
  if (scheduleFor instanceof Date) {
    scheduleFor = scheduleFor;
  } else if (scheduleFor) {
    scheduleFor = fromDurationToDate(new Date(), scheduleFor);
  } else {
    scheduleFor = new Date();
  }

  const mut = stateLock.get(id);
  if (mut === undefined) throw new ExecutionNotFound(id);

  const unlock = await mut.lock();
  try {
    const execution = executionState.get(id) as Execution;

    if (execution.state !== "created")
      throw new ExecutionNotReschedulable(execution.state);

    execution.scheduleFor = new Date();
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
