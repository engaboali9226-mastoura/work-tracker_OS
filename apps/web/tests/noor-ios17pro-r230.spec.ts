import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {inflateSync} from "node:zlib";

const web=new URL("../",import.meta.url);
const read=(relative:string)=>readFileSync(new URL(relative,web),"utf8");
const shell=read("src/platform-shell.tsx");
const css=read("src/noor-ios-viewport-r230.css");
const main=read("src/main.tsx");
const html=read("index.html");
const manifest=JSON.parse(read("public/noor.webmanifest"));
const generator=new URL("../../../tools/hosting/generate-transparent-noor-icons-r224.mjs",import.meta.url);

function alphaBounds(file:string){
 const png=readFileSync(new URL("public/"+file,web));
 assert.ok(png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])));
 const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
 assert.equal(width,180);assert.equal(height,180);
 assert.equal(png[25],6,"Apple PNG must contain actual alpha");
 let parts:Buffer[]=[];
 for(let pos=8;pos+12<=png.length;){
  const len=png.readUInt32BE(pos),kind=png.toString("ascii",pos+4,pos+8);
  if(kind==="IDAT")parts.push(png.subarray(pos+8,pos+8+len));
  pos+=len+12;
  if(kind==="IEND")break;
 }
 const raw=inflateSync(Buffer.concat(parts));
 assert.equal(raw.length,height*(width*4+1));
 let loX=width,loY=height,hiX=-1,hiY=-1,transparent=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const alpha=raw[y*(width*4+1)+1+x*4+3];
  if(alpha===0)transparent++;
  if(alpha>=70){loX=Math.min(loX,x);loY=Math.min(loY,y);
    hiX=Math.max(hiX,x);hiY=Math.max(hiY,y);}
 }
 return {diameter:Math.max(hiX-loX+1,hiY-loY+1),transparent};
}
test("R230 iPhone logo visibly larger within same 180px Home Screen icon",()=>{
 execFileSync(process.execPath,[generator.pathname],{stdio:"pipe"});
 const old=alphaBounds("noor-apple-touch-transparent-r224.png");
 const current=alphaBounds("noor-apple-touch-expanded-r230.png");
 assert.ok(current.diameter>old.diameter*1.3,
   "iPhone ring must occupy substantially more of its tile");
 assert.ok(current.diameter<180*.94,
   "retain breathing room to avoid rounded-square crop");
 assert.ok(current.transparent>180*180*.15,"retain transparent background");
 assert.match(html,/href="\/noor-apple-touch-expanded-r230\.png"/u);
 for(const size of [192,512])assert.ok(manifest.icons.some((x:any)=>
   x.src==="/noor-icon-transparent-r224-"+size+".png"));
});
test("R230 login card fits a narrow iPhone with no fixed content-box overflow",()=>{
 assert.match(shell,/\.glass-panel \{ box-sizing: border-box; min-width: 0;/u);
 assert.match(shell,/width: min\(100%, 390px\)/u);
 assert.match(shell,/\.glass-panel \{ width: min\(100%, 352px\)/u);
 assert.match(shell,/\.glass-input:[^\n]+/u);
 assert.match(shell,/box-sizing: border-box; font-size: 16px/u);
 assert.match(shell,/className="noor-auth-route-r230"/u);
 assert.match(css,/\.noor-auth-route-r230 \{/u);
});
test("R230 iOS compact mode is WebKit/mobile scoped without disabling user zoom",()=>{
 assert.match(main,/import "\.\/noor-ios-viewport-r230\.css";/u);
 assert.match(css,/@supports \(-webkit-touch-callout: none\)/u);
 assert.match(css,/@media \(max-width: 430px\)/u);
 assert.match(css,/\.np-page input,/u);
 assert.match(css,/\.np-page select,/u);
 assert.match(css,/\.np-page textarea,/u);
 assert.match(css,/font-size: 16px/u);
 assert.doesNotMatch(css,/zoom:\s*[.\d]+|transform:\s*scale\(|user-scalable\s*:\s*no|maximum-scale\s*=\s*1/iu);
 assert.match(html,/name="viewport" content="width=device-width, initial-scale=1\.0"/u);
});
