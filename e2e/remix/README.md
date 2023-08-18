# Remix process undefined in client

`process.env` throws because `process` is undefined because there is no process in the remix client, and remix builds top level code from packages imported from route files.

## How to test

```
npm install
npm run build
npm start
# Other terminal
node e2e/remix/test.js
```

You should not see any error message
