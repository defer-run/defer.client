import { Counter } from "../../../src/backend/local/counter.js";

describe("incr/1", () => {
  describe("increment non existing key", () => {
    it("increments key by one", async () => {
      const counter = new Counter();
      expect(counter.getCount("foo")).toBe(0);
      await counter.incr("foo");
      expect(counter.getCount("foo")).toBe(1);
    });
  });

  describe("increment existing key", () => {
    it("increments key by one", async () => {
      const counter = new Counter();
      expect(counter.getCount("foo")).toBe(0);
      await counter.incr("foo");
      await counter.incr("foo");
      expect(counter.getCount("foo")).toBe(2);
    });
  });
});

describe("decr/1", () => {
  describe("decrement non existing key", () => {
    it("decrement key by one", async () => {
      const counter = new Counter();
      expect(counter.getCount("foo")).toBe(0);
      await counter.decr("foo");
      expect(counter.getCount("foo")).toBe(-1);
    });
  });

  describe("decrement existing key", () => {
    it("decrement key by one", async () => {
      const counter = new Counter();
      expect(counter.getCount("foo")).toBe(0);
      await counter.decr("foo");
      await counter.decr("foo");
      expect(counter.getCount("foo")).toBe(-2);
    });
  });
});

describe("getCount/1", () => {
  it("returns counter value", async () => {
    const counter = new Counter();
    expect(counter.getCount("foo")).toBe(0);
    await counter.incr("foo");
    expect(counter.getCount("foo")).toBe(1);
    await counter.decr("foo");
    expect(counter.getCount("foo")).toBe(0);
  });
});
