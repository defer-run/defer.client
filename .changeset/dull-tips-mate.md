---
"@defer/client": minor
---

Add `assignOptions()` helper

`assignOptions` is helpful to change the behavior of a given Background Function
by combining multiple options such as `delay`, `metadata` or `discardAfter`:

```ts
import { assignOptions, delay } from "@defer/client";
import handleStripeWebhookFn from "./defer/handleStripeWebhook.js";

// ...

const handleStripeWebhook = assignOptions(handleStripeWebhookFn, {
  discardAfter: '12h'
  // process webhooks in the right order
  delay: event.created + 60 * 10,
  // add metadata for the the Defer Console
  metadata: {
    livemode: event.livemode,
    type: event.type,
    apiVersion: event.api_version,
  },
});

handleStripeWebhook(event.id)
  .then((executionID) => {
    response.sendStatus(
      200,
      "application/json",
      JSON.stringify({ executionID })
    );
  })
  .catch((err) => {
    response.sendStatus(400);
  });

// ...
```
