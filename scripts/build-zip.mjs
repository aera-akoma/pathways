import { execSync } from 'node:child_process';
import { existsSync, copyFileSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const distDir = resolve(root, 'dist');
const prodZip = resolve(root, 'podar-pathways-production.zip');
const publicZip = resolve(root, 'public.zip');

console.log('1. Building production frontend bundle with Vite...');
execSync('npm run build', { cwd: root, stdio: 'inherit' });

console.log('2. Assembling all required production files into dist/...');

// Copy .htaccess files
if (existsSync(resolve(root, 'public/.htaccess'))) {
  copyFileSync(resolve(root, 'public/.htaccess'), resolve(distDir, '.htaccess'));
}
if (existsSync(resolve(root, 'public/api/.htaccess'))) {
  copyFileSync(resolve(root, 'public/api/.htaccess'), resolve(distDir, 'api/.htaccess'));
}

// Copy .env configuration
if (existsSync(resolve(root, '.env'))) {
  copyFileSync(resolve(root, '.env'), resolve(distDir, '.env'));
  console.log('   ✓ Copied .env');
}
if (existsSync(resolve(root, '.env.example'))) {
  copyFileSync(resolve(root, '.env.example'), resolve(distDir, '.env.example'));
  console.log('   ✓ Copied .env.example');
}

// Copy database.sql
if (existsSync(resolve(root, 'database.sql'))) {
  copyFileSync(resolve(root, 'database.sql'), resolve(distDir, 'database.sql'));
  console.log('   ✓ Copied database.sql');
}

// Copy DEPLOYMENT_GUIDE.txt
if (existsSync(resolve(root, 'DEPLOYMENT_GUIDE.txt'))) {
  copyFileSync(resolve(root, 'DEPLOYMENT_GUIDE.txt'), resolve(distDir, 'DEPLOYMENT_GUIDE.txt'));
  console.log('   ✓ Copied DEPLOYMENT_GUIDE.txt');
}

// Ensure api/logs exists with protection
const distLogsDir = resolve(distDir, 'api/logs');
mkdirSync(distLogsDir, { recursive: true });
writeFileSync(resolve(distLogsDir, '.gitkeep'), '');
if (existsSync(resolve(root, 'public/api/logs/.htaccess'))) {
  copyFileSync(resolve(root, 'public/api/logs/.htaccess'), resolve(distLogsDir, '.htaccess'));
}

console.log('3. Creating production ZIP archives using Windows bsdtar (including dotfiles)...');

// Remove old zip files if present
try { execSync(`powershell -NoProfile -Command "Remove-Item '${prodZip}', '${publicZip}' -ErrorAction SilentlyContinue"`); } catch {}

// Create zip archive with tar.exe (preserves dotfiles and directory structure relative to dist/)
execSync(`tar.exe -a -cf "${prodZip}" -C "${distDir}" .`, { cwd: root, stdio: 'inherit' });

// Copy to public.zip so both zip names work interchangeably
copyFileSync(prodZip, publicZip);

const sizeMB = (statSync(prodZip).size / (1024 * 1024)).toFixed(2);
console.log(`\n======================================================`);
console.log(`✓ PRODUCTION ARCHIVES CREATED SUCCESSFULLY:`);
console.log(`  1. ${prodZip} (${sizeMB} MB)`);
console.log(`  2. ${publicZip} (${sizeMB} MB)`);
console.log(`======================================================`);
console.log(`\nVerification of Archive Contents:`);
const archiveList = execSync(`tar.exe -tf "${prodZip}"`, { encoding: 'utf8' });
const sampleFiles = ['.htaccess', 'index.html', 'assets', 'api', 'database.sql', '.env', 'favicon.svg', 'media'];
for (const req of sampleFiles) {
  const found = archiveList.split('\n').some(line => line.includes(req));
  console.log(`  ${found ? '✓' : '✗'} Contains ${req}`);
}
console.log(`\nDeployment Step: Upload either ZIP directly into your cPanel 'public_html/' directory and click Extract.`);
