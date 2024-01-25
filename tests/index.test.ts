process.env["DEFER_NO_LOCAL_SCHEDULER"] = "1";
process.env["DEFER_NO_BANNER"] = "1";

import {
  addMetadata,
  assignOptions,
  backend,
  cancelExecution,
  defer,
  delay,
  discardAfter,
  getExecution,
  reRunExecution,
  rescheduleExecution,
} from "../src/index.js";

describe("defer/2", () => {
  describe("when no options is set", () => {
    it("returns deferable function with default", () => {
      const myFunc = async () => console.log("the cake is a lie");
      const myDeferedFunc = defer(myFunc);

      expect(myDeferedFunc.__fn).toBe(myFunc);
      expect(myDeferedFunc.__metadata).toBeDefined();
      expect(myDeferedFunc.__metadata.name).toBe(myFunc.name);
      expect(myDeferedFunc.__metadata.cron).toBeUndefined();
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
      expect(myDeferedFunc.__execOptions).toBeUndefined();
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
        expect(myDeferedFunc.__metadata.cron).toBeUndefined();
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
        expect(myDeferedFunc.__execOptions).toBeUndefined();
      });
    });

    describe("when retry option is a number", () => {
      it("sets custom maxAttempts", () => {
        const myFunc = async () => console.log("the cake is a lie");
        const myDeferedFunc = defer(myFunc, { retry: 7 });

        expect(myDeferedFunc.__fn).toBe(myFunc);
        expect(myDeferedFunc.__metadata).toBeDefined();
        expect(myDeferedFunc.__metadata.name).toBe(myFunc.name);
        expect(myDeferedFunc.__metadata.cron).toBeUndefined();
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
        expect(myDeferedFunc.__execOptions).toBeUndefined();
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
        expect(myDeferedFunc.__metadata.cron).toBeUndefined();
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
        expect(myDeferedFunc.__execOptions).toBeUndefined();
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
      expect(myDeferedFunc.__metadata.cron).toBeUndefined();
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
      expect(myDeferedFunc.__execOptions).toBeUndefined();
    });
  });

  describe("when maxDuration option is set", () => {
    it("returns deferable function with custom maxDuration", () => {
      const myFunc = async () => console.log("the cake is a lie");
      const myDeferedFunc = defer(myFunc, { maxDuration: 2000 });

      expect(myDeferedFunc.__fn).toBe(myFunc);
      expect(myDeferedFunc.__metadata).toBeDefined();
      expect(myDeferedFunc.__metadata.name).toBe(myFunc.name);
      expect(myDeferedFunc.__metadata.cron).toBeUndefined();
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
      expect(myDeferedFunc.__execOptions).toBeUndefined();
    });
  });

  describe("when maxConcurrencyAction option is set", () => {
    it("returns deferable function with custom maxConcurrencyAction", () => {
      const myFunc = async () => console.log("the cake is a lie");
      const myDeferedFunc = defer(myFunc, { maxConcurrencyAction: "cancel" });

      expect(myDeferedFunc.__fn).toBe(myFunc);
      expect(myDeferedFunc.__metadata).toBeDefined();
      expect(myDeferedFunc.__metadata.name).toBe(myFunc.name);
      expect(myDeferedFunc.__metadata.cron).toBeUndefined();
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
      expect(myDeferedFunc.__execOptions).toBeUndefined();
    });
  });
});

