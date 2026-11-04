import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {inflateSync} from "node:zlib";
import test from "node:test";

const PUBLIC=new URL("../public/",import.meta.url);
const generator=new URL("../../../tools/hosting/generate-transparent-noor-icons-r224.mjs",import.meta.url);
const manifest=JSON.parse(readFileSync(new URL("noor.webmanifest",PUBLIC),"utf8"));
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");

function inspect(png:Buffer,size:number){
 assert.ok(png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])));
 assert.equal(png.readUInt32BE(16),size);
 assert.equal(png.readUInt32BE(20),size);
 assert.equal(png[24],8);
 assert.equal(png[25],6,"R224 requires actual alpha channel, not a fake white square");
 const compressed:Buffer[]=[];
 for(let offset=8;offset+12<=png.length;){
   const len=png.readUInt32BE(offset),name=png.toString("ascii",offset+4,offset+8);
   if(name==="IDAT")compressed.push(png.subarray(offset+8,offset+8+len));
   offset+=12+len;if(name==="IEND")break;
 }
 const raw=inflateSync(Buffer.concat(compressed),{maxOutputLength:size*(1+size*4)+1});
 assert.equal(raw.length,size*(1+size*4));
 let transparent=0,opaque=0;
 for(let y=0;y<size;y++){
   const row=y*(1+size*4);
   assert.equal(raw[row],0,"Generated PNG must use unfiltered RGBA scanlines");
   for(let x=0;x<size;x++){
     const a=raw[row+1+x*4+3];
     if(a===0)transparent++;
     if(a===255)opaque++;
   }
 }
 assert.equal(raw[1+3],0,"Corner background is transparent");
 assert.ok(transparent>size*size*.2,"Logo must have substantial transparent background");
 assert.ok(opaque>size*size*.005,"The original logo must still be visible");
}

test("R224 transparent icon assets derive solely from original branded PNGs, no redraw",()=>{
 const script=readFileSync(generator,"utf8");
 for(const file of ["noor-app-icon-192.png","noor-app-icon-512.png","apple-touch-icon.png"]){
   assert.ok(script.includes(file));
 }
 assert.doesNotMatch(script,/fetch\(|https?:\/\/|SUPABASE_SERVICE_ROLE_KEY|indexedDB|localStorage/u);
 execFileSync(process.execPath,[generator.pathname],{stdio:"pipe"});
 for(const [filename,size] of [
   ["noor-icon-transparent-r224-192.png",192],
   ["noor-icon-transparent-r224-512.png",512],
   ["noor-apple-touch-transparent-r224.png",180]
 ] as const)inspect(readFileSync(new URL(filename,PUBLIC)),size);
});

test("R224 installed PWA uses versioned transparent logo icons, preserving installability",()=>{
 for(const size of [192,512])assert.ok(manifest.icons.some((x:any)=>
   x.src==="/noor-icon-transparent-r224-"+size+".png" && x.sizes===size+"x"+size && x.type==="image/png"));
 assert.match(html,/rel="apple-touch-icon" sizes="180x180" href="\/noor-apple-touch-transparent-r224\.png"/u);
 assert.match(html,/rel="manifest" href="\/noor\.webmanifest"/u);
 assert.equal(manifest.display,"standalone");
});
