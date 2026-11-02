import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PUBLIC_MEDIA } from '../src/publicMedia.js';
const base='http://127.0.0.1:5000';
for (const path of ['/', '/about', '/why-us', '/contact', '/privacy-policy', '/login', '/signup']) {
 const r=await fetch(base+path);assert.equal(r.status,200,path);assert.ok((await r.text()).includes('id="root"'));console.log('PASS public/auth route',path);
}
for(const path of new Set(Object.values(PUBLIC_MEDIA))){const r=await fetch(base+path,{method:'HEAD'});assert.equal(r.status,200,path);assert.match(r.headers.get('content-type'),path.endsWith('.mp4')?/video\/mp4/:/image\/jpeg/);}
const range=await fetch(base+PUBLIC_MEDIA.video,{headers:{Range:'bytes=0-1023'}});assert.equal(range.status,206);assert.equal((await range.arrayBuffer()).byteLength,1024);assert.match(range.headers.get('content-range'),/^bytes 0-1023\//);
const invalid=await fetch(base+PUBLIC_MEDIA.video,{headers:{Range:'bytes=999999999-'}});assert.equal(invalid.status,416);
console.log('PASS local photos, playable video MIME, range requests and invalid range handling');
