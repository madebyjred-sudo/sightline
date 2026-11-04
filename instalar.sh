#!/bin/sh
# Instala la skill sightline para Claude Code (y para Hermes, si está instalado) y enlaza el bin.
set -e
RAIZ="$(cd "$(dirname "$0")" && pwd)"
DESTINOS="$HOME/.claude/skills/sightline"
[ -d "$HOME/.hermes" ] && DESTINOS="$HOME/.hermes/skills/software-development/sightline $DESTINOS"
for d in $DESTINOS; do
  mkdir -p "$d"
  cp "$RAIZ/skills/sightline/SKILL.md" "$d/SKILL.md"
  echo "skill: $d"
done
mkdir -p "$HOME/.local/bin"
chmod +x "$RAIZ/bin/sightline.mjs"
ln -sf "$RAIZ/bin/sightline.mjs" "$HOME/.local/bin/sightline"
echo "bin: $HOME/.local/bin/sightline -> $RAIZ/bin/sightline.mjs"
