// Lê bio, seguidores e cabeçalho de cada perfil. Só leitura.
//   node scripts/perfis.js            → lê os handles de dados/busca.json
//   node scripts/perfis.js h1 h2 ...  → só esses
// Saída em dados/perfis.json ({handle: {meta, header}}), que o agente usa para escrever o lote.
const fs = require('fs');
const path = require('path');
const { abaNova } = require('./cdp.js');
const { DADOS } = require('./config.js');
const SAIDA = path.join(DADOS, 'perfis.json');
let hs = process.argv.slice(2);
if (!hs.length) hs = JSON.parse(fs.readFileSync(path.join(DADOS, 'busca.json'), 'utf8')).map(x => x.h);
(async () => {
  const out = fs.existsSync(SAIDA) ? JSON.parse(fs.readFileSync(SAIDA, 'utf8')) : {};
  const a = await abaNova();
  try {
    for (const h of hs) {
      if (out[h]) continue;
      await a.cmd('Page.navigate', { url: `https://www.instagram.com/${h}/` });
      await a.espera(6000 + Math.random() * 3000);
      out[h] = JSON.parse(await a.ev(`JSON.stringify({meta:document.querySelector('meta[property="og:description"]')?.content||'',header:(document.querySelector('header')?.innerText||'').replace(/\\n+/g,' | ').slice(0,600)})`));
      fs.writeFileSync(SAIDA, JSON.stringify(out, null, 1));
      console.log('@' + h);
      await a.espera(4000 + Math.random() * 5000);
    }
  } finally { await a.fecha(); }
  console.log(Object.keys(out).length, 'perfis lidos em', SAIDA);
})().catch(e => { console.error(e.message); process.exit(1); });
