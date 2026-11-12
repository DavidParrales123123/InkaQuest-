import fs from 'fs';
import path from 'path';

const base = 'C:\\Users\\david\\Desktop\\Proyecto inkaquest desde cero\\frontend\\inkaquest-web\\src\\app';
const c = fs.readFileSync(path.join(base, 'app.routes.ts'), 'utf8');
const re = /import\('([^']+)'\)\.then\(\s*\(m\)\s*=>\s*m\.([A-Za-z0-9_]+)\s*\)/gs;
const all = [];
let m;
while ((m = re.exec(c))) {
  all.push({ p: m[1], cls: m[2] });
}
const unique = new Map();
for (const x of all) unique.set(x.p, x.cls);
const missing = [];
for (const [p, cls] of unique.entries()) {
  const fp = path.join(base, p.replace(/^\.\//, '').replace(/\//g, '\\') + '.ts');
  if (!fs.existsSync(fp)) missing.push({ p, cls, fp });
}
console.log('total matches', all.length, 'unique paths', unique.size, 'missing', missing.length);
fs.writeFileSync(
  'C:\\Users\\david\\Desktop\\Proyecto inkaquest desde cero\\route-missing.json',
  JSON.stringify(missing, null, 2),
);
console.log(missing.map((x) => x.p).join('\n'));
