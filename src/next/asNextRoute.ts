import type { NextRequest, NextResponse } from "next/server";
import { DeferError } from "../backend.js";
import {
  DeferredFunction,
  getExecution,
  getExecutionResult,
} from "../index.js";

export interface DeferNextRoute {
  GetHandler: (request: NextRequest) => Promise<NextResponse | Response>;
  PostHandler: (request: NextRequest) => Promise<NextResponse | Response>;
}

interface Options<
  F extends (...args: any) => Promise<R>,
  R = ReturnType<F> extends Promise<infer RR> ? RR : ReturnType<F>
> {
  proxy?: (request: NextRequest) => Promise<Parameters<F>>;
}

const ResponseJSON = Response.json;

export function asNextRoute<F extends (...args: any) => Promise<any>>(
  deferFn: DeferredFunction<F>,
  options?: Options<F>
): DeferNextRoute {
  return {
    GetHandler: async (request: NextRequest) => {
      const id = request.nextUrl.searchParams.get("id");
      if (id) {
        try {
          let result: any = undefined;
          const { state } = await getExecution(id);
          if (state === "succeed" || state === "failed") {
            result = await getExecutionResult(id);
          }

          return ResponseJSON({ id, state, result });
        } catch (e: unknown) {
          if (e instanceof DeferError) {
            return ResponseJSON(
              { id, error: e.toString() },
              {
                status: 500,
              }
            );
          } else {
            return ResponseJSON(
              { id, error: "Unexpected error." },
              {
                status: 500,
              }
            );
          }
        }
      } else {
        return ResponseJSON(
          { error: "missing `id` query parameter from `useDeferRoute()`" },
          { status: 400 }
        );
      }
    },

    PostHandler: async (request: NextRequest) => {
      const args: any = options?.proxy
        ? await options.proxy(request)
        : await request.json();
      if (Array.isArray(args)) {
        // @ts-expect-error Charly: need to be refined
        const execution = await deferFn(...args);
        return ResponseJSON(execution);
      } else {
        return ResponseJSON(
          {
            error: `\`args\` should be an array ${
              options?.proxy ? "- check your `proxy()`" : ""
            }`,
          },
          { status: 400 }
        );
      }
    },
  };
}
