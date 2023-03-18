import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = fs.readFileSync(join(__dirname, '../package.json'), 'utf-8')
const pkg = JSON.parse(file);
const code = `export default "${pkg.version}";\n`;

fs.writeFileSync(join(__dirname, '../src/version.ts'), code);
