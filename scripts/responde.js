// Responde numa conversa do direct: node scripts/responde.js <handle> <arquivo-com-texto> "<trecho da última msg deles>"
// Abre o perfil, cai no fio existente, confere que o trecho deles está lá e manda. Log em dados/enviadas.jsonl.
const fs = require('fs');
const { aba, JS, escreveEEnvia } = require('./cdp.js');
const { LOG, BLOQ } = require('./config.js');
const [h, arq, trecho] = process.argv.slice(2);
if (!h || !arq || !trecho) { console.error('uso: node scripts/responde.js <handle> <arquivo> "<trecho deles>"'); process.exit(1); }
const txt = fs.readFileSync(arq, 'utf8').trim();
(async () => {
  const a = await aba();
  let r;
  try {
    await a.cmd('Page.navigate', { url: `https://www.instagram.com/${h}/` });
    await a.espera(7000);
    if (!(await a.ev(JS.botaoMensagem))) throw new Error('sem botão Enviar mensagem');
    await a.espera(7000);
    const fio = await a.ev(`(()=>{const c=document.querySelector("[contenteditable=true]");if(!c)return null;let e=c;for(let i=0;i<14&&e;i++){e=e.parentElement;if(e&&e.innerText.includes(${JSON.stringify(trecho)}))break}return e?e.innerText:null})()`);
    if (!fio || !fio.includes(trecho)) throw new Error('fio não tem a mensagem deles');
    if (fio.replace(/\s+/g, ' ').includes(txt.slice(0, 40))) throw new Error('resposta já estava no fio');
    r = await escreveEEnvia(a, txt, BLOQ);
  } catch (e) { r = 'erro: ' + e.message; } finally { a.fecha(); }
  fs.appendFileSync(LOG, JSON.stringify({ h, tipo: 'resposta', quando: new Date().toISOString(), r }) + '\n');
  console.log(h, '→', r);
})();
