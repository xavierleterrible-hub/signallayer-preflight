#!/usr/bin/env node
/** Read-only x402 payment offer inspection. NO wallet access, NO signature, NO charge. */
const target = process.argv[2] || 'https://example.com/';
if (!/^https:\/\//i.test(target)) {
  console.error('Usage: node scripts/check-offer.mjs https://public.example/path');
  process.exit(2);
}
const url = new URL('https://signallayer.floot.app/_api/v1/agent/preflight');
url.searchParams.set('target', target);
url.searchParams.set('intent', 'pay');
const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
if (res.status !== 402) {
  throw new Error(`Expected an unpaid 402 challenge; got HTTP ${res.status}`);
}
const header = res.headers.get('payment-required');
if (!header) throw new Error('Missing PAYMENT-REQUIRED header');
let req;
try { req = JSON.parse(Buffer.from(header, 'base64').toString('utf8')); }
catch { throw new Error('Malformed PAYMENT-REQUIRED challenge'); }
const offers = Array.isArray(req.accepts) ? req.accepts : [];
const expected = {
  scheme: 'exact', network: 'eip155:8453', amount: '10000',
  asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  payTo: '0x60B3C6c053E926460D1E1053c516c859C95365e6'
};
const ok = req.x402Version === 2 && offers.some(o =>
  String(o.scheme).toLowerCase() === expected.scheme &&
  o.network === expected.network &&
  String(o.amount) === expected.amount &&
  String(o.asset).toLowerCase() === expected.asset.toLowerCase() &&
  String(o.payTo).toLowerCase() === expected.payTo.toLowerCase()
);
console.log(JSON.stringify({
  challengeVersion: req.x402Version, httpStatus: res.status,
  expectedOfferPresent: ok, offers: offers.map(o => ({
    scheme:o.scheme, network:o.network, amount:o.amount,
    asset:o.asset, payTo:o.payTo
  }))
}, null, 2));
if (!ok) {
  console.error('STOP: no offer matches the audited default network/token/recipient/price.');
  process.exit(1);
}
console.log('PASS: an unsigned x402 offer matches known terms. This is NOT a payment or safety assessment.');
