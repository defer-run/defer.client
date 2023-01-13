# @cua.run/client

## 0.3.0

### Minor Changes

- [#20](https://github.com/defer-run/defer.client/pull/20) [`99ed4df`](https://github.com/defer-run/defer.client/commit/99ed4df58266a08c7c3a58410a9b7be55bcbcb40) Thanks [@charlypoly](https://github.com/charlypoly)! - Introduce `defer.schedule(fn, frequencyStr)`

  Defer now support scheduled functions (CRON), as follows:

  ```ts
  import { defer } from "@defer.run/client";

  async function myDeferWorkflow() {
    const users = await prisma.user.find({
      where: {
        // ...
      }
    });

    // do something...
  }

  export default defer.schedule(myDeferWorkflow, "every day at 10am");
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
