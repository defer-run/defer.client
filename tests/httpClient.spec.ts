import { fetch } from "@whatwg-node/fetch";
import { makeHTTPClient } from "../src/httpClient";
const { Response } = jest.requireActual("@whatwg-node/fetch");

jest.mock("@whatwg-node/fetch", () => {
  const originalModule = jest.requireActual("@whatwg-node/fetch");
  return {
    __esModule: true,
    ...originalModule,
    fetch: jest.fn(),
  };
});
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

const fakeEndpoint = "http://example.com";
const fakeAccessToken = "foobar";
const httpClient = makeHTTPClient(fakeEndpoint, fakeAccessToken);

const expectedHeaderFields = {
  Authorization: "Basic OmZvb2Jhcg==",
  "Content-type": "application/json",
  "User-Agent":
    "defer/unknow (source: https://github.com/defer-run/defer.client)",
};

describe("makeHTTPClient/3", () => {
  it("should not throw with 200", async () => {
    const mockedResponse = new Response("{}", {
      status: 200,
    });
    mockedFetch.mockResolvedValue(mockedResponse);
    const response = await httpClient("GET", "/hello");

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(fakeEndpoint + "/hello", {
      method: "GET",
      body: null,
      headers: expectedHeaderFields,
    });
    expect(response).toEqual({});
  });
});