describe("defer.cron/3", () => {
  describe("when no options is set", () => {
    it("returns deferable function with default", () => {
      const myFunc = async () => console.log("the cake is a lie");
      const myDeferedFunc = defer.cron(myFunc, "5 4 * * *");

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
      expect(myDeferedFunc.__execOptions).toBeUndefined();
    });
  });

  describe("when retry option is set", () => {
    describe("when retry option is a boolean", () => {
      it("sets default retry policy", () => {
        const myFunc = async () => console.log("the cake is a lie");
        const myDeferedFunc = defer.cron(myFunc, "5 4 * * *", { retry: true });

        expect(myDeferedFunc.__fn).toBe(myFunc);
        expect(myDeferedFunc.__metadata).toBeDefined();
        expect(myDeferedFunc.__metadata.cron).toBe("5 4 * * *");
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
        expect(myDeferedFunc.__execOptions).toBeUndefined();
      });
    });

    describe("when retry option is a number", () => {
      it("sets custom maxAttempts", () => {
        const myFunc = async () => console.log("the cake is a lie");
        const myDeferedFunc = defer.cron(myFunc, "5 4 * * *", { retry: 7 });

        expect(myDeferedFunc.__fn).toBe(myFunc);
        expect(myDeferedFunc.__metadata).toBeDefined();
        expect(myDeferedFunc.__metadata.name).toBe(myFunc.name);
        expect(myDeferedFunc.__metadata.cron).toBe("5 4 * * *");
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
        expect(myDeferedFunc.__execOptions).toBeUndefined();
      });
    });

    describe("when retry option is an object", () => {
      it("sets custom maxAttempts", () => {
        const myFunc = async () => console.log("the cake is a lie");
        const myDeferedFunc = defer.cron(myFunc, "5 4 * * *", {
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
        expect(myDeferedFunc.__metadata.cron).toBe("5 4 * * *");
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
        expect(myDeferedFunc.__execOptions).toBeUndefined();
      });
    });
  });

  describe("when concurrency option is set", () => {
    it("returns deferable function with custom concurrency", () => {
      const myFunc = async () => console.log("the cake is a lie");
      const myDeferedFunc = defer.cron(myFunc, "5 4 * * *", {
        concurrency: 20,
      });

      expect(myDeferedFunc.__fn).toBe(myFunc);
      expect(myDeferedFunc.__metadata).toBeDefined();
      expect(myDeferedFunc.__metadata.name).toBe(myFunc.name);
      expect(myDeferedFunc.__metadata.cron).toBe("5 4 * * *");
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
      expect(myDeferedFunc.__execOptions).toBeUndefined();
    });
  });

  describe("when maxDuration option is set", () => {
    it("returns deferable function with custom maxDuration", () => {
      const myFunc = async () => console.log("the cake is a lie");
      const myDeferedFunc = defer.cron(myFunc, "5 4 * * *", {
        maxDuration: 2000,
      });

      expect(myDeferedFunc.__fn).toBe(myFunc);
      expect(myDeferedFunc.__metadata).toBeDefined();
      expect(myDeferedFunc.__metadata.name).toBe(myFunc.name);
      expect(myDeferedFunc.__metadata.cron).toBe("5 4 * * *");
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
      expect(myDeferedFunc.__execOptions).toBeUndefined();
    });
  });

  describe("when maxConcurrencyAction option is set", () => {
    it("returns deferable function with custom maxConcurrencyAction", () => {
      const myFunc = async () => console.log("the cake is a lie");
      const myDeferedFunc = defer.cron(myFunc, "5 4 * * *", {
        maxConcurrencyAction: "cancel",
      });

      expect(myDeferedFunc.__fn).toBe(myFunc);
      expect(myDeferedFunc.__metadata).toBeDefined();
      expect(myDeferedFunc.__metadata.name).toBe(myFunc.name);
      expect(myDeferedFunc.__metadata.cron).toBe("5 4 * * *");
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
      expect(myDeferedFunc.__execOptions).toBeUndefined();
    });
  });
});

describe("delay/2", () => {
  it("adds delay in __execOptions", () => {
    const myFunc = async () => console.log("the cake is a lie");
    const myDeferedFunc = defer(myFunc, { maxConcurrencyAction: "cancel" });
    const myDeferedDelayFunc = delay(myDeferedFunc, "2h");

    expect(myDeferedDelayFunc.__metadata).toStrictEqual(
      myDeferedFunc.__metadata
    );

    expect(myDeferedDelayFunc.__execOptions).toBeDefined();
    expect(myDeferedDelayFunc.__execOptions?.delay).toBe("2h");
    expect(myDeferedDelayFunc.__execOptions?.metadata).toBeUndefined();
    expect(myDeferedDelayFunc.__execOptions?.discardAfter).toBeUndefined();
  });
});

describe("addMetadata/2", () => {
  it("adds metadata in __execOptions", () => {
    const myFunc = async () => console.log("the cake is a lie");
    const myDeferedFunc = defer(myFunc, { maxConcurrencyAction: "cancel" });
    const myDeferedMDFunc = addMetadata(myDeferedFunc, { foo: "bar" });

    expect(myDeferedMDFunc.__metadata).toStrictEqual(myDeferedFunc.__metadata);

    expect(myDeferedMDFunc.__execOptions).toBeDefined();
    expect(myDeferedMDFunc.__execOptions?.delay).toBeUndefined();
    expect(myDeferedMDFunc.__execOptions?.metadata).toStrictEqual({
      foo: "bar",
    });
    expect(myDeferedMDFunc.__execOptions?.discardAfter).toBeUndefined();

    const myDeferedMDFunc2 = addMetadata(myDeferedFunc, { bar: "foo" });
    expect(myDeferedMDFunc2.__execOptions).toBeDefined();
    expect(myDeferedMDFunc2.__execOptions?.delay).toBeUndefined();
    expect(myDeferedMDFunc2.__execOptions?.metadata).toStrictEqual({
      bar: "foo",
    });
    expect(myDeferedMDFunc2.__execOptions?.discardAfter).toBeUndefined();
  });
});

describe("discardAfter/2", () => {
  it("adds discardAfter in __execOptions", () => {
    const myFunc = async () => console.log("the cake is a lie");
    const myDeferedFunc = defer(myFunc, { maxConcurrencyAction: "cancel" });
    const myDeferedDiscardyFunc = discardAfter(myDeferedFunc, "2h");

    expect(myDeferedDiscardyFunc.__metadata).toStrictEqual(
      myDeferedFunc.__metadata
    );

    expect(myDeferedDiscardyFunc.__execOptions).toBeDefined();
    expect(myDeferedDiscardyFunc.__execOptions?.delay).toBeUndefined();
    expect(myDeferedDiscardyFunc.__execOptions?.metadata).toBeUndefined();
    expect(myDeferedDiscardyFunc.__execOptions?.discardAfter).toBe("2h");
  });
});

describe("assignOptions/2", () => {
  describe("when options are empty", () => {
    it("does nothing", () => {
      const myFunc = async () => console.log("the cake is a lie");
      const myDeferedFunc = defer(myFunc, { maxConcurrencyAction: "cancel" });
      const myDeferedAssignFunc = assignOptions(myDeferedFunc, {});

      expect(myDeferedAssignFunc.__execOptions).toStrictEqual({});
    });
  });
});

describe("getExecution/1", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("calls the backend", async () => {
    const spy = jest
      .spyOn(backend, "getExecution")
      .mockImplementation((id: string): any => {
        return { id };
      });
    const response = await getExecution("the cake is a lie");
    expect(spy).toHaveBeenCalledWith("the cake is a lie");
    expect(response).toStrictEqual({ id: "the cake is a lie" });
  });
});

describe("cancelExecution/2", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("calls the backend", async () => {
    const spy = jest
      .spyOn(backend, "cancelExecution")
      .mockImplementation((id: string, force: boolean): any => {
        return { id, force };
      });
    const response = await cancelExecution("the cake is a lie");
    expect(spy).toHaveBeenCalledWith("the cake is a lie", false);
    expect(response).toStrictEqual({ id: "the cake is a lie", force: false });
  });
});

