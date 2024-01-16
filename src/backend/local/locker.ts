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

class Locker {
  private _locked: boolean;
  private _waiting: Array<(unlock: () => void) => void>;

  constructor() {
    this._locked = false;
    this._waiting = [];
  }

  lock(): Promise<() => void> {
    const unlock = () => {
      let nextResolve: ((unlock: () => void) => void) | undefined;
      if (this._waiting.length > 0) {
        nextResolve = this._waiting.shift();
        if (nextResolve) {
          nextResolve(unlock);
        }
      } else {
        this._locked = false;
      }
    };

    if (this._locked) {
      return new Promise((resolve) => {
        this._waiting.push(resolve);
      });
    } else {
      this._locked = true;
      return new Promise((resolve) => {
        resolve(unlock);
      });
    }
  }
}
