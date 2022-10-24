import { fetch } from "@whatwg-node/fetch";
import { DOMAIN, PATH, TOKEN_ENV_NAME } from "./constants.js";

interface Options {
  apiToken?: string;
  apiUrl?: string;
}

let token: string | undefined = process.env[TOKEN_ENV_NAME];
let apiEndpoint = `${DOMAIN}${PATH}`;

export const init = ({ apiToken, apiUrl }: Options) => {
  token = apiToken || process.env[TOKEN_ENV_NAME];
  apiEndpoint = apiUrl || `${DOMAIN}${PATH}`;
};

export function defer<F extends (...args: any | undefined) => Promise<any>>(
  fn: F
): F;
export function defer(fn: any): any {
  const ret = (...args: any[]) => {
    if (token) {
      return new Promise((resolve, reject) => {
        let body = "";
        try {
          body = JSON.stringify({
            name: fn.name,
            arguments: args,
          });
        } catch (error) {
          console.log(
            `[defer.run][${fn}] Failed to serialize arguments: ${error}`
          );
          reject();
        }
        fetch(apiEndpoint, {
          method: "POST",
          body,
          headers: {
            "Content-type": "application/json",
            Authorization: `Basic ${Buffer.from(":" + token).toString(
              "base64"
            )}`,
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
