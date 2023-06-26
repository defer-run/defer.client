import { useCallback, useRef, useState } from "react";
import { DeferRetFn } from "..";
import { ExecutionState, FetchExecutionResponse } from "../client";

export type UseDeferRoute<ARA extends boolean, A extends any[], R> = [
  execute: (...args: ARA extends true ? any : A) => void,
  state: {
    loading: boolean;
    result: R;
    error?: Error;
  }
];

// const [uploadFile, { loading, result: fileName, error }] = useDeferRoute(createThumbnails, { refreshInterval: 1000 });
export const useDeferRoute = <
  F extends (...args: any) => Promise<any>,
  HP extends boolean = false,
  R = ReturnType<F> extends Promise<infer RR> ? RR : ReturnType<F>,
  A extends any[] = Parameters<F>
>(
  deferFn: DeferRetFn<F>,
  { refreshInterval }: { hasProxy: HP; refreshInterval: number } = {
    refreshInterval: 500,
    // @ts-expect-error to refine
    hasProxy: false,
  }
): UseDeferRoute<HP, A, R> => {
  const routePath = deferFn.__metadata.nextRoute;
  const [status, setStatus] = useState<ExecutionState>();
  const [result, setResult] = useState<any>();
  const [error, setError] = useState<Error>();
  const intervalRef = useRef<number | null>();

  const NOTICE = `
  useDeferRoute() has been called with a Defer function missing the \`nextRoute\` option:

  export default defer(${
    (deferFn.__metadata as any).name
  }, { nextRoute: '/api/${(deferFn.__metadata as any).name}' })

  Then create the \`api/${
    (deferFn.__metadata as any).name
  }/route.ts\` file as follow:

  import { asNextRoute } from "@/defer-next/asNextRoute";
  import ${(deferFn.__metadata as any).name} from "@/defer/${
    (deferFn.__metadata as any).name
  }";

  const { GetHandler, PostHandler } = asNextRoute(${
    (deferFn.__metadata as any).name
  });

  export const GET = GetHandler;
  export const POST = PostHandler;
`;

  if (!routePath) {
    console.warn(NOTICE);
  }

  const pollExecution = (executionId: string) => async () => {
    const res = await fetch(`${routePath}?id=${executionId}`, {
      method: "GET",
    });
    const data = (await res.json()) as FetchExecutionResponse;
    setStatus(data.state);
    if (["succeed", "failed"].includes(data.state) && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      if (data.state === "succeed") {
        setResult(data.result);
      } else if (data.state === "failed") {
        setError(data.result);
      }
    }
  };

  const execute = useCallback(
    async (args: any) => {
      if (!routePath) {
        console.error(NOTICE);
        return;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        setResult(undefined);
        setError(undefined);
      }
      const result = await fetch(`${routePath}`, {
        method: "POST",
        body: JSON.stringify(args || []),
        headers: {
          "Content-type": "application/json",
        },
      });
      const data = await result.json();
      intervalRef.current = setInterval(
        pollExecution(data.id),
        Math.max(500, refreshInterval)
      ) as unknown as number;
    },
    [pollExecution, refreshInterval]
  );

  return [
    execute,
    {
      loading: !!status && status === "running",
      result,
      error,
    },
  ];
};
