import os, re, shutil, urllib.request
from concurrent.futures import ThreadPoolExecutor

ORIGIN="http://localhost:3001"; BP=os.environ.get("BASE_PATH", "/Hawa-Computer-"); OUT=os.environ.get("OUT", "/tmp/ghp-site")
DOMAIN=os.environ.get("CUSTOM_DOMAIN","")
SKIP=("/admin","/account","/api","/_next","/uploads","/favicon")
ASSET=("/_next","/uploads","/favicon")
EXTRA=["/checkout","/my-account"]
href_re=re.compile(r'href="(/[^"#]*)"')
SCRIPT_TEMPLATE = """<script>(function(){
var B="__BP__";
var MSG_B="\u098f\u0987 \u09b8\u09cd\u099f\u09cd\u09af\u09be\u099f\u09bf\u0995 \u09aa\u09cd\u09b0\u09bf\u09ad\u09bf\u0989 \u2014 \u0985\u09b0\u09cd\u09a1\u09be\u09b0, \u09b2\u0997\u0987\u09a8 \u0993 \u09ab\u09b0\u09cd\u09ae \u099a\u09be\u09b2\u09c1 \u0995\u09b0\u09a4\u09c7 \u09ab\u09c1\u09b2 \u0985\u09cd\u09af\u09be\u09aa \u09a6\u09b0\u0995\u09be\u09b0\u0964";
var MSG_E="This is a static preview. Ordering, login and forms need the full app.";
function map(h){
  if(!h)return h;
  if(h.indexOf("/api/locale?")===0){
    var nx=decodeURIComponent((h.match(/next=([^&]*)/)||[])[1]||"/");
    if(nx.indexOf(B)===0)nx=nx.slice(B.length);
    h=(/lang=en/.test(h)?"/en":"")+nx;
  }
  if(h.charAt(0)==="/"&&h.indexOf(B)!==0)h=B+h;
  return h;
}
function fixAll(){
  var els=document.querySelectorAll('a[href^="/"],form[action^="/"],img[src^="/"],link[href^="/"],source[src^="/"]');
  for(var i=0;i<els.length;i++){
    var el=els[i],attrs=["href","src","action"];
    for(var j=0;j<attrs.length;j++){
      var a=attrs[j];
      if(el.hasAttribute(a)){var v=el.getAttribute(a),n=map(v);if(n!==v)el.setAttribute(a,n);}
    }
  }
}
document.addEventListener("click",function(e){
  var a=e.target.closest?e.target.closest("a"):null;
  if(!a)return;
  var h=a.getAttribute("href");
  if(!h||h.charAt(0)==="#"||h.indexOf("http")===0||h.indexOf("mailto:")===0||h.indexOf("tel:")===0||a.target==="_blank")return;
  e.preventDefault();e.stopPropagation();window.location.href=map(h);
},true);
document.addEventListener("submit",function(e){
  if(e.target&&e.target.hasAttribute&&e.target.hasAttribute("data-allow-submit"))return;
  e.preventDefault();e.stopPropagation();window.alert(__MSG__);
},true);
new MutationObserver(fixAll).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["href","src","action"]});
document.addEventListener("DOMContentLoaded",fixAll);
setTimeout(fixAll,150);setTimeout(fixAll,800);setTimeout(fixAll,2000);
})();</script>"""

FIX_BN = SCRIPT_TEMPLATE.replace("__MSG__", "MSG_B")
FIX_EN = SCRIPT_TEMPLATE.replace("__MSG__", "MSG_E")


def fetch(path, cookie):
    try:
        req=urllib.request.Request(ORIGIN+path, headers={"User-Agent":"Mozilla/5.0"})
        if cookie: req.add_header("Cookie", cookie)
        with urllib.request.urlopen(req, timeout=45) as r:
            return r.read().decode("utf-8","ignore")
    except Exception:
        return None

def crawl(cookie):
    seen, pages, queue = set(), {}, ["/"]+EXTRA
    with ThreadPoolExecutor(max_workers=12) as pool:
        while queue:
            batch, queue = queue, []
            for path, body in pool.map(lambda p:(p, fetch(p, cookie)), batch):
                if body is None or path in pages: continue
                pages[path]=body
                for m in href_re.findall(body):
                    p=m.split("?")[0] or "/"
                    if p.startswith(SKIP) or p in seen: continue
                    if re.search(r"\.(css|js|png|jpg|jpeg|svg|webp|ico|xml|txt|pdf)$", p): continue
                    seen.add(p); queue.append(p)
    return pages

def rewrite(body, P, is_en):
    def loc(m):
        if m.group(1)=="en": return 'href="%s/en"' % BP if P=="/" else 'href="%s/en%s"' % (BP,P)
        return 'href="%s"' % BP if P=="/" else 'href="%s%s"' % (BP,P)
    s=re.sub(r'href="/api/locale\?lang=(bn|en)(?:&amp;|&)next=[^"]*"', loc, body)
    def fix(m):
        attr,url=m.group(1),m.group(2)
        if url.startswith(BP) or url.startswith("//"): return m.group(0)
        if url.startswith(ASSET) or attr=="src": return '%s="%s%s"' % (attr,BP,url)
        if attr=="href" and re.search(r'\.(png|jpe?g|svg|webp|gif|ico|css|js|json|pdf|woff2?)$', url.split("?")[0], re.I):
            return '%s="%s%s"' % (attr,BP,url)
        if is_en: return '%s="%s/en"' % (attr,BP) if url=="/" else '%s="%s/en%s"' % (attr,BP,url)
        return '%s="%s%s"' % (attr,BP,url)
    s=re.sub(r'(href|action|src)="(/[^"]*)"', fix, s)
    fix_script=(FIX_EN if is_en else FIX_BN).replace("__BP__", BP)
    return s.replace("</body>", fix_script+"</body>", 1)

shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT, exist_ok=True)
bn=crawl(None); print("bn pages:", len(bn), flush=True)
en=crawl("hc_locale=en"); print("en pages:", len(en), flush=True)
for pages, root, is_en in ((bn, OUT, False), (en, os.path.join(OUT,"en"), True)):
    for path, body in pages.items():
        rel=path.strip("/")
        target=os.path.join(root,"index.html") if not rel else os.path.join(root, rel, "index.html")
        os.makedirs(os.path.dirname(target), exist_ok=True)
        open(target,"w",encoding="utf-8").write(rewrite(body, path, is_en))
for src,dst in (("/tmp/hawa-static/.next/static", os.path.join(OUT,"_next/static")),("/tmp/hawa-static/public", OUT)):
    if os.path.isdir(src): shutil.copytree(src, dst, dirs_exist_ok=True)
for path in ("/icon.png","/apple-icon.png","/favicon.ico","/robots.txt"):
    try:
        req=urllib.request.Request(ORIGIN+path, headers={"User-Agent":"Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=20) as r:
            data=r.read()
        with open(os.path.join(OUT, path.lstrip("/")),"wb") as fh:
            fh.write(data)
    except Exception as exc:
        print("extra skip", path, exc, flush=True)

open(os.path.join(OUT,".nojekyll"),"w").close()
if DOMAIN:
    open(os.path.join(OUT,"CNAME"),"w").write(DOMAIN.strip()+"\n")
print("built", flush=True)
