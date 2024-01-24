process.env["DEFER_NO_LOCAL_SCHEDULER"] = "1";
process.env["DEFER_NO_BANNER"] = "1";

import { defer } from "../src/index.js";

describe("defer/2", () => {
  it("returns deferable function", () => {
    const myFunc = async () => console.log("the cake is a lie");
    const myDeferedFunc = defer(myFunc);

    expect(myDeferedFunc.__fn).toBe(myFunc);
    expect(myDeferedFunc.__metadata).toBeDefined();
    expect(myDeferedFunc.__metadata.name).toBe(myFunc.name);
    expect(myDeferedFunc.__metadata.version).toBe(6); // latest manifest version
    expect(myDeferedFunc.__metadata.retry).toBeDefined();
    expect(myDeferedFunc.__metadata.retry).toStrictEqual({
      initialInterval: 30,
      maxAttempts: 0,
      maxInterval: 600,
      multiplier: 1.5,
      randomizationFactor: 0.5,
    });
    expect(myDeferedFunc.__metadata.concurrency).toBeUndefined();
    expect(myDeferedFunc.__metadata.maxDuration).toBeUndefined();
    expect(myDeferedFunc.__metadata.maxConcurrencyAction).toBeUndefined();
  });
});
