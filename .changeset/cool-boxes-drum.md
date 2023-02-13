---
"@defer.run/client": minor
---

Add a primary retry option when defining defer function.

```js
import { defer } from "@defer.run/client";

async function makeAPICallWhoMaybeFail() {
  // do something...
}

export default defer(makeAPICallWhoMaybeFail, { retry: 5 });
```

