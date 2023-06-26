import { asNextRoute } from "../../../src/next/asNextRoute";
import helloWorld from "./helloWorld";

const { GetHandler, PostHandler } = asNextRoute(helloWorld);

export const GET = GetHandler;
export const POST = PostHandler;
