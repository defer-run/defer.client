import { asNextRoute } from "../../../src";
import helloWorld from "./helloWorld";

const { GetHandler, PostHandler } = asNextRoute(helloWorld);

export const GET = GetHandler;
export const POST = PostHandler;
