#!/usr/bin/env bash
# tools/riverraid_stella_capture.lua + sampler + parity diff
# Full pipeline run. STELLA_CAPTURE_CLEAN=1 self-clears; SAMPLE_STRIDE=2 halves sampling.
set +e
export PYTHONIOENCODING=utf-8
export STELLA_CAPTURE_CLEAN=1
cd /c/Users/vrock/Documents/riverraid-rom-extract || exit 1

echo "═══ 1. Kill stale EmuHawk ═══"
powershell.exe -NoProfile -Command "Get-CimInstance Win32_Process -Filter Name='EmuHawk.exe' | ForEach-Object { Stop-Process -Id \$_.ProcessId -Force }" 2>/dev/null
sleep 1
rm -rf tools/stella_captures
mkdir -p tools/stella_captures
echo "cleared"

echo "═══ 2. Launch EmuHawk 215s ═══"
START=$(date +%s)
'tools/bizhawk_install/EmuHawk.exe' --lua='tools/riverraid_stella_capture.lua' 'reference/river-raid-wiz-main/baserom.a26' > tools/emuhawk_run.txt 2> tools/emuhawk_err.log &
sleep 215
powershell.exe -NoProfile -Command "Get-CimInstance Win32_Process -Filter Name='EmuHawk.exe' | ForEach-Object { Stop-Process -Id \$_.ProcessId -Force }" 2>/dev/null
sleep 2
END=$(date +%s)
echo "capture duration=$((END-START))s"

echo "═══ 3. PNG count ═══"
PNG_COUNT=$(ls tools/stella_captures/*.png 2>/dev/null | wc -l)
echo "PNGs: $PNG_COUNT"
ls tools/stella_captures/*.png | head -2
ls tools/stella_captures/*.png | tail -2

echo "═══ 4. Sampler with SAMPLE_STRIDE=2 ═══"
START=$(date +%s)
SAMPLE_STRIDE=2 node tools/sample_stella_buckets.mjs
ST=$?; END=$(date +%s)
echo "sampler exit=$ST duration=$((END-START))s"

echo "═══ 5. Parity diff ═══"
rm -f tools/parity_draft_palette.js.diff
START=$(date +%s)
node tools/parity_diff.mjs --diff
ST=$?; END=$(date +%s)
echo "diff exit=$ST duration=$((END-START))s"

echo "═══ 6. Bucket classifications ═══"
node -e "
const r=JSON.parse(require('fs').readFileSync('tools/stella_buckets_report.json','utf8'));
console.log('bucket_status_counts: '+JSON.stringify(r.meta.bucket_status_counts));
console.log('clustering: iterations='+r.clustering_summary.iterations+' converged='+r.clustering_summary.converged+' unique_colors='+r.clustering_summary.unique_surviving_colors+' total_valid_px='+r.clustering_summary.total_valid_pixels);
const order=['PLANE_GREEN','PLANE_GREY','PLANE_DARK','SHIP_WHITE','SHIP_LIGHT','BRIDGE_RED','BRIDGE_DARK','BRIDGE_DARKEST','CYAN','DARK_BLUE','BROWN'];
for (const n of order) {
  const q=r.buckets[n];
  if (!q) continue;
  console.log('  '+n.padEnd(16)+' '+q.bucket_status.padEnd(7)+' n='+String(q.sample_count).padStart(7)+' drift='+q.drift_vs_seed);
}
const r2=JSON.parse(require('fs').readFileSync('tools/parity_diff_output.json','utf8'));
console.log('---');
console.log('parity classification: '+JSON.stringify(r2.meta.classification_summary));
for (const [n,q] of Object.entries(r2.buckets)) {
  if (q.proposed_new_rgb) console.log('  '+n.padEnd(16)+' '+q.classification+' PROPOSE '+JSON.stringify(q.proposed_new_rgb));
}
"

echo "═══ 7. Diff preview head ═══"
head -40 tools/parity_draft_palette.js.diff 2>&1

echo "DONE"
