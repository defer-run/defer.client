---
"@defer/client": major
---

This new major version brings scheduling features to the local developer experience.

Features:
- concurrency
- delay
- reschedule
- cancel
- discard
- `DeferError` has been replaced with respective errors for each client method.

Breaking changes:
- `getExecution` does not return the result anymore. To do so, one must use `getExecutionResult`.
