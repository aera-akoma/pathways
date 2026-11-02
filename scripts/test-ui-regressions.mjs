import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { isValidCalendarDate, profileError } from '../src/validation.js';
for (const date of ['2026-02-30','2026-02-29','1900-02-29','2026-04-31','2026-00-10','2026-13-01','2026-01-00','0000-01-01','2026-2-01','not-a-date']) assert.equal(isValidCalendarDate(date),false,date);
for (const date of ['2024-02-29','2000-02-29','2026-02-28','2026-04-30','2026-12-31']) assert.equal(isValidCalendarDate(date),true,date);
assert.ok(profileError({goal:'Developer',phone:'9876543210',dob:'2026-02-30'}));
assert.equal(profileError({goal:'Developer',phone:'9876543210',dob:'2000-02-29'}),'');
const source=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');
const hydrateState=source.slice(source.indexOf('function jg()'),source.indexOf('function Mg('));
const hydrateSession=source.slice(source.indexOf('function Ng()'),source.indexOf('function Pg('));
assert.ok(hydrateState && hydrateSession);
const avatar='data:image/jpeg;base64,/9j/fixture';
const stored={students:[{id:'test-real-student',name:'Test Student',phone:'9000000099',avatar}],roster:[]};
const session={token:'fixture',role:'student',id:'test-real-student',avatar,student:{id:'test-real-student',avatar}};
const context=vm.createContext({Dg:'state',Og:'session',Ag:{courses:[],opportunities:[],internships:[],placements:[]},DEFAULT_STUDENT_AVATAR:'fallback',localStorage:{getItem:key=>JSON.stringify(key==='state'?stored:session)},console});
vm.runInContext(hydrateState+'\n'+hydrateSession,context);
assert.equal(context.jg().students[0].avatar,avatar,'stored JPEG must survive page reload');
assert.equal(context.Ng().avatar,avatar,'session JPEG must survive page reload');
assert.equal(context.Ng().student.avatar,avatar,'nested JPEG must survive page reload');
console.log('PASS: strict calendar dates and actual state/session JPEG hydration');
const profileSource=readFileSync(new URL('../src/ProfileSettings.jsx',import.meta.url),'utf8');
assert.ok(!profileSource.includes("startsWith('data:image/jpeg;base64')"),'profile rendering accepts compressed JPEG');
const persistStart=profileSource.indexOf('  const persistAvatar = async');
const persistEnd=profileSource.indexOf('\n  };',persistStart)+5;
const persistCode=profileSource.slice(persistStart,persistEnd).replace('const persistAvatar','globalThis.persistAvatar');
for (const failure of [false,true]) {
  const changes=[];
  const photoContext=vm.createContext({student:{id:'fixture'},requestJson:async()=>{if(failure)throw Error('Rejected');return {id:'fixture'};},setFormData:fn=>changes.push(fn({})),setState:fn=>changes.push(fn({students:[{id:'fixture'}]})),localStorage:{getItem:()=>null},window:{dispatchEvent:()=>{}},CustomEvent:class{}});
  vm.runInContext(persistCode,photoContext);
  if(failure){await assert.rejects(photoContext.persistAvatar(avatar),/Rejected/);assert.equal(changes.length,0);}else{await photoContext.persistAvatar(avatar);assert.equal(changes[0].avatar,avatar);}
}
console.log('PASS: photo persistence commits only after accepted server response');
