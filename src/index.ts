/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Units } from "parse-duration";
import { DOMAIN, INTERNAL_VERSION, PATH, TOKEN_ENV_NAME } from "./constants.js";
import {
  DeferExecuteResponse,
  executeBackgroundFunction,
  poolForExecutionResult,
  serializeBackgroundFunctionArguments,
} from "./execute.js";
import { makeFetcher } from "./fetcher.js";

export type { DeferExecuteResponse } from "./execute.js";

interface Options {
  apiToken?: string;
  apiUrl?: string;
  debug?: boolean;
}

let token: string | undefined = process.env[TOKEN_ENV_NAME];
let apiEndpoint = `${DOMAIN}${PATH}`;

let debug = false;

let fetcher = token ? makeFetcher(apiEndpoint, token) : undefined;

export const init = ({ apiToken, apiUrl, debug: debugValue }: Options) => {
  token = apiToken || process.env[TOKEN_ENV_NAME];
  apiEndpoint = apiUrl || `${DOMAIN}${PATH}`;
  debug = debugValue || debug;
  fetcher = token ? makeFetcher(apiEndpoint, token) : undefined;
};

type UnPromise<F> = F extends Promise<infer R> ? R : F;

export type DelayString = `${string}${Units}`;
export interface DeferExecutionOptions {
  delay: DelayString | Date;
}

type DeferRetFnParameters<
  F extends (...args: any | undefined) => Promise<any>
> = [...first: Parameters<F>, options: DeferExecutionOptions];

interface DeferRetFn<F extends (...args: any | undefined) => Promise<any>> {
  (...args: Parameters<F>): ReturnType<F>;
  __fn: F;
  __version: number;
  await: DeferAwaitRetFn<F>;
  delayed: (...args: DeferRetFnParameters<F>) => ReturnType<F>;
}
interface DeferAwaitRetFn<
  F extends (...args: any | undefined) => Promise<any>
> {
  (...args: Parameters<F>): Promise<UnPromise<ReturnType<F>>>;
}

interface Defer {
  <F extends (...args: any | undefined) => Promise<any>>(fn: F): DeferRetFn<F>;
}

export const isDeferExecution = (obj: any): obj is DeferExecuteResponse =>
  !!obj.__deferExecutionResponse;

export const defer: Defer = (fn) => {
  const ret: DeferRetFn<typeof fn> = (...args: Parameters<typeof fn>) => {
    if (debug) {
      console.log(`[defer.run][${fn.name}] invoked.`);
    }
    if (token && fetcher) {
      return executeBackgroundFunction(fn.name, args, fetcher, debug);
    } else {
      if (debug) {
        console.log(`[defer.run][${fn.name}] defer ignore, no token found.`);
      }
      // try to serialize arguments for develpment warning purposes
      serializeBackgroundFunctionArguments(fn.name, args);
      // FIX: do better
      return fn(...(args as any)) as any;
    }
  };
  ret.__fn = fn;
  ret.__version = INTERNAL_VERSION;
  ret.await = async (...args) => {
    const executionResult = (await defer(fn)(...args)) as UnPromise<
      ReturnType<typeof fn>
    >;

    if (isDeferExecution(executionResult)) {
      return await poolForExecutionResult<UnPromise<ReturnType<typeof fn>>>(
        fn.name,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        executionResult.id!,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        fetcher!,
        debug
      );
    } else {
      return Promise.resolve(executionResult);
    }
  };
  ret.delayed = (...args) => {
    if (debug) {
      console.log(`[defer.run][${fn.name}] invoked.`);
    }
    const [options] = args.splice(-1);
    if (token && fetcher) {
      return executeBackgroundFunction(fn.name, args, fetcher, debug, options);
    } else {
      if (debug) {
        console.log(`[defer.run][${fn.name}] defer ignore, no token found.`);
      }
      // try to serialize arguments for develpment warning purposes
      serializeBackgroundFunctionArguments(fn.name, args);
      // FIX: do better
      return fn(...(args as any)) as any;
    }
  };
  return ret as any;
};

// EXAMPLES:
//
// interface Contact {
//   id: string;
//   name: string;
// }
//
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
//
// const importContactsD = defer(importContacts);
//
// async function test() {
//   await importContactsD("1", []); // fire and forget
//
//   await importContactsD.await("1", []); // wait for execution result
//
//   await importContactsD.delayed("1", [], { delay: "2 days" }); // scheduled
// }
