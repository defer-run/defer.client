import { ExecutionState, FetchExecutionResponse } from "./client.js";
import { DeferError } from "./errors.js";
import {
  DeferredFunction,
  __database,
  DeferableFunction,
  Manifest,
} from "./index";
import { Queue } from "./queue.js";

type Invocation<F extends DeferableFunction> = {
  id: string;
  func: DeferredFunction<F>
  args: any
  oncomplete: ((result: FetchExecutionResponse<any>) => void) | undefined
};
type FunctionConfiguration<F extends DeferableFunction> = Manifest & {
  queue: Queue<Invocation<F>>;
};
const fns: Record<string, FunctionConfiguration<any>> = {};

export function setupFn<F extends DeferableFunction>(metadata: Manifest) {
  fns[metadata.id] = {
    ...metadata,
    queue: new Queue<Invocation<F>>(invoke, metadata.concurrency),
  };
}

export function execLocally<F extends DeferableFunction>(
  id: string,
  func: DeferredFunction<F>,
  args: any
): Promise<FetchExecutionResponse<any>> {
  return new Promise(resolve => {
    fns[func.__metadata.id]!.queue.push({
      id,
      func,
      args,
      oncomplete: resolve
    });
  })
}

async function invoke(invocation: Invocation<any>) {
    __database.set(invocation.id, { id: invocation.id, state: "started" });
    let state: ExecutionState = "succeed";
    let originalResult: any;
    try {
      originalResult = await invocation.func.__fn(...invocation.args);
    } catch (error) {
      const e = error as Error;
      state = "failed";
      originalResult = {
        name: e.name,
        message: e.message,
        cause: e.cause,
        stack: e.stack,
      };

      console.error('Error in deferred function ' + invocation.func.__fn.name + ' (invocation ' + invocation.id + '):\n', e)
    }
  
    let result: any;
    try {
      result = JSON.parse(JSON.stringify(originalResult || ""));
    } catch (error) {
      const e = error as Error;
      throw new DeferError(`cannot serialize function return: ${e.message}`);
    }
  
    const response = { id: invocation.id, state, result }
    __database.set(invocation.id, response);

    invocation.oncomplete?.(response)
  
}