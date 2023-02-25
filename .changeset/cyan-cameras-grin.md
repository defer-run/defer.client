---
"@defer/client": major
---

Add concurrency limit option.

```js
import { defer } from "@defer/client";

async function oneByOne() {
  // do something...
}

export default defer(oneByOne, { concurrency: 1 });
```
