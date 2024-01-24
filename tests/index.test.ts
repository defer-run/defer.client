process.env["DEFER_NO_LOCAL_SCHEDULER"] = "1";
process.env["DEFER_NO_BANNER"] = "1";

import { defer } from "../src/index.js";

describe("defer/2", () => {
  describe("when no options is set", () => {
    it("returns deferable function with default", () => {
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

  describe("when retry option is set", () => {
    describe("when retry option is a boolean", () => {
      it("sets default retry policy", () => {
        const myFunc = async () => console.log("the cake is a lie");
        const myDeferedFunc = defer(myFunc, { retry: true });

        expect(myDeferedFunc.__fn).toBe(myFunc);
        expect(myDeferedFunc.__metadata).toBeDefined();
        expect(myDeferedFunc.__metadata.name).toBe(myFunc.name);
        expect(myDeferedFunc.__metadata.version).toBe(6); // latest manifest version
        expect(myDeferedFunc.__metadata.retry).toBeDefined();
        expect(myDeferedFunc.__metadata.retry).toStrictEqual({
          initialInterval: 30,
          maxAttempts: 13,
          maxInterval: 600,
          multiplier: 1.5,
          randomizationFactor: 0.5,
        });
        expect(myDeferedFunc.__metadata.concurrency).toBeUndefined();
        expect(myDeferedFunc.__metadata.maxDuration).toBeUndefined();
        expect(myDeferedFunc.__metadata.maxConcurrencyAction).toBeUndefined();
      });
    });

    describe("when retry option is a number", () => {
      it("sets custom maxAttempts", () => {
        const myFunc = async () => console.log("the cake is a lie");
        const myDeferedFunc = defer(myFunc, { retry: 7 });

        expect(myDeferedFunc.__fn).toBe(myFunc);
        expect(myDeferedFunc.__metadata).toBeDefined();
        expect(myDeferedFunc.__metadata.name).toBe(myFunc.name);
        expect(myDeferedFunc.__metadata.version).toBe(6); // latest manifest version
        expect(myDeferedFunc.__metadata.retry).toBeDefined();
        expect(myDeferedFunc.__metadata.retry).toStrictEqual({
          initialInterval: 30,
          maxAttempts: 7,
          maxInterval: 600,
          multiplier: 1.5,
          randomizationFactor: 0.5,
        });
        expect(myDeferedFunc.__metadata.concurrency).toBeUndefined();
        expect(myDeferedFunc.__metadata.maxDuration).toBeUndefined();
        expect(myDeferedFunc.__metadata.maxConcurrencyAction).toBeUndefined();
      });
    });

    describe("when retry option is an object", () => {
      it("sets custom maxAttempts", () => {
        const myFunc = async () => console.log("the cake is a lie");
        const myDeferedFunc = defer(myFunc, {
          retry: {
            initialInterval: 2,
            maxAttempts: 10,
            maxInterval: 12000,
            multiplier: 1,
            randomizationFactor: 0.7,
          },
        });

        expect(myDeferedFunc.__fn).toBe(myFunc);
        expect(myDeferedFunc.__metadata).toBeDefined();
        expect(myDeferedFunc.__metadata.name).toBe(myFunc.name);
        expect(myDeferedFunc.__metadata.version).toBe(6); // latest manifest version
        expect(myDeferedFunc.__metadata.retry).toBeDefined();
        expect(myDeferedFunc.__metadata.retry).toStrictEqual({
          initialInterval: 2,
          maxAttempts: 10,
          maxInterval: 12000,
          multiplier: 1,
          randomizationFactor: 0.7,
        });
        expect(myDeferedFunc.__metadata.concurrency).toBeUndefined();
        expect(myDeferedFunc.__metadata.maxDuration).toBeUndefined();
        expect(myDeferedFunc.__metadata.maxConcurrencyAction).toBeUndefined();
      });
    });
  });

  describe("when concurrency option is set", () => {
    it("returns deferable function with custom concurrency", () => {
      const myFunc = async () => console.log("the cake is a lie");
      const myDeferedFunc = defer(myFunc, { concurrency: 20 });

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
      expect(myDeferedFunc.__metadata.concurrency).toBe(20);
      expect(myDeferedFunc.__metadata.maxDuration).toBeUndefined();
      expect(myDeferedFunc.__metadata.maxConcurrencyAction).toBeUndefined();
    });
  });

  describe("when maxDuration option is set", () => {
    it("returns deferable function with custom maxDuration", () => {
      const myFunc = async () => console.log("the cake is a lie");
      const myDeferedFunc = defer(myFunc, { maxDuration: 2000 });

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
      expect(myDeferedFunc.__metadata.maxDuration).toBe(2000);
      expect(myDeferedFunc.__metadata.maxConcurrencyAction).toBeUndefined();
    });
  });

  describe("when maxConcurrencyAction option is set", () => {
    it("returns deferable function with custom maxConcurrencyAction", () => {
      const myFunc = async () => console.log("the cake is a lie");
      const myDeferedFunc = defer(myFunc, { maxConcurrencyAction: "cancel" });

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
      expect(myDeferedFunc.__metadata.maxConcurrencyAction).toBe("cancel");
    });
  });
});
