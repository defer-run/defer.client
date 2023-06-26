import { NextRequest, NextResponse } from "next/server";
import { getExecution } from "../getExecution";
import type { DeferRetFn } from "..";
import { APIError } from "../errors";

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

export function asNextRoute<F extends (...args: any) => Promise<any>>(
  deferFn: DeferRetFn<F>,
  options?: Options<F>
): DeferNextRoute {
  return {
    GetHandler: async (request: NextRequest) => {
      const id = request.nextUrl.searchParams.get("id");
      if (id) {
        try {
          const { state, result } = await getExecution(id);
          return NextResponse.json({ id, state, result });
        } catch (e: unknown) {
          if (e instanceof APIError) {
            return NextResponse.json(
              { id, error: e.toString() },
              {
                status: 500,
              }
            );
          } else {
            return NextResponse.json(
              { id, error: "Unexpected error." },
              {
                status: 500,
              }
            );
          }
        }
      } else {
        return NextResponse.json(
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
        return NextResponse.json(execution);
      } else {
        return NextResponse.json(
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
