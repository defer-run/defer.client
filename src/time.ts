import parseDuration from "parse-duration";

import { DelayString } from "./index.js";

export const withDelay = (dt: Date, delay: DelayString): Date => new Date(dt.getTime() + parseDuration(delay));
