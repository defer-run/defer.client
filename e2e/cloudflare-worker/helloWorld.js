import { defer } from "../../dist/esm/index";

async function helloWorld() {
    console.log("hello!")
}

export default defer(helloWorld);
