import { awaitResult, defer } from "../src";
import { DeferError } from "../src/errors";
import { makeHTTPClient } from "../src/httpClient";
import { jitter } from "../src/jitter";

jest.mock("../src/httpClient");
jest.mock("../src/jitter");
jest.setTimeout(20000);

describe("awaitResult(deferFn)", () => {
  describe("common", () => {
    it("defer() raises a type error is function is not async", () => {
      function myFunction(_customerId: string) {}

      // @ts-expect-error Type 'void' is not assignable to type 'Promise<any>'.ts(2345)
      const deferred = defer(myFunction);
    });
  });

  describe("when Defer is active (`DEFER_TOKEN` is set)", () => {
    describe("with successful functions execution", () => {
      beforeAll(() => {
        const responseFn = jest
          .fn()
          // first `/exec` call
          .mockImplementationOnce(() => {
            return { id: "1" };
          })
          // first `/runs/:id` call
          .mockImplementationOnce(() => {
            return { id: "1", state: "created" };
          })
          // second `/runs/:id` call
          .mockImplementationOnce(() => {
            return { id: "1", state: "started" };
          })
          // third `/runs/:id` call
          .mockImplementationOnce(() => {
            return { id: "1", state: "succeed", result: "coucou" };
          });

        jest.mocked(jitter).mockReturnValue(0);
        jest
          .mocked(makeHTTPClient)
          // first `/exec` call
          .mockImplementation(() => async () => {
            return responseFn();
          });

        process.env["DEFER_TOKEN"] = "test";
        process.env["DEFER_DEBUG"] = "1";
      });

      it("should NOT call the wrapped function and return the function execution result", async () => {
        const myFunction = jest.fn(async (_str: string) => "Hello World!");
        const deferred = defer(myFunction);

        const awaitable = awaitResult(deferred);
        const result = await awaitable("");
        expect(result).toEqual("coucou");
        expect(myFunction).not.toHaveBeenCalled();
      });
    });
  });

  describe("when Defer is inactive (`DEFER_TOKEN` is unset)", () => {
    beforeAll(() => {
      process.env["DEFER_TOKEN"] = "";
    });
    it("should rethrow any error as `DeferError`", async () => {
      const myFunction = async (_str: string) => {
        throw new Error("my function failed locally!");
      };
      const deferred = defer(myFunction);
      const awaitable = awaitResult(deferred);

      await expect(awaitable("")).rejects.toThrow(DeferError);
    });
  });
});
