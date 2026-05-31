import http.server
import socketserver

PORT = 8080

# 自定义处理器，强制修正 MIME 类型
class MyHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        '.js': 'application/javascript', # 核心修复：告诉浏览器这是 JS
        '.mjs': 'application/javascript',
        '.html': 'text/html',
        '.css': 'text/css',
        '.wasm': 'application/wasm',
        '': 'application/octet-stream',   # 默认类型
    }

    def end_headers(self):
        # 禁用缓存，防止改代码后浏览器不更新
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        super().end_headers()

with socketserver.TCPServer(("", PORT), MyHandler) as httpd:
    print(f"Serving at port {PORT}")
    httpd.serve_forever()