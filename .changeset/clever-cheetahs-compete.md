---
"@defer.run/client": minor
---

Introduce a new API to delay an execution:

```ts
import { delay } from "@defer.run/client"
import { helloWorld } from '../defer/helloWorld';

// create a delayed execution
const delayedHelloWorld = delay(helloWorld, '1h')

delayedHelloWorld() // background execution in 1 hour
```
