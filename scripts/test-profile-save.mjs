import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {profileError} from '../src/validation.js';import {requireRecord} from '../src/api.js';
const source=fs.readFileSync('src/ProfileSettings.jsx','utf8');const start=source.indexOf('  const handleSaveProfile = async');const end=source.indexOf('\n  // Update Password',start);const code=source.slice(start,end)+'\nglobalThis.save=handleSaveProfile;';
for(const mode of ['success','http-error','network','malformed','invalid']){
 let updates=0,requests=0,status=null,stored=null;let state={students:[{id:'student-1',goal:'Old'}]};
 const saved={id:'student-1',goal:'Server normalized',phone:'9876543210',profileCompletedAt:'2026-11-02 10:00:00',portfolio:'https://example.com'};
 const c={formData:{goal:mode==='invalid'?'':'Developer',phone:'9876543210'},student:{id:'student-1',name:'Student',email:'student@example.com'},profileSaveInFlight:{current:false},profileError,requireRecord,setProfileSaveStatus:v=>status=v,setIsSavingProfile:()=>{},setFormData:()=>updates++,setState:fn=>{state=fn(state);updates++;},notify:()=>{},localStorage:{getItem:()=>JSON.stringify({id:'student-1',student:{id:'student-1'}}),setItem:(k,v)=>stored=JSON.parse(v)},requestJson:async()=>{requests++;if(mode==='http-error')throw Error('Save rejected');if(mode==='network')throw Error('Network unavailable');return mode==='malformed'?{}:saved;}};
 vm.createContext(c);vm.runInContext(code,c);await c.save({preventDefault(){}});
 if(mode==='success'){assert.equal(status.type,'success');assert.equal(state.students[0].goal,'Server normalized');assert.equal(stored.student.profileCompletedAt,saved.profileCompletedAt);}else{assert.equal(status.type,'error');assert.equal(updates,0);assert.equal(stored,null);}
 if(mode==='invalid')assert.equal(requests,0);assert.equal(c.profileSaveInFlight.current,false);
}
assert.ok(source.includes('Target Career Goal <span aria-hidden="true">*</span>'));assert.ok(source.includes('Registered Mobile (10-Digit) <span aria-hidden="true">*</span>'));assert.ok(source.includes("'Save Profile'"));
console.log('PASS: profile save success, server rejection, network error, malformed response, required validation and required labels');
