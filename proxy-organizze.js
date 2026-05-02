/**
 * Proxy local para a API do Organizze
 * Resolve o bloqueio de CORS ao abrir o dashboard como arquivo local.
 *
 * COMO USAR:
 *   1. Tenha o Node.js instalado (https://nodejs.org)
 *   2. Abra o terminal nesta pasta
 *   3. Execute: node proxy-organizze.js
 *   4. Abra o dashboard-organizze.html no navegador
 *   5. Mantenha este terminal aberto enquanto usar o dashboard
 */

const http = require('http');
const https = require('https');

const PORT = 3131;
const API_BASE = 'api.organizze.com.br';

const server = http.createServer((req, res) => {
  // Libera CORS para qualquer origem (necessário para arquivo local)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, User-Agent, X-User-Agent');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Repassa o caminho da requisição para a API real
  const path = req.url; // ex: /rest/v2/accounts

  const options = {
    hostname: API_BASE,
    port: 443,
    path: path,
    method: 'GET',
    headers: {
      'Authorization': req.headers['authorization'] || '',
      'User-Agent': req.headers['x-user-agent'] || 'Dashboard-Proxy (proxy@local.com)',
      'Content-Type': 'application/json',
    }
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Erro ao conectar à API do Organizze:', err.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Proxy error', detail: err.message }));
  });

  proxyReq.end();
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('✅ Proxy do Organizze rodando em http://localhost:' + PORT);
  console.log('   Abra o dashboard-organizze.html no navegador.');
  console.log('   Mantenha esta janela aberta enquanto usar o dashboard.');
  console.log('   Para encerrar: Ctrl+C');
  console.log('');
});
