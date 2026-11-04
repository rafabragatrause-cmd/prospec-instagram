// Lê config.json (ou config.exemplo.json) e centraliza caminhos, horário e limites.
const fs = require('fs');
const path = require('path');
const RAIZ = path.join(__dirname, '..');
const arq = [process.env.CONFIG, path.join(RAIZ, 'config.json'), path.join(RAIZ, 'config.exemplo.json')].find(f => f && fs.existsSync(f));
const cfg = JSON.parse(fs.readFileSync(arq, 'utf8'));
const DADOS = path.join(RAIZ, 'dados');
fs.mkdirSync(DADOS, { recursive: true });
const fuso = cfg.horario?.fuso || 'America/Sao_Paulo';
const hm = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const agora = () => new Date(new Date().toLocaleString('en-US', { timeZone: fuso }));
module.exports = {
  cfg, RAIZ, DADOS,
  LOG: path.join(DADOS, 'enviadas.jsonl'),
  BASE: `http://127.0.0.1:${process.env.CDP_PORTA || cfg.cdp_porta || 9333}`,
  hora: () => new Date().toLocaleTimeString('pt-BR', { timeZone: fuso, hour: '2-digit', minute: '2-digit' }),
  min: () => { const d = agora(); return d.getHours() * 60 + d.getMinutes(); },
  hoje: (d = new Date()) => d.toLocaleDateString('sv-SE', { timeZone: fuso }),
  hm,
  // sinais de bloqueio do Instagram (pt e en): qualquer um para tudo
  BLOQ: /tente novamente mais tarde|ação bloqueada|bloqueamos|restringimos|não foi possível enviar|não enviada|limitamos|try again later|action blocked|we restrict|couldn't send|not sent/i,
};
