#!/usr/bin/env python3
"""Capture a gameplay screenshot of the River Raid JS port using
Chrome DevTools Protocol (headless + remote debugging)."""

import base64
import json
import os
import struct
import subprocess
import time
import urllib.request

import websocket

GAME_URL = "http://127.0.0.1:9911/"
OUTPUT = "extraction/gameplay_screenshot.png"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
DEBUG_PORT = 9222
PROJECT_DIR = r"C:\Users\vrock\Documents\riverraid-rom-extract"

def find_ws_url():
    """Get the WebSocket debug URL from Chrome's /json endpoint."""
    url = f"http://127.0.0.1:{DEBUG_PORT}/json"
    resp = urllib.request.urlopen(url, timeout=5)
    data = json.loads(resp.read().decode())
    if not data:
        raise RuntimeError("No Chrome tabs found via /json endpoint")
    return data[0]["webSocketDebuggerUrl"]

def send_cmd(ws, method, params=None):
    """Send a CDP command and wait for result."""
    msg_id = send_cmd.next_id
    send_cmd.next_id += 1
    cmd = {"id": msg_id, "method": method}
    if params:
        cmd["params"] = params
    ws.send(json.dumps(cmd))
    while True:
        raw = ws.recv()
        resp = json.loads(raw)
        if resp.get("id") == msg_id:
            return resp.get("result", {})
send_cmd.next_id = 1

def evaluate(ws, js_expr):
    """Evaluate JavaScript in the page and return the result value."""
    result = send_cmd(ws, "Runtime.evaluate", {
        "expression": js_expr,
        "returnByValue": True,
    })
    if "exceptionDetails" in result:
        print(f"  JS Error: {result['exceptionDetails']}")
        return None
    return result.get("result", {}).get("value")

def capture_screenshot(ws):
    """Capture a PNG screenshot (full page)."""
    result = send_cmd(ws, "Page.captureScreenshot", {"format": "png"})
    data = result.get("data")
    if not data:
        raise RuntimeError("No screenshot data returned")
    return base64.b64decode(data)

def main():
    os.chdir(PROJECT_DIR)

    # Kill any lingering Chrome debug instances
    subprocess.run(
        ["taskkill", "//F", "//IM", "chrome.exe"],
        capture_output=True, text=True, timeout=5
    )
    time.sleep(1)

    # Start Chrome headless with remote debugging
    print("Starting Chrome headless...")
    chrome_proc = subprocess.Popen(
        [CHROME,
         f"--remote-debugging-port={DEBUG_PORT}",
         "--headless",
         "--disable-gpu",
         "--no-sandbox",
         "--window-size=640,480",
         "--disable-web-security",
         "about:blank"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(2)

    try:
        ws_url = find_ws_url()
        print(f"WebSocket URL: {ws_url}")

        ws = websocket.create_connection(ws_url, timeout=10)
        print("Connected to Chrome DevTools")

        # Navigate to game
        print(f"Navigating to {GAME_URL}...")
        send_cmd(ws, "Page.enable")
        send_cmd(ws, "Page.navigate", {"url": GAME_URL})
        time.sleep(1)

        # Wait for page to fully load
        ready = evaluate(ws, "document.readyState")
        print(f"Page readyState: {ready}")

        # Take title screen screenshot
        title_png = capture_screenshot(ws)
        title_path = "extraction/game_title_screenshot.png"
        with open(title_path, "wb") as f:
            f.write(title_png)
        print(f"Title screen saved: {title_path} ({len(title_png)} bytes)")

        # Check for canvas
        has_canvas = evaluate(ws, "!!document.querySelector('canvas')")
        print(f"Canvas present: {has_canvas}")

        # Inject mouse click on canvas to focus it, then press Space
        print("Starting game (pressing Space)...")
        # First focus the canvas
        evaluate(ws, """
            const c = document.querySelector('canvas');
            if (c) c.focus();
        """)

        # Dispatch a real Space keydown + keyup
        evaluate(ws, """
            (function() {
                const opts = {key: ' ', code: 'Space', keyCode: 32, which: 32, bubbles: true};
                window.dispatchEvent(new KeyboardEvent('keydown', opts));
                window.dispatchEvent(new KeyboardEvent('keyup', opts));
            })();
        """)

        # Wait for game to transition through SCROLL_IN
        time.sleep(3)

        # Check game state
        state = evaluate(ws, "window.__game ? window.__game.state : 'no __game'")
        lives = evaluate(ws, "window.__game ? window.__game.player.lives : 'N/A'")
        score = evaluate(ws, "window.__game ? window.__game.scoring.score : 'N/A'")
        fuel = evaluate(ws, "window.__game ? window.__game.player.fuel : 'N/A'")
        px = evaluate(ws, "window.__game ? Math.round(window.__game.player.x) : 'N/A'")
        py = evaluate(ws, "window.__game ? Math.round(window.__game.player.y) : 'N/A'")

        print(f"Game state: {state}")
        print(f"Lives: {lives}, Score: {score}, Fuel: {fuel}")
        print(f"Player pos: ({px}, {py})")

        # Take gameplay screenshot
        gameplay_png = capture_screenshot(ws)
        with open(OUTPUT, "wb") as f:
            f.write(gameplay_png)
        print(f"\nGameplay screenshot saved: {OUTPUT} ({len(gameplay_png)} bytes)")

        # Also get canvas pixel analysis
        canvas_data = evaluate(ws, """
            (function() {
                const c = document.querySelector('canvas');
                if (!c) return null;
                const ctx = c.getContext('2d');
                const d = ctx.getImageData(0, 0, c.width, c.height).data;
                // Sample: center pixel, top pixel, water region, HUD region
                const center = [d[160*4], d[160*4+1], d[160*4+2], d[160*4+3]];
                const top = [d[5*c.width*4], d[5*c.width*4+1], d[5*c.width*4+2], d[5*c.width*4+3]];
                const hud = [d[10*c.width*4], d[10*c.width*4+1], d[10*c.width*4+2], d[10*c.width*4+3]];
                const river = [d[120*c.width*4], d[120*c.width*4+1], d[120*c.width*4+2], d[120*c.width*4+3]];
                return JSON.stringify({center, top, hud, river, w: c.width, h: c.height});
            })();
        """)
        print(f"Canvas analysis: {canvas_data}")

        ws.close()

    finally:
        chrome_proc.terminate()
        chrome_proc.wait(timeout=5)

    # Verify output PNG
    with open(OUTPUT, "rb") as f:
        sig = f.read(8)
        assert sig == b'\x89PNG\r\n\x1a\n', "Invalid PNG signature"
        ihdr_len = struct.unpack(">I", f.read(4))[0]
        typ = f.read(4)
        assert typ == b'IHDR', f"Expected IHDR, got {typ}"
        ihdr = f.read(ihdr_len)
        w, h = struct.unpack(">II", ihdr[:8])
        print(f"Output PNG: {w}x{h} ({os.path.getsize(OUTPUT)} bytes) — valid!")

if __name__ == "__main__":
    main()
