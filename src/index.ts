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

import {
  Backend,
  CancelExecutionResult,
  DeferError,
  EnqueueResult,
  ExecutionFilters,
  GetExecutionResult,
  ListExecutionAttemptsResult,
  ListExecutionsResult,
  PageRequest,
  ReRunExecutionResult,
  RescheduleExecutionResult,
} from "./backend.js";
import * as localBackend from "./backend/local.js";
import * as remoteBackend from "./backend/remote.js";
import { jitter } from "./jitter.js";
import { info, warn } from "./logger.js";
import { Duration, fromDurationToDate, getEnv, sleep } from "./utils.js";

const INTERNAL_VERSION = 6;
const RETRY_MAX_ATTEMPTS_PLACEHOLDER = 13;

export let backend: Backend = remoteBackend;
if (getEnv("DEFER_TOKEN") === undefined) {
  backend = localBackend;
  if (getEnv("DEFER_NO_LOCAL_SCHEDULER") === undefined) localBackend.start();
}

/**
 * Check if defer is enqueuing on the Defer cloud
 * @returns {boolean}
 */
export const deferEnabled = (): boolean => !!getEnv("DEFER_TOKEN");

export interface ExecutionMetadata {
  [key: string]: string;
}

export type NextRouteString = `/api/${string}`;

export interface Manifest {
  name: string;
  version: number;
  cron?: string;
  retry?: RetryPolicy;
  concurrency?: number | undefined;
  maxDuration?: number | undefined;
  maxConcurrencyAction: "keep" | "cancel" | undefined;
}

export interface RetryPolicy {
  maxAttempts: number;
  initialInterval: number;
  randomizationFactor: number;
  multiplier: number;
  maxInterval: number;
}

export type DeferableFunction = (...args: any) => Promise<any>;

export interface ExecutionOptions {
  delay?: Duration | Date;
  metadata?: ExecutionMetadata;
  discardAfter?: Duration | Date;
}

export interface DeferredFunction<F extends DeferableFunction> {
  (...args: Parameters<F>): Promise<EnqueueResult>;
  __metadata: Manifest;
  __fn: F;
  __execOptions?: ExecutionOptions;
}

export interface DeferredFunctionConfiguration {
  retry?: boolean | number | Partial<RetryPolicy>;
  concurrency?: number;
  maxDuration?: number;
  maxConcurrencyAction?: "keep" | "cancel";
}

function defaultRetryPolicy(): RetryPolicy {
  return {
    maxAttempts: 0,
    initialInterval: 30,
    randomizationFactor: 0.5,
    multiplier: 1.5,
    maxInterval: 60 * 10,
  };
}

function parseRetryPolicy(
  options?: DeferredFunctionConfiguration,
): RetryPolicy {
  const retryPolicy: RetryPolicy = defaultRetryPolicy();
  switch (typeof options?.retry) {
    case "boolean": {
      if (options.retry) {
        retryPolicy.maxAttempts = RETRY_MAX_ATTEMPTS_PLACEHOLDER;
      }
      break;
    }
    case "number": {
      retryPolicy.maxAttempts = options.retry;
      break;
    }
    case "object": {
      if (options.retry.maxAttempts) {
        retryPolicy.maxAttempts = options.retry.maxAttempts;
      } else {
        options.retry.maxAttempts = RETRY_MAX_ATTEMPTS_PLACEHOLDER;
      }

      if (options.retry.initialInterval)
        retryPolicy.initialInterval = options.retry.initialInterval;

      if (options.retry.randomizationFactor)
        retryPolicy.randomizationFactor = options.retry.randomizationFactor;

      if (options.retry.multiplier)
        retryPolicy.multiplier = options.retry.multiplier;

      if (options.retry.maxInterval)
        retryPolicy.maxInterval = options.retry.maxInterval;

      break;
    }
    case "undefined": {
      retryPolicy.maxAttempts = 0;
      break;
    }
    default: {
      throw new Error("invalid retry options");
    }
  }

  return retryPolicy;
}

async function enqueue<F extends DeferableFunction>(
  func: DeferredFunction<F>,
  ...args: Parameters<F>
): Promise<EnqueueResult> {
  let scheduleFor: Date;
  let discardAfter: Date | undefined;

  const delay = func.__execOptions?.delay;
  if (delay instanceof Date) {
    scheduleFor = delay;
  } else if (delay) {
    const now = new Date();
    scheduleFor = fromDurationToDate(now, delay);
  } else {
    scheduleFor = new Date();
  }

  const after = func.__execOptions?.discardAfter;
  if (after instanceof Date) {
    discardAfter = after;
  } else if (after) {
    const now = new Date();
    discardAfter = fromDurationToDate(now, after);
  }

  const metadata = func.__execOptions?.metadata
    ? func.__execOptions?.metadata
    : undefined;
  const response = await backend.enqueue(
    func,
    args,
    scheduleFor,
    discardAfter,
    metadata,
  );

  info("execution enqueued", {
    id: response.id,
    function: response.functionName,
  });

  return response;
}

