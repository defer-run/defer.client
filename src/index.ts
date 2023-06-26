import parseDuration, { Units } from "parse-duration";
import { v4 as randomUUID } from "uuid";
import {
  INTERNAL_VERSION,
  RETRY_MAX_ATTEMPTS_PLACEHOLDER,
} from "./constants.js";

import {
  enqueueExecution,
  EnqueueExecutionResponse,
  ExecutionState,
  FetchExecutionResponse,
  waitExecutionResult,
} from "./client.js";
import { DeferError } from "./errors.js";
import { HTTPClient, makeHTTPClient } from "./httpClient.js";

interface Options {
  accessToken?: string;
  endpoint?: string;
  verbose?: boolean;
}

const withDelay = (dt: Date, delay: DelayString): Date =>
  new Date(dt.getTime() + parseDuration(delay));

export const __database = new Map<
  string,
  { id: string; state: ExecutionState; result?: any }
>();
let __accessToken: string | undefined = process.env["DEFER_TOKEN"];
let __endpoint = process.env["DEFER_ENDPOINT"] || "https://api.defer.run";
let __verbose = false;
export let __httpClient: HTTPClient | undefined;
if (__accessToken) __httpClient = makeHTTPClient(__endpoint, __accessToken);

export function configure(opts = {} as Options): void {
  if (opts.accessToken) __accessToken = opts.accessToken;
  if (opts.endpoint) __endpoint = opts.endpoint;
  if (opts.verbose) __verbose = opts.verbose;

  if (__accessToken) __httpClient = makeHTTPClient(__endpoint, __accessToken);

  return;
}

export const deferEnabled = () => !!__accessToken;

async function execLocally(
  id: string,
  fn: any,
  args: any
): Promise<FetchExecutionResponse> {
  let state: ExecutionState = "succeed";
  let originalResult: any;
  try {
    originalResult = await fn(...args);
  } catch (error) {
    const e = error as Error;
    state = "failed";
    originalResult = {
      name: e.name,
      message: e.message,
      cause: e.cause,
      stack: e.stack,
    };
  }

  let result: any;
  try {
    result = JSON.parse(JSON.stringify(originalResult || ""));
  } catch (error) {
    const e = error as Error;
    throw new DeferError(`cannot serialize function return: ${e.message}`);
  }

  const response = { id, state, result };
  __database.set(id, response);

  return response;
}

export type UnPromise<F> = F extends Promise<infer R> ? R : F;

export type DelayString = `${string}${Units}`;
export interface Metadata {
  [key: string]: string;
}
export interface DeferExecutionOptions {
  delay?: DelayString | Date;
  metadata?: Metadata;
}

export type DeferRetFnParameters<
  F extends (...args: any | undefined) => Promise<any>
> = [...first: Parameters<F>, options: DeferExecutionOptions];

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

export interface HasDeferMetadata {
  __metadata: {
    version: number;
    cron?: string;
    retry?: RetryPolicy;
    concurrency?: Concurrency | undefined;
    maxDuration?: number | undefined;
  };
}

export interface DeferRetFn<
  F extends (...args: any | undefined) => Promise<any>
> extends HasDeferMetadata {
  (...args: Parameters<F>): Promise<EnqueueExecutionResponse>;
  __fn: F;
  __execOptions?: DeferExecutionOptions;
}

export interface DeferScheduledFn<F extends (...args: never) => Promise<any>>
  extends HasDeferMetadata {
  (...args: Parameters<F>): void;
  __fn: F;
}

export interface DeferAwaitRetFn<
  F extends (...args: any | undefined) => Promise<any>
> {
  (...args: Parameters<F>): Promise<UnPromise<ReturnType<F>>>;
}

export interface Defer {
  <F extends (...args: any | undefined) => Promise<any>>(
    fn: F,
    options?: DeferOptions
  ): DeferRetFn<F>;
  cron: <F extends (args: never[]) => Promise<any>>(
    fn: F,
    schedule: string,
    options?: DeferOptions
  ) => DeferScheduledFn<F>;
}

export interface RetryPolicy {
  maxAttempts: number;
  initialInterval: number;
  randomizationFactor: number;
  multiplier: number;
  maxInterval: number;
}

