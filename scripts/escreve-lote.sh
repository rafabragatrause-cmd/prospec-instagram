#!/usr/bin/env bash
# Pede ao agente (Codex por padrão, ou Claude Code) que escreva dados/lote.json a partir de dados/perfis.json,
# seguindo AGENTS.md, PLAYBOOK.md e config.json. Não manda nada: só escreve o arquivo para você revisar.
#   ./scripts/escreve-lote.sh            usa o codex
#   AGENTE=claude ./scripts/escreve-lote.sh
cd "$(dirname "$0")/.." || exit 1
PEDIDO='Leia AGENTS.md, PLAYBOOK.md e config.json (ou config.exemplo.json). Com os perfis de dados/perfis.json, escreva dados/lote.json com uma DM por perfil que se encaixe no público do config, no formato de exemplos/lote.exemplo.json. Descarte quem não é negócio local do nicho (agência, curso, influenciador, franquia grande, perfil parado) e quem já aparece em dados/enviadas.jsonl ou dados/optout.txt. Cada DM cita um detalhe real tirado da bio e termina na pergunta_final do config. Não envie nada; no fim, diga quantos entraram e quantos ficaram de fora e por quê.'
case "${AGENTE:-codex}" in
  codex) codex exec --sandbox workspace-write "$PEDIDO" ;;
  claude) claude -p "$PEDIDO" --allowedTools "Read,Write,Edit" ;;
  *) echo "AGENTE deve ser codex ou claude"; exit 1 ;;
esac
