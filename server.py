#!/usr/bin/env python3
"""
FurnitureVision AI – Local Server
ideaepipla.gr

Run this to serve the app at http://localhost:8080
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Add CORS headers so fetch() works from localhost
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-goog-api-key, x-api-key')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def log_message(self, format, *args):
        # Suppress noisy access logs, only show errors
        if args[1] not in ('200', '304'):
            super().log_message(format, *args)

if __name__ == '__main__':
    os.chdir(DIRECTORY)

    with socketserver.TCPServer(('', PORT), Handler) as httpd:
        url = f'http://localhost:{PORT}'
        print(f'\n🪑 FurnitureVision AI Server')
        print(f'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        print(f'✅ Running at: {url}')
        print(f'📁 Serving:    {DIRECTORY}')
        print(f'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        print(f'Press Ctrl+C to stop\n')

        # Auto-open browser
        webbrowser.open(url)

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\n\nServer stopped.')
            sys.exit(0)