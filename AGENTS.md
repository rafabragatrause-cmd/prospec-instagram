# Instruções para o agente (Codex, Claude Code ou outro)

Este repositório faz prospecção por DM no Instagram para qualquer nicho. Os scripts controlam um Chrome logado pela porta de depuração (CDP), e você, o agente, cuida da parte que pede julgamento: escolher quem entra no lote, escrever cada DM e responder quem respondeu.

## Antes de agir

1. Leia `config.json` (se não existir, `config.exemplo.json`) e `PLAYBOOK.md`.
2. Confira se o Chrome de prospecção está aberto: `curl -s http://127.0.0.1:9333/json/list` precisa listar uma aba do instagram.com. Se não estiver, peça ao usuário para rodar `npm run chrome` e fazer login. Nunca faça login por ele e nunca peça a senha.
3. Leia `dados/enviadas.jsonl` para saber o que já saiu hoje.

## Fluxo

| Passo | Comando | Quem decide |
|---|---|---|
| Achar perfis | `node scripts/busca.js "termo cidade" ...` (sem termos, usa nichos × cidades do config) | script |
| Ler as bios | `node scripts/perfis.js` | script |
| Escrever o lote | você escreve `dados/lote.json` no formato de `exemplos/lote.exemplo.json` | **agente** |
| Revisar | mostre o lote ao usuário antes do primeiro envio do dia | **usuário** |
| Enviar | `node scripts/dm.js 1 10` | script, com teto e horário |
| Ver respostas | `node scripts/inbox.js` (linha com `>>` = a pessoa respondeu) e `node scripts/fio.js <handle>` | script |
| Responder | escreva o texto num arquivo e rode `node scripts/responde.js <handle> <arquivo> "<trecho da última msg deles>"` | **agente** |

## Como escrever a DM

- Uma DM por perfil, com **um detalhe real** tirado da bio ou do cabeçalho (`dados/perfis.json`). Nunca invente detalhe.
- Apresentação curta com `remetente` do config, o detalhe e a `pergunta_final`. Troque "cliente" pela palavra do nicho (paciente, aluno, pedido).
- Sem preço, sem link e sem "rapidinho" ou duração de call.
- Fica fora do lote: agência, curso, mentor, influenciador, franquia grande, perfil parado, quem está em `dados/optout.txt` ou já recebeu (`dados/enviadas.jsonl`).

## Regras que não se quebram

1. No máximo `limites.dms_por_dia` primeiras DMs por dia (o `dm.js` trava), com o intervalo do config entre uma e outra.
2. Não seguir nem curtir perfil no mesmo dia da DM.
3. Qualquer sinal de bloqueio ("tente novamente mais tarde", "ação bloqueada"): o `dm.js` sai com código 2. Pare tudo e avise o usuário. Não tente de novo no mesmo dia.
4. Pediu para não receber: o handle vai para `dados/optout.txt` na hora.
5. Valor só na call, nunca por mensagem.
6. Áudio não dá para ouvir: peça ao usuário o que a pessoa disse.
7. Nada de senha, cookie ou token em arquivo, log ou commit. `config.json` e `dados/` ficam fora do git.

## Códigos de saída do dm.js

- `0`: lote terminou, ou bateu o teto, ou saiu do horário.
- `2`: bloqueio. Pare o dia.
- `3`: falha que precisa de olho (conversa errada, texto não bateu, não enviou). Leia o log antes de seguir.
