process.env["DEFER_NO_LOCAL_SCHEDULER"] = "1";
process.env["DEFER_NO_BANNER"] = "1";

import { ExecutionNotFound } from "../../src/backend.js";
import {
  cancelExecution,
  enqueue,
  getExecution,
  rescheduleExecution,
} from "../../src/backend/local.js";
import { defer } from "../../src/index.js";

const myFunc = async () => console.log("the cake is a lie");
const myDeferedFunc = defer(myFunc);

describe("enqueue/5", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("returns the execution object", async () => {
    const now = new Date();
    jest.useFakeTimers();
    jest.setSystemTime(now);

    const result = await enqueue(myDeferedFunc, [], now, now, undefined);
    expect(result.createdAt).toStrictEqual(now);
    expect(result.updatedAt).toStrictEqual(now);
    expect(result.scheduledAt).toStrictEqual(now);
    expect(result.functionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
    expect(result.functionName).toBe("myFunc");
    expect(result.state).toBe("created");
  });

  it("returns same function id", async () => {
    const now = new Date();
    jest.useFakeTimers();
    jest.setSystemTime(now);

    const result = await enqueue(myDeferedFunc, [], now, now, undefined);
    const result2 = await enqueue(myDeferedFunc, [], now, now, undefined);

    expect(result.id).not.toBe(result2.id);
    expect(result.functionName).toBe(result2.functionName);
    expect(result.functionId).toBe(result2.functionId);
  });
});

describe("getExecution/1", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe("when execution exist", () => {
    it("returns the execution", async () => {
      const now = new Date();
      const enqueueResult = await enqueue(
        myDeferedFunc,
        [],
        now,
        now,
        undefined
      );
      const getResult = await getExecution(enqueueResult.id);

      expect(getResult).toStrictEqual(enqueueResult);
    });
  });

  describe("when the execution does not exist", () => {
    it("throws error", async () => {
      await expect(
        async () => await getExecution("fake id")
      ).rejects.toThrowError(ExecutionNotFound);
    });
  });
});

describe("cancelExecution/2", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe("when execution state is created", () => {
    it("returns an execution in a cancelled state", async () => {
      const now = new Date();
      const enqueueResult = await enqueue(
        myDeferedFunc,
        [],
        now,
        now,
        undefined
      );

      jest.useFakeTimers();
      jest.setSystemTime();

      const cancelResult = await cancelExecution(enqueueResult.id, false);
      expect(cancelResult).toStrictEqual({
        ...enqueueResult,
        updatedAt: new Date(),
        state: "cancelled",
      });
    });
  });

  describe("when execution not exist", () => {
    it("throws an error", async () => {
      await expect(
        async () => await cancelExecution("fake id", false)
      ).rejects.toThrowError(ExecutionNotFound);
    });
  });
});

describe("rescheduleExecution", () => {
  describe("when execution state is created", () => {
    it("returns an execution with new schedule date", async () => {
      const now = new Date();
      const enqueueResult = await enqueue(
        myDeferedFunc,
        [],
        now,
        now,
        undefined
      );

      jest.useFakeTimers();
      jest.setSystemTime();

      const cancelResult = await rescheduleExecution(
        enqueueResult.id,
        new Date("December 17, 1995 03:24:00")
      );
      expect(cancelResult).toStrictEqual({
        ...enqueueResult,
        updatedAt: new Date(),
        scheduledAt: new Date("December 17, 1995 03:24:00"),
        state: "created",
      });
    });
  });

  describe("when execution not exist", () => {
    it("throws an error", async () => {
      await expect(
        async () => await rescheduleExecution("fake id", new Date())
      ).rejects.toThrowError(ExecutionNotFound);
    });
  });
});
