import { ExecutionState, FetchExecutionResponse } from "./client.js";
import { DeferError } from "./errors.js";
import {
  DeferredFunction,
  __database,
  DeferableFunction,
  LocalManifest,
} from "./index";
import { Queue } from "./queue.js";

type Invocation<F extends DeferableFunction> = {
  id: string;
  func: DeferredFunction<F>;
  args: any;
  oncomplete: ((result: FetchExecutionResponse<any>) => void) | undefined;
  throwErrors?: boolean;
};
type FunctionConfiguration<F extends DeferableFunction> = LocalManifest & {
  queue: Queue<Invocation<F>>;
};
const fns: Record<string, FunctionConfiguration<any>> = {};

export function registerFunction<F extends DeferableFunction>(
  wrapped: DeferredFunction<F>
) {
  fns[wrapped.__localMetadata!.id] = {
    ...wrapped.__localMetadata!,
    queue: new Queue<Invocation<F>>(invoke, wrapped.__metadata.concurrency),
  };
}

export function execLocally<F extends DeferableFunction>(
  id: string,
  func: DeferredFunction<F>,
  args: any,
  throwErrors: boolean = false
): Promise<FetchExecutionResponse<any>> {
  return new Promise((resolve) => {
    fns[func.__localMetadata!.id]!.queue.push({
      id,
      func,
      args,
      oncomplete: resolve,
      throwErrors,
    });
  });
}

async function invoke(
  invocation: Invocation<any>,
  throwErrors: boolean = false
) {
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

    console.error(
      "Error in deferred function " +
        invocation.func.__fn.name +
        " (invocation " +
        invocation.id +
        "):\n",
      e
    );
  }

  let result: any;
  let executionError: Error | undefined;
  try {
    result = JSON.parse(JSON.stringify(originalResult || ""));
  } catch (error) {
    executionError = error as Error;
    throw new DeferError(
      `cannot serialize function return: ${executionError.message}`
    );
  }

  const response = { id: invocation.id, state, result };
  __database.set(invocation.id, response);

  // make sure to release the lock even in case of error
  invocation.oncomplete?.(response);

  if (executionError && throwErrors) {
    throw executionError;
  }
}
