process.env["DEFER_NO_LOCAL_SCHEDULER"] = "1";
process.env["DEFER_NO_BANNER"] = "1";

import {
  DeferError,
  ExecutionAbortingAlreadyInProgress,
  ExecutionNotCancellable,
  ExecutionNotFound,
} from "../../src/backend.js";
import {
  cancelExecution,
  enqueue,
  getExecution,
} from "../../src/backend/remote.js";
import { defer } from "../../src/index.js";

global.fetch = jest.fn();

const expectedHeaderFields = {
  Authorization: "Basic Og==",
  "Content-type": "application/json",
  "User-Agent":
    "defer/unknown (source: https://github.com/defer-run/defer.client)",
};

function newExecutionAPIResponse(o?: any): string {
  return JSON.stringify({
    data: {
      id: "fake-id",
      state: "created",
      function_name: "sayHello",
      function_id: "fake-id",
      updated_at: new Date(),
      created_at: new Date(),
      ...o,
    },
  });
}

describe("enqueue/5", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  const myFunc = async () => console.log("the cake is a lie");
  const myDeferedFunc = defer(myFunc);

  describe("when API respond with 200 status code", () => {
    it("returns execution object", async () => {
      const now = new Date();
      const mockResponse = new Response(
        newExecutionAPIResponse({ updated_at: now, created_at: now }),
        { status: 200 }
      );
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
      const result = await enqueue(myDeferedFunc, [], now, now, undefined);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        "https://api.defer.run/public/v2/executions",
        {
          method: "PUT",
          body: JSON.stringify({
            function_name: "myFunc",
            function_arguments: [],
            schedule_for: now,
            discard_after: now,
          }),
          cache: "no-store",
          headers: expectedHeaderFields,
        }
      );
      expect(result).toStrictEqual({
        id: "fake-id",
        state: "created",
        functionName: "sayHello",
        functionId: "fake-id",
        updatedAt: now,
        createdAt: now,
      });
    });
  });

  describe("when API respond with 400 status code", () => {
    it("throws error", async () => {
      const now = new Date();
      const mockResponse = new Response(
        JSON.stringify({
          error: "bad_request",
          message: 'cannot find function "createUser"',
        }),
        { status: 400 }
      );
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      await expect(
        async () => await enqueue(myDeferedFunc, [], now, now, undefined)
      ).rejects.toThrow(DeferError);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        "https://api.defer.run/public/v2/executions",
        {
          method: "PUT",
          body: JSON.stringify({
            function_name: "myFunc",
            function_arguments: [],
            schedule_for: now,
            discard_after: now,
          }),
          cache: "no-store",
          headers: expectedHeaderFields,
        }
      );
    });
  });

  describe("when API respond with 500 status code", () => {
    it("throws error", async () => {
      const now = new Date();
      const mockResponse = new Response(
        JSON.stringify({
          error: "internal_error",
          message: "oops",
        }),
        { status: 400 }
      );
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      await expect(
        async () => await enqueue(myDeferedFunc, [], now, now, undefined)
      ).rejects.toThrow(DeferError);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        "https://api.defer.run/public/v2/executions",
        {
          method: "PUT",
          body: JSON.stringify({
            function_name: "myFunc",
            function_arguments: [],
            schedule_for: now,
            discard_after: now,
          }),
          cache: "no-store",
          headers: expectedHeaderFields,
        }
      );
    });
  });
});

