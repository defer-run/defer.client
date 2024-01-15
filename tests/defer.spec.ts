import { defer } from "../src";
import { APIError } from "../src/errors";
import { makeHTTPClient } from "../src/httpClient";

jest.mock("../src/httpClient");

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
    describe("with successful API responses", () => {
      beforeEach(() => {
        jest.mocked(makeHTTPClient).mockImplementation(() => {
          return async <T>(
            _method: string,
            _path: string,
            _body: string | null = null
          ): Promise<T> => {
            return { id: "1" } as any;
          };
        });
        process.env["DEFER_TOKEN"] = "test";
      });

      it("should throw if arguments are not serializable", async () => {
        const myFunction = jest.fn(async function testFn(_str: bigint) {});
        const deferred = defer(myFunction);
        await expect(deferred(2n)).rejects.toThrow(
          "cannot serialize argument: Do not know how to serialize a BigInt"
        );
      });

      it("should NOT call the wrapped function and return execution ID", async () => {
        const myFunction = jest.fn(async (_str: string) => {});
        const deferred = defer(myFunction);

        const result = await deferred("");
        expect(myFunction).not.toHaveBeenCalled();
        expect(result).toEqual({ id: "1" });
      });
    });

    describe("with error API responses", () => {
      beforeEach(() => {
        jest.mocked(makeHTTPClient).mockImplementation(() => {
          return async <T>(
            _method: string,
            _path: string,
            _body: string | null = null
          ): Promise<T> => {
            throw new APIError("cannot enqueue execution: reason", "E42");
          };
        });

        process.env["DEFER_TOKEN"] = "test";
      });

      it("should NOT call the wrapped function and throw the error", async () => {
        const myFunction = jest.fn(async (_str: string) => {});
        const deferred = defer(myFunction);

        await expect(deferred("")).rejects.toThrow(
          "cannot enqueue execution: reason"
        );
        expect(myFunction).not.toHaveBeenCalled();
      });
    });
  });

  describe("when Defer is inactive (`DEFER_TOKEN` is unset)", () => {
    beforeAll(() => {
      process.env["DEFER_TOKEN"] = "";
    });
    it("should call the wrapped function", async () => {
      const myFunction = jest.fn(async (_str: string) => {});
      const deferred = defer(myFunction);

      await deferred("");
      expect(myFunction).toHaveBeenCalled();
    });
  });
});
