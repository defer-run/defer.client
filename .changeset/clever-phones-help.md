---
"@defer/client": minor
---

Deprecate `defer.await()` in favor of `awaitResult(deferFn)`

```ts
import { importContacts } from '../defer/importContacts'

const importContactWithResult = awaitResult(importContacts);
const result = await importContactWithResult("1", []);
```
