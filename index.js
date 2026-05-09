/**
 * Render (and others) often default to `node index.js` at the repo root.
 * The API lives in `server/`; run it with cwd there so `dotenv` loads server/.env.
 */
const { spawn } = require('child_process');
const path = require('path');

const serverDir = path.join(__dirname, 'server');
const child = spawn('node', ['index.js'], {
  stdio: 'inherit',
  cwd: serverDir,
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code == null ? 1 : code);
});
