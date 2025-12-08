import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const version = {
    version: Date.now().toString(),
    timestamp: new Date().toISOString()
};

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
}

fs.writeFileSync(
    path.join(publicDir, 'version.json'),
    JSON.stringify(version, null, 2)
);

console.log('Generated version.json:', version);
