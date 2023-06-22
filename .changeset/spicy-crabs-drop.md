---
"@defer/client": minor
---

Introducing `timeout` beta support

`defer()` exposes a new `timeout` configuration:

```ts
const importContacts = (companyId: string, contacts: Contact[]) => {
  //  ...
};

export default defer(importContacts, {
  timeout: 10, // timeout after 10secs
});
```

BREAKING CHANGE: `timeout` has a default value to 30min. Users having executions going over this limit can override it with a higher value `{ timeout: 3600 }`
