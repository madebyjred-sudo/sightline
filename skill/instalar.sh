#!/bin/sh
# Instala la skill taste para Claude Code (y para Hermes, si está instalado) y enlaza el bin.
set -e
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
DESTINOS="$HOME/.claude/skills/taste"
[ -d "$HOME/.hermes" ] && DESTINOS="$HOME/.hermes/skills/software-development/taste $DESTINOS"
for d in $DESTINOS; do
  mkdir -p "$d"
  cp "$RAIZ/skill/SKILL.md" "$d/SKILL.md"
  echo "skill: $d"
done
mkdir -p "$HOME/.local/bin"
chmod +x "$RAIZ/bin/taste.mjs"
ln -sf "$RAIZ/bin/taste.mjs" "$HOME/.local/bin/taste"
echo "bin: $HOME/.local/bin/taste -> $RAIZ/bin/taste.mjs"
