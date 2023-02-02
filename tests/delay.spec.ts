import { Response } from "@whatwg-node/fetch";
import { defer, delay, init } from "../src";
import type { DeferExecuteResponse } from "../src/execute";
import { DeferConfiguredFetcher, makeFetcher } from "../src/fetcher";


jest.mock("../src/fetcher")

describe("delay()", () => {
  describe("when Defer is active (`DEFER_TOKEN` is set)", () => {

    describe('with successful API responses', () => {
      let fetcher: DeferConfiguredFetcher | undefined;
      beforeAll(() => {
        fetcher = jest.fn().mockImplementationOnce(async () => {
          return new Response(JSON.stringify({ id: '1' } as DeferExecuteResponse))
        })
        jest.mocked(makeFetcher).mockImplementationOnce(() => fetcher!)
        init({ apiToken: "test" });
      });

      it("should throw if arguments are not serializable", async () => {
        const myFunction = jest.fn(async function testFn(_str: bigint) {});
        const deferred = defer(myFunction);
        const delayed = delay(deferred, '1h')
        const consoleSpy = jest
          .spyOn(console, "log")
          .mockImplementation(() => {});
  
        await expect(delayed(2n)).rejects.toThrow(
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
        const delayed = delay(deferred, new Date('2023-01-01'))
  
        const result = await delayed("")
        expect(result).toEqual({ id: '1', __deferExecutionResponse: true })
        expect(myFunction).not.toHaveBeenCalled();
        expect(fetcher).toHaveBeenCalledWith("enqueue", {"body": "{\"name\":\"mockConstructor\",\"arguments\":[\"\"],\"schedule_for\":\"2023-01-01T00:00:00.000Z\"}", "method": "POST"})
      });

    })
  })
});
