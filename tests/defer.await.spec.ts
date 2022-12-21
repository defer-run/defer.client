import { Response } from "@whatwg-node/fetch";
import { defer, init } from "../src";
import type { DeferExecuteResponse, DeferExecutionResponse } from "../src/execute";
import { makeFetcher } from "../src/fetcher";
import * as constants from '../src/constants';

const FN_EXECUTION_POLLING_INTERVAL_SECS = constants.FN_EXECUTION_POLLING_INTERVAL_SECS


jest.mock("../src/fetcher")
jest.setTimeout(20000)

describe("defer.await()", () => {
  describe("common", () => {
    it("defer() raises a type error is function is not async", () => {
      function myFunction(_customerId: string) {}

      // @ts-expect-error Type 'void' is not assignable to type 'Promise<any>'.ts(2345)
      const deferred = defer(myFunction);
    });
  });

  describe("when Defer is active (`DEFER_TOKEN` is set)", () => {

    describe('with successful functions execution', () => {
      beforeAll(() => {
        const responseFn = jest.fn().
        // first `/exec` call
        mockImplementationOnce(() => {
          return new Response(JSON.stringify({ id: '1' } as DeferExecuteResponse))
        }).
        // first `/runs/:id` call
        mockImplementationOnce(() => {
          return new Response(JSON.stringify({ state:'created' } as DeferExecutionResponse))
        }).
        // second `/runs/:id` call
        mockImplementationOnce(() => {
          return new Response(JSON.stringify({ state:'running' } as DeferExecutionResponse))
        }).
        // third `/runs/:id` call
        mockImplementationOnce(() => {
          return new Response(JSON.stringify({ state:'succeed', result: 'coucou' } as DeferExecutionResponse))
        })

        jest.mocked(makeFetcher).
          // first `/exec` call
          mockImplementation(() => async () => {
            return responseFn()
          })

        init({ apiToken: "test", debug: true });
        // @ts-expect-error
        constants.FN_EXECUTION_POLLING_INTERVAL_SECS = .1
      });

      afterAll(() => {
        // @ts-expect-error
        constants.FN_EXECUTION_POLLING_INTERVAL_SECS = FN_EXECUTION_POLLING_INTERVAL_SECS
      })

      it("should NOT call the wrapped function and return the function execution result", async () => {
        const myFunction = jest.fn(async (_str: string) => 'Hello World!');
        const deferred = defer(myFunction);
  
        const result = await deferred.await("")
        expect(result).toEqual('coucou')
        expect(myFunction).not.toHaveBeenCalled();
      });

    })
  });

});
