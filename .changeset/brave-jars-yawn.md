---
"@defer/client": minor
---

Add cancel execution:

```ts
import { cancelExecution } from "@defer/client";

// ...

const { id } = await cancelExecution(executionId);

// ...
```
