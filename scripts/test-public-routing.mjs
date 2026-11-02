import assert from 'node:assert/strict';
import {parseCurrentLocation,pageToPath} from '../src/router.js';
import {PUBLIC_PATHS,isPublicPage,resolveLoginDestination} from '../src/publicRouting.js';
globalThis.window={location:{pathname:'/',hash:'',search:''}};
for(const [page,path] of Object.entries(PUBLIC_PATHS)){
 window.location.pathname=path; assert.equal(parseCurrentLocation().page,page);assert.equal(pageToPath(page),path);assert.ok(isPublicPage(page));
}
for(const page of ['login','signup']){window.location.pathname='/'+page;assert.equal(parseCurrentLocation().page,page);assert.equal(resolveLoginDestination(parseCurrentLocation(),'student'),'dashboard');}
window.location.pathname='/';window.location.hash='#journey';assert.equal(parseCurrentLocation().page,'home','in-page anchor must not open auth');
window.location.hash='#/courses';assert.equal(parseCurrentLocation().page,'courses');
window.location.hash='';window.location.pathname='/admin/students';assert.equal(parseCurrentLocation().role,'admin');
assert.equal(resolveLoginDestination(parseCurrentLocation(),'student'),'dashboard');
assert.equal(resolveLoginDestination(parseCurrentLocation(),'admin'),'students');
window.location.pathname='/courses';assert.equal(resolveLoginDestination(parseCurrentLocation(),'student'),'courses');
console.log('PASS: public pages, login/signup destinations, anchor navigation and protected deep links');
