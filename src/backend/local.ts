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
  ExecutionState,
  GetExecutionResult,
  RescheduleExecutionResult,
} from "../backend.js";
import { DeferableFunction, DeferredFunction } from "../index.js";
import { error, info } from "../logger";
import { randomUUID } from "../utils";

const executionState = new Map<string, ExecutionState>();
const promiseState = new Map<string, () => Promise<void>>();
const executionResult = new Map<string, any>();
const executionLock = new Map<string, Locker>();

export async function enqueue<F extends DeferableFunction>(
  func: DeferredFunction<F>,
  args: Parameters<F>
): Promise<EnqueueResult> {
  const executionId = randomUUID();
  const mut = new Locker();

  executionLock.set(executionId, mut);
  const unlock = await mut.lock();
  try {
    executionState.set(executionId, "created");
    info("execution created", {
      function: func.name,
      execution: executionId,
    });

    const execution = async () => {
      info("starting execution", {
        function: func.name,
        execution: executionId,
      });
      executionState.set(executionId, "started");
      try {
        const result = await func(...args);
        executionState.set(executionId, "succeed");
        executionResult.set(
          executionId,
          JSON.parse(JSON.stringify(result || ""))
        );
        info("execution succeeded", {
          function: func.name,
          execution: executionId,
        });
      } catch (err) {
        const e: Error = err as Error;
        executionState.set(executionId, "failed");
        executionResult.set(executionId, {
          name: e.name,
          message: e.message,
          cause: e.cause,
          stack: e.stack,
        });
        error("execution failed", {
          function: func.name,
          execution: executionId,
        });
        throw err;
      }
    };

    promiseState.set(executionId, execution);

    return { id: executionId, state: "created" };
  } finally {
    unlock();
  }
}

export async function getExecution(id: string): Promise<GetExecutionResult> {
  const mut = executionLock.get(id);
  if (mut === undefined) throw new ExecutionNotFound(id);

  const unlock = await mut.lock();

  try {
    const state = executionState.get(id) as ExecutionState;
    return { id, state };
  } finally {
    unlock();
  }
}

export async function cancelExecution(
  id: string,
  force: boolean
): Promise<CancelExecutionResult> {
  const mut = executionLock.get(id);
  if (mut === undefined) throw new ExecutionNotFound(id);

  const unlock = await mut.lock();
  try {
    const state = executionState.get(id) as ExecutionState;

    if (force) {
      switch (state) {
        case "aborting":
          throw new ExecutionAbortingAlreadyInProgress();
        case "created":
          executionState.set(id, "cancelled");
          break;
        case "started":
          executionState.set(id, "aborting");
          break;
        default:
          throw new ExecutionNotCancellable(state);
      }
    } else {
      switch (state) {
        case "created":
          executionState.set(id, "cancelled");
          break;
        default:
          throw new ExecutionNotCancellable(state);
      }
    }

    return { id, state };
  } finally {
    unlock();
  }
}

export async function rescheduleExecution(
  id: string,
  scheduleFor: Duration | Date | undefined
): Promise<RescheduleExecutionResult> {}
