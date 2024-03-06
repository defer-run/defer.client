// Copyright (c) 2023 Defer SAS <hello@defer.run>.
//
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
// REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
// AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
// INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
// LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
// OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
// PERFORMANCE OF THIS SOFTWARE.

import { isDebugEnabled } from "./utils";

// source: https://github.com/csquared/node-logfmt/blob/master/lib/stringify.js
function fmtData(data: any): string {
  var line = "";

  for (var key in data) {
    var value = data[key];
    var is_null = false;
    if (value == null) {
      is_null = true;
      value = "";
    } else value = value.toString();

    var needs_quoting = value.indexOf(" ") > -1 || value.indexOf("=") > -1;
    var needs_escaping = value.indexOf('"') > -1 || value.indexOf("\\") > -1;

    if (needs_escaping) value = value.replace(/["\\]/g, "\\$&");
    if (needs_quoting || needs_escaping) value = '"' + value + '"';
    if (value === "" && !is_null) value = '""';

    line += key + "=" + value + " ";
  }

  //trim traling space
  return line.substring(0, line.length - 1);
}

export function log(lvl: string, msg: string, data?: any) {
  if (data) console.log(fmtData({ level: lvl, message: msg, ...data }));
  else console.log(fmtData({ level: lvl, message: msg }));
}

export function info(msg: string, data?: any) {
  log("info", msg, data);
}

export function error(msg: string, data?: any) {
  log("error", msg, data);
}

export function warn(msg: string, data?: any) {
  log("warn", msg, data);
}

export function debug(msg: string, data?: any) {
  if (isDebugEnabled()) log("debug", msg, data);
}
