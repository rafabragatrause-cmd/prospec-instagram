// Cliente CDP mínimo, sem dependência (o playwright não conecta no Chrome 156+).
const { BASE } = require('./config.js');
async function aba(id) {
  const lista = await (await fetch(BASE + '/json')).json();
  id = id || process.env.IG_TAB;
  const t = id ? lista.find(x => x.id === id) : lista.find(x => x.type === 'page' && x.url.includes('instagram.com'));
  if (!t) throw new Error('sem aba do instagram: rode scripts/abrir-chrome.sh e faça login');
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((ok, erro) => { ws.onopen = ok; ws.onerror = erro; });
  let n = 0; const pend = {};
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; } };
  const cmd = (method, params = {}) => new Promise((ok, erro) => { const i = ++n; pend[i] = m => m.error ? erro(new Error(m.error.message)) : ok(m.result); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => { const r = await cmd('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'erro no evaluate'); return r.result.value; };
  const espera = ms => new Promise(r => setTimeout(r, ms));
  return { t, cmd, ev, espera, fecha: () => ws.close() };
}
// abre uma aba própria (não mexe na aba do dm.js) e fecha no fim
async function abaNova(url = 'about:blank') {
  const t = await (await fetch(BASE + '/json/new?' + url, { method: 'PUT' })).json();
  const a = await aba(t.id);
  return { ...a, fecha: async () => { a.fecha(); await fetch(BASE + '/json/close/' + t.id); } };
}
// trechos de página reaproveitados pelos scripts
const JS = {
  botaoMensagem: `(()=>{const b=[...document.querySelectorAll("[role=button],button")].find(x=>/^(Enviar mensagem|Message)$/.test(x.innerText.trim()));if(!b)return false;b.click();return true})()`,
  // com a janela do Chrome escondida o Enter não envia: clicar no botão "Enviar" envia
  botaoEnviar: `(()=>{const b=[...document.querySelectorAll("[role=button],button")].filter(b=>/^(Enviar|Send)$/.test((b.innerText||b.getAttribute("aria-label")||"").trim())).pop();if(!b)return false;b.click();return true})()`,
  caixa: `(document.querySelector("[contenteditable=true]")||{}).innerText||""`,
  limpa: `(document.querySelector("[contenteditable=true]").focus(), document.execCommand("selectAll"), document.execCommand("delete"))`,
};
// escreve o texto na conversa aberta e envia; devolve 'ok', 'ok?', 'bloqueio' ou o motivo da falha
async function escreveEEnvia(a, txt, BLOQ) {
  await a.cmd('Page.bringToFront', {});
  await a.ev(`document.querySelector("[contenteditable=true]").focus()`);
  await a.cmd('Input.insertText', { text: txt });
  await a.espera(1500);
  if ((await a.ev(JS.caixa)).trim() !== txt) { await a.ev(JS.limpa); return 'texto não bateu, apagado'; }
  if (!(await a.ev(JS.botaoEnviar))) for (const type of ['keyDown', 'keyUp']) await a.cmd('Input.dispatchKeyEvent', { type, key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, ...(type === 'keyDown' ? { text: '\r' } : {}) });
  await a.espera(5000);
  const depois = await a.ev('document.body.innerText');
  if (BLOQ.test(depois)) return 'bloqueio';
  if ((await a.ev(JS.caixa)).trim()) return 'não enviou (texto ficou na caixa)';
  return depois.replace(/\s+/g, ' ').includes(txt.slice(0, 40)) ? 'ok' : 'ok?';
}
module.exports = { aba, abaNova, JS, escreveEEnvia };
