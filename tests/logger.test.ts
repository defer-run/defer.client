import { error, info, log, warn } from "../src/logger.js";

describe("log/3", () => {
  it("test without data", () => {
    const logSpy = jest.spyOn(console, "log");
    log("test", "the cake is a lie");
    expect(logSpy).toHaveBeenCalledWith(
      'level=test message="the cake is a lie"'
    );
  });

  it("test with data", () => {
    const logSpy = jest.spyOn(console, "log");
    log("test", "the cake is a lie", { cake: true });
    expect(logSpy).toHaveBeenCalledWith(
      'level=test message="the cake is a lie" cake=true'
    );
  });
});

describe("info/2", () => {
  it("test without data", () => {
    const logSpy = jest.spyOn(console, "log");
    info("the cake is a lie");
    expect(logSpy).toHaveBeenCalledWith(
      'level=info message="the cake is a lie"'
    );
  });
  it("test with data", () => {
    const logSpy = jest.spyOn(console, "log");
    info("the cake is a lie", { cake: true });
    expect(logSpy).toHaveBeenCalledWith(
      'level=info message="the cake is a lie" cake=true'
    );
  });
});

describe("error/2", () => {
  it("test without data", () => {
    const logSpy = jest.spyOn(console, "log");
    error("the cake is a lie");
    expect(logSpy).toHaveBeenCalledWith(
      'level=error message="the cake is a lie"'
    );
  });
  it("test with data", () => {
    const logSpy = jest.spyOn(console, "log");
    error("the cake is a lie", { cake: true });
    expect(logSpy).toHaveBeenCalledWith(
      'level=error message="the cake is a lie" cake=true'
    );
  });
});

describe("warn/2", () => {
  it("test without data", () => {
    const logSpy = jest.spyOn(console, "log");
    warn("the cake is a lie");
    expect(logSpy).toHaveBeenCalledWith(
      'level=error message="the cake is a lie"'
    );
  });
  it("test with data", () => {
    const logSpy = jest.spyOn(console, "log");
    warn("the cake is a lie", { cake: true });
    expect(logSpy).toHaveBeenCalledWith(
      'level=error message="the cake is a lie" cake=true'
    );
  });
});
