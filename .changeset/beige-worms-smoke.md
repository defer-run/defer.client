---
"@defer/client": minor
---

expose `getExecution(id)` to poll for an execution status and result:

```ts
import { type FetchExecutionResponse, getExecution } from "@defer/client";
import type { NextApiRequest, NextApiResponse } from "next";

type Response = {
  res: FetchExecutionResponse;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
) {
  const executionId = req.query.id;
  const ret = await getExecution(executionId as string);
  res.status(200).json({ res: ret });
}
```
