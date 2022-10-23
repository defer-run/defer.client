import { fetch } from "@whatwg-node/fetch";
import { DOMAIN, PATH, TOKEN_ENV_NAME } from "./constants.js";

interface Options {
  apiToken: string;
}

let token: string | undefined = process.env[TOKEN_ENV_NAME];

export const init = ({ apiToken }: Options) => {
  token = apiToken;
};

function defer<F extends (...args: any | undefined) => Promise<any>>(fn: F): F;
function defer(fn: any): any {
  const ret = (...args: any[]) => {
    if (token) {
      return new Promise((resolve, reject) => {
        let body = "";
        try {
          body = JSON.stringify({
            fn: fn.name,
            args: JSON.stringify(args),
          });
        } catch (error) {
          console.log(
            `[defer.run][${fn}] Failed to serialize arguments: ${error}`
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
          console.log(`[defer.run][${fn}] Failed to execute: ${error}`);
          reject();
        });
      });
    } else {
      return fn(...args);
    }
  };
  return ret;
}

export default defer;
