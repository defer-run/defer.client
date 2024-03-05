import { NextRequest } from "next/server";
import helloWorld from "./fixtures/helloWorld";
import { POST, GET } from "./fixtures/route";
import { POST as POSTWithProxy } from "./fixtures/routeWithProxy";
import { getExecution } from "../../src/index";
import { ExecutionNotFound } from "../../src/backend";

jest.mock("./fixtures/helloWorld");
jest.mock("../../src/index", () => {
  const originalModule = jest.requireActual("../../src/index");
  return {
    __esModule: true,
    ...originalModule,
    getExecution: jest.fn(),
  };
});

describe("asNextRoute()", () => {
  describe("POST() - background function invocation", () => {
    describe("valid empty params, without proxy", () => {
      beforeEach(() =>
        jest.mocked(helloWorld).mockResolvedValue({ id: "test-id" } as any)
      );

      test("properly call the background function and forward the execution ID", async () => {
        const req = new NextRequest("http://localhost:3000/api/helloWorld", {
          method: "POST",
          body: JSON.stringify([]),
          headers: {
            "Content-type": "application/json",
          },
        });

        const res = await POST(req);

        expect(helloWorld).toHaveBeenCalledWith();

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ id: "test-id" });
      });
    });

    describe("valid params, without proxy", () => {
      beforeEach(() =>
        jest.mocked(helloWorld).mockResolvedValue({ id: "test-id" } as any)
      );
      afterEach(() => {
        jest.mocked(helloWorld).mockReset();
      });

      test("properly call the background function with params and forward the execution ID", async () => {
        const req = new NextRequest("http://localhost:3000/api/helloWorld", {
          method: "POST",
          body: JSON.stringify(["charly"]),
          headers: {
            "Content-type": "application/json",
          },
        });

        const res = await POST(req);

        expect(helloWorld).toHaveBeenCalledWith("charly");

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ id: "test-id" });
      });
    });

    describe("valid params, with proxy", () => {
      beforeEach(() =>
        jest.mocked(helloWorld).mockResolvedValue({ id: "test-id" } as any)
      );

      test("properly call the background function with params and forward the execution ID", async () => {
        const req = new NextRequest("http://localhost:3000/api/helloWorld", {
          method: "POST",
          body: JSON.stringify(["charly"]),
          headers: {
            "Content-type": "application/json",
          },
        });

        const res = await POSTWithProxy(req);

        expect(helloWorld).toHaveBeenCalledWith("prefix-charly");

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ id: "test-id" });
      });
    });
  });

  describe("GET() - background function polling", () => {
    describe.each([
      // [scenario, query params, execution result, expected response]
      [
        "valid query params, valid pending execution ID",
        "?id=test-id",
        "test-id",
        { id: "test-id", state: "created" },
        [200, { id: "test-id", state: "created" }],
      ],
      [
        "valid query params, invalid execution ID",
        "?id=not-found-id",
        "not-found-id",
        new ExecutionNotFound("execution not found"),
        [500, { error: "Error: execution not found", id: "not-found-id" }],
      ],
      [
        "invalid query params",
        "?",
        null,
        null,
        [400, { error: "missing `id` query parameter from `useDeferRoute()`" }],
      ],
    ])(
      "%s",
      (
        _scenario,
        queryParams,
        executionId,
        executionResult,
        [expectedResponseStatus, expectedResponseBody]
      ) => {
        beforeEach(() => {
          if (executionResult instanceof Error) {
            jest.mocked(getExecution).mockImplementation(() => {
              throw executionResult;
            });
          } else {
            jest.mocked(getExecution).mockResolvedValue(executionResult as any);
          }
        });
        afterEach(() => {
          jest.mocked(getExecution).mockReset();
        });

        test("properly call the background function and forward the execution ID", async () => {
          const req = new NextRequest(
            `http://localhost:3000/api/helloWorld${queryParams}`,
            {
              method: "GET",
            }
          );

          const res = await GET(req);

          if (executionId) {
            expect(getExecution).toHaveBeenCalledWith(executionId);
          }

          expect(res.status).toBe(expectedResponseStatus);
          expect(await res.json()).toEqual(expectedResponseBody);
        });
      }
    );
  });
});
