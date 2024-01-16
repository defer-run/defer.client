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
import { debug, info } from "../logger";
import {
  Duration,
  fromDurationToDate,
  randomUUID,
  sanitizeFunctionArguments,
} from "../utils";

interface Execution {
  id: string;
  args: string;
  state: ExecutionState;
  result?: string;
  scheduleFor: Date;
  createdAt: Date;
  updatedAt: Date;
}

const stateLock = new Map<string, Locker>();
const executionState = new Map<string, Execution>();

export async function enqueue<F extends DeferableFunction>(
  func: DeferredFunction<F>,
  args: Parameters<F>
): Promise<EnqueueResult> {
  debug("serializing function arguments", { function: func.name });
  const functionArguments = sanitizeFunctionArguments(args);

  const mut = new Locker();
  const now = new Date();
  const execution: Execution = {
    id: randomUUID(),
    state: "created",
    args: functionArguments,
    scheduleFor: now,
    createdAt: now,
    updatedAt: now,
  };

  stateLock.set(execution.id, mut);
  executionState.set(execution.id, execution);
  info("execution created", { function: func.name, execution: execution.id });

  return {
    id: execution.id,
    state: execution.state,
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
  if (scheduleFor instanceof Date) scheduleFor = scheduleFor;
  else if (scheduleFor)
    scheduleFor = fromDurationToDate(new Date(), scheduleFor);
  else scheduleFor = new Date();

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
      createdAt: execution.createdAt,
      updatedAt: execution.updatedAt,
    };
  } finally {
    unlock();
  }
}
