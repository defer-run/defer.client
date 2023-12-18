import { makeHTTPClient } from "../src/httpClient";

global.fetch = jest.fn();

const fakeEndpoint = "http://example.com";
const fakeAccessToken = "foobar";
const httpClient = makeHTTPClient(fakeEndpoint, fakeAccessToken);

const expectedHeaderFields = {
  Authorization: "Basic OmZvb2Jhcg==",
  "Content-type": "application/json",
  "User-Agent":
    "defer/unknown (source: https://github.com/defer-run/defer.client)",
};

describe("makeHTTPClient/3", () => {
  it("should not throw with 200", async () => {
    const mockResponse = new Response("{}", { status: 200 });
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
    const response = await httpClient("GET", "/hello");

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(fakeEndpoint + "/hello", {
      method: "GET",
      body: null,
      cache: "no-store",
      headers: expectedHeaderFields,
    });
    expect(response).toEqual({});
  });
});
