# `@defer.run/client`

`defer` is your favorite async tasks handler to offload your JavaScript API.


## Install


```sh
yarn add @defer.run/client

# or

npm i @defer.run/client
```

## Configuration

Make sure to define the `DEFER_TOKEN` environment variable in production/staging environments.

## Usage


### 1. Define your background function

A background function should be a unique default export of a file placed in `background-functions/` folder.

```ts
import { defer } from "@defer.run/client";

function importContacts(intercomId: string) {
  // import contacts from Hubspot and insert them in the database
}

export default defer(importContacts)
```


### 2. Call your background function

For a seamless integration with your project, we recommend to install our `@defer.run/babel` babel plugin.
Our babel plugin will replace all usage of defer functions to client pushes:

```ts
import type { NextApiRequest, NextApiResponse } from "next";
import sentToIntercom from "../../background-functions/importContacts";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // will be executed in the background
  await importContacts(currentUser.intercomId);

  res.status(200).json({ name: "John Doe" });
}
```
