// Manda as primeiras DMs do lote, uma por vez, com intervalo sorteado, pausa e teto diário do config.json.
//   node scripts/dm.js <de> <ate>            índices 1-based do lote (ex.: 1 10)
//   node scripts/dm.js 3 3 --agora           só um, já
//   LOTE=outro.json node scripts/dm.js 1 10  (padrão: dados/lote.json)
// Para no primeiro sinal de bloqueio (sai com 2) ou em falha que precisa de olho (sai com 3).
const fs = require('fs');
const path = require('path');
const { aba, JS, escreveEEnvia } = require('./cdp.js');
const { cfg, DADOS, LOG, BLOQ, hora, min, hoje, hm } = require('./config.js');
const LOTE = JSON.parse(fs.readFileSync(path.resolve(process.env.LOTE || path.join(DADOS, 'lote.json')), 'utf8'));
const [de, ate] = [Number(process.argv[2] || 1), Number(process.argv[3] || LOTE.length)];
const AGORA = process.argv.includes('--agora');
const TETO = cfg.limites?.dms_por_dia ?? 10;
const [IMIN, IMAX] = cfg.limites?.intervalo_min || [8, 15];
const INICIO = hm(cfg.horario?.inicio || '08:00'), FIM = hm(cfg.horario?.fim || '18:00');
const [PA, PB] = (cfg.horario?.pausa || ['12:00', '13:30']).map(hm);
const dorme = ms => new Promise(r => setTimeout(r, ms));
const log = () => fs.existsSync(LOG) ? fs.readFileSync(LOG, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];
const optout = new Set(fs.existsSync(path.join(DADOS, 'optout.txt')) ? fs.readFileSync(path.join(DADOS, 'optout.txt'), 'utf8').split(/\s+/).filter(Boolean) : []);

async function manda(p) {
  const a = await aba();
  try {
    await a.cmd('Page.navigate', { url: `https://www.instagram.com/${p.h}/` });
    await a.espera(6000 + Math.random() * 3000);
    if (BLOQ.test(await a.ev('document.body.innerText'))) return 'bloqueio';
    if (!(await a.ev(JS.botaoMensagem))) return 'sem botão Enviar mensagem';
    await a.espera(6000 + Math.random() * 2000);
    const fio = await a.ev(`(()=>{const c=document.querySelector("[contenteditable=true]");if(!c)return null;let e=c;for(let i=0;i<12&&e;i++){e=e.parentElement;if(e&&e.innerText.length>40)break}return e?e.innerText:null})()`);
    if (!fio || !fio.includes(p.h)) return 'conversa não é do perfil certo';
    if (fio.replace(/\s+/g, ' ').includes(p.dm.slice(0, 40))) return 'já tinha mensagem nossa';
    return await escreveEEnvia(a, p.dm, BLOQ);
  } finally { a.fecha(); }
}

(async () => {
  const feitos = new Set(log().filter(x => x.r.startsWith('ok')).map(x => x.h));
  const fila = LOTE.slice(de - 1, ate).map((p, k) => ({ ...p, n: de + k })).filter(p => !feitos.has(p.h) && !optout.has(p.h));
  for (let i = 0; i < fila.length; i++) {
    const p = fila[i];
    if (log().filter(x => !x.tipo && x.r.startsWith('ok') && hoje(new Date(x.quando)) === hoje()).length >= TETO) { console.log(`${hora()} teto de ${TETO} DMs hoje, parei`); break; }
    if (!(AGORA && i === 0)) {
      const s = IMIN * 60 + Math.floor(Math.random() * (IMAX - IMIN) * 60);
      const alvo = min() + Math.ceil(s / 60);
      if (alvo >= PA && alvo < PB) { console.log(`${hora()} pausa até depois de ${cfg.horario?.pausa?.[1] || '13:30'}`); while (min() < PB) await dorme(30000); await dorme(Math.random() * 600000); }
      else { console.log(`${hora()} próximo (${p.n} @${p.h}) em ${Math.round(s / 60)} min`); await dorme(s * 1000); }
    }
    if (min() < INICIO || min() >= FIM) { console.log(`${hora()} fora do horário (${cfg.horario?.inicio}–${cfg.horario?.fim}), parei`); break; }
    const r = await manda(p).catch(e => 'erro: ' + e.message);
    fs.appendFileSync(LOG, JSON.stringify({ n: p.n, h: p.h, quando: new Date().toISOString(), r }) + '\n');
    console.log(`${hora()} ${String(p.n).padStart(2, '0')} @${p.h} → ${r}`);
    if (r === 'bloqueio') { console.log('PAROU: sinal de bloqueio do Instagram'); process.exit(2); }
    if (!r.startsWith('ok') && !/já tinha|sem botão/.test(r)) { console.log('PAROU: falha que precisa de olho'); process.exit(3); }
  }
  console.log(`${hora()} fim do lote`);
})();
