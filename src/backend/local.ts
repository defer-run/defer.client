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

import { EnqueueResult } from "../backend.js";
import { DeferableFunction, DeferredFunction } from "../index.js";
import { error, info } from "../logger";
import { randomUUID } from "../utils";

const executionState = new Map<string, string>();
const promiseState = new Map<string, () => Promise<void>>();
const executionResult = new Map<string, any>();

export async function enqueue<F extends DeferableFunction>(
  func: DeferredFunction<F>,
  args: Parameters<F>
): Promise<EnqueueResult> {
  {
    const executionId = randomUUID();
    executionState.set(executionId, "created");
    info("execution created", {
      functionName: func.name,
      executionId: executionId,
    });

    const execution = async () => {
      info("starting execution", {
        functionName: func.name,
        executionId: executionId,
      });
      executionState.set(executionId, "started");
      try {
        const result = await func(args);
        executionState.set(executionId, "succeed");
        executionResult.set(
          executionId,
          JSON.parse(JSON.stringify(result || ""))
        );
        info("execution succeeded", {
          functionName: func.name,
          executionId: executionId,
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
          functionName: func.name,
          executionId: executionId,
        });
        throw err;
      }
    };

    promiseState.set(executionId, execution);

    return { id: executionId };
  }
}