export interface DeferOptions {
  retry?: boolean | number | Partial<RetryPolicy>;
  concurrency?: Concurrency;
  maxDuration?: number;
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

function parseRetryPolicy(options?: DeferOptions): RetryPolicy {
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

export const defer: Defer = (fn, options) => {
  const ret = async (
    ...args: Parameters<typeof fn>
  ): Promise<UnPromise<ReturnType<DeferRetFn<typeof fn>>>> => {
    if (__verbose) console.log(`[defer.run][${fn.name}] invoked.`);

    let functionArguments: any;
    try {
      functionArguments = JSON.parse(JSON.stringify(args));
    } catch (error) {
      const e = error as Error;
      throw new DeferError(`cannot serialize argument: ${e.message}`);
    }

    if (__httpClient) {
      return enqueueExecution(__httpClient, {
        name: fn.name,
        arguments: functionArguments,
        scheduleFor: new Date(),
        metadata: {},
      });
    }

    if (__verbose)
      console.log(`[defer.run][${fn.name}] defer ignore, no token found.`);

    const id = randomUUID();
    __database.set(id, { id: id, state: "running" });
    execLocally(id, fn, functionArguments);
    return { id };
  };

  ret.__fn = fn;
  ret.__metadata = {
    version: INTERNAL_VERSION,
    retry: parseRetryPolicy(options),
    concurrency: options?.concurrency,
    maxDuration: options?.maxDuration,
  };

  return ret;
};

defer.cron = (fn, schedule, options) => {
  const ret: DeferScheduledFn<typeof fn> = () => {
    throw new Error("`defer.cron()` functions should not be invoked.");
  };

  ret.__fn = fn;
  ret.__metadata = {
    version: INTERNAL_VERSION,
    cron: schedule,
    retry: parseRetryPolicy(options),
    concurrency: options?.concurrency,
    maxDuration: options?.maxDuration,
  };

  return ret;
};

interface DeferDelay {
  <F extends (...args: any | undefined) => Promise<any>>(
    deferFn: DeferRetFn<F>,
    delay: DelayString | Date
  ): DeferRetFn<F>;
}

/**
 * Delay the execution of a background function
 * @constructor
 * @param {Function} deferFn - A background function (`defer(...)` result)
 * @param {string|Date} delay - The delay (ex: "1h" or a Date object)
 * @returns Function
 */
export const delay: DeferDelay = (deferFn, delay) => {
  const delayedDeferFn = async (
    ...args: Parameters<typeof deferFn>
  ): Promise<UnPromise<ReturnType<DeferRetFn<typeof fn>>>> => {
    const fn = deferFn.__fn;
    let functionArguments: any;
    try {
      functionArguments = JSON.parse(JSON.stringify(args));
    } catch (error) {
      const e = error as Error;
      throw new DeferError(`cannot serialize argument: ${e.message}`);
    }

    if (__verbose) console.log(`[defer.run][${fn.name}] invoked.`);

    if (__httpClient) {
      let scheduleFor: Date;
      if (delay instanceof Date) {
        scheduleFor = delay;
      } else {
        const now = new Date();
        scheduleFor = withDelay(now, delay);
      }

      return enqueueExecution(__httpClient, {
        name: fn.name,
        arguments: functionArguments,
        scheduleFor,
        metadata: deferFn.__execOptions?.metadata || {},
      });
    }

    if (__verbose)
      console.log(`[defer.run][${fn.name}] defer ignore, no token found.`);

    const id = randomUUID();
    __database.set(id, { id: id, state: "running" });
    execLocally(id, fn, functionArguments);
    return { id };
  };

  delayedDeferFn.__fn = deferFn.__fn;
  delayedDeferFn.__metadata = deferFn.__metadata;
  delayedDeferFn.__execOptions = {
    ...deferFn.__execOptions,
    delay,
  };

  return delayedDeferFn;
};

interface DeferAddMetadata {
  <F extends (...args: any | undefined) => Promise<any>>(
    deferFn: DeferRetFn<F>,
    metadata: Metadata
  ): DeferRetFn<F>;
}

/**
 * Add metadata to the the execution of a background function
 * @constructor
 * @param {Function} deferFn - A background function (`defer(...)` result)
 * @param {Metadata} metadata - The metadata (ex: `{ foo: "bar" }`)
 * @returns Function
 */
export const addMetadata: DeferAddMetadata = (deferFn, metadata) => {
  const newMetadata = { ...deferFn.__execOptions?.metadata, ...metadata };
  const deferFnWithMetadata = async (
    ...args: Parameters<typeof deferFn>
  ): Promise<UnPromise<ReturnType<DeferRetFn<typeof fn>>>> => {
    const fn = deferFn.__fn;
    let functionArguments: any;
    try {
      functionArguments = JSON.parse(JSON.stringify(args));
    } catch (error) {
      const e = error as Error;
      throw new DeferError(`cannot serialize argument: ${e.message}`);
    }

    if (__verbose) console.log(`[defer.run][${fn.name}] invoked.`);

    if (__httpClient) {
      let scheduleFor: Date;
      const delay = deferFn.__execOptions?.delay;
      if (delay instanceof Date) {
        scheduleFor = delay;
      } else if (delay) {
        const now = new Date();
        scheduleFor = withDelay(now, delay);
      } else {
        scheduleFor = new Date();
      }

      return enqueueExecution(__httpClient, {
        name: fn.name,
        arguments: functionArguments,
        scheduleFor,
        metadata: newMetadata,
      });
    }

    if (__verbose)
      console.log(`[defer.run][${fn.name}] defer ignore, no token found.`);

    const id = randomUUID();
    __database.set(id, { id: id, state: "running" });
    execLocally(id, fn, functionArguments);
    return { id };
  };

  deferFnWithMetadata.__fn = deferFn.__fn;
  deferFnWithMetadata.__metadata = deferFn.__metadata;
  deferFnWithMetadata.__execOptions = {
    ...deferFn.__execOptions,
    metadata: newMetadata,
  };

  return deferFnWithMetadata;
};

interface DeferAwaitResult {
  <F extends (...args: any | undefined) => Promise<any>>(
    deferFn: DeferRetFn<F>
  ): DeferAwaitRetFn<F>;
}

/**
 * Trigger the execution of a background function and waits for its result
 * @constructor
 * @param {Function} deferFn - A background function (`defer(...)` result)
 * @returns Function
 */
export const awaitResult: DeferAwaitResult =
  (deferFn) =>
  async (...args: Parameters<typeof deferFn>) => {
    const fnName = deferFn.__fn.name;
    const fn = deferFn.__fn;
    let functionArguments: any;
    try {
      functionArguments = JSON.parse(JSON.stringify(args));
    } catch (error) {
      const e = error as Error;
      throw new DeferError(`cannot serialize argument: ${e.message}`);
    }

    let response: FetchExecutionResponse;
    if (__httpClient) {
      const { id } = await enqueueExecution(__httpClient, {
        name: fnName,
        arguments: functionArguments,
        scheduleFor: new Date(),
        metadata: {},
      });

      response = await waitExecutionResult(__httpClient, { id: id });
    } else {
      const id = randomUUID();
      __database.set(id, { id: id, state: "running" });
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

// EXAMPLES:

// interface Contact {
//   id: string;
//   name: string;
// }

// const importContacts = (companyId: string, contacts: Contact[]) => {
//   return new Promise<{ imported: number; companyId: string }>((resolve) => {
//     console.log(`Start importing contacts for company#${companyId}`);
//     setTimeout(() => {
//       console.log(contacts);
//       console.log("Done.");
//       resolve({ imported: 10000, companyId });
//     }, 5000);
//   });
// };

// const importContactsD = defer(importContacts);

// async function myFunction() {
//   return 1;
// }

// defer.cron(myFunction, "every day");

// async function test() {
//   await importContactsD("1", []); // fire and forget

//   const r = await importContactsD.await("1", []); // wait for execution result

//   const awaitImportContact = awaitResult(importContactsD);
//   const result = await awaitImportContact("1", []);
// }

// // Delayed

// const delayed = delay(importContactsD, "1h");
// delayed("", []);

// // Retry options

// const importContactsRetried = defer(importContacts, { retry: 3 });
