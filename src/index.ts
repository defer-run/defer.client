import { fetch } from "@whatwg-node/fetch";

interface Options {
  apiToken: string;
}

let token: string;

export default {
  init: ({ apiToken }: Options) => {
    token = apiToken;
  },
  push: (fn: string, args: Record<string, any>, _options: Options) => {
    fetch(`${DOMAIN}/${PATH}`, {
      method: "POST",
      body: JSON.stringify({
        fn,
        args,
      }),
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  },
};
