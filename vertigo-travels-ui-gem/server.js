const express = require('express'); const path = require('path'); const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Change to your CAP backend base URL if needed: const CAP_BASE = process.env.CAP_BASE || 'https://sadevmain-dev-vertigo-travels-cap.cfapps.eu10.hana.ondemand.com';

// Simple proxy for CAP services to avoid CORS during local dev app.use('/api', createProxyMiddleware({ target: CAP_BASE, changeOrigin: true, pathRewrite: { '^/api': '/' }, onProxyReq: (proxyReq, req, res) => { // Ensure CSRF header can be requested downstream if (req.method === 'GET') { proxyReq.setHeader('x-csrf-token', 'Fetch'); } } }));

// Serve UI5 app app.use(express.static(path.join(__dirname, 'webapp')));

app.listen(8080, () => { console.log('Vertigo Travels UI running at http://localhost:8080'); console.log('Proxy to CAP at', CAP_BASE); });