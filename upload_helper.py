"""
Alegla — bottle image uploader
Run: python3 upload_helper.py
Then open http://localhost:8765 and drag your bottle image onto the page.
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import os, sys

SAVE_PATH = os.path.join(os.path.dirname(__file__), 'assets', 'bottle.png')

HTML = b"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Alegla – Upload Bottle Image</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;background:#fdf8f0;display:flex;
       align-items:center;justify-content:center;min-height:100vh}
  .card{background:#fff;border-radius:20px;padding:48px;text-align:center;
        box-shadow:0 8px 40px rgba(0,0,0,.1);max-width:460px;width:90%}
  h1{font-size:1.6rem;color:#1a5c30;margin-bottom:8px}
  p{color:#6b7c6b;font-size:.95rem;margin-bottom:32px}
  #drop{border:2.5px dashed #c9e8d0;border-radius:14px;padding:52px 24px;
        cursor:pointer;transition:all .2s;background:#f7fdf8}
  #drop:hover,#drop.over{border-color:#1a5c30;background:#edf7ef}
  #drop svg{margin:0 auto 16px;display:block}
  #drop span{font-size:.9rem;color:#4a8a5e;font-weight:500}
  #status{margin-top:24px;font-weight:600;font-size:1rem;min-height:28px}
  .ok{color:#1a5c30} .err{color:#dc2626}
  input[type=file]{display:none}
</style>
</head>
<body>
<div class="card">
  <h1>Alegla Bottle Upload</h1>
  <p>Drop your bottle image here and it will be saved to <code>assets/bottle.png</code> automatically.</p>
  <div id="drop" onclick="document.getElementById('fi').click()">
    <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="#1a5c30" stroke-width="1.5">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
    </svg>
    <span>Click or drag &amp; drop your bottle image</span>
  </div>
  <input type="file" id="fi" accept="image/*">
  <div id="status"></div>
</div>
<script>
const drop=document.getElementById('drop'),st=document.getElementById('status');
document.getElementById('fi').onchange=e=>send(e.target.files[0]);
drop.ondragover=e=>{e.preventDefault();drop.classList.add('over')};
drop.ondragleave=()=>drop.classList.remove('over');
drop.ondrop=e=>{e.preventDefault();drop.classList.remove('over');send(e.dataTransfer.files[0])};
function send(file){
  if(!file)return;
  const fd=new FormData();fd.append('file',file,'bottle.png');
  st.textContent='Uploading…';st.className='';
  fetch('/upload',{method:'POST',body:fd})
    .then(r=>r.text())
    .then(t=>{st.textContent=t;st.className='ok';drop.style.borderColor='#1a5c30'})
    .catch(()=>{st.textContent='Error — try again';st.className='err'});
}
</script>
</body>
</html>"""

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a): pass   # silence request logs

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(HTML)

    def do_POST(self):
        if self.path != '/upload':
            self.send_response(404); self.end_headers(); return
        length = int(self.headers.get('Content-Length', 0))
        raw = self.rfile.read(length)
        boundary = self.headers['Content-Type'].split('boundary=')[1].encode()
        for part in raw.split(b'--' + boundary):
            if b'filename' in part:
                content = part.split(b'\r\n\r\n', 1)[1].rstrip(b'\r\n--')
                os.makedirs(os.path.dirname(SAVE_PATH), exist_ok=True)
                with open(SAVE_PATH, 'wb') as f:
                    f.write(content)
                msg = f'Saved to assets/bottle.png ({len(content):,} bytes) — you can close this tab!'
                self.send_response(200)
                self.send_header('Content-Type', 'text/plain')
                self.end_headers()
                self.wfile.write(msg.encode())
                print(f'\n✓ {msg}')
                return
        self.send_response(400); self.end_headers()
        self.wfile.write(b'No file found in request')

if __name__ == '__main__':
    port = 8765
    print(f'→ Open http://localhost:{port} in your browser')
    print('  Drag your bottle image onto the page to save it.')
    print('  Press Ctrl+C to stop.\n')
    HTTPServer(('localhost', port), Handler).serve_forever()
