import { chromium } from "@playwright/test";

const routes = [
  "/index.html",
  "/about.html",
  "/approach.html",
  "/team.html",
  "/publications.html",
  "/videos.html",
  "/audio.html",
  "/findings.html",
  "/findings/01-introduction.html",
  "/findings/09-guitars-bass.html",
  "/findings/glossary.html",
  "/contact.html",
  "/faq.html",
  "/privacy.html",
  "/acknowledgements.html"
];

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const allFindings = [];

for (const r of routes) {
  await page.goto(`http://localhost:4180${r}`);
  const findings = await page.evaluate(() => {
    function rgbParse(s){const m=s.match(/rgba?\(([^)]+)\)/);if(!m)return null;const p=m[1].split(',').map(x=>parseFloat(x.trim()));return{r:p[0],g:p[1],b:p[2],a:p[3]??1};}
    function lum({r,g,b}){const t=(c)=>{c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);};return 0.2126*t(r)+0.7152*t(g)+0.0722*t(b);}
    function contrast(fg,bg){const L1=lum(fg),L2=lum(bg);return(Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);}
    function classify(el) {
      // Detect dark contexts: hero (any), site-footer, dark sections
      let cur = el;
      while (cur && cur !== document.body) {
        const cls = (cur.className || '').toString();
        if (cls.includes('hero') || cls.includes('chapter-hero')) return { r: 8, g: 10, b: 12, name: 'hero-overlay' };
        if (cls.includes('site-footer')) return { r: 17, g: 20, b: 24, name: 'footer' };
        cur = cur.parentElement;
      }
      // Else effective bg walk
      cur = el;
      while (cur) {
        const c = getComputedStyle(cur).backgroundColor;
        const p = rgbParse(c);
        if (p && p.a > 0.5) return { ...p, name: 'inherited' };
        cur = cur.parentElement;
      }
      return { r: 255, g: 255, b: 255, name: 'fallback-white' };
    }
    const out = [];
    document.querySelectorAll('a').forEach(a => {
      const cs = getComputedStyle(a);
      const fg = rgbParse(cs.color);
      if (!fg) return;
      const r = a.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const bg = classify(a);
      const c = contrast(fg, bg);
      if (c < 4.5) {
        out.push({
          text: a.textContent.trim().slice(0, 35),
          cls: (a.className || '').toString().slice(0, 30),
          context: bg.name,
          fg: cs.color,
          bg: `rgb(${bg.r},${bg.g},${bg.b})`,
          contrast: c.toFixed(2)
        });
      }
    });
    return out;
  });
  if (findings.length) allFindings.push({ route: r, findings });
}

await browser.close();
console.log(JSON.stringify(allFindings, null, 2));
