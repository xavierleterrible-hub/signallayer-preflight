#!/usr/bin/env node
/**
 * SignalLayer public UI reconnaissance. Read-only, no wallet, no payments, no form submits.
 * Runs in CI on desktop and mobile Chromium. Reports candidate dead/inert controls.
 * It does NOT certify every interactive app workflow or authenticated route.
 */
import { chromium, devices } from "playwright";
import fs from "node:fs/promises";

const base = "https://signallayer.floot.app";
const baseUrl = new URL(base);
const maxPages = 35;
const isIgnored = (url) =>
  /^\/_api\/|^\/api\/|^\/_cdn\//i.test(url.pathname) ||
  /\/(pay|sign|checkout|auth|wallet|settle|transfer|delete)(\/|$)/i.test(url.pathname);
const report = {
  startedAt: new Date().toISOString(), base, mode: "unsigned, read-only, no form submission",
  desktop: {}, mobile: {}, warning: "A clickable control with no visible effect may still perform an intended action. Review candidates manually."
};
const cutoff = (s,n=140)=>String(s ?? "").trim().slice(0,n);
function safeUrl(href, from){
  try {
    const u = new URL(href, from);
    if(!["http:","https:"].includes(u.protocol)) return null;
    u.hash = "";
    return u;
  } catch {return null}
}
const options=[
  {name:"desktop", contextOptions:{viewport:{width:1440,height:900}}},
  {name:"mobile",contextOptions:{...devices["iPhone 13"],browserName:undefined}}
];
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try{
for(const configuration of options){
  const context=await browser.newContext(configuration.contextOptions);
  const page=await context.newPage();
  const collected={
    crawled:[], errors:[], deadRoutes:[], suspiciousLinks:[], clickable:[],
    candidateUnwiredControls:[], externalLinks:[], internalLinks:[], consoleErrors:[]
  };
  const toVisit=[base+"/"];const seen=new Set();
  page.on("pageerror",e=>collected.errors.push(cutoff(e.message,300)));
  page.on("console", msg=>{if(msg.type()==="error") collected.consoleErrors.push(cutoff(msg.text(),300))});
  while(toVisit.length && seen.size<maxPages){
    const path=toVisit.shift();
    if(seen.has(path))continue;
    seen.add(path);
    let response;
    try {
      response=await page.goto(path,{waitUntil:"domcontentloaded",timeout:18000});
      await page.waitForTimeout(1100);
    } catch(e) {
      collected.deadRoutes.push({url:path,reason:"navigation:"+cutoff(e.message,230)});
      continue;
    }
    const status=response?.status() ?? 0;
    const route={url:path,status,title:cutoff(await page.title())};
    const data=await page.evaluate(()=>{
      const all=Array.from(document.querySelectorAll('a[href],button,[role="button"],[role="link"],summary,[tabindex]:not([tabindex="-1"])'));
      return all.filter(el=>{
        const css=getComputedStyle(el);const rect=el.getBoundingClientRect();
        return css.display!=="none"&&css.visibility!=="hidden"&&rect.width>0&&rect.height>0;
      }).map(el=>{
        const name=(el.textContent||el.getAttribute("aria-label")||el.getAttribute("title")||"").replace(/\s+/g," ").trim();
        return {tag:el.tagName.toLowerCase(),role:el.getAttribute("role"),text:name.slice(0,100),href:el.getAttribute("href"),hasInlineHandler:!!el.getAttribute("onclick"),disabled:el.hasAttribute("disabled"),type:el.getAttribute("type"),aria:el.getAttribute("aria-label"),target:el.getAttribute("target")};
      });
    });
    route.clickableCount=data.length;
    if(status>=400) collected.deadRoutes.push(route);
    collected.crawled.push(route);
    for(const entry of data) {
      const key=JSON.stringify({url:path,...entry});
      if(collected.clickable.length<500)collected.clickable.push({...entry,page:path});
      if(entry.tag==="a" || entry.role==="link"){
        if(!entry.href || entry.href==="#" || /^javascript:/i.test(entry.href)){
          collected.suspiciousLinks.push({page:path,...entry,reason:"empty-or-placeholder-href"});
          continue;
        }
        if(entry.href.startsWith("#")){
          const ident=entry.href.slice(1);
          const exists=await page.evaluate(id=>Boolean(document.getElementById(id)||document.querySelector('[name="'+CSS.escape(id)+'"]')),ident);
          if(!exists)collected.suspiciousLinks.push({page:path,href:entry.href,text:entry.text,reason:"missing-anchor-target"});
          continue;
        }
        const u=safeUrl(entry.href,path);
        if(!u)continue;
        const href=u.toString();
        if(u.origin===baseUrl.origin){
          if(!collected.internalLinks.includes(href))collected.internalLinks.push(href);
          if(!isIgnored(u) && !seen.has(href) && !toVisit.includes(href))toVisit.push(href);
        } else if(collected.externalLinks.length<200&&!collected.externalLinks.some(x=>x.href===href))collected.externalLinks.push({href,text:entry.text,page:path});
      } else if(entry.tag==="button"||entry.role==="button"){
        if(!entry.disabled && !entry.text && !entry.aria)
          collected.candidateUnwiredControls.push({page:path,...entry,reason:"unlabeled-interactive-control"});
      }
    }
  }
  report[configuration.name]={
    pagesChecked:collected.crawled.length,routeIssues:collected.deadRoutes,
    pageErrors:[...new Set(collected.errors)].slice(0,25),
    consoleErrors:[...new Set(collected.consoleErrors)].slice(0,25),
    suspectedDeadLinks:collected.suspiciousLinks.slice(0,100),
    possibleUnlabeledButtons:collected.candidateUnwiredControls.slice(0,80),
    routes:collected.crawled,externalLinks:collected.externalLinks,
    clickableControls:collected.clickable.slice(0,350),
    internalLinkCount:collected.internalLinks.length,
    note:"Buttons were inventoried but NOT clicked; submit/payment/wallet actions deliberately excluded."
  };
  await context.close();
}
} finally {await browser.close()}
await fs.mkdir("ui-audit",{recursive:true});
await fs.writeFile("ui-audit/report.json",JSON.stringify(report,null,2));
console.log("PUBLIC_CONTROL_INVENTORY "+JSON.stringify({
  desktop:report.desktop.clickableControls,
  mobile:report.mobile.clickableControls,
  desktopExternals:report.desktop.externalLinks,
  mobileExternals:report.mobile.externalLinks,
  desktopSuspicious:report.desktop.suspectedDeadLinks,
  mobileSuspicious:report.mobile.suspectedDeadLinks
}).slice(0,21000));
console.log(JSON.stringify({
  mode:report.mode,
  desktop:{pages:report.desktop.pagesChecked,routeIssues:report.desktop.routeIssues?.length,suspicious:report.desktop.suspectedDeadLinks?.length,unlabeled:report.desktop.possibleUnlabeledButtons?.length,pageErrors:report.desktop.pageErrors?.length,controls:report.desktop.clickableControls?.length},
  mobile:{pages:report.mobile.pagesChecked,routeIssues:report.mobile.routeIssues?.length,suspicious:report.mobile.suspectedDeadLinks?.length,unlabeled:report.mobile.possibleUnlabeledButtons?.length,pageErrors:report.mobile.pageErrors?.length,controls:report.mobile.clickableControls?.length},
  report:"ui-audit/report.json",
  caveat:"Read-only crawl is not a proof that every button works; full UX testing requires Floot editor."
},null,2));
