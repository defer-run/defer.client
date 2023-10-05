<p align="center">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/defer-run/documentation/master/images/logo/dark.svg"/>
        <img alt="Defer logo" src="https://raw.githubusercontent.com/defer-run/documentation/master/images/logo/light.svg"/>
    </picture>
</p>
<p align="center">
    Zero infrastructure Node.js background jobs
</p>
<p align="center">
    <a href="https://docs.defer.run/">Documentation</a>
    <span>&nbsp;·&nbsp;</span>
    <a href="https://www.defer.run/blog">Blog</a>
    <span>&nbsp;·&nbsp;</span>
    <a href="https://discord.gg/x2v84Vqsk6">Community</a>
    <span>&nbsp;·&nbsp;</span>
    <a href="https://github.com/defer-run/defer.client/discussions/categories/roadmap">Roadmap / RFCs</a>
</p>
<br/>

## Get started

- [Next.js Quickstart](https://docs.defer.run/get-started/quickstart/nextjs)
- [Express/Koa/hapi Quickstart](https://docs.defer.run/get-started/quickstart/express-koa-hapi)

## API documentation

- [Retries](https://docs.defer.run/features/retries)
- [Delayed Function](https://docs.defer.run/features/delays)
- [CRON](https://docs.defer.run/features/cron)

## Contributing

You want to fix a bug or suggest a change? Please open a PR! Want to
pitch a new feature, [please open a
RFC](https://github.com/defer-run/defer.client/discussions/new?category=roadmap).

### Open a PR

Make sure to follow our [Code of Conduct](./CODE_OF_CONDUCT.md) and
the following requirements:

1. Each new feature should be shipped with new tests
1. A PR should contains a description explaining the motivation

### Local setup

1. Clone the repository: `git clone
   git@github.com:defer-run/defer.client.git`
2. Install the dependencies: `npm ci`
3. Run the test after introducing changes: `npm run test`
4. Bump a patch or minor by running `npx changelog` (please provide a
   brief description of the changes)
