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

import { DeferableFunction, DeferredFunction } from "./index.js";

export type ExecutionState =
  | "created"
  | "started"
  | "succeed"
  | "failed"
  | "cancelled"
  | "aborting"
  | "aborted"
  | "discarded";

export type ExecutionErrorCode = "ER0000" | "ER0001" | "ER0002" | "ER0003";

export interface Execution {
  id: string;
  state: ExecutionState;
  functionName: string;
  functionId: string;
  scheduledAt: Date;
  result?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startCursor: string | undefined;
  endCursor: string | undefined;
}

export interface PageResult<T> {
  data: T[];
  pageInfo: PageInfo;
}

export interface PageRequest {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
}

export interface DateInterval {
  from: Date;
  to: Date;
}

export interface ExecutionFilters {
  states?: ExecutionState[];
  functionIds?: string[];
  errorCodes?: ExecutionErrorCode[];
  executedBy?: string;
  startedAt?: DateInterval;
  scheduleAt?: DateInterval;
  metadata?: {
    key: string;
    values: string[];
  }[];
}

export type EnqueueResult = Execution;

export type GetExecutionResult = Execution;

export type CancelExecutionResult = Execution;

export type RescheduleExecutionResult = Execution;

export type ReRunExecutionResult = Execution;

export type ListExecutionsResult = PageResult<Execution>;

export type ListExecutionAttemptsResult = PageResult<Execution>;

export const errorMessage = (error: Error) => {
  let message = error.message;

  if (error.cause instanceof Error) {
    message = `${message}: ${errorMessage(error.cause)}`;
  } else {
    message = `${message}: ${String(error.cause)}`;
  }

  return message;
};

export class DeferError extends Error {
  constructor(msg: string) {
    super(msg);
    Object.setPrototypeOf(this, DeferError.prototype);
  }
}

export class ExecutionNotFound extends DeferError {
  constructor(msg: string) {
    super(msg);
    Object.setPrototypeOf(this, ExecutionNotFound.prototype);
  }
}

export class ExecutionNotCancellable extends DeferError {
  constructor(msg: string) {
    super(msg);
    Object.setPrototypeOf(this, ExecutionNotCancellable.prototype);
  }
}

export class ExecutionAbortingAlreadyInProgress extends DeferError {
  constructor(msg: string) {
    super(msg);
    Object.setPrototypeOf(this, ExecutionAbortingAlreadyInProgress.prototype);
  }
}

export class ExecutionNotReschedulable extends DeferError {
  constructor(state: string) {
    super(`cannot resechedule execution in "${state}" state`);
    Object.setPrototypeOf(this, ExecutionNotReschedulable.prototype);
  }
}

export interface Backend {
  enqueue<F extends DeferableFunction>(
    func: DeferredFunction<F>,
    args: Parameters<F>,
    scheduleFor: Date,
    discardAfter: Date | undefined,
    metadata: { [key: string]: string } | undefined
  ): Promise<EnqueueResult>;
  getExecution(id: string): Promise<GetExecutionResult>;
  cancelExecution(id: string, force: boolean): Promise<CancelExecutionResult>;
  reRunExecution(id: string): Promise<ReRunExecutionResult>;
  rescheduleExecution(
    id: string,
    scheduleFor: Date
  ): Promise<RescheduleExecutionResult>;
  listExecutions(
    page?: PageRequest,
    filters?: ExecutionFilters
  ): Promise<ListExecutionsResult>;
  listExecutionAttempts(
    id: string,
    page?: PageRequest,
    filters?: ExecutionFilters
  ): Promise<ListExecutionAttemptsResult>;
}
