<p align="center">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://www.defer.run/github/defer_darkmode.png" width="410" height="216">
        <img alt="Defer logo" src="https://www.defer.run/github/defer_lightmode.png" width="410" height="216">
    </picture>
</p>
<p align="center">
    Zero infrastructure Node.js background jobs
</p>
<p>&nbsp;</p>
<p align="center">
    <a href="https://docs.defer.run/">Documentation</a>
    <span>&nbsp;·&nbsp;</span>
    <a href="https://www.defer.run/blog">Blog</a>
    <span>&nbsp;·&nbsp;</span>
    <a href="https://discord.gg/x2v84Vqsk6">Community</a>
    <span>&nbsp;·&nbsp;</span>
    <a href="https://github.com/defer-run/defer.client/discussions/categories/roadmap">Roadmap / RFCs</a>
</p>

<p>&nbsp;</p>
<p>&nbsp;</p>

# `@defer/client`

## Get started

- [Next.js Quickstart](https://docs.defer.run/quickstart/next/)
- [Express/Koa/hapi Quickstart](https://docs.defer.run/quickstart/express-koa-hapi/)

## API documentation

- [Configuration options: retries, concurrency](https://docs.defer.run/features/retries-concurrency/)
- [Delayed Function](https://docs.defer.run/features/delay/)
- [CRON](https://docs.defer.run/features/cron/)
- [Workflows](https://docs.defer.run/features/workflows/)

## Contributing

You want to fix a bug or suggest a change? Please open a PR!
Want to pitch a new feature, [please open a RFC](https://github.com/defer-run/defer.client/discussions/new?category=roadmap).

### Open a PR

Make sure to follow our [Code of Conduct](./CODE_OF_CONDUCT.md) and the following requirements:

1. Each new feature should be shipped with new tests
1. A PR should contains a description explaining the motivation

### Local setup

1. Clone the repository: `git clone git@github.com:defer-run/defer.client.git`
1. Install the dependencies: `yarn`
1. Run the test after introducing changes: `yarn test`
1. Bump a patch or minor by running `yarn changelog` (please provide a brief description of the changes)
