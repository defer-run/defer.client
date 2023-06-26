import { defer } from "../../../src";

async function helloWorld(name: string = "") {
  return new Promise<string>((resolve) => {
    setTimeout(() => {
      console.log(`Hello ${name}!`);
      resolve("done");
    }, 5000);
  });
}

export default defer(helloWorld, {
  concurrency: 10,
  retry: 5,
  nextRoute: "/api/uploadProfilePicture",
});
