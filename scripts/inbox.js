// Lista a caixa de direct numa aba própria. Só leitura. ">>" = a última mensagem é da outra pessoa.
const { abaNova } = require('./cdp.js');
(async () => {
  const a = await abaNova('https://www.instagram.com/direct/inbox/');
  try {
    await a.espera(9000);
    const itens = JSON.parse(await a.ev(`(()=>{const out=[];document.querySelectorAll('[role=button], a[href*="/direct/t/"]').forEach(e=>{const tx=e.innerText.trim();if(tx&&tx.includes('\\n')&&tx.length<300)out.push(tx.replace(/\\n+/g,' | '))});return JSON.stringify([...new Set(out)].slice(0,40))})()`));
    // prévia nossa: "Você: ...", "Você enviou uma foto", "You sent...", "Você reagiu..."
    const nossa = /\b(Você|You)(:| enviou| sent| reagiu| reacted| curtiu| liked| compartilhou| shared| respondeu| replied)/;
    for (const x of itens) console.log((nossa.test(x) ? '   ' : '>> ') + x);
  } finally { await a.fecha(); }
})().catch(e => { console.error(e.message); process.exit(1); });
