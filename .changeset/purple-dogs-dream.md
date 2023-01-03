---
"@defer.run/client": minor
---

Introduce `defer.schedule(fn, frequencyStr)`

Defer now support scheduled functions (CRON), as follows:

```ts
import { defer } from '@defer.run/client'

async function myDeferWorkflow() {
  const users = await prisma.user.find({
    where: {
      // ...
    },
  })

  // do something...
}

defer.schedule(myDeferWorkflow, 'every day at 10am')
```

**Notes**

- a scheduled function should not take arguments
- a scheduled function is scheduled on PST time (beta)
- a scheduled function should not be invoked (will result in errors)
