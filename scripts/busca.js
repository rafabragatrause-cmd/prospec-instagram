// Acha perfis pela caixa de pesquisa do Instagram (conta logada no Chrome de prospecção). Só leitura.
//   node scripts/busca.js "clinica de estetica campinas" "pilates campinas"   → dados/busca.json
// Sem termos, monta "nicho cidade" a partir do config.json.
const fs = require('fs');
const path = require('path');
const { abaNova } = require('./cdp.js');
const { cfg, DADOS } = require('./config.js');
const SAIDA = path.join(DADOS, 'busca.json');
let termos = process.argv.slice(2);
if (!termos.length) termos = cfg.nichos.flatMap(n => cfg.cidades.map(c => `${n} ${c}`));
(async () => {
  const a = await abaNova('https://www.instagram.com/');
  const out = fs.existsSync(SAIDA) ? JSON.parse(fs.readFileSync(SAIDA, 'utf8')) : [];
  try {
    await a.cmd('Page.bringToFront', {});
    await a.espera(8000);
    for (const q of termos) {
      const ok = await a.ev(`(()=>{const s=document.querySelector('svg[aria-label="Pesquisa"], svg[aria-label="Pesquisar"], svg[aria-label="Search"]');if(!s)return false;(s.closest('a,[role=button],div[role=link]')||s).click();return true})()`);
      if (!ok) { console.log('sem ícone de pesquisa (está logado?)'); break; }
      await a.espera(2500);
      const inp = await a.ev(`(()=>{const i=document.querySelector('input[placeholder="Pesquisar"], input[placeholder="Search"], input[aria-label*="esquis"], input[aria-label*="earch"]');if(!i)return false;i.focus();i.select();return true})()`);
      if (!inp) { console.log('sem campo de pesquisa'); break; }
      await a.cmd('Input.insertText', { text: q });
      await a.espera(5000 + Math.random() * 2000);
      const r = JSON.parse(await a.ev(`JSON.stringify([...document.querySelectorAll('a[href^="/"]')].map(x=>({h:x.getAttribute('href'),t:x.innerText.replace(/\\s+/g,' ').trim()})).filter(x=>/^\\/[A-Za-z0-9._]+\\/$/.test(x.h)&&x.t&&!/^\\/(explore|reels|direct|accounts)\\//.test(x.h)))`));
      let n = 0;
      for (const x of r) { const h = x.h.slice(1, -1); if (!out.some(y => y.h === h)) { out.push({ q, h, texto: x.t }); n++; } }
      console.log(q, '→', n, 'novos');
      fs.writeFileSync(SAIDA, JSON.stringify(out, null, 1));
      for (const type of ['keyDown', 'keyUp']) await a.cmd('Input.dispatchKeyEvent', { type, key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      await a.espera(5000 + Math.random() * 5000);
    }
  } finally { await a.fecha(); }
  console.log(out.length, 'perfis em', SAIDA);
})().catch(e => { console.error(e.message); process.exit(1); });
