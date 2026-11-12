import fs from 'fs';
import path from 'path';

const base = 'C:\\Users\\david\\Desktop\\Proyecto inkaquest desde cero\\frontend\\inkaquest-web\\src\\app';
const c = fs.readFileSync(path.join(base, 'app.routes.ts'), 'utf8');
const re = /loadComponent:\s*\(\)\s*=>\s*import\('([^']+)'\)\.then\(\s*\(m\)\s*=>\s*m\.([A-Za-z0-9_]+)\s*\)/gs;
const seen = new Map();
let m;
while ((m = re.exec(c))) seen.set(m[1], m[2]);
const missing = [];
for (const [p, cls] of seen.entries()) {
  const rel = p.replace(/^\.\//, '');
  const fp = path.join(base, rel.replace(/\//g, '\\') + '.ts');
  if (!fs.existsSync(fp)) missing.push({ p, cls, rel, fp });
}
function isPublicLike(rel) {
  return rel.startsWith('features/public') || rel.startsWith('features/auth');
}
function titleFromRel(rel) {
  const seg = rel.split('/').pop();
  return seg.replace(/-/g, ' ').replace(/\b\w/g, (x) => x.toUpperCase());
}
let created = 0;
for (const { cls, rel, fp } of missing) {
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  const seg = rel.split('/').pop();
  const selector = 'app-' + seg;
  const title = titleFromRel(rel);
  const publicLike = isPublicLike(rel);
  const routerImport = publicLike ? "import { RouterLink } from '@angular/router';\n" : '';
  const importsList = publicLike
    ? '[PageHeaderComponent, DataPanelComponent, RouterLink]'
    : '[PageHeaderComponent, DataPanelComponent]';
  const template = publicLike
    ? `\n    <section class="container-app py-10 md:py-14">\n      <app-page-header\n        titulo="${title}"\n        descripcion="Esta pantalla forma parte del frontend profesional de InkaQuest."\n      />\n      <div class="mt-8">\n        <app-data-panel\n          [cargando]="false"\n          [vacio]="true"\n          tituloVacio="Contenido en preparacion"\n          descripcionVacia="Esta seccion muestra un estado honesto mientras se completa la integracion con los datos y endpoints definitivos. Consulta docs/frontend-pendientes.md."\n        />\n      </div>\n    </section>`
    : `\n    <section class="space-y-6">\n      <app-page-header\n        titulo="${title}"\n        descripcion="Los datos de esta pantalla provienen de la base real cuando la integracion lo permite."\n      />\n      <app-data-panel\n        [cargando]="false"\n        [vacio]="true"\n        tituloVacio="Sin datos disponibles"\n        descripcionVacia="No hay registros para mostrar o la accion depende de una integracion pendiente del backend. Consulta docs/frontend-pendientes.md."\n      />\n    </section>`;
  const content = `import { ChangeDetectionStrategy, Component } from '@angular/core';
${routerImport}
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

/**
 * Pantalla: ${title}.
 *
 * <p>Componente del frontend profesional de InkaQuest. No inventa datos ni
 * endpoints; muestra un estado honesto cuando la informacion o la accion
 * depende de una integracion aun pendiente.</p>
 */
@Component({
  selector: '${selector}',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: ${importsList},
  template: \`${template}
  \`,
})
export class ${cls} {}
`;
  fs.writeFileSync(fp, content, 'utf8');
  created++;
}
console.log('unique', seen.size, 'missing', missing.length, 'created', created);
