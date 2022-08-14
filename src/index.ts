import { fetch } from "@whatwg-node/fetch";
import { DOMAIN, PATH } from "./constants.js";

interface Options {
  apiToken: string;
}

let token: string;
export default {
  init: ({ apiToken }: Options) => {
    token = apiToken;
  },
  push: (fn: string, ...args: any[]) => {
    return new Promise((resolve, reject) => {
      let body = "";
      try {
        body = JSON.stringify({
          fn,
          args,
        });
      } catch (error) {
        console.log(
          `[cua.function][${fn}] Failed to serialize arguments: ${error}`
        );
        reject();
      }
      fetch(`${DOMAIN}${PATH}`, {
        method: "POST",
        body,
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }).then(resolve, (error) => {
        console.log(`[cua.function][${fn}] Failed to execute: ${error}`);
        reject();
      });
    });
  },
};
