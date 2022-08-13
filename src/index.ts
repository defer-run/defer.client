import { fetch } from "@whatwg-node/fetch";
import { DOMAIN, PATH } from "./constants";

interface Options {
  apiToken: string;
}

let token: string;
export default {
  init: ({ apiToken }: Options) => {
    token = apiToken;
  },
  push: (fn: string, args?: any[], options?: Options) => {
    const { apiToken = token } = options || {};
    return fetch(`${DOMAIN}${PATH}`, {
      method: "POST",
      body: JSON.stringify({
        fn,
        args,
      }),
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
    });
  },
};
