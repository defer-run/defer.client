import {
  fromDurationToDate,
  getEnv,
  isDebugEnabled,
  randomUUID,
} from "../src/utils.js";

describe("randomUUID/0", () => {
  describe("when globalThis.crypto exist", () => {
    it("uses crypto", () => {
      expect(randomUUID()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });
  });

  describe("when globalThis.crypto does not exist", () => {
    const crypto = globalThis.crypto;

    beforeEach(() => {
      (globalThis as any).crypto = undefined;
    });

    afterEach(() => {
      globalThis.crypto = crypto;
    });

    it("uses URL", () => {
      expect(randomUUID()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });
  });
});

describe("getEnv/1", () => {
  describe("when globalThis.process exist (NodeJS, Bun)", () => {
    const env = process.env;
    beforeEach(() => {
      process.env = { ...env, FOO: "BAR" };
    });

    afterEach(() => {
      process.env = { ...env };
    });

    it("uses process.env", () => {
      expect(getEnv("FOO")).toBe("BAR");
    });
  });

  describe("when globalThis.process does not exist (Cloudflare Worker)", () => {
    const process = globalThis.process;

    beforeEach(() => {
      (globalThis as any).process = undefined;

      const f = globalThis as any;
      f["FOO"] = "BAR";
    });

    afterEach(() => {
      globalThis.process = process;
    });

    it("uses globalThis", () => {
      expect(getEnv("FOO")).toBe("BAR");
    });
  });
});

describe("isDebugEnabled/0", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = { ...env };
  });

  describe("when DEFER_DEBUG is set", () => {
    it("returns true", () => {
      process.env["DEFER_DEBUG"] = "1";
      expect(isDebugEnabled()).toBeTruthy();
    });
  });

  describe("when DEFER_DEBUG is not set", () => {
    it("returns false", () => {
      process.env["DEFER_DEBUG"] = undefined;
      expect(isDebugEnabled()).toBeFalsy();
    });
  });
});

describe("fromDurationToDate/2", () => {
  describe("when delay is 0s", () => {
    it("returns the same date", () => {
      const now = new Date();
      expect(fromDurationToDate(now, "0s")).toStrictEqual(now);
    });
  });

  describe("when delay is 1h", () => {
    it("returns the date 1 hour after", () => {
      const now = new Date();
      const expected = now;
      expected.setHours(expected.getHours() + 4);
      expect(fromDurationToDate(now, "0s")).toStrictEqual(expected);
    });
  });
});
