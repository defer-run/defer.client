---
"@defer/client": minor
---

Introducing `maxDuration` support

`defer()` exposes a new `maxDuration` configuration:

```ts
const importContacts = (companyId: string, contacts: Contact[]) => {
  //  ...
};

export default defer(importContacts, {
  maxDuration: 10, // timeout after 10secs
});
```

BREAKING CHANGE: `maxDuration` has a default value to 30min. Users having executions going over this limit can override it with a higher value `{ maxDuration: 3600 }`
