/* eslint-disable @typescript-eslint/no-explicit-any */
import { DOMAIN, PATH, TOKEN_ENV_NAME } from "./constants.js";
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

interface DeferRetFn<F extends (...args: any | undefined) => Promise<any>> {
  (...args: Parameters<F>): ReturnType<F>;
  __fn: F;
}
interface DeferAwaitRetFn<
  F extends (...args: any | undefined) => Promise<any>
> {
  (...args: Parameters<F>): Promise<UnPromise<ReturnType<F>>>;
  __fn: F;
}

interface Defer {
  <F extends (...args: any | undefined) => Promise<any>>(fn: F): DeferRetFn<F>;
  await: <F extends (...args: any | undefined) => Promise<any>>(
    fn: F
  ) => DeferAwaitRetFn<F>;
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
  return ret as any;
};

defer.await = (fn) => {
  const ret: DeferAwaitRetFn<typeof fn> = async (
    ...args: Parameters<typeof fn>
  ) => {
    const executionResult = await defer(fn)(...args);

    // an exception is raised in case of failed execution creation, the below code becoming unreachable
    return await poolForExecutionResult<UnPromise<ReturnType<typeof fn>>>(
      fn.name,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      executionResult.id!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      fetcher!,
      debug
    );
  };
  ret.__fn = fn;
  return ret as any;
};
