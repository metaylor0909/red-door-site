#!/usr/bin/env bash
# Creates the folder structure and makes the first commit.
# Run from inside the cloned (empty) repo.
set -euo pipefail

mkdir -p archive/{blog,pages,images} src public
for d in archive/blog archive/pages archive/images src public; do
  [ -e "$d/.gitkeep" ] || touch "$d/.gitkeep"
done

if [ ! -d .git ]; then
  git init -b main
fi

git add .
git commit -m "Initial repo structure, CLAUDE.md, and .gitignore"

echo
echo "Done. Now connect it to GitHub:"
echo "  git remote add origin git@github.com:<you>/red-door-site.git"
echo "  git push -u origin main"
