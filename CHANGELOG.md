# @defer/client

## 2.3.0

### Minor Changes

- [#130](https://github.com/defer-run/defer.client/pull/130) [`70cb314`](https://github.com/defer-run/defer.client/commit/70cb31476bbf4656613a7b892b9d80c651b98acf) Thanks [@charlypoly](https://github.com/charlypoly)! - Fix VSCode dynamic imports resolving on `@defer/client/index`

## 2.2.1

### Patch Changes

- [#128](https://github.com/defer-run/defer.client/pull/128) [`17b344f`](https://github.com/defer-run/defer.client/commit/17b344f4f378a13ef5f5e74a0fe7d0200d224d5e) Thanks [@charlypoly](https://github.com/charlypoly)! - Regression on local `listExecutions()`

## 2.2.0

### Minor Changes

- [#126](https://github.com/defer-run/defer.client/pull/126) [`f8a010d`](https://github.com/defer-run/defer.client/commit/f8a010d7ad82a9356c1b6b70c0ced87656fe7237) Thanks [@charlypoly](https://github.com/charlypoly)! - Local support for metadata filtering

## 2.1.1

### Patch Changes

- [#125](https://github.com/defer-run/defer.client/pull/125) [`dc38d60`](https://github.com/defer-run/defer.client/commit/dc38d609b5bcbea33762f52e83cabaf8c7d5cb30) Thanks [@codenem](https://github.com/codenem)! - Fix InternalExecution interface

- [#125](https://github.com/defer-run/defer.client/pull/125) [`42b943b`](https://github.com/defer-run/defer.client/commit/42b943bd4dc77fcf5ae594b21815bb963580d430) Thanks [@phil-loops](https://github.com/phil-loops)! - update type definition for `DeferableFunction`

- [#123](https://github.com/defer-run/defer.client/pull/123) [`cf3b12d`](https://github.com/defer-run/defer.client/commit/cf3b12def5245e165ecc0cb3504924d70680abdb) Thanks [@charlypoly](https://github.com/charlypoly)! - Fix `awaitResult()` typings

## 2.1.0

### Minor Changes

- [#120](https://github.com/defer-run/defer.client/pull/120) [`c1f4ffe`](https://github.com/defer-run/defer.client/commit/c1f4ffe5e8bc3b64d608fdb914fe35552fc17da3) Thanks [@charlypoly](https://github.com/charlypoly)! - Fix local concurrency applied globally

## 2.0.0

### Major Changes

- [#116](https://github.com/defer-run/defer.client/pull/116) [`2276048`](https://github.com/defer-run/defer.client/commit/2276048c6f796a0f3177eff2e9cf99f96c73bf50) Thanks [@gearnode](https://github.com/gearnode)! - This new major version brings scheduling features to the local developer experience.

  Features:

  - concurrency
  - delay
  - reschedule
  - cancel
  - discard
  - `DeferError` has been replaced with respective errors for each client method.

  Breaking changes:

  - `getExecution` does not return the result anymore. To do so, one must use `getExecutionResult`.

### Minor Changes

- [#116](https://github.com/defer-run/defer.client/pull/116) [`b62b04b`](https://github.com/defer-run/defer.client/commit/b62b04b39af81b66b13766bc33ba6c9da72cede1) Thanks [@gearnode](https://github.com/gearnode)! - Add option to hide defer starting banner

- [#116](https://github.com/defer-run/defer.client/pull/116) [`b62b04b`](https://github.com/defer-run/defer.client/commit/b62b04b39af81b66b13766bc33ba6c9da72cede1) Thanks [@gearnode](https://github.com/gearnode)! - Add option to not start local execution scheduler

- [#116](https://github.com/defer-run/defer.client/pull/116) [`2276048`](https://github.com/defer-run/defer.client/commit/2276048c6f796a0f3177eff2e9cf99f96c73bf50) Thanks [@gearnode](https://github.com/gearnode)! - Use Defer public API v2

## 1.15.0

### Minor Changes

- [#112](https://github.com/defer-run/defer.client/pull/112) [`b2363a6`](https://github.com/defer-run/defer.client/commit/b2363a650a221410328ad4c60c3178f8eb5d77e4) Thanks [@codenem](https://github.com/codenem)! - add function configuration maxConcurrencyAction

## 1.14.1

### Patch Changes

- [#110](https://github.com/defer-run/defer.client/pull/110) [`a9055df`](https://github.com/defer-run/defer.client/commit/a9055df0b421a6a419bee499d4c9e4116a5a0f6b) Thanks [@charlypoly](https://github.com/charlypoly)! - Re-throw errors for local development

## 1.14.0

### Minor Changes

- [#108](https://github.com/defer-run/defer.client/pull/108) [`f4e14f2`](https://github.com/defer-run/defer.client/commit/f4e14f2e80b79ca41c36dfbbb288b82969a34066) Thanks [@gearnode](https://github.com/gearnode)! - Fix execution state bad values

## 1.13.1

### Patch Changes

- [#104](https://github.com/defer-run/defer.client/pull/104) [`11ff735`](https://github.com/defer-run/defer.client/commit/11ff735c92e1e39b6ab5dc8d360555fe81eed135) Thanks [@gearnode](https://github.com/gearnode)! - Disable fetch cache

## 1.13.0

### Minor Changes

- [#102](https://github.com/defer-run/defer.client/pull/102) [`5613d53`](https://github.com/defer-run/defer.client/commit/5613d537b01659bb8572cdef0cfea51d729296f9) Thanks [@charlypoly](https://github.com/charlypoly)! - Add `assignOptions()` helper

  `assignOptions` is helpful to change the behavior of a given Background Function
  by combining multiple options such as `delay`, `metadata` or `discardAfter`:

  ```ts
  import { assignOptions, delay } from "@defer/client";
  import handleStripeWebhookFn from "./defer/handleStripeWebhook.js";

  // ...

  const handleStripeWebhook = assignOptions(handleStripeWebhookFn, {
    discardAfter: '12h'
    // process webhooks in the right order
    delay: event.created + 60 * 10,
    // add metadata for the the Defer Console
    metadata: {
      livemode: event.livemode,
      type: event.type,
      apiVersion: event.api_version,
    },
  });

  handleStripeWebhook(event.id)
    .then((executionID) => {
      response.sendStatus(
        200,
        "application/json",
        JSON.stringify({ executionID })
      );
    })
    .catch((err) => {
      response.sendStatus(400);
    });

  // ...
  ```

## 1.12.1

### Minor Changes

- [#96](https://github.com/defer-run/defer.client/pull/96) [`a392419`](https://github.com/defer-run/defer.client/commit/a392419f2e464c2baee978722e516fd1ef72429e) Thanks [@gearnode](https://github.com/gearnode)! - Add discardAfter option

- [#98](https://github.com/defer-run/defer.client/pull/98) [`a766297`](https://github.com/defer-run/defer.client/commit/a766297ce592ea4ad8eeef3ebe03df2257b9059f) Thanks [@gearnode](https://github.com/gearnode)! - Add reschedule support

### Patch Changes

- [#100](https://github.com/defer-run/defer.client/pull/100) [`4e367da`](https://github.com/defer-run/defer.client/commit/4e367da569d695f2a9fe57991e9c9593d08dec57) Thanks [@estubmo](https://github.com/estubmo)! - Bun support: Use crypto rather than URL/Blob API for generating random UUID

## 1.11.0

### Minor Changes

- [#94](https://github.com/defer-run/defer.client/pull/94) [`258c769`](https://github.com/defer-run/defer.client/commit/258c769505037a9abe6a2bff4924fae579aad99d) Thanks [@gearnode](https://github.com/gearnode)! - Add Bun runtime support

- [#94](https://github.com/defer-run/defer.client/pull/94) [`258c769`](https://github.com/defer-run/defer.client/commit/258c769505037a9abe6a2bff4924fae579aad99d) Thanks [@gearnode](https://github.com/gearnode)! - Drop NodeJS 16.x support

## 1.10.0

### Minor Changes

- [#90](https://github.com/defer-run/defer.client/pull/90) [`d84ec22`](https://github.com/defer-run/defer.client/commit/d84ec22793c1747189f41b31182558b31f7a0a5f) Thanks [@gearnode](https://github.com/gearnode)! - Add list execution tries

## 1.9.0

### Minor Changes

- [#86](https://github.com/defer-run/defer.client/pull/86) [`01d1aae`](https://github.com/defer-run/defer.client/commit/01d1aaeae78c0a6b38dafa049ef217d719f55ee3) Thanks [@gearnode](https://github.com/gearnode)! - Add force cancel execution support

* [#89](https://github.com/defer-run/defer.client/pull/89) [`16dcf96`](https://github.com/defer-run/defer.client/commit/16dcf960bd5c49f88cd9ef1bd88f186e500fa9a5) Thanks [@gearnode](https://github.com/gearnode)! - Cloudflare Worker compatibility

### Patch Changes

- [#87](https://github.com/defer-run/defer.client/pull/87) [`bfdad40`](https://github.com/defer-run/defer.client/commit/bfdad40a4cd33650c4d5e4482d30349d01656862) Thanks [@codenem](https://github.com/codenem)! - Better compatibility with engines without process.env

## 1.8.1

### Patch Changes

- [#82](https://github.com/defer-run/defer.client/pull/82) [`73a96d9`](https://github.com/defer-run/defer.client/commit/73a96d9497510f1069525e67aaef752eadff24eb) Thanks [@charlypoly](https://github.com/charlypoly)! - Remove unnecessary `peerDependencies` on `next` and `react`

## 1.8.0

### Minor Changes

- [#80](https://github.com/defer-run/defer.client/pull/80) [`27a1d46`](https://github.com/defer-run/defer.client/commit/27a1d46d2773fcc0d15440ad81f238c51630827e) Thanks [@gearnode](https://github.com/gearnode)! - Remove running state

* [#80](https://github.com/defer-run/defer.client/pull/80) [`27a1d46`](https://github.com/defer-run/defer.client/commit/27a1d46d2773fcc0d15440ad81f238c51630827e) Thanks [@gearnode](https://github.com/gearnode)! - Add cancel execution:

  ```ts
  import { cancelExecution } from "@defer/client";

  // ...

  const { id } = await cancelExecution(executionId);

  // ...
  ```

## 1.7.2

### Patch Changes

- [#78](https://github.com/defer-run/defer.client/pull/78) [`8477826`](https://github.com/defer-run/defer.client/commit/84778269a3232aff584bc42985ed1ddddfb4db83) Thanks [@charlypoly](https://github.com/charlypoly)! - fix ESM compat

## 1.7.1

### Patch Changes

- [#76](https://github.com/defer-run/defer.client/pull/76) [`54ec6f7`](https://github.com/defer-run/defer.client/commit/54ec6f75bec3a0f88e720028c3f12591c21af774) Thanks [@charlypoly](https://github.com/charlypoly)! - Typings fixes on 1.7.0

## 1.7.0

### Minor Changes

- [#66](https://github.com/defer-run/defer.client/pull/66) [`b9973d5`](https://github.com/defer-run/defer.client/commit/b9973d5cda217738008c202e82829112a00d7998) Thanks [@charlypoly](https://github.com/charlypoly)! - Introducing `@defer/client/next` integration

  This release introduces two new helpers that makes Defer deeply integrated with NextJS:

  - `asNextRoute()`: used in combination of `useDeferRoute()` to trigger background functions from Client-side Components
  - `useDeferRoute()`: trigger and wait for the result of a background functions from Client-side Components

  ## Next API Routes

  ```tsx
  import { asNextRoute } from "@defer/client/next";
  import createThumbnails from "../../defer/createThumbnails";

  const { GetHandler, PostHandler } = asNextRoute(createThumbnails);

  export const GET = GetHandler;
  export const POST = PostHandler;
  ```

  ## React client-side component

  ```tsx
  import { useDeferRoute } from "@defer/client/next";
  import createThumbnails from "../../defer/createThumbnails";

  export function MyComp() {
    const { request, loading, result } = useDeferRoute(createThumbnails);
    return (
      <div>
        <span>Loading: {loading ? "Yes" : "No"}</span>
        <span>Result: {result ? JSON.stringify(result) : "--"}</span>
        <button onClick={() => request("")}>Call</button>
      </div>
    );
  }
  ```

## 1.6.0

### Minor Changes

- [#70](https://github.com/defer-run/defer.client/pull/70) [`4646cd0`](https://github.com/defer-run/defer.client/commit/4646cd0daaa8c88664f564756a5d93d6dc6ef6e3) Thanks [@gearnode](https://github.com/gearnode)! - Introducing `maxDuration` support

  `defer()` exposes a new `maxDuration` configuration:

  ```ts
  const importContacts = (companyId: string, contacts: Contact[]) => {
    //  ...
  };

  export default defer(importContacts, {
    maxDuration: 10, // timeout after 10secs
  });
  ```

  BREAKING CHANGE: `maxDuration` has a default value to 30min. Users having executions going over this limit can override it with a higher value `{ maxDuration: 3600 }`

* [#70](https://github.com/defer-run/defer.client/pull/70) [`c92bb44`](https://github.com/defer-run/defer.client/commit/c92bb445b1559406c45aa8a985b6d63ceabbadd8) Thanks [@gearnode](https://github.com/gearnode)! - Allow options for CRON function

### Patch Changes

- [#68](https://github.com/defer-run/defer.client/pull/68) [`74ab12b`](https://github.com/defer-run/defer.client/commit/74ab12bfbefbf9a16eaa487efc27ebe8681e751b) Thanks [@gearnode](https://github.com/gearnode)! - Fix error code field name

## 1.5.0

### Minor Changes

- [#61](https://github.com/defer-run/defer.client/pull/61) [`44b91f9`](https://github.com/defer-run/defer.client/commit/44b91f9fafa4282579dc4fbb458b2e363d0649af) Thanks [@gearnode](https://github.com/gearnode)! - Fix remix build by not using native crypto module

* [#64](https://github.com/defer-run/defer.client/pull/64) [`20f8d66`](https://github.com/defer-run/defer.client/commit/20f8d661177b6afc1098447eb348e0734f9417cd) Thanks [@codenem](https://github.com/codenem)! - Update public api paths and improve error messages

## 1.4.0

### Minor Changes

- [#59](https://github.com/defer-run/defer.client/pull/59) [`0333c50`](https://github.com/defer-run/defer.client/commit/0333c501d36fde0259906f364b0ad7d2a59bd720) Thanks [@charlypoly](https://github.com/charlypoly)! - Fix `retry` default value

* [#51](https://github.com/defer-run/defer.client/pull/51) [`8c97893`](https://github.com/defer-run/defer.client/commit/8c97893e1b34dc4d5dd3102164c400c28f59ec79) Thanks [@codenem](https://github.com/codenem)! - Add support for execution metadata

## 1.3.1

### Patch Changes

- [#54](https://github.com/defer-run/defer.client/pull/54) [`6964331`](https://github.com/defer-run/defer.client/commit/6964331eefd3cedf72a1de2789d95e035cb41eaf) Thanks [@gearnode](https://github.com/gearnode)! - Concurrency options is ignored

## 1.3.0

### Minor Changes

- [#50](https://github.com/defer-run/defer.client/pull/50) [`44ca317`](https://github.com/defer-run/defer.client/commit/44ca317c29bc58f618f030eca3f29ecceb4e13f2) Thanks [@gearnode](https://github.com/gearnode)! - Add option to configure retry behaviour

## 1.2.0

### Minor Changes

- [#44](https://github.com/defer-run/defer.client/pull/44) [`d9dcfae`](https://github.com/defer-run/defer.client/commit/d9dcfaef99f2856f4b55481edefcf32d52bfe8f4) Thanks [@gearnode](https://github.com/gearnode)! - Execution defer function without blocking

* [#45](https://github.com/defer-run/defer.client/pull/45) [`7bfd219`](https://github.com/defer-run/defer.client/commit/7bfd219210f2b3ee90e49754934f394fe29478bc) Thanks [@gearnode](https://github.com/gearnode)! - Add user-agent header field

- [#44](https://github.com/defer-run/defer.client/pull/44) [`d9dcfae`](https://github.com/defer-run/defer.client/commit/d9dcfaef99f2856f4b55481edefcf32d52bfe8f4) Thanks [@gearnode](https://github.com/gearnode)! - Add support of getExecution locally

### Patch Changes

- [#44](https://github.com/defer-run/defer.client/pull/44) [`d9dcfae`](https://github.com/defer-run/defer.client/commit/d9dcfaef99f2856f4b55481edefcf32d52bfe8f4) Thanks [@gearnode](https://github.com/gearnode)! - Fix function return not serialized

## 1.1.0

### Minor Changes

- [#36](https://github.com/defer-run/defer.client/pull/36) [`ccc39dd`](https://github.com/defer-run/defer.client/commit/ccc39dd151d9201a7205ed0785933aae8e5eb2ce) Thanks [@charlypoly](https://github.com/charlypoly)! - expose `getExecution(id)` to poll for an execution status and result:

  ```ts
  import { type FetchExecutionResponse, getExecution } from "@defer/client";
  import type { NextApiRequest, NextApiResponse } from "next";

  type Response = {
    res: FetchExecutionResponse;
  };

  export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Response>,
  ) {
    const executionId = req.query.id;
    const ret = await getExecution(executionId as string);
    res.status(200).json({ res: ret });
  }
  ```

## 1.0.0

### Major Changes

- [#29](https://github.com/defer-run/defer.client/pull/29) [`859bf46`](https://github.com/defer-run/defer.client/commit/859bf465cd9808a94fa45f0d9ab022039d30b4e7) Thanks [@gearnode](https://github.com/gearnode)! - Add concurrency limit option.

  ```js
  import { defer } from "@defer/client";

  async function oneByOne() {
    // do something...
  }

  export default defer(oneByOne, { concurrency: 1 });
  ```

* [#31](https://github.com/defer-run/defer.client/pull/31) [`d791d79`](https://github.com/defer-run/defer.client/commit/d791d79f1b1af77818f849072721ef6accba3a38) Thanks [@gearnode](https://github.com/gearnode)! - Remove deprecated `.delayed` API.

- [#31](https://github.com/defer-run/defer.client/pull/31) [`ef80061`](https://github.com/defer-run/defer.client/commit/ef800611dec0549eba9a406e093cd1940c7bb0cb) Thanks [@gearnode](https://github.com/gearnode)! - `init` function renamed in `configure`

* [#31](https://github.com/defer-run/defer.client/pull/31) [`ef80061`](https://github.com/defer-run/defer.client/commit/ef800611dec0549eba9a406e093cd1940c7bb0cb) Thanks [@gearnode](https://github.com/gearnode)! - Handle API HTTP error by throwing an error

- [#31](https://github.com/defer-run/defer.client/pull/31) [`ef80061`](https://github.com/defer-run/defer.client/commit/ef800611dec0549eba9a406e093cd1940c7bb0cb) Thanks [@gearnode](https://github.com/gearnode)! - Keep same behavior in dev and prod

* [#34](https://github.com/defer-run/defer.client/pull/34) [`fe251f2`](https://github.com/defer-run/defer.client/commit/fe251f245baf2eb93c70ff5f295f4354a65ecbf6) Thanks [@charlypoly](https://github.com/charlypoly)! - BREAKING CHANGE:

  - Renamed `defer.schedule()` to `defer.cron()`
  - `defer.cron()` no longer takes a english string but a CRON tab string

  ```ts
  import { defer } from "@defer.run/client";

  const weeklyBrief = async () => {
    // ...
  };

  export default defer.cron(weeklyBrief, "5 0 * * *");
  ```

### Minor Changes

- [#34](https://github.com/defer-run/defer.client/pull/34) [`e399d75`](https://github.com/defer-run/defer.client/commit/e399d75570b0431fe80aff794ab851e3b10f0d52) Thanks [@charlypoly](https://github.com/charlypoly)! - Deprecate `defer.await()` in favor of `awaitResult(deferFn)`

  ```ts
  import { importContacts } from "../defer/importContacts";

  const importContactWithResult = awaitResult(importContacts);
  const result = await importContactWithResult("1", []);
  ```

## 0.5.0

### Minor Changes

- [#26](https://github.com/defer-run/defer.client/pull/26) [`4d2c4d4`](https://github.com/defer-run/defer.client/commit/4d2c4d4392493a0936ab457e30ff88fe2e7d769c) Thanks [@gearnode](https://github.com/gearnode)! - Add a primary retry option when defining defer function.

  ```js
  import { defer } from "@defer/client";

  async function makeAPICallWhoMaybeFail() {
    // do something...
  }

  export default defer(makeAPICallWhoMaybeFail, { retry: 5 });
  ```

## 0.4.0

### Minor Changes

- [#24](https://github.com/defer-run/defer.client/pull/24) [`ca35544`](https://github.com/defer-run/defer.client/commit/ca35544849cc76cff8c4038ce30eb90a293af1e0) Thanks [@charlypoly](https://github.com/charlypoly)! - Introduce a new API to delay an execution:

  ```ts
  import { delay } from "@defer/client";
  import { helloWorld } from "../defer/helloWorld";

  // create a delayed execution
  const delayedHelloWorld = delay(helloWorld, "1h");

  delayedHelloWorld(); // background execution in 1 hour
  ```

## 0.3.0

### Minor Changes

- [#20](https://github.com/defer-run/defer.client/pull/20) [`99ed4df`](https://github.com/defer-run/defer.client/commit/99ed4df58266a08c7c3a58410a9b7be55bcbcb40) Thanks [@charlypoly](https://github.com/charlypoly)! - Introduce `defer.schedule(fn, frequencyStr)`

  Defer now support scheduled functions (CRON), as follows:

  ```ts
  import { defer } from "@defer/client";

  async function myDeferWorkflow() {
    const users = await prisma.user.find({
      where: {
        // ...
      },
    });

    // do something...
  }

  export default defer.cron(myDeferWorkflow, "every day at 10am");
  ```

  **Notes**

  - a scheduled function should not take arguments
  - a scheduled function is **scheduled on UTC time**
  - a scheduled function should not be invoked (will result in errors)

## 0.2.3

### Patch Changes

- [#18](https://github.com/defer-run/defer.client/pull/18) [`27fe426`](https://github.com/defer-run/defer.client/commit/27fe4260af99dd97213368a7b235911130a0ea1e) Thanks [@charlypoly](https://github.com/charlypoly)! - Typings fixes

## 0.2.2

### Patch Changes

- [#16](https://github.com/defer-run/defer.client/pull/16) [`e282ee3`](https://github.com/defer-run/defer.client/commit/e282ee3ddbb6c8502036b67d19b554bd70f376d0) Thanks [@charlypoly](https://github.com/charlypoly)! - Handle error without result on polling

## 0.2.1

### Patch Changes

- [#14](https://github.com/defer-run/defer.client/pull/14) [`2007397`](https://github.com/defer-run/defer.client/commit/200739753643c5bc6a3946f8040c4a16c8fa3052) Thanks [@charlypoly](https://github.com/charlypoly)! - `DeferFunction.await()` should be noop when `DEFER_TOKEN` is not set

## 0.2.0

### Minor Changes

- [#11](https://github.com/defer-run/defer.client/pull/11) [`9c7895c`](https://github.com/defer-run/defer.client/commit/9c7895c46a764ece759f01cdb0ab9a4ed4fa05ee) Thanks [@charlypoly](https://github.com/charlypoly)! - Support for delayed functions

### Patch Changes

- [#12](https://github.com/defer-run/defer.client/pull/12) [`5cde47b`](https://github.com/defer-run/defer.client/commit/5cde47b6901544a90d66d654c24b9ac506bb87b1) Thanks [@charlypoly](https://github.com/charlypoly)! - Forward the received error for `deferred.await()`

## 0.1.0

### Minor Changes

- [#4](https://github.com/defer-run/defer.client/pull/4) [`08f0945`](https://github.com/defer-run/defer.client/commit/08f09459d0b4815b3540d8303c3877b75f6e7d69) Thanks [@charlypoly](https://github.com/charlypoly)! - `defer.await()`

### Patch Changes

- [#8](https://github.com/defer-run/defer.client/pull/8) [`991697d`](https://github.com/defer-run/defer.client/commit/991697da3c5dc27ab4f91f3f321add4de4eec161) Thanks [@charlypoly](https://github.com/charlypoly)! - expose client version (internal)

* [#9](https://github.com/defer-run/defer.client/pull/9) [`87ea1d4`](https://github.com/defer-run/defer.client/commit/87ea1d4de38498ac174a45b5786240798979229c) Thanks [@charlypoly](https://github.com/charlypoly)! - Execution polling jitter algorithm

## 0.0.16

### Patch Changes

- [#5](https://github.com/defer-run/defer.client/pull/5) [`7a54246`](https://github.com/defer-run/defer.client/commit/7a5424696aa340e4f5b24ae9b5cb504b09a826dc) Thanks [@gearnode](https://github.com/gearnode)! - Update endpoint

## 0.0.7

### Patch Changes

- support multiple arguments + error handling

## 0.0.6

### Patch Changes

- ESM fix

## 0.0.5

### Patch Changes

- major bugfix

## 0.0.4

### Patch Changes

- fetch

## 0.0.4-next.0

### Patch Changes

- debug mode

## 0.0.2

### Patch Changes

- fix for fetch client (POST)
