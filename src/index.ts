/* eslint-disable @typescript-eslint/no-explicit-any */
import parseDuration, { Units } from "parse-duration";
import { INTERNAL_VERSION } from "./constants.js";

const FakeID = "00000000000000000000000000000000";

import {
  enqueueExecution,
  EnqueueExecutionResponse,
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

let __accessToken: string | undefined = process.env["DEFER_TOKEN"];
let __endpoint = "https://api.defer.run";
let __verbose = false;
let __httpClient: HTTPClient | undefined;
if (__accessToken) __httpClient = makeHTTPClient(__endpoint, __accessToken);

export function configure(opts = {} as Options): void {
  if (opts.accessToken) __accessToken = opts.accessToken;
  if (opts.endpoint) __endpoint = opts.endpoint;
  if (opts.verbose) __verbose = opts.verbose;

  if (__accessToken) __httpClient = makeHTTPClient(__endpoint, __accessToken);

  return;
}

export type UnPromise<F> = F extends Promise<infer R> ? R : F;

export type DelayString = `${string}${Units}`;
export interface DeferExecutionOptions {
  delay: DelayString | Date;
}

export type DeferRetFnParameters<
  F extends (...args: any | undefined) => Promise<any>
> = [...first: Parameters<F>, options: DeferExecutionOptions];

export type RetryNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type Concurrency =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
  | 32
  | 33
  | 34
  | 35
  | 36
  | 37
  | 38
  | 39
  | 40
  | 41
  | 42
  | 43
  | 44
  | 45
  | 46
  | 47
  | 48
  | 49
  | 50;

export interface HasDeferMetadata {
  __metadata: {
    version: number;
    cron?: string;
    retry?: RetryNumber;
    concurrency?: Concurrency;
  };
}

export interface DeferRetFn<
  F extends (...args: any | undefined) => Promise<any>
> extends HasDeferMetadata {
  (...args: Parameters<F>): Promise<EnqueueExecutionResponse>;
  __fn: F;
  await: DeferAwaitRetFn<F>;
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
    schedule: string
  ) => DeferScheduledFn<F>;
}

export interface DeferOptions {
  retry?: boolean | RetryNumber;
  concurrency?: Concurrency;
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
      });
    }

    if (__verbose)
      console.log(`[defer.run][${fn.name}] defer ignore, no token found.`);

    await fn(...functionArguments);

    return { id: FakeID };
  };

  ret.__fn = fn;
  let retryPolicy: RetryNumber = 0;
  if (options?.retry === true) {
    retryPolicy = 12;
  }
  if (typeof options?.retry === "number") {
    retryPolicy = options.retry;
  }
  ret.__metadata = { version: INTERNAL_VERSION, retry: retryPolicy };
  ret.await = async (...args: Parameters<typeof fn>) => {
    let functionArguments: any;
    try {
      functionArguments = JSON.parse(JSON.stringify(args));
    } catch (error) {
      const e = error as Error;
      throw new DeferError(`cannot serialize argument: ${e.message}`);
    }

    if (__httpClient) {
      const { id } = await enqueueExecution(__httpClient, {
        name: fn.name,
        arguments: functionArguments,
        scheduleFor: new Date(),
      });

      const response = await waitExecutionResult(__httpClient, { id: id });

      if (response.state === "failed") {
        let error = new Error("Defer execution failed");
        if (response.result?.message) {
          error = new Error(response.result.message);
          error.stack = response.result.stack;
        } else if (response.result) {
          error = response.result;
        }

        throw error;
      }

      return response.result;
    }

    try {
      return Promise.resolve(await fn(...functionArguments));
    } catch (error) {
      // const e = error as Error;
      let deferError: any = new Error("Defer execution failed");
      if (error instanceof Error) {
        deferError = new Error(error.message);
        deferError.stack = error.stack || "";
      } else {
        deferError = error;
      }

      throw error;
    }
  };

  return ret;
};

defer.cron = (fn, schedule) => {
  const ret: DeferScheduledFn<typeof fn> = () => {
    throw new Error("`defer.cron()` functions should not be invoked.");
  };

  ret.__fn = fn;
  ret.__metadata = {
    version: INTERNAL_VERSION,
    cron: schedule,
  };

  return ret;
};

interface DeferDelay {
  <F extends (...args: any | undefined) => Promise<any>>(
    deferFn: DeferRetFn<F>,
    delay: DelayString | Date
  ): (...args: Parameters<F>) => Promise<EnqueueExecutionResponse>;
}

/**
 * Delay the execution of a background function
 * @constructor
 * @param {Function} deferFn - A background function (`defer(...)` result)
 * @param {string|Date} delay - The delay (ex: "1h" or a Date object)
 * @returns Function
 */
export const delay: DeferDelay =
  (deferFn, delay) =>
  async (...args) => {
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
        scheduleFor: scheduleFor,
      });
    }

    if (__verbose)
      console.log(`[defer.run][${fn.name}] defer ignore, no token found.`);

    await fn(...functionArguments);

    return { id: FakeID };
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

//   await importContactsD.await("1", []); // wait for execution result

//   await importContactsD.delayed("1", [], { delay: "2 days" }); // scheduled
// }

// // Delayed

// const delayed = delay(importContactsD, "1h");
// delayed("", []);

// // Retry options

// const importContactsRetried = defer(importContacts, { retry: 3 });
