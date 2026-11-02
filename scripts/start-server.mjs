import { existsSync } from 'node:fs';
import { spawn, execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const distHtml = resolve(root, 'dist', 'index.html');

// Ensure production frontend bundle exists so localhost:5000 always serves correctly
if (!existsSync(distHtml)) {
  console.log('[start-server] Production frontend not found in dist/. Running build...');
  try {
    execSync('npm run build', { cwd: root, stdio: 'inherit' });
  } catch (err) {
    console.error('[start-server] Warning: Initial build failed. Will serve available assets.');
  }
}

const php = process.env.PHP_BINARY || (process.platform === 'win32' && existsSync('C:/xampp/php/php.exe') ? 'C:/xampp/php/php.exe' : 'php');
const port = process.env.PORT || '5000';
if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) throw new Error('PORT must be between 1 and 65535.');
console.log(`Podar Pathways: http://127.0.0.1:${port}`);
const server = spawn(php, ['-S', `127.0.0.1:${port}`, 'router.php'], { cwd: root, stdio: 'inherit' });
server.on('error', (error) => { console.error(`Unable to start PHP. Install PHP 8+ or set PHP_BINARY. ${error.message}`); process.exitCode = 1; });
server.on('exit', (code) => { process.exitCode = code ?? 0; });
process.on('SIGINT', () => server.kill('SIGINT'));
process.on('SIGTERM', () => server.kill('SIGTERM'));
