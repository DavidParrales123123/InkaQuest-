import fs from 'fs';
const c = fs.readFileSync('C:\\Users\\david\\Desktop\\Proyecto inkaquest desde cero\\frontend\\inkaquest-web\\src\\app\\app.routes.ts','utf8');
console.log('len', c.length);
console.log('loadComponent:', (c.match(/loadComponent:/g)||[]).length);
console.log('imports:', (c.match(/import\(/g)||[]).length);
console.log('thens:', (c.match(/\.then/g)||[]).length);
const re = /import\('([^']+)'\)\.then\(\s*\(m\)\s*=>\s*m\.([A-Za-z0-9_]+)\s*\)/gs;
let m, count=0; while((m=re.exec(c))) count++;
console.log('full pattern matches:', count);
const re2 = /import\('([^']+)'\)/g;
let c2=0; while(re2.exec(c)) c2++;
console.log('import paths:', c2);
// find first import not matched by full pattern
const re3 = /import\('([^']+)'\)\.then\([^)]+\)/gs;
let c3=0; const samples=[];
while((m=re3.exec(c))){ c3++; if(samples.length<3) samples.push(m[0].slice(0,120)); }
console.log('import..then(any):', c3);
console.log(samples);