describe("rescheduleExecution/2", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
  });

  describe("when scheduleFor is a Date", () => {
    it("calls the backend", async () => {
      const now = new Date();
      const spy = jest
        .spyOn(backend, "rescheduleExecution")
        .mockImplementation((id: string, scheduleFor: Date): any => {
          return { id, scheduleFor };
        });
      const response = await rescheduleExecution("the cake is a lie", now);
      expect(spy).toHaveBeenCalledWith("the cake is a lie", now);
      expect(response).toStrictEqual({
        id: "the cake is a lie",
        scheduleFor: now,
      });
    });
  });

  describe("when scheduleFor is a duration", () => {
    it("calls the backend", async () => {
      const now = new Date();
      jest.setSystemTime(now);
      const expectedSheduleFor = new Date();
      expectedSheduleFor.setHours(expectedSheduleFor.getHours() + 1);

      const spy = jest
        .spyOn(backend, "rescheduleExecution")
        .mockImplementation((id: string, scheduleFor: Date): any => {
          return { id, scheduleFor };
        });
      const response = await rescheduleExecution("the cake is a lie", "1h");
      expect(spy).toHaveBeenCalledWith("the cake is a lie", expectedSheduleFor);
      expect(response).toStrictEqual({
        id: "the cake is a lie",
        scheduleFor: expectedSheduleFor,
      });
    });
  });

  describe("when scheduleFor is undefined", () => {
    it("calls the backend", async () => {
      const now = new Date();
      jest.setSystemTime(now);

      const spy = jest
        .spyOn(backend, "rescheduleExecution")
        .mockImplementation((id: string, scheduleFor: Date): any => {
          return { id, scheduleFor };
        });
      const response = await rescheduleExecution("the cake is a lie");
      expect(spy).toHaveBeenCalledWith("the cake is a lie", now);
      expect(response).toStrictEqual({
        id: "the cake is a lie",
        scheduleFor: now,
      });
    });
  });
});

describe("reRunExecution/1", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("calls the backend", async () => {
    const spy = jest
      .spyOn(backend, "reRunExecution")
      .mockImplementation((id: string): any => {
        return { id };
      });
    const response = await reRunExecution("the cake is a lie");
    expect(spy).toHaveBeenCalledWith("the cake is a lie");
    expect(response).toStrictEqual({ id: "the cake is a lie" });
  });
});
