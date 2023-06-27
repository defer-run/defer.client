"use client";
import { useCallback, useRef, useState } from "react";
import type { DeferRetFn } from "..";
import type { ExecutionState, FetchExecutionResponse } from "../client";

export type UseDeferRoute<ARA extends boolean, A extends any[], R> = [
  execute: (...args: ARA extends true ? any : A) => void,
  state: {
    loading: boolean;
    result: R;
    error?: Error | undefined;
  }
];

// const [uploadFile, { loading, result: fileName, error }] = useDeferRoute(createThumbnails, { refreshInterval: 1000 });
export const useDeferRoute = <
  DFR extends DeferRetFn<any> = any,
  F extends (...args: any[]) => Promise<any> = DFR extends DeferRetFn<infer RR>
    ? RR
    : any,
  HP extends boolean = false,
  R = ReturnType<F> extends Promise<infer RR> ? RR : ReturnType<F>,
  A extends any[] = Parameters<F>
>(
  routePath: string,
  { refreshInterval }: { hasProxy: HP; refreshInterval: number } = {
    refreshInterval: 500,
    // @ts-expect-error to refine
    hasProxy: false,
  }
): UseDeferRoute<HP, A, R> => {
  const [status, setStatus] = useState<ExecutionState>();
  const [result, setResult] = useState<any>();
  const [error, setError] = useState<Error | undefined>();
  const intervalRef = useRef<number | null>();

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
    async (...args: any[]) => {
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
      loading: !!status && ["started", "created", "running"].includes(status),
      result,
      error,
    },
  ];
};
