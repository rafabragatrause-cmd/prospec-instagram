#!/usr/bin/env bash
# Abre o Chrome de prospecção (perfil separado, porta de depuração só em 127.0.0.1).
# Na primeira vez, faça login na conta do Instagram nessa janela e deixe-a aberta.
PORTA="${CDP_PORTA:-9333}"
PERFIL="${CHROME_PERFIL:-$HOME/.chrome-prospec-ig}"
if curl -s "http://127.0.0.1:$PORTA/json/version" >/dev/null; then echo "Chrome já está aberto na porta $PORTA"; exit 0; fi
case "$(uname)" in
  Darwin) CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ;;
  *) CHROME="$(command -v google-chrome || command -v google-chrome-stable || command -v chromium || command -v chromium-browser)" ;;
esac
CHROME="${CHROME_BIN:-$CHROME}"
if [ -z "$CHROME" ] || [ ! -x "$CHROME" ]; then echo "Chrome não encontrado. Instale o Google Chrome ou passe CHROME_BIN=/caminho/do/chrome"; exit 1; fi
"$CHROME" --remote-debugging-port="$PORTA" --user-data-dir="$PERFIL" --no-first-run https://www.instagram.com/ >/dev/null 2>&1 &
for _ in $(seq 1 20); do
  if curl -s "http://127.0.0.1:$PORTA/json/version" >/dev/null; then echo "Chrome na porta $PORTA, perfil $PERFIL"; exit 0; fi
  sleep 1
done
echo "O Chrome não respondeu na porta $PORTA. Feche outras janelas desse perfil e tente de novo."; exit 1
