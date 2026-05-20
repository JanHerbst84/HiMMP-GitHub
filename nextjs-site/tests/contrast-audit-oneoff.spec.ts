/*
 * One-off rendered-DOM contrast audit. Not part of the standard
 * suite — invoked manually for the D-9-e baseline:
 *
 *   npx playwright test contrast-audit-oneoff.spec.ts --reporter=list
 *
 * Walks every visible text element on every route in both schemes
 * (default + explicit dark), and writes a JSON list of failures
 * to `/tmp/d9e-baseline.json` for triage.
 */

import { test, expect } from "@playwright/test";
import inventory from "../.migration/current-site-inventory.json";
import { writeFileSync, readFileSync, existsSync } from "node:fs";

const routes = (inventory as { pages: { path: string }[] }).pages.map(
  (p) => "/" + p.path
);

const auditScript = `(() => {
  function parseRgb(s){const m=s.match(/rgba?\\(([^)]+)\\)/);if(!m)return null;const p=m[1].split(',').map(x=>Number(x.trim()));return [p[0],p[1],p[2],p[3]!==undefined?p[3]:1];}
  function effectiveBg(el){
    // Element's own bg first (handles .resource-button etc. with explicit bg).
    const own=getComputedStyle(el);
    if(own.backgroundImage&&own.backgroundImage!=='none'){
      const g=own.backgroundImage.match(/linear-gradient\\([^,]+,\\s*(rgba?\\([^)]+\\))/);
      if(g)return g[1];
    }
    if(own.backgroundColor&&own.backgroundColor!=='rgba(0, 0, 0, 0)'&&own.backgroundColor!=='transparent'){
      const p=parseRgb(own.backgroundColor);
      if(p&&p[3]>=0.5)return own.backgroundColor;
    }
    // Hero overlay special case.
    const hero=el.closest('.hero, .chapter-hero');
    if(hero){
      const o=hero.querySelector('.hero-overlay, .chapter-hero-overlay');
      if(o)return getComputedStyle(o).backgroundColor;
    }
    // Walk ancestors.
    let c=el.parentElement;
    while(c){
      const cs=getComputedStyle(c);
      if(cs.backgroundImage&&cs.backgroundImage!=='none'){
        const g=cs.backgroundImage.match(/linear-gradient\\([^,]+,\\s*(rgba?\\([^)]+\\))/);
        if(g)return g[1];
      }
      if(cs.backgroundColor&&cs.backgroundColor!=='rgba(0, 0, 0, 0)'&&cs.backgroundColor!=='transparent'){
        const p=parseRgb(cs.backgroundColor);
        if(p&&p[3]>=0.5)return cs.backgroundColor;
      }
      c=c.parentElement;
    }
    return getComputedStyle(document.body).backgroundColor;
  }
  function lum([r,g,b]){const t=c=>{const s=c/255;return s<=0.03928?s/12.92:Math.pow((s+0.055)/1.055,2.4);};return 0.2126*t(r)+0.7152*t(g)+0.0722*t(b);}
  function ratio(f,b){const l1=lum(f),l2=lum(b);const [a,x]=l1>l2?[l1,l2]:[l2,l1];return (a+0.05)/(x+0.05);}
  const findings=[];
  for(const el of document.querySelectorAll('body *')){
    if(!el.textContent||!el.textContent.trim())continue;
    if(!Array.from(el.childNodes).some(n=>n.nodeType===3&&n.textContent.trim()))continue;
    const r=el.getBoundingClientRect();if(r.width===0||r.height===0)continue;
    const cs=getComputedStyle(el);if(cs.visibility==='hidden'||cs.display==='none')continue;
    const f=parseRgb(cs.color);const bs=effectiveBg(el);const b=parseRgb(bs);if(!f||!b)continue;
    const rt=ratio(f,b);
    const fs=parseFloat(cs.fontSize);
    const fw=parseInt(cs.fontWeight,10)||400;
    const large=fs>=24||(fs>=18.66&&fw>=700);
    const thr=large?3:4.5;
    if(rt<thr){
      findings.push({
        tag:el.tagName.toLowerCase(),
        cls:(el.className||'').toString().slice(0,80),
        text:el.textContent.trim().slice(0,60),
        fg:cs.color,
        bg:bs,
        ratio:Number(rt.toFixed(2)),
        size:Number(fs.toFixed(1)),
        threshold:thr
      });
    }
  }
  // Dedupe within page by class + tag + ratio
  const seen=new Set();
  return findings.filter(f=>{const k=f.cls+':'+f.tag+':'+f.ratio;if(seen.has(k))return false;seen.add(k);return true;});
})()`;

type Finding = {
  route: string;
  scheme: string;
  tag: string;
  cls: string;
  text: string;
  fg: string;
  bg: string;
  ratio: number;
  size: number;
  threshold: number;
};

const OUTPUT = "/tmp/d9e-baseline.json";

function appendFindings(newFindings: Finding[]) {
  let existing: Finding[] = [];
  if (existsSync(OUTPUT)) {
    try {
      existing = JSON.parse(readFileSync(OUTPUT, "utf8"));
    } catch {
      existing = [];
    }
  }
  existing.push(...newFindings);
  writeFileSync(OUTPUT, JSON.stringify(existing, null, 2));
}

test.describe.serial("D-9-e baseline audit", () => {
  test("reset output file", async () => {
    writeFileSync(OUTPUT, "[]");
  });

  for (const route of routes) {
    test(`light: ${route}`, async ({ page }) => {
      await page.goto(`http://localhost:4173${route}`);
      const findings = await page.evaluate(auditScript);
      appendFindings(
        (findings as Omit<Finding, "route" | "scheme">[]).map((f) => ({
          route,
          scheme: "light",
          ...f,
        }))
      );
    });
    test(`dark: ${route}`, async ({ page }) => {
      await page.addInitScript(() => {
        try {
          window.localStorage.setItem("himmp-theme", "dark");
        } catch {
          /* swallow */
        }
      });
      await page.goto(`http://localhost:4173${route}`);
      const findings = await page.evaluate(auditScript);
      appendFindings(
        (findings as Omit<Finding, "route" | "scheme">[]).map((f) => ({
          route,
          scheme: "dark",
          ...f,
        }))
      );
    });
  }
});
