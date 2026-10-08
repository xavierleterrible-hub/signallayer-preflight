#!/usr/bin/env node
// Read-only production health check. Makes 8 unsigned calls. Never pays, signs or retries.
// All requests identify CI traffic and MUST NOT be counted as independent buyers.
import assert from "node:assert/strict";

const base="https://signallayer.floot.app";
const payTo="0x60B3C6c053E926460D1E1053c516c859C95365e6";
const token="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const paid=[
  {name:"agent_preflight",path:"/_api/v1/agent/preflight",amount:"10000",args:{target:"https://example.com/",intent:"pay"}},
  {name:"market_execution_intel",path:"/_api/v1/market/execution-intel",amount:"30000",args:{sellToken:token,buyToken:"0x4200000000000000000000000000000000000006",amount:"10",sellTokenDecimals:6,buyTokenDecimals:18}},
  {name:"structured_extract",path:"/_api/v1/web/structured-extract",amount:"20000",args:{url:"https://example.com/",fields:["title"]}}
];
const common={"user-agent":"SignalLayer-CI-SmokeTest/1.0","x-signallayer-source":"ci-smoke"};
async function request(path,options={}){
  return fetch(base+path,{...options,redirect:"manual",signal:AbortSignal.timeout(18000),headers:{...common,...options.headers}});
}
function terms(payload,item){
  assert.equal(payload.x402Version,2,"x402 V2 expected");
  assert.ok(Array.isArray(payload.accepts)&&payload.accepts.length>0,"missing payment offer");
  assert.ok(payload.accepts.some(x=>x.scheme==="exact"&&x.network==="eip155:8453"&&
    String(x.amount)===item.amount&&x.asset?.toLowerCase()===token.toLowerCase()&&
    x.payTo?.toLowerCase()===payTo.toLowerCase()),"wrong network, asset, payee or price");
  assert.ok(payload.extensions?.bazaar,"Bazaar discovery extension missing");
}
const output=[];
const catalog=await request("/_api/tools");
assert.equal(catalog.status,200,"free tool catalog must return HTTP 200");
const catalogBody=await catalog.json();
output.push({surface:"catalog",status:catalog.status,foundTools:JSON.stringify(catalogBody).includes("agent_preflight")});

const router=await request("/_api/v1/router?task=Check%20an%20unfamiliar%20x402%20API%20before%20payment");
assert.equal(router.status,200,"free router must return HTTP 200");
output.push({surface:"router",status:router.status});

// An unsigned 402 is only a challenge, not a successful tool execution or settled payment.
for(const item of paid){
  const params=new URLSearchParams();
  if(item.name==="agent_preflight"){params.set("target",item.args.target);params.set("intent","pay");}
  const http=await request(item.path+"?"+params);
  assert.equal(http.status,402,item.name+" HTTP 402 expected");
  const encoded=http.headers.get("payment-required");
  assert.ok(encoded,item.name+" missing PAYMENT-REQUIRED");
  const offer=JSON.parse(Buffer.from(encoded,"base64").toString("utf8"));
  terms(offer,item);
  output.push({surface:"http",tool:item.name,status:402,bazaar:true,priceAtomic:item.amount});

  const mcp=await request("/_api/mcp",{method:"POST",headers:{
    "content-type":"application/json","accept":"application/json, text/event-stream",
    "mcp-protocol-version":"2025-06-18"
  },body:JSON.stringify({jsonrpc:"2.0",id:item.amount,method:"tools/call",params:{name:item.name,arguments:item.args}})});
  assert.equal(mcp.status,200,item.name+" MCP protocol HTTP status");
  const body=await mcp.json();
  assert.equal(body.result?.isError,true,item.name+" should require a payment");
  const requirement=body.result?.structuredContent;
  terms(requirement,item);
  assert.equal(requirement.extensions.bazaar.info.input?.toolName,item.name);
  assert.equal(requirement.extensions.bazaar.info.input?.type,"mcp");
  output.push({surface:"mcp",tool:item.name,status:200,paymentRequired:true,bazaar:true,priceAtomic:item.amount});
}

console.log(JSON.stringify({result:"PASS",mode:"read-only",calls:output.length,checks:output,
  caveat:"No payment, no settlement test, no third-party user inferred"},null,2));
