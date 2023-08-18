import puppeteer from "puppeteer";

// (async () => {
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();
//   // page.on("error", (event) => {
//   //   console.log(event);
//   //   process.exit(1);
//   // });
//   page
//     .on("console", (message) =>
//       console.log(
//         `${message.type().substr(0, 3).toUpperCase()} ${message.text()}`
//       )
//     )
//     .on("pageerror", ({ message }) => console.log(message))
//     .on("response", (response) =>
//       console.log(`${response.status()} ${response.url()}`)
//     )
//     .on("requestfailed", (request) =>
//       console.log(`${request.failure().errorText} ${request.url()}`)
//     );
//   await page.goto(
//     `file://${path.resolve("e2e/process-undefined-in-client/index.html")}`
//   );
//   browser.close();
// })();

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  // page.on("error", (event) => {
  //   console.log(event);
  //   process.exit(1);
  // });
  page.on("pageerror", ({ message }) => console.log(message));
  await page.goto(`http://localhost:3000`);
  browser.close();
})();
