#!/usr/bin/env python3
"""Dev server that disables browser caching so CSS/JS edits show up on every reload."""
import http.server
import socketserver
import os

# Serve from the site root (parent of /scripts)
os.chdir(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

PORT = 3456


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


class ReuseAddrServer(socketserver.TCPServer):
    allow_reuse_address = True


with ReuseAddrServer(("", PORT), NoCacheHandler) as httpd:
    print(f"DotMov dev server (no-cache) on http://localhost:{PORT}")
    httpd.serve_forever()
