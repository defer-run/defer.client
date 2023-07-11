import fs from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = fs.readFileSync(join(__dirname, "../dist/package.json"), "utf-8");
const pkg = JSON.parse(file);

(pkg.typesVersions = {
  "*": {
    index: ["typings/index.d.ts"],
    next: ["typings/next/index.d.ts"],
  },
}),
  fs.writeFileSync(
    join(__dirname, "../dist/package.json"),
    JSON.stringify(pkg, null, 2)
  );
