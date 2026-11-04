#!/usr/bin/env bash
# Abre o Chrome de prospecção (perfil separado, porta de depuração só em 127.0.0.1).
# Na primeira vez, faça login na conta do Instagram nessa janela e deixe-a aberta.
PORTA="${CDP_PORTA:-9333}"
PERFIL="${CHROME_PERFIL:-$HOME/.chrome-prospec-ig}"
case "$(uname)" in
  Darwin) CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ;;
  *) CHROME="$(command -v google-chrome || command -v chromium || command -v chromium-browser)" ;;
esac
"$CHROME" --remote-debugging-port="$PORTA" --remote-debugging-address=127.0.0.1 --user-data-dir="$PERFIL" --no-first-run https://www.instagram.com/ >/dev/null 2>&1 &
echo "Chrome na porta $PORTA, perfil $PERFIL"
