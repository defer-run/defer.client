import { DeferExecutionTimeoutError } from "./errors.js";

export const timeoutable = <
  F extends (...args: any | undefined) => Promise<any>
>(
  fn: F,
  timeout: number
): F => {
  return ((...args: Parameters<F>) => {
    return new Promise((resolve, reject) => {
      let hasExecuted = false;

      const timeoutId = setTimeout(() => {
        if (!hasExecuted) {
          reject(
            new DeferExecutionTimeoutError(
              `${fn.name} timeout after ${timeout}secs`
            )
          );
        }
      }, timeout) as unknown as number;

      // @ts-expect-error to solve
      fn(...args)
        .then(resolve, reject)
        .finally(() => {
          hasExecuted = true;
          clearTimeout(timeoutId);
        });
    });
  }) as F;
};
