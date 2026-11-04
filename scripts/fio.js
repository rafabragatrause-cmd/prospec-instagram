// Lê a conversa com um perfil, numa aba própria. Só leitura.  node scripts/fio.js <handle>
const { abaNova, JS } = require('./cdp.js');
(async () => {
  const a = await abaNova('https://www.instagram.com/' + process.argv[2] + '/');
  try {
    await a.espera(7000);
    await a.ev(JS.botaoMensagem);
    await a.espera(7000);
    console.log(await a.ev(`(()=>{const c=document.querySelector("[contenteditable=true]");let e=c;for(let i=0;i<14&&e;i++){e=e.parentElement;if(e&&e.innerText.length>200)break}
      const midia=e?[...e.querySelectorAll("img,audio,video")].map(m=>m.tagName+":"+(m.alt||m.src||"").slice(0,80)):[];
      return (e?e.innerText.slice(-1200):"sem fio")+"\\nMIDIA: "+JSON.stringify(midia.slice(-6))})()`));
  } finally { await a.fecha(); }
})().catch(e => { console.error(e.message); process.exit(1); });
