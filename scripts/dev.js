/**
 * Запускает локальный сервер и открывает сайт в браузере.
 * Использование: npm run dev
 */
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const PORT = process.env.PORT || 3000;
const URL = `http://localhost:${PORT}`;

const server = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
  env: { ...process.env, PORT: String(PORT) },
});

function openBrowser() {
  const start = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  require('child_process').exec(`${start} ${URL}`);
}

function waitForServer(retries = 20) {
  const req = http.get(URL, () => {
    console.log('\nОткрываю браузер: ' + URL);
    openBrowser();
  });
  req.on('error', () => {
    if (retries > 0) setTimeout(() => waitForServer(retries - 1), 500);
  });
}

setTimeout(waitForServer, 1500);
