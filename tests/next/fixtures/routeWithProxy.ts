import { asNextRoute } from "../../../src";
import helloWorld from "./helloWorld";

const { GetHandler, PostHandler } = asNextRoute(helloWorld, {
  // @ts-expect-error too strict return type
  async proxy(request) {
    const args = await request.json();
    return [`prefix-${args[0]}`];
  },
});

export const GET = GetHandler;
export const POST = PostHandler;
