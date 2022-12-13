/* eslint-disable @typescript-eslint/no-explicit-any */
import { DOMAIN, PATH, TOKEN_ENV_NAME } from "./constants.js";
import {
  DeferExecuteResponse,
  executeBackgroundFunction,
  poolForExecutionResult,
  serializeBackgroundFunctionArguments,
} from "./execute.js";
import { makeFetcher } from "./fetcher.js";

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

interface Defer {
  <F extends (...args: any | undefined) => Promise<any>>(fn: F): (
    ...args: Parameters<F>
  ) => Promise<DeferExecuteResponse>;
  await: <F extends (...args: any | undefined) => Promise<any>>(
    fn: F
  ) => (
    ...args: Parameters<F>
  ) => Promise<DeferExecuteResponse | UnPromise<ReturnType<F>>>;
}

export const defer: Defer = (fn) => {
  const ret = (...args: Parameters<typeof fn>) => {
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
      return fn(...(args as any));
    }
  };
  return ret as any;
};

defer.await = (fn) => {
  const ret = async (...args: Parameters<typeof fn>) => {
    const executionResult = await defer(fn)(...args);

    if (executionResult.id) {
      return await poolForExecutionResult<ReturnType<typeof fn>>(
        fn.name,
        executionResult.id,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        fetcher!,
        debug
      );
    } else {
      throw new Error(executionResult.error || "Failed to create execution");
    }
  };
  return ret as any;
};
