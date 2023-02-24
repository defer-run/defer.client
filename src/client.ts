import type { HTTPClient } from "./httpClient.js";
import { jitter } from "./jitter.js";

export interface EnqueueExecutionRequest {
	name: string;
	arguments: any[];
	scheduleFor: Date;
}

export interface EnqueueExecutionResponse {
	id: string;
}

export interface FetchExecutionRequest {
	id: string;
}

export type ExecutionState = "running" | "created" | "failed" | "succeed";

export interface FetchExecutionResponse {
	id: string;
	state: ExecutionState;
	result?: any;
}

export type PoolExecutionRequest = FetchExecutionRequest;

export type PoolExecutionResponse = FetchExecutionResponse;

export function enqueueExecution(
	client: HTTPClient,
	request: EnqueueExecutionRequest
): Promise<EnqueueExecutionResponse> {
	const data = JSON.stringify({ name: request.name, arguments: request.arguments, schedule_for: request.scheduleFor });
	return client<EnqueueExecutionResponse>("POST", "/api/v1/enqueue", data);
}

export function fetchExecution(
	client: HTTPClient,
	request: FetchExecutionRequest
): Promise<FetchExecutionResponse> {
	return client<FetchExecutionResponse>(
		"GET",
		`/api/v1/executions/${request.id}`
	);
}

export async function waitExecutionResult(
	client: HTTPClient,
	request: PoolExecutionRequest
): Promise<PoolExecutionResponse> {
	let attempts = 1;

	return new Promise<PoolExecutionResponse>((resolve, reject) => {
		const pool = function () {
			fetchExecution(client, request).then(
				(response) => {
					switch (response.state) {
						case "failed":
							resolve(response);
							break;
						case "succeed":
							resolve(response);
							break;
						default:
							setTimeout(pool, jitter(attempts++) * 1000);
					}

					return;
				},
				(error) => reject(error)
			);
		};

		setTimeout(pool, jitter(attempts++) * 1000);
	});
}
