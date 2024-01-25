import { KV } from "../../../src/backend/local/kv.js";

describe("set/2", () => {
  it("adds value in the store", async () => {
    const store = new KV<string>();

    expect(await store.get("foo")).toBe(undefined);
    await store.set("foo", "bar");
    expect(await store.get("foo")).toBe("bar");
  });
});

describe("get/1", () => {
  it("read value in the store", async () => {
    const store = new KV<string>();

    expect(await store.get("foo")).toBe(undefined);
    await store.set("foo", "bar");
    expect(await store.get("foo")).toBe("bar");
  });
});

describe("keys/0", () => {
  it("read value in the store", async () => {
    const store = new KV<string>();

    await store.set("foo", "bar");
    expect(await store.keys()).toStrictEqual(["foo"]);
  });
});
