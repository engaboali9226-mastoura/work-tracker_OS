import test from "node:test";
import assert from "node:assert/strict";
import {noorTotpQrImageSourceR318} from "../src/noor-admin-totp-qr-r318.js";

const svg='<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100"/></svg>';

test("R318: Supabase auth-js already prefixes its SVG with data:image/svg+xml;utf-8,",()=>{
 const providerQr="data:image/svg+xml;utf-8,"+svg;
 const image=noorTotpQrImageSourceR318(providerQr);
 assert.equal(image,"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg));
 assert.equal(decodeURIComponent(image!.split(",")[1]!),svg);
 assert.equal(image!.split("data:image/svg+xml").length,2,
  "duplicate data URI prefixes break SVG on Safari");
});

test("R318: raw SVG and already percent-encoded SVG produce a single safe data URI",()=>{
 const normalized="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
 assert.equal(noorTotpQrImageSourceR318(svg),normalized);
 assert.equal(noorTotpQrImageSourceR318(normalized),normalized);
 assert.equal(noorTotpQrImageSourceR318("data:image/svg+xml;utf-8,"+encodeURIComponent(svg)),normalized);
 assert.equal(noorTotpQrImageSourceR318("<?xml version=\"1.0\"?>\n"+svg),
  "data:image/svg+xml;charset=utf-8,"+encodeURIComponent("<?xml version=\"1.0\"?>\n"+svg));
});

test("R318: do not accept external images, nested data URIs, arbitrary HTML or invalid QR",()=>{
 for(const invalid of [
  "", "https://example.com/steal", "javascript:alert(1)",
  "data:text/html,<svg></svg>",
  "data:image/svg+xml;utf-8,data:image/svg+xml;utf-8,"+svg,
  "data:image/png;base64,AAA",
  "<img onerror=alert(1)>",
  "data:image/svg+xml;utf-8,other-value",
  "x".repeat(250_001),
 ]){
  assert.equal(noorTotpQrImageSourceR318(invalid),null);
 }
});
