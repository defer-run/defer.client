import { asNextRoute } from "../../../src/next";
import helloWorld from "./helloWorld";

const { GetHandler, PostHandler } = asNextRoute(helloWorld, {
  // @ts-expect-error too strict return type
  async proxy(request) {
    const args = await requeston();
    return [`prefix-${args[0]}`];
  },
});

export const GET = GetHandler;
export const POST = PostHandler;