/**
 * Define a deferred function
 * @template F
 * @param {F} fn
 * @param {DeferredFunctionConfiguration=} config
 * @returns {DeferredFunction<F>}
 */
export function defer<F extends DeferableFunction>(
  fn: F,
  config?: DeferredFunctionConfiguration,
): DeferredFunction<F> {
  const wrapped: DeferredFunction<F> = async (
    ...args: Parameters<F>
  ): Promise<EnqueueResult> => enqueue(wrapped, ...args);
  wrapped.__fn = fn;
  wrapped.__metadata = {
    name: fn.name,
    version: INTERNAL_VERSION,
    retry: parseRetryPolicy(config),
    concurrency: config?.concurrency,
    maxDuration: config?.maxDuration,
    maxConcurrencyAction: config?.maxConcurrencyAction,
  };

  return wrapped;
}

/**
 * Define a defer cron
 * @template F
 * @param {F} fn
 * @param {string} cronExpr
 * @param {DeferredFunctionConfiguration=} config
 * @returns {DeferredFunction<F>}
 */
defer.cron = function <F extends DeferableFunction>(
  fn: F,
  cronExpr: string,
  config?: DeferredFunctionConfiguration,
): DeferredFunction<F> {
  const wrapped: DeferredFunction<F> = async (
    ...args: Parameters<F>
  ): Promise<EnqueueResult> => enqueue(wrapped, ...args);

  wrapped.__fn = fn;
  wrapped.__metadata = {
    name: fn.name,
    version: INTERNAL_VERSION,
    retry: parseRetryPolicy(config),
    cron: cronExpr,
    concurrency: config?.concurrency,
    maxDuration: config?.maxDuration,
    maxConcurrencyAction: config?.maxConcurrencyAction,
  };

  return wrapped;
};

/**
 * Delay an execution
 * @template F
 * @param {DeferredFunction<F>} fn
 * @param {Duration | Date} delay
 * @deprecated Prefer `assignOptions()` (https://www.defer.run/docs/references/defer-client/assign-options)
 * @returns {DeferredFunction<F>}
 */
export function delay<F extends DeferableFunction>(
  fn: DeferredFunction<F>,
  delay: Duration | Date,
): DeferredFunction<F> {
  return assignOptions(fn, { delay });
}

/**
 * Add metadata to an execution
 * @template F
 * @param {DeferredFunction<F>} fn
 * @param {ExecutionMetadata} metadata
 * @deprecated Prefer `assignOptions()` (https://www.defer.run/docs/references/defer-client/assign-options)
 * @returns {DeferredFunction<F>}
 */
export function addMetadata<F extends DeferableFunction>(
  fn: DeferredFunction<F>,
  metadata: ExecutionMetadata,
): DeferredFunction<F> {
  return assignOptions(fn, { metadata });
}

/**
 * Discard an execution if not started after a given interval
 * @template F
 * @param {DeferredFunction<F>} fn
 * @param {Duration | Date} value
 * @deprecated Prefer `assignOptions()` (https://www.defer.run/docs/references/defer-client/assign-options)
 * @returns {DeferredFunction<F>}
 */
export function discardAfter<F extends DeferableFunction>(
  fn: DeferredFunction<F>,
  value: Duration | Date,
): DeferredFunction<F> {
  return assignOptions(fn, { discardAfter: value });
}

/**
 * Assign execution options to a deferred function
 * @template F
 * @param {DeferredFunction<F>} fn
 * @param {ExecutionOptions} options
 * @returns {DeferredFunction<F>}
 */
export function assignOptions<F extends DeferableFunction>(
  fn: DeferredFunction<F>,
  options: ExecutionOptions,
): DeferredFunction<F> {
  const wrapped: DeferredFunction<F> = async (
    ...args: Parameters<typeof fn>
  ): Promise<EnqueueResult> => enqueue(wrapped, ...args);

  wrapped.__fn = fn.__fn;
  wrapped.__metadata = fn.__metadata;
  wrapped.__execOptions = { ...fn.__execOptions, ...options };
  return wrapped;
}

/**
 * Get an execution
 * @async
 * @param {string} id
 * @throws {ExecutionNotFound} when execution does not exists
 * @throws {DeferError} when error is unknown
 * @returns {Promise<GetExecutionResult>}
 */
export async function getExecution(id: string): Promise<GetExecutionResult> {
  return backend.getExecution(id);
}

/**
 * Get an execution result
 * @async
 * @template T
 * @param {string} id
 * @throws {ExecutionNotFound} when execution does not exists
 * @throws {ExecutionResultNotAvailableYet} when result is not yet available
 * @throws {ExecutionResultNotAvailable} when there's no result
 * @throws {DeferError} when error is unknown
 * @returns {Promise<T>}
 */
export async function getExecutionResult<T = any>(id: string): Promise<T> {
  return backend.getExecutionResult(id) as T;
}

