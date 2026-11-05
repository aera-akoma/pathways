import assert from 'node:assert/strict';
import { PUBLIC_MEDIA } from '../src/publicMedia.js';
const base=process.env.PUBLIC_TEST_URL || 'http://127.0.0.1:5000';
for (const path of ['/', '/about', '/why-us', '/contact', '/privacy-policy', '/developer-credits', '/login', '/signup']) {
 const r=await fetch(base+path);assert.equal(r.status,200,path);assert.ok((await r.text()).includes('id="root"'));console.log('PASS public/auth route',path);
}
const videoFixture = PUBLIC_MEDIA.video;
const range=await fetch(base+videoFixture,{headers:{Range:'bytes=0-1023'}});assert.equal(range.status,206);assert.equal((await range.arrayBuffer()).byteLength,1024);assert.match(range.headers.get('content-range'),/^bytes 0-1023\//);
const invalid=await fetch(base+videoFixture,{headers:{Range:'bytes=999999999-'}});assert.equal(invalid.status,416);
console.log('PASS local video range requests and invalid range handling');
