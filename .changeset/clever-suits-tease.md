---
"@defer/client": minor
---

Introducing `@defer/client/next` integration

This release introduces two new helpers that makes Defer deeply integrated with NextJS:

- `asNextRoute()`: used in combination of `useDeferRoute()` to trigger background functions from Client-side Components
- `useDeferRoute()`: trigger and wait for the result of a background functions from Client-side Components

## Next API Routes

```tsx
import { asNextRoute } from "@defer/client/next";
import createThumbnails from "../../defer/createThumbnails";

const { GetHandler, PostHandler } = asNextRoute(createThumbnails);

export const GET = GetHandler;
export const POST = PostHandler;
```

## React client-side component

```tsx
import { useDeferRoute } from "@defer/client/next";
import createThumbnails from "../../defer/createThumbnails";

export function MyComp() {
  const { request, loading, result } = useDeferRoute(createThumbnails);
  return (
    <div>
      <span>Loading: {loading ? "Yes" : "No"}</span>
      <span>Result: {result ? JSON.stringify(result) : "--"}</span>
      <button onClick={() => request("")}>Call</button>
    </div>
  );
}
```
