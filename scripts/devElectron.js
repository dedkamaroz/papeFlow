const { spawn } = require('child_process');
const path = require('path');

// Wait for webpack dev server to be ready
console.log('Waiting for webpack dev server to start...');

const checkServer = () => {
  const http = require('http');
  
  http.get('http://localhost:3000', (res) => {
    if (res.statusCode === 200 || res.statusCode === 304) {
      console.log('Dev server is ready! Starting Electron...');
      
      // Start Electron
      const electron = require('electron');
      const electronPath = path.resolve(node_modules, '.bin', process.platform === 'win32' ? 'electron.cmd' : 'electron');
      
      const electronProcess = spawn(electron, ['.'], {
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: 'development'
        }
      });
      
      electronProcess.on('close', () => {
        process.exit();
      });
    }
  }).on('error', () => {
    // Server not ready yet, check again
    setTimeout(checkServer, 1000);
  });
};

// Start checking after a short delay
setTimeout(checkServer, 3000);