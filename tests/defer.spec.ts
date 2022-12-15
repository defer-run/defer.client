import { Response } from "@whatwg-node/fetch";
import { defer, init } from "../src";
import type { DeferExecuteResponse } from "../src/execute";
import { makeFetcher } from "../src/fetcher";


jest.mock("../src/fetcher")

describe("defer()", () => {
  describe("common", () => {
    it("defer() raises a type error is function is not async", () => {
      function myFunction(_customerId: string) {}

      // @ts-expect-error Type 'void' is not assignable to type 'Promise<any>'.ts(2345)
      const deferred = defer(myFunction);
    });

    it("defer() maintains function signature", () => {
      async function myFunction(_customerId: string) {}

      const deferred = defer(myFunction);

      expect(async () => {
        await deferred("");
      }).not.toThrowError();
    });
  });

  describe("when Defer is active (`DEFER_TOKEN` is set)", () => {

    describe('with successful API responses', () => {
      beforeAll(() => {
        jest.mocked(makeFetcher).mockImplementationOnce(() => async () => {
          return new Response(JSON.stringify({ id: '1' } as DeferExecuteResponse))
        })
        init({ apiToken: "test" });
      });

      it("should throw if arguments are not serializable", async () => {
        const myFunction = jest.fn(async function testFn(_str: bigint) {});
        const deferred = defer(myFunction);
        const consoleSpy = jest
          .spyOn(console, "log")
          .mockImplementation(() => {});
  
        await expect(deferred(2n)).rejects.toThrow(
          "[defer.run][mockConstructor] failed to serialize arguments"
        );
  
        expect(myFunction).not.toHaveBeenCalled();
        expect(consoleSpy).toBeCalledWith(
          "[defer.run][mockConstructor] Failed to serialize arguments: TypeError: Do not know how to serialize a BigInt"
        );
      });

      it("should NOT call the wrapped function and return execution ID", async () => {
        const myFunction = jest.fn(async (_str: string) => {});
        const deferred = defer(myFunction);
  
        const result = await deferred("")
        expect(result).toEqual({ id: '1', __deferExecutionResponse: true })
        expect(myFunction).not.toHaveBeenCalled();
      });

    })

    describe('with error API responses', () => {
      beforeAll(() => {
        jest.mocked(makeFetcher).mockImplementationOnce(() => async () => {
          return new Response(JSON.stringify({ error: 'Failed to create execution' } as DeferExecuteResponse))
        })
        init({ apiToken: "test" });
      });

      it("should NOT call the wrapped function and throw the error", async () => {
        const myFunction = jest.fn(async (_str: string) => {});
        const deferred = defer(myFunction);
  
        await expect(deferred("")).rejects.toThrow(
          "Failed to create execution"
        );
        expect(myFunction).not.toHaveBeenCalled();
      });

    })
  });

  describe("when Defer is inactive (`DEFER_TOKEN` is unset)", () => {
    beforeAll(() => {
      init({ apiToken: "" });
    });
    it("should call the wrapped function", async () => {
      const myFunction = jest.fn(async (_str: string) => {});
      const deferred = defer(myFunction);

      await deferred("");
      expect(myFunction).toHaveBeenCalled();
    });

    it("should log if arguments are not serializable", async () => {
      const myFunction = jest.fn(async function testFn(_str: bigint) {});
      const deferred = defer(myFunction);
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});

      await deferred(2n);
      expect(myFunction).toHaveBeenCalled();
      expect(consoleSpy).toBeCalledWith(
        "[defer.run][mockConstructor] Failed to serialize arguments: TypeError: Do not know how to serialize a BigInt"
      );
    });
  });
});
