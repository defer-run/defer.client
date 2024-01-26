process.env["DEFER_NO_LOCAL_SCHEDULER"] = "1";
process.env["DEFER_NO_BANNER"] = "1";

import { ExecutionNotFound } from "../../src/backend.js";
import { enqueue, getExecution } from "../../src/backend/local.js";
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
