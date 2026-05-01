import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import net from 'net';

async function isPortOpen(port, host = '127.0.0.1', timeoutMs = 250) {
  return await new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (result) => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(result);
      }
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, host);
  });
}

async function resolveBackendPort(defaultPort, fallbackPort) {
  // Explicit override always wins (e.g. VITE_BACKEND_PORT=5135).
  const envPort = Number(process.env.VITE_BACKEND_PORT);
  if (!Number.isNaN(envPort) && envPort > 0) return envPort;

  if (await isPortOpen(defaultPort)) return defaultPort;
  if (await isPortOpen(fallbackPort)) return fallbackPort;
  return defaultPort;
}

// https://vite.dev/config/
export default defineConfig(async () => {
  // Allow switching between HTTP and HTTPS with an env variable
  const useHttps = process.env.VITE_HTTPS === '1';
  const backendHttps = process.env.VITE_BACKEND_HTTPS === '1';
  const backendPort = backendHttps
    ? 7049
    : await resolveBackendPort(5134, 5135);
  const backendProtocol = backendHttps ? 'https' : 'http';
  
  const serverConfig = {
    port: 3000,
    proxy: {
      '/api': {
        target: `${backendProtocol}://localhost:${backendPort}`,
        changeOrigin: true,
        secure: false
      }
    }
  };
  
  if (useHttps) {
    try {
      serverConfig.https = {
        key: fs.readFileSync('localhost-key.pem'),
        cert: fs.readFileSync('localhost.pem'),
      };
    } catch (err) {
      console.warn("HTTPS was requested, but certificates (localhost-key.pem / localhost.pem) were not found.");
    }
  }

  return {
    plugins: [react()],
    server: serverConfig,
  };
});
