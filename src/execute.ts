/* eslint-disable @typescript-eslint/no-explicit-any */
import { FN_EXECUTION_POLLING_INTERVAL_SECS } from "./constants.js";
import type { DeferConfiguredFetcher } from "./fetcher.js";

export interface DeferExecuteResponse {
  id?: string;
  error?: string;
  __deferExecutionResponse?: boolean;
}

export function executeBackgroundFunction(
  fnName: string,
  args: any[],
  fetcher: DeferConfiguredFetcher,
  debug = false
): Promise<DeferExecuteResponse> {
  return new Promise<DeferExecuteResponse>((resolve, reject) => {
    const body = serializeBackgroundFunctionArguments(fnName, args);
    if (!body) {
      throw new Error(`[defer.run][${fnName}] failed to serialize arguments`);
    }
    fetcher("enqueue", {
      method: "POST",
      body,
    }).then(
      async (resp) => {
        if (debug) {
          console.log(
            `[defer.run][${fnName}] response[${resp.statusText}]: ${await resp
              .clone()
              .text()}`
          );
        }
        try {
          const result = (await resp.json()) as DeferExecuteResponse;
          if (result.error) {
            reject(new Error(result.error));
          } else {
            resolve({ ...result, __deferExecutionResponse: true });
          }
        } catch (error) {
          console.log(`[defer.run][${fnName}] Failed to execute: ${error}`);
          reject();
        }
      },
      (error) => {
        console.log(`[defer.run][${fnName}] Failed to execute: ${error}`);
        reject(error);
      }
    );
  });
}

export function serializeBackgroundFunctionArguments(
  fnName: string,
  args: any[]
) {
  let body: string | false = "[]";
  try {
    body = JSON.stringify({
      name: fnName,
      arguments: args,
    });
    return body;
  } catch (error) {
    console.log(
      `[defer.run][${fnName}] Failed to serialize arguments: ${error}`
    );
    return false;
  }
}

// export function unserializeBackgroundFunctionResult<R>(
//   fnName: string,
//   result: string
// ) {
//   let body: R;
//   try {
//     body = JSON.parse(result) as R;
//   } catch (error) {
//     console.log(
//       `[defer.run][${fnName}] Failed to parse function execution result: ${error}`
//     );
//   }
//   // @ts-expect-error fix with proper error handling
//   return body;
// }

export interface DeferExecutionResponse {
  id: string;
  state: "running" | "created" | "failed" | "succeed";
  result: any;
}

const jitter = (attempt: number) =>
  Math.floor(
    Math.random() *
      (Math.min(15, Math.pow(FN_EXECUTION_POLLING_INTERVAL_SECS * 2, attempt)) -
        0 +
        1) +
      0
  );

// TODO(charly): handler error cases
export function poolForExecutionResult<R>(
  fnName: string,
  runId: string,
  fetcher: DeferConfiguredFetcher,
  debug = false
): Promise<R> {
  let attempt = 1;
  const getResult = async () =>
    fetcher(`executions/${runId}`, {
      method: "GET",
    }).then(async (resp) => (await resp.json()) as DeferExecutionResponse);

  return new Promise<R>((resolve, reject) => {
    const poll = async () => {
      const result = await getResult();
      if (debug) {
        console.log(
          `[defer.run][${fnName}] execution polling response: ${JSON.stringify(
            result
          )}`
        );
      }
      if (result.result) {
        resolve(result.result);
        return;
      } else if (result.state === "failed") {
        // TODO
        // reject(result.error);
        reject(new Error("Defer execution failed"));
        return;
      }
      setTimeout(poll, jitter(attempt++) * 1000);
    };
    // initial call
    setTimeout(poll, jitter(attempt++) * 1000);
  });
}
