// NOOR R224: precise RGB -> transparent RGBA conversion of the EXISTING
// R223 source PNGs. Original logo glyphs/colours are never redrawn.
// Pure built-in Node.js, no network, no dependencies, no user data.
// The conversion is deterministic and fails closed on unexpected PNG format.
import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {inflateSync,deflateSync} from 'node:zlib';

const PUBLIC=fileURLToPath(new URL('../../apps/web/public/',import.meta.url));
const jobs=[
  ['noor-app-icon-192.png','noor-icon-transparent-r224-192.png',192],
  ['noor-app-icon-512.png','noor-icon-transparent-r224-512.png',512],
  ['apple-touch-icon.png','noor-apple-touch-transparent-r224.png',180],
];
const signature=Buffer.from([137,80,78,71,13,10,26,10]);
function fail(){throw Error('R224_UNSUPPORTED_OR_CORRUPT_ORIGINAL_ICON');}
function crc32(input){
  let crc=0xffffffff;
  for(const byte of input){
    crc^=byte;
    for(let n=0;n<8;n++)crc=(crc>>>1)^(crc&1?0xedb88320:0);
  }
  return (crc^0xffffffff)>>>0;
}
function chunk(type,data){
  const kind=Buffer.from(type,'ascii');
  const head=Buffer.alloc(8);
  head.writeUInt32BE(data.length,0);
  kind.copy(head,4);
  const tail=Buffer.alloc(4);
  tail.writeUInt32BE(crc32(Buffer.concat([kind,data])));
  return Buffer.concat([head,data,tail]);
}
function decodeRGB(png,expected){
  if(!png.subarray(0,8).equals(signature)||png.length>3000000)fail();
  let off=8,header=null,parts=[],ended=false;
  while(off+12<=png.length){
    const len=png.readUInt32BE(off),type=png.toString('ascii',off+4,off+8);
    if(len>2000000||off+len+12>png.length)fail();
    const data=png.subarray(off+8,off+8+len);
    const check=png.readUInt32BE(off+8+len);
    if(crc32(Buffer.concat([Buffer.from(type,'ascii'),data]))!==check)fail();
    if(type==='IHDR'){
      if(header||len!==13)fail();
      const w=data.readUInt32BE(0),h=data.readUInt32BE(4);
      if(w!==expected||h!==expected||data[8]!==8||data[9]!==2||
         data[10]!==0||data[11]!==0||data[12]!==0)fail();
      header={w,h};
    } else if(type==='IDAT'){
      if(!header)fail();
      parts.push(data);
    } else if(type==='IEND'){ended=true;break;}
    else if((type.charCodeAt(0)&32)===0 && type!=='PLTE')fail();
    off+=len+12;
  }
  if(!header||!ended||!parts.length)fail();
  const {w,h}=header,scanline=w*3;
  const raw=inflateSync(Buffer.concat(parts),{maxOutputLength:h*(scanline+1)+1});
  if(raw.length!==h*(scanline+1))fail();
  const output=Buffer.alloc(w*h*3);
  for(let y=0;y<h;y++){
    const row=y*(scanline+1),filter=raw[row],start=y*scanline;
    if(filter>4)fail();
    for(let x=0;x<scanline;x++){
      const i=row+1+x;
      const left=x>=3?output[start+x-3]:0;
      const up=y>0?output[start+x-scanline]:0;
      const upLeft=x>=3&&y>0?output[start+x-scanline-3]:0;
      let predictor=0;
      if(filter===1)predictor=left;
      else if(filter===2)predictor=up;
      else if(filter===3)predictor=Math.floor((left+up)/2);
      else if(filter===4){
        const p=left+up-upLeft;
        const a=Math.abs(p-left),b=Math.abs(p-up),c=Math.abs(p-upLeft);
        predictor=a<=b&&a<=c?left:b<=c?up:upLeft;
      }
      output[start+x]=(raw[i]+predictor)&255;
    }
  }
  return {w,h,rgb:output};
}
function makeTransparent(png,expected){
  const {w,h,rgb}=decodeRGB(png,expected);
  const scanline=1+w*4;
  const raw=Buffer.alloc(h*scanline,0);
  let clear=0,solid=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const src=(y*w+x)*3,dst=y*scanline+1+x*4;
    const r=rgb[src],g=rgb[src+1],b=rgb[src+2];
    // Drop the white RGB background and softly recover thin anti-aliased
    // strokes, without recolouring opaque ink. Both inside and outside the
    // logo's original thin gold circular outline become transparent.
    const difference=255-Math.min(r,g,b);
    const alpha=difference<=12?0:difference>=48?255:Math.round((difference-12)*255/36);
    if(!alpha)clear++;
    if(alpha===255)solid++;
    const coverage=alpha/255;
    const channel=c=>alpha===0?0:alpha===255?c:
      Math.max(0,Math.min(255,Math.round((c-(1-coverage)*255)/coverage)));
    raw[dst]=channel(r);raw[dst+1]=channel(g);raw[dst+2]=channel(b);raw[dst+3]=alpha;
  }
  if(clear<w*h*.20||solid<w*h*.005)fail();
  const ihdr=Buffer.alloc(13);
  ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);
  ihdr[8]=8;ihdr[9]=6; // 8-bit RGBA
  return {bytes:Buffer.concat([signature,chunk('IHDR',ihdr),
    chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]),
    clear,solid,w,h};
}

for(const [source,target,size] of jobs){
  const result=makeTransparent(readFileSync(join(PUBLIC,source)),size);
  // Each target is a new, versioned filename to bypass pinned iOS icon cache.
  writeFileSync(join(PUBLIC,target),result.bytes,{flag:'w',mode:0o644});
  process.stdout.write('R224_TRANSPARENT_LOGO_OK '+target+
    ' '+result.w+'x'+result.h+
    ' transparent_pixels='+result.clear+'\n');
}
