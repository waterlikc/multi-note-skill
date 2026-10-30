#!/usr/bin/env bash
set -u
OUT="测试结果-$(hostname).txt"
: > "$OUT"
echo "multi-note-skill v3.2.0 测试" >> "$OUT"
date >> "$OUT"
echo "=== 环境 ===" >> "$OUT"
node -v >> "$OUT" 2>&1 || { echo "找不到 Node.js 20+" >> "$OUT"; cat "$OUT"; exit 1; }
echo "=== 1/3 selfcheck ===" >> "$OUT"
node tests/selfcheck.mjs >> "$OUT" 2>&1; SC=$?
echo "=== 2/3 runtime + animation ===" >> "$OUT"
node --test tests/runtime.test.mjs tests/animation.test.mjs >> "$OUT" 2>&1; TS=$?
echo "=== 3/3 audit ===" >> "$OUT"
node cli/note.mjs audit . >> "$OUT" 2>&1; AU=$?
echo "selfcheck=$SC tests=$TS audit=$AU" >> "$OUT"
cat "$OUT"
[ "$SC" = 0 ] && [ "$TS" = 0 ] && [ "$AU" = 0 ]