/**
 * Cancel an execution
 * @async
 * @param {string} id
 * @param {boolean} force
 * @throws {ExecutionNotFound} when execution does not exists
 * @throws {ExecutionAbortingAlreadyInProgress} when execution is started
 * @throws {ExecutionNotCancellable} when execution cannot be cancelled
 * @throws {DeferError} when error is unknown
 * @returns {Promise<CancelExecutionResult>}
 */
export async function cancelExecution(
  id: string,
  force: boolean = false,
): Promise<CancelExecutionResult> {
  return backend.cancelExecution(id, force);
}

/**
 * Reschedule an execution
 * @async
 * @param {string} id
 * @param {Duration | Date | undefined} value
 * @throws {ExecutionNotFound} when execution does not exists
 * @throws {ExecutionNotReschedulable} when execution has started and/or completed.
 * @throws {DeferError} when error is unknown
 * @returns {Promise<RescheduleExecutionResult>}
 */
export async function rescheduleExecution(
  id: string,
  value?: Duration | Date | undefined,
): Promise<RescheduleExecutionResult> {
  const now = new Date();
  let scheduleFor: Date;

  if (value instanceof Date) {
    scheduleFor = value;
  } else if (value) {
    scheduleFor = fromDurationToDate(now, value);
  } else {
    scheduleFor = now;
  }

  return backend.rescheduleExecution(id, scheduleFor);
}

/**
 * ReRun an execution
 * @async
 * @param {string} id
 * @throws {ExecutionNotFound} when execution does not exists
 * @throws {DeferError} when error is unknown
 * @returns {Promise<ReRunExecutionResult>}
 */
export async function reRunExecution(
  id: string,
): Promise<ReRunExecutionResult> {
  return backend.reRunExecution(id);
}

/**
 * List an execution attempts
 * @deprecated Prefer `listExecutionAttempts()` (https://www.defer.run/docs/references/defer-client/list-execution-attempts)
 * @async
 * @param {string} id
 * @throws {ExecutionNotFound} when execution does not exists
 * @throws {DeferError} when error is unknown
 * @returns {Promise<ListExecutionAttemptsResult>}
 */
export async function getExecutionTries(
  id: string,
): Promise<ListExecutionAttemptsResult> {
  warn(
    `"getExecutionTries" is deprecated and will be removed in future versions. Please use "listExecutionAttempts" instead.`,
  );
  return listExecutionAttempts(id);
}

/**
 * List an execution attempts
 * @async
 * @param {string} id
 * @param {PageRequest=} page
 * @param {ExecutionFilters=} filters
 * @throws {ExecutionNotFound} when execution does not exists
 * @throws {DeferError} when error is unknown
 * @returns {Promise<ListExecutionAttemptsResult>}
 */
export async function listExecutionAttempts(
  id: string,
  page?: PageRequest,
  filters?: ExecutionFilters,
): Promise<ListExecutionAttemptsResult> {
  return backend.listExecutionAttempts(id, page, filters);
}

/**
 * List executions
 * @async
 * @param {PageRequest=} page
 * @param {ExecutionFilters=} filters
 * @throws {DeferError} when error is unknown
 * @returns {Promise<ListExecutionsResult>}
 */
export async function listExecutions(
  page?: PageRequest,
  filters?: ExecutionFilters,
): Promise<ListExecutionsResult> {
  return backend.listExecutions(page, filters);
}

/**
 * Enqueue and wait for an execution result
 * @async
 * @template F
 * @param {DeferredFunction<F>} fn
 * @throws {ExecutionNotFound} when execution does not exists
 * @throws {ExecutionResultNotAvailableYet} when result is not yet available
 * @throws {ExecutionResultNotAvailable} when there's no result
 * @throws {DeferError} when error is unknown
 * @returns {Promise<Awaited<F>>}
 */
export function awaitResult<F extends DeferableFunction, R = ReturnType<F>>(
  fn: DeferredFunction<F>,
): (...args: Parameters<F>) => Promise<Awaited<R>> {
  return async function (...args: Parameters<F>): Promise<Awaited<R>> {
    const enqueueResponse = await enqueue(fn, ...args);
    await sleep(1000);

    let i = 0;
    for (;;) {
      i++;
      const response = await getExecution(enqueueResponse.id);
      switch (response.state) {
        case "failed": {
          const result = await getExecutionResult(enqueueResponse.id);
          let error = new DeferError(
            `execution ${enqueueResponse.id} has failed`,
          );
          if (result?.message) {
            error = new DeferError(result.message);
            error.stack = result.stack;
          } else if (result) {
            error = result;
          }
          throw error;
        }
        case "succeed":
          return await getExecutionResult<Awaited<R>>(enqueueResponse.id);
        case "aborted":
        case "cancelled":
        case "discarded":
          throw new DeferError(
            `execution "${enqueueResponse.id}" was "${response.state}"`,
          );
        default:
          await sleep(jitter(i) * 1000);
      }
    }
  };
}