// import { defer } from "@defer/client";
import { addMetadata, defer } from "../../../../dist/esm/index.js";

const helloWorld = async () => {
  console.log("Hello World");
};

// export default defer(helloWorld);
export default addMetadata(defer(helloWorld), { route: "Index" });