describe("getExecution/1", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe("when API respond with 200 status code", () => {
    it("returns execution object", async () => {
      const now = new Date();
      const mockResponse = new Response(
        newExecutionAPIResponse({ updated_at: now, created_at: now }),
        { status: 200 }
      );
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
      const result = await getExecution("fake-id");
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        "https://api.defer.run/public/v2/executions/fake-id",
        {
          method: "GET",
          body: null,
          cache: "no-store",
          headers: expectedHeaderFields,
        }
      );
      expect(result).toStrictEqual({
        id: "fake-id",
        state: "created",
        functionName: "sayHello",
        functionId: "fake-id",
        updatedAt: now,
        createdAt: now,
      });
    });
  });

  describe("when API respond with 400 status code", () => {
    it("throws error", async () => {
      const mockResponse = new Response(
        JSON.stringify({
          error: "bad_request",
          message: "cannot decode body",
        }),
        { status: 400 }
      );
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      await expect(async () => await getExecution("fake-id")).rejects.toThrow(
        DeferError
      );

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        "https://api.defer.run/public/v2/executions/fake-id",
        {
          method: "GET",
          body: null,
          cache: "no-store",
          headers: expectedHeaderFields,
        }
      );
    });
  });

  describe("when API respond with 404 status code", () => {
    it("throws error", async () => {
      const mockResponse = new Response(
        JSON.stringify({
          error: "bad_request",
          message: 'cannot find execution "fake-id"',
        }),
        { status: 404 }
      );
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      await expect(async () => await getExecution("fake-id")).rejects.toThrow(
        ExecutionNotFound
      );

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        "https://api.defer.run/public/v2/executions/fake-id",
        {
          method: "GET",
          body: null,
          cache: "no-store",
          headers: expectedHeaderFields,
        }
      );
    });
  });
});

describe("cancelExecution/2", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe("when API respond with 200 status code", () => {
    it("returns execution object", async () => {
      const now = new Date();
      const mockResponse = new Response(
        newExecutionAPIResponse({ updated_at: now, created_at: now }),
        { status: 200 }
      );
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
      const result = await cancelExecution("fake-id", true);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        "https://api.defer.run/public/v2/executions/fake-id/cancellation",
        {
          method: "POST",
          body: JSON.stringify({ force: true }),
          cache: "no-store",
          headers: expectedHeaderFields,
        }
      );
      expect(result).toStrictEqual({
        id: "fake-id",
        state: "created",
        functionName: "sayHello",
        functionId: "fake-id",
        updatedAt: now,
        createdAt: now,
      });
    });
  });

  describe("when API respond with 202 status code", () => {
    it("returns execution object", async () => {
      const mockResponse = new Response(JSON.stringify({}), { status: 202 });
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      await expect(
        async () => await cancelExecution("fake-id", false)
      ).rejects.toThrow(ExecutionAbortingAlreadyInProgress);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        "https://api.defer.run/public/v2/executions/fake-id/cancellation",
        {
          method: "POST",
          body: JSON.stringify({ force: false }),
          cache: "no-store",
          headers: expectedHeaderFields,
        }
      );
    });
  });

  describe("when API respond with 400 status code", () => {
    it("throws error", async () => {
      const mockResponse = new Response(
        JSON.stringify({
          error: "bad_request",
          message: "cannot decode body",
        }),
        { status: 400 }
      );
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      await expect(
        async () => await cancelExecution("fake-id", false)
      ).rejects.toThrow(DeferError);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        "https://api.defer.run/public/v2/executions/fake-id/cancellation",
        {
          method: "POST",
          body: JSON.stringify({ force: false }),
          cache: "no-store",
          headers: expectedHeaderFields,
        }
      );
    });
  });

  describe("when API respond with 404 status code", () => {
    it("throws error", async () => {
      const mockResponse = new Response(
        JSON.stringify({
          error: "bad_request",
          message: 'cannot find execution "fake-id"',
        }),
        { status: 404 }
      );
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      await expect(
        async () => await cancelExecution("fake-id", false)
      ).rejects.toThrow(ExecutionNotFound);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        "https://api.defer.run/public/v2/executions/fake-id/cancellation",
        {
          method: "POST",
          body: JSON.stringify({ force: false }),
          cache: "no-store",
          headers: expectedHeaderFields,
        }
      );
    });
  });

  describe("when API respond with 409 status code", () => {
    it("throws error", async () => {
      const mockResponse = new Response(
        JSON.stringify({
          error: "conflict",
          message: "cannot cancel execution in failed state",
        }),
        { status: 409 }
      );
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      await expect(
        async () => await cancelExecution("fake-id", false)
      ).rejects.toThrow(ExecutionNotCancellable);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        "https://api.defer.run/public/v2/executions/fake-id/cancellation",
        {
          method: "POST",
          body: JSON.stringify({ force: false }),
          cache: "no-store",
          headers: expectedHeaderFields,
        }
      );
    });
  });
});
