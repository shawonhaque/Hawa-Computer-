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
  if(h.charAt(0)==="/"&&h.indexOf(B)!==0)h=B+pageify(h);
  return h;
}
function pageify(h){
  if(h.charAt(0)!=="/")return h;
  if(/\\.(css|js|png|jpe?g|svg|webp|gif|ico|xml|txt|pdf|json|webmanifest|woff2?)([?#]|$)/i.test(h))return h;
  if(h.charAt(h.length-1)==="/")return h;
  var i=h.search(/[?#]/);
  return i<0?h+"/":h.slice(0,i)+"/"+h.slice(i);
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

def crawl(cookie, seeds=()):
    seen, pages, queue = set(), {}, ["/"]+EXTRA+list(seeds)
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

SITE=(("https://"+DOMAIN) if DOMAIN else "https://shawonhaque.github.io"+BP).rstrip("/")

NOT_PAGE=re.compile(r"\.(css|js|png|jpe?g|svg|webp|gif|ico|xml|txt|pdf|json|webmanifest|woff2?)$", re.I)

def page_path(url):
    """GitHub Pages serves a page at /x/, so link straight to that form.

    Without it every first visit to an inner page costs a 301 hop. Assets, files
    with an extension and off-site links are left alone.
    """
    if not url.startswith("/") or url.startswith("//"):
        return url
    path, hash_sep, frag = url.partition("#")
    path, query_sep, query = path.partition("?")
    if path == "/" or path.endswith("/") or NOT_PAGE.search(path):
        return url
    return path + "/" + query_sep + query + hash_sep + frag

def locale_urls(P):
    """Absolute Bengali and English URLs for a path, both with the served trailing slash."""
    core = P.strip("/")
    rest = "" if not core else "/" + core
    return SITE + rest + "/", SITE + "/en" + rest + "/"

def locale_head(P, is_en):
    """Self-canonical plus hreflang pairs.

    The app resolves "./" against its own route, so the /en mirror would claim the
    Bengali page as canonical. Each locale is a real page for its reader, so it
    declares itself and the pair points at each other.
    """
    bn, en = locale_urls(P)
    self_url = en if is_en else bn
    return (
        '<link rel="canonical" href="%s"/>' % self_url
        + '<link rel="alternate" hreflang="bn" href="%s"/>' % bn
        + '<link rel="alternate" hreflang="en" href="%s"/>' % en
        + '<link rel="alternate" hreflang="x-default" href="%s"/>' % bn
    )

def rewrite(body, P, is_en):
    def loc(m):
        if m.group(1)=="en": return 'href="%s/en/"' % BP if P=="/" else 'href="%s/en%s/"' % (BP,P)
        return 'href="%s/"' % BP if P=="/" else 'href="%s%s/"' % (BP,P)
    s=re.sub(r'href="/api/locale\?lang=(bn|en)(?:&amp;|&)next=[^"]*"', loc, body)
    def fix(m):
        attr,url=m.group(1),m.group(2)
        if url.startswith(BP) or url.startswith("//"): return m.group(0)
        if url.startswith(ASSET) or attr=="src": return '%s="%s%s"' % (attr,BP,url)
        if attr=="href" and re.search(r'\.(png|jpe?g|svg|webp|gif|ico|css|js|json|pdf|woff2?)$', url.split("?")[0], re.I):
            return '%s="%s%s"' % (attr,BP,url)
        path=page_path(url)
        if is_en: return '%s="%s/en/"' % (attr,BP) if path=="/" else '%s="%s/en%s"' % (attr,BP,path)
        return '%s="%s%s"' % (attr,BP,path)
    s=re.sub(r'(href|action|src)="(/[^"]*)"', fix, s)
    s=re.sub(r'<link rel="canonical"[^>]*/>', "", s, count=1)
    s=s.replace("</head>", locale_head(P, is_en)+"</head>", 1)
    fix_script=(FIX_EN if is_en else FIX_BN).replace("__BP__", BP)
    return s.replace("</body>", fix_script+"</body>", 1)

def sitemap_seeds():
    """Queue every URL the sitemap advertises.

    A legal page that nothing links to is still in the sitemap; without this the
    mirror would publish a URL that 404s the moment a crawler followed it.
    """
    try:
        text=fetch_text("/sitemap.xml")
    except Exception as exc:
        print("seed skip", exc, flush=True)
        return []
    seeds=[]
    for loc in re.findall(r"<loc>(.*?)</loc>", text, re.S):
        loc=loc.strip()
        path=loc[len(SITE):] if loc.startswith(SITE) else (loc if loc.startswith("/") else "")
        path=path.rstrip("/") or "/"
        if path.startswith(SKIP) or path in seeds:
            continue
        seeds.append(path)
    return seeds

SEEDS=sitemap_seeds(); print("seeded:", len(SEEDS), flush=True)
shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT, exist_ok=True)
bn=crawl(None, SEEDS); print("bn pages:", len(bn), flush=True)
en=crawl("hc_locale=en", SEEDS); print("en pages:", len(en), flush=True)
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

def expand_sitemap(text):
    """Trailing-slash URLs plus an English twin per page, cross-linked by hreflang.

    Pages are served at /x/, and the /en tree existed only as hreflang tags before
    this, so a crawler had to guess that it existed.
    """
    head = text[: text.index("<url>")] if "<url>" in text else text
    head = head.replace(
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml"',
    )
    out, seen = [], set()
    for block in re.findall(r"<url>(.*?)</url>", text, re.S):
        loc = re.search(r"<loc>(.*?)</loc>", block, re.S).group(1).strip()
        rest = loc[len(SITE):] if loc.startswith(SITE) else "/" + loc.lstrip("/")
        bn, en = locale_urls(rest)
        meta = re.sub(r"<loc>.*?</loc>", "", block, flags=re.S).strip()
        alt = (
            '<xhtml:link rel="alternate" hreflang="bn" href="%s"/>' % bn
            + '<xhtml:link rel="alternate" hreflang="en" href="%s"/>' % en
            + '<xhtml:link rel="alternate" hreflang="x-default" href="%s"/>' % bn
        )
        for url in (bn, en):
            if url in seen:
                continue
            seen.add(url)
            out.append("<url>\n<loc>%s</loc>\n%s\n%s\n</url>" % (url, alt, meta))
    return head.rstrip() + "\n" + "\n".join(out) + "\n</urlset>\n"

def fetch_text(path):
    req=urllib.request.Request(ORIGIN+path, headers={"User-Agent":"Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read().decode("utf-8")

for path in ("/sitemap.xml","/robots.txt"):
    try:
        text=fetch_text(path)
    except Exception as exc:
        print("meta skip", path, exc, flush=True)
        continue
    text=re.sub(r'https?://(?:localhost:3000|127\.0\.0\.1:3000)', SITE, text)
    text=re.sub(r'(<loc>)/', r'\1%s/' % SITE, text)
    if path.endswith("sitemap.xml"):
        text=expand_sitemap(text)
    with open(os.path.join(OUT, path.lstrip("/")),"w",encoding="utf-8") as fh:
        fh.write(text)

open(os.path.join(OUT,".nojekyll"),"w").close()
if DOMAIN:
    open(os.path.join(OUT,"CNAME"),"w").write(DOMAIN.strip()+"\n")
print("built", flush=True)
