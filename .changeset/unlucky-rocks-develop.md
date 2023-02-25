---
"@defer/client": major
---

BREAKING CHANGE:
- Renamed `defer.schedule()` to `defer.cron()`
- `defer.cron()` no longer takes a english string but a CRON tab string

```ts
import { defer } from '@defer.run/client'

const weeklyBrief = async () => {
  // ...
}
  
export default defer.schedule(
  weeklyBrief,
  '5 0 * * *'
)
```
