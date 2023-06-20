import { defer, delay, addMetadata, configure } from "../src";
import { HTTPClient, makeHTTPClient } from "../src/httpClient";

jest.mock("../src/httpClient");

describe("addMetadata()", () => {
  describe("when Defer is active (`DEFER_TOKEN` is set)", () => {
    describe("with successful API responses", () => {
      let httpClient: HTTPClient | undefined;

      beforeAll(() => {
        httpClient = jest.fn().mockImplementationOnce(async () => {
          return { id: "1" } as any;
        });
        jest.mocked(makeHTTPClient).mockImplementationOnce(() => httpClient!);
        configure({ accessToken: "test" });
      });

      it("should throw if arguments are not serializable", async () => {
        const myFunction = jest.fn(async function testFn(_str: bigint) {});
        const deferred = defer(myFunction);
        const defferedWithMetadata = addMetadata(deferred, { foo: "bar" });
        await expect(defferedWithMetadata(2n)).rejects.toThrow(
          "cannot serialize argument: Do not know how to serialize a BigInt"
        );

        expect(myFunction).not.toHaveBeenCalled();
      });

      it("should NOT call the wrapped function and return execution ID", async () => {
        const myFunction = jest.fn(async (_str: string) => {});
        const deferred = defer(myFunction);
        const delayed = delay(deferred, new Date("2023-01-01"));
        const defferedWithMetadata = addMetadata(delayed, {
          foo: "bar",
          foo2: "bar2",
        });

        const result = await defferedWithMetadata("");
        expect(result).toEqual({ id: "1" });
        expect(myFunction).not.toHaveBeenCalled();
        expect(httpClient).toHaveBeenCalledWith(
          "POST",
          "/public/v1/enqueue",
          '{"name":"mockConstructor","arguments":[""],"schedule_for":"2023-01-01T00:00:00.000Z","metadata":{"foo":"bar","foo2":"bar2"}}'
        );
      });
    });
  });
});
