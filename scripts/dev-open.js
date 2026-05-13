#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const http = require('http');

const HOST = 'localhost';

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://${HOST}:${port}`, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 307);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function findOpenPort() {
  for (const port of [3000, 3001, 3002, 3003, 3004, 3005]) {
    if (await checkPort(port)) return port;
  }
  return null;
}

function openBrowser(port) {
  exec(`open -a "Google Chrome" http://${HOST}:${port}`);
}

const next = spawn('npx', ['next', 'dev'], {
  stdio: 'inherit',
  shell: true
});

let opened = false;

const checkInterval = setInterval(async () => {
  if (opened) return;

  const port = await findOpenPort();
  if (port) {
    opened = true;
    clearInterval(checkInterval);
    console.log(`\n🌐 Opening http://${HOST}:${port} in Chrome...`);
    openBrowser(port);
  }
}, 500);

next.on('error', (err) => {
  clearInterval(checkInterval);
  console.error('Failed to start next dev:', err);
  process.exit(1);
});

next.on('exit', () => {
  clearInterval(checkInterval);
});

// 保持进程运行
process.on('SIGINT', () => {
  process.exit(0);
});
