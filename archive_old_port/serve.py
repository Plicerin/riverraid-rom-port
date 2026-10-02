#!/usr/bin/env python3
"""
River Raid — Caching-friendly dev server.

The user's recurring complaint across this port's history has been
"player jet upside down" appearing even after we change the sprite
decoder convention. A common cause is **stale browser cache**: the
user's browser holds on to the OLD `dist/main-*.js` bundle even
after we rebuild, because Python's built-in `SimpleHTTPServer`
sends no `Cache-Control` header at all and `index.html` historically
had no "<meta http-equiv>" cache directive.

This dev server REPLACES the standard `python -m http.server` with
a subclass that explicitly sends:

    Cache-Control: no-store, no-cache, must-revalidate, max-age=0
    Pragma: no-cache
    Expires: 0

on every response — so the browser MUST re-validate on every reload
and the user always gets the freshly-rebuilt `dist/main-*.js`.

Run from the project root:

    $ python serve.py
    Serving at http://127.0.0.1:9911/ with no-cache headers
    [Ctrl-C to stop]

If a different port is needed:

    $ python serve.py --port 9912
"""
import argparse
import http.server
import socketserver


class _NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    """
    SimpleHTTPRequestHandler that always sends no-cache headers so any
    bundle rebuilt into `dist/` is picked up on browser reload. Logs
    concise one-line requests.
    """

    def end_headers(self):
        # DELIBERATELY no-cache: this is a dev tool, we always want
        # the user to see the latest dist/main-*.js after a rebuild.
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        # Trim the default time-stamped logger to one short line per req.
        try:
            msg = fmt % args
        except Exception:
            msg = fmt
        print(f"[serve.py] {self.address_string()} {msg}", flush=True)


def main():
    parser = argparse.ArgumentParser(description="No-cache static dev server.")
    parser.add_argument("--port", "-p", type=int, default=9911,
                        help="TCP port to listen on (default 9911).")
    parser.add_argument("--host", default="127.0.0.1",
                        help="Bind address (default 127.0.0.1).")
    args = parser.parse_args()

    # Allow port reuse so successive python serve.py invocations during dev
    # don't have to wait out TIME_WAIT.
    socketserver.TCPServer.allow_reuse_address = True

    with socketserver.TCPServer((args.host, args.port), _NoCacheHandler) as httpd:
        print(f"Serving at http://{args.host}:{args.port}/ with no-cache headers", flush=True)
        print(f"(replacing the standard python -m http.server for this project)", flush=True)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print(f"\n[serve.py] shutting down")


if __name__ == "__main__":
    main()
