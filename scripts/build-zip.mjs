import { execSync } from 'node:child_process';
import { existsSync, copyFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const distDir = resolve(root, 'dist');
const prodZip = resolve(root, 'podar-pathways-production.zip');
const publicZip = resolve(root, 'public.zip');

console.log('1. Building production assets with Vite...');
execSync('npm run build', { cwd: root, stdio: 'inherit' });

console.log('2. Creating production ZIP archives from dist/...');
const psCommand = `Compress-Archive -Path '${distDir}\\*', '${distDir}\\.htaccess' -DestinationPath '${prodZip}' -Force`;
execSync(`powershell -NoProfile -Command "${psCommand}"`, { cwd: root, stdio: 'inherit' });

copyFileSync(prodZip, publicZip);

const sizeMB = (statSync(prodZip).size / (1024 * 1024)).toFixed(2);
console.log(`\nSUCCESS! Created production archives:`);
console.log(` - ${prodZip} (${sizeMB} MB)`);
console.log(` - ${publicZip} (${sizeMB} MB)`);
console.log(`\nUpload either ZIP directly into your cPanel 'public_html/' directory and click Extract.`);

