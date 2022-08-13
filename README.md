# `@cua.run/client`

`cua` is your favorite async tasks handler to offload your JavaScript API.


## Install


```sh
yarn add @cua.run/client

# or

npm i @cua.run/client
```

## Configuration

```ts
import cua from "@cua.run/client";

cua.init({ apiToken: "YOUR API TOKEN" });
```

## Usage


### Recommended usage

For a seamless integration with your project, we recommend to install our `@cua.run/babel` babel plugin.
Our babel plugin will replace all usage of cua functions to client pushes:

```ts
import type { NextApiRequest, NextApiResponse } from "next";
import sentToIntercom from "../../cua-functions/sendToIntercom";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = { /* ... */ }
  await sentToIntercom(user); // will be replaced by `cua.push('sentToIntercom', [user])` by our babel plugin
  res.status(200).json({ name: "John Doe" });
}
```


### Programmatic usage

```ts
await cua.push('function name', args)
```
