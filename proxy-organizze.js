/**
 * Proxy local/nuvem para a API do Organizze
 * Protegido por chave secreta (DASHBOARD_SECRET)
 *
 * CONFIGURAÇÃO LOCAL:
 *   1. Defina a variável de ambiente antes de iniciar:
 *      Windows PowerShell : $env:DASHBOARD_SECRET="sua-chave-aqui"; node proxy-organizze.js
 *      Windows CMD        : set DASHBOARD_SECRET=sua-chave-aqui && node proxy-organizze.js
 *      Mac/Linux          : DASHBOARD_SECRET=sua-chave-aqui node proxy-organizze.js
 *
 * CONFIGURAÇÃO NO RENDER.COM:
 *   Em "Environment Variables", adicione:
 *   DASHBOARD_SECRET = (uma senha forte de sua escolha)
 *
 * COMO GERAR UMA CHAVE SEGURA:
 *   No terminal Node.js: require('crypto').randomBytes(32).toString('hex')
 *   Ou use qualquer gerador de senha com 32+ caracteres.
 */

const http  = require('http');
const https = require('https');

const PORT    = process.env.PORT || 3131;
const SECRET  = process.env.DASHBOARD_SECRET || '';
const API_HOST = 'api.organizze.com.br';

if (!SECRET) {
  console.warn('⚠  AVISO: DASHBOARD_SECRET não definido. O proxy está sem proteção!');
}

const server = http.createServer((req, res) => {
  const origin = req.headers.origin || '*';

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-User-Agent, X-Dashboard-Secret');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ── Validação da chave secreta ──────────────────────────────────────────
  if (SECRET) {
    const provided = req.headers['x-dashboard-secret'] || '';
    if (provided !== SECRET) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Não autorizado. Chave inválida ou ausente.' }));
      console.warn(`[${new Date().toISOString()}] Tentativa bloqueada — chave incorreta`);
      return;
    }
  }

  // ── Repassa a requisição para a API do Organizze ────────────────────────
  const options = {
    hostname: API_HOST,
    port: 443,
    path: req.url,
    method: 'GET',
    headers: {
      'Authorization' : req.headers['authorization'] || '',
      'User-Agent'    : req.headers['x-user-agent']  || 'Dashboard-Proxy (proxy@local.com)',
      'Content-Type'  : 'application/json',
    }
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, {
      'Content-Type'                 : 'application/json',
      'Access-Control-Allow-Origin'  : origin,
    });
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error(`[${new Date().toISOString()}] Erro ao conectar ao Organizze:`, err.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Erro no proxy', detail: err.message }));
  });

  proxyReq.end();
});

server.listen(PORT, () => {
  console.log('');
  console.log(`✅ Proxy do Organizze rodando na porta ${PORT}`);
  console.log(SECRET
    ? '🔒 Proteção por chave secreta: ATIVA'
    : '⚠  Proteção por chave secreta: INATIVA (defina DASHBOARD_SECRET)');
  console.log('');
});
