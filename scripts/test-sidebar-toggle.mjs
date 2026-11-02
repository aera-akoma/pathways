import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const source=fs.readFileSync('src/main.jsx','utf8');
const match=source.match(/onClick:(\(\)=>\{if\(compact\)s\(!o\);else setCollapsed\(!collapsed\)\})/);assert.ok(match,'actual hamburger handler');
for(const compact of [false,true])for(const open of [false,true]){let mobile,desktop;const c={compact,o:open,collapsed:open,s:value=>mobile=value,setCollapsed:value=>desktop=value};vm.createContext(c);vm.runInContext('('+match[1]+')()',c);if(compact){assert.equal(mobile,!open);assert.equal(desktop,undefined);}else{assert.equal(desktop,!open);assert.equal(mobile,undefined);}}
assert.ok(source.includes('"aria-controls":`app-sidebar`'));assert.ok(source.includes('inert:navHidden||undefined'));
console.log('PASS: actual hamburger handler opens/closes mobile and collapses/expands desktop independently');
