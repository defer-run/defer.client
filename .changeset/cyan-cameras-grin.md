---
"@defer.run/client": minor
---

Add concurrency limit option.

```js
import { defer } from "@defer.run/client";

async function oneByOne() {
  // do something...
}

export default defer(oneByOne, { concurrency: 1 });
```
