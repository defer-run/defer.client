import {
  Backend,
  CancelExecutionResult,
  EnqueueResult,
  GetExecutionResult,
  RescheduleExecutionResult,
} from "./backend.js";
import * as localBackend from "./backend/local.js";
import * as remoteBackend from "./backend/remote.js";
import { APIError, DeferError } from "./errors.js";
import { Duration, fromDurationToDate, getEnv } from "./utils.js";
import version from "./version.js";

const INTERNAL_VERSION = 6;
const RETRY_MAX_ATTEMPTS_PLACEHOLDER = 13;

if (getEnv("DEFER_TOKEN") === undefined) {
  console.log(`
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
`);
}

let backend: Backend = localBackend;
if (getEnv("DEFER_TOKEN") !== undefined) backend = remoteBackend;

export const deferEnabled = () => !!getEnv("DEFER_TOKEN");

export interface ExecutionMetadata {
  [key: string]: string;
}

// https://stackoverflow.com/questions/39494689/is-it-possible-to-restrict-number-to-a-certain-range/70307091#70307091
type Enumerate<
  N extends number,
  Acc extends number[] = []
> = Acc["length"] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc["length"]]>;

type Range<F extends number, T extends number> = Exclude<
  Enumerate<T>,
  Enumerate<F>
>;

export type Concurrency = Range<0, 51>;

export type NextRouteString = `/api/${string}`;

export interface Manifest {
  id: string;
  name: string;
  version: number;
  cron?: string;
  retry?: RetryPolicy;
  concurrency?: Concurrency | undefined;
  maxDuration?: number | undefined;
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
  concurrency?: Concurrency;
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
  options?: DeferredFunctionConfiguration
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

export function defer<F extends DeferableFunction>(
  fn: F,
  config?: DeferredFunctionConfiguration
): DeferredFunction<F> {
  const wrapped = async function (
    ...args: Parameters<typeof fn>
  ): Promise<EnqueueResult> {
    return backend.enqueue(wrapped, args);
  };

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

defer.cron = function (
  fn: DeferableFunction,
  cronExpr: string,
  config?: DeferredFunctionConfiguration
): DeferredFunction<typeof fn> {
  const wrapped = async function (
    ...args: Parameters<typeof fn>
  ): Promise<EnqueueResult> {
    return backend.enqueue(wrapped, args);
  };

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
 * @param fn Duration
 * @param delay Duration | Date
 * @deprecated Prefer `assignOptions()` (https://docs.defer.run/references/defer-client/assign-options)
 * @returns
 */
export function delay<F extends DeferableFunction>(
  fn: DeferredFunction<F>,
  delay: Duration | Date
): DeferredFunction<F> {
  return assignOptions(fn, { delay });
}

/**
 * Add metadata to an execution
 * @param fn Duration
 * @param metadata Object
 * @deprecated Prefer `assignOptions()` (https://docs.defer.run/references/defer-client/assign-options)
 * @returns
 */
export function addMetadata<F extends DeferableFunction>(
  fn: DeferredFunction<F>,
  metadata: ExecutionMetadata
): DeferredFunction<F> {
  return assignOptions(fn, { metadata });
}

/**
 * Discard an execution if not started after a given interval
 * @param fn Duration
 * @param value Duration | Date
 * @deprecated Prefer `assignOptions()` (https://docs.defer.run/references/defer-client/assign-options)
 * @returns
 */
export function discardAfter<F extends DeferableFunction>(
  fn: DeferredFunction<F>,
  value: Duration | Date
): DeferredFunction<F> {
  return assignOptions(fn, { discardAfter: value });
}

export function assignOptions<F extends DeferableFunction>(
  fn: DeferredFunction<F>,
  options: ExecutionOptions
): DeferredFunction<F> {
  const wrapped = async function (
    ...args: Parameters<typeof fn>
  ): Promise<EnqueueResult> {
    return backend.enqueue(wrapped, args);
  };

  wrapped.__fn = fn.__fn;
  wrapped.__metadata = fn.__metadata;
  wrapped.__execOptions = { ...fn.__execOptions, ...options };
  return wrapped;
}

export function awaitResult<F extends DeferableFunction>(
  fn: DeferredFunction<F>
): (...args: Parameters<F>) => Promise<Awaited<ReturnType<F>>> {
  return async function (
    ...args: Parameters<F>
  ): Promise<Awaited<ReturnType<F>>> {
    const originalFunction = fn.__fn;
    const functionArguments = sanitizeFunctionArguments(args);
    const httpClient = getHTTPClient();

    let response: client.FetchExecutionResponse;
    if (httpClient) {
      const { id } = await client.enqueueExecution(httpClient, {
        name: originalFunction.name,
        arguments: functionArguments,
        scheduleFor: new Date(),
        metadata: {},
      });
      response = await client.waitExecutionResult(httpClient, { id: id });
    } else {
      const id = randomUUID();
      __database.set(id, { id: id, state: "started" });
      response = await execLocally(id, fn, functionArguments);
    }

    if (response.state === "failed") {
      let error = new DeferError("Defer execution failed");
      if (response.result?.message) {
        error = new DeferError(response.result.message);
        error.stack = response.result.stack;
      } else if (response.result) {
        error = response.result;
      }
      throw error;
    }

    return response.result;
  };
}

export async function getExecution(id: string): Promise<GetExecutionResult> {
  return backend.getExecution(id);
}

export async function cancelExecution(
  id: string,
  force = false
): Promise<CancelExecutionResult> {
  return backend.cancelExecution(id, force);
}

export async function getExecutionTries(
  id: string
): Promise<client.GetExecutionTriesResponse> {
  const httpClient = getHTTPClient();
  if (httpClient) return client.getExecutionTries(httpClient, { id });

  const response = __database.get(id);
  if (response)
    return Promise.resolve([{ id: response.id, state: response.state }]);

  throw new APIError("execution not found", "not found");
}

export async function rescheduleExecution(
  id: string,
  scheduleFor: Duration | Date | undefined
): Promise<RescheduleExecutionResult> {
  const now = new Date();

  if (scheduleFor === undefined) {
    scheduleFor = now;
  } else if (scheduleFor instanceof Date) {
    scheduleFor = scheduleFor;
  } else if (scheduleFor) {
    scheduleFor = fromDurationToDate(now, scheduleFor);
  }

  return backend.rescheduleExecution(id, scheduleFor);
}
