import { makeHTTPClient } from "../../../src/backend/remote/httpClient.js";

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

describe("makeHttpclient/3", () => {
	beforeEach(() => {
		jest.resetModules();
	});

	describe("when server respond with 2xx", () => {
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

		it("should not throw with 201", async () => {
			const mockResponse = new Response("{}", { status: 201 });
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

		it("should not throw with 202", async () => {
			const mockResponse = new Response("{}", { status: 202 });
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

		it("should not throw with 203", async () => {
			const mockResponse = new Response("{}", { status: 203 });
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

		it("should not throw with 206", async () => {
			const mockResponse = new Response("{}", { status: 206 });
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

		it("should not throw with 207", async () => {
			const mockResponse = new Response("{}", { status: 207 });
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

		it("should not throw with 208", async () => {
			const mockResponse = new Response("{}", { status: 208 });
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

		it("should not throw with 226", async () => {
			const mockResponse = new Response("{}", { status: 208 });
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
	})
})
