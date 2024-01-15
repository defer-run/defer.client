// Copyright (c) 2021-2023 Defer SAS <hello@defer.run>.
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

import { DeferableFunction, DeferredFunction } from "../index.js";

export interface EnqueueResult {
  id: string;
}

export interface GetExecutionResult {
  id: string;
}

export interface CancelExecutionResult {
  id: string;
}

export interface RescheduleExecutionResult {
  id: string;
}

export interface Backend {
  enqueue<F extends DeferableFunction>(
    func: DeferredFunction<F>,
    args: Parameters<F>
  ): Promise<EnqueueResult>;
  getExecution(id: string): Promise<GetExecutionResult>;
  cancelExecution(id: string, force: boolean): Promise<CancelExecutionResult>;
  rescheduleExecution(
    id: string,
    scheduleFor: Duration | Date | undefined
  ): Promise<RescheduleExecutionResult>;
}
