#!/usr/bin/env bash
# tmp_verify.sh - bring up River Raid JS dev env + probe headless capability.
# Intentionally tiny so the bash side-agent doesn't choke.
set +e
cd /c/Users/vrock/Documents/riverraid-rom-extract

echo "=== [A] toolchain ==="
which node >/dev/null 2>&1 && node --version
which npm  >/dev/null 2>&1 && npm --version

echo
echo "=== [B] pkill prior + start serve.py ==="
pkill -f serve.py 2>/dev/null
sleep 1
nohup python serve.py --host 127.0.0.1 --port 9911 > /tmp/serve.log 2>&1 &
disown
sleep 2
cat /tmp/serve.log

echo
echo "=== [C] HTTP probe ==="
curl -s -m 5 -o /tmp/index.html -w "page http=%{http_code} bytes=%{size_download}\n" http://127.0.0.1:9911/
bundle=$(grep -oP 'dist/main-[A-Za-z0-9_-]+\.js' /tmp/index.html 2>/dev/null | head -1)
echo "bundle path = $bundle"
[ -n "$bundle" ] && curl -s -m 5 -o /tmp/main.js -w "bundle http=%{http_code} bytes=%{size_download}\n" http://127.0.0.1:9911/$bundle

echo
echo "=== [D] headless tooling probes ==="
echo "-- python playwright --"
python -c "import playwright; print('OK', playwright.__version__)" 2>&1 | head -1
echo "-- chrome.exe --"
which chrome.exe chromium.exe google-chrome 2>&1 | head -3
echo "-- chrome on MS store --"
ls "/c/Program Files/Google/Chrome/Application/chrome.exe" 2>&1 | head -3
echo "-- ms-playwright cache --"
ls -d /c/Users/vrock/AppData/Local/ms-playwright/chromium* 2>/dev/null | head -3
echo "-- node puppeteer pkg --"
cd /c/Users/vrock/Documents/riverraid-rom-extract && node -e "try{require.resolve('puppeteer');console.log('OK')}catch(e){console.log('NO')}" 2>&1 | head -1

echo
echo "=== [E] serve.py alive ==="
ps -ef | grep -E "serve\.py" | grep -v grep | head -3
