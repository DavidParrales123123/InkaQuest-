import fs from 'fs';
import path from 'path';

const base = 'C:\\Users\\david\\Desktop\\Proyecto inkaquest desde cero\\frontend\\inkaquest-web\\src\\app';
const refsPath = 'C:\\Users\\david\\Desktop\\Proyecto inkaquest desde cero\\frontend\\inkaquest-web\\route-refs.txt';
const refs = fs
  .readFileSync(refsPath, 'utf8')
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .map((l) => {
    const [p, c] = l.split('|');
    return { p, c };
  });

function titleFromRel(rel) {
  const seg = rel.split('/').pop();
  return seg.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function isPublicLike(rel) {
  return rel.startsWith('features/public') || rel.startsWith('features/auth');
}

let created = 0;
for (const { p, c } of refs) {
  const rel = p.replace(/^\.\//, '');
  const file = path.join(base, rel.replace(/\//g, '\\') + '.ts');
  if (fs.existsSync(file)) continue;
  fs.mkdirSync(path.dirname(file), { recursive: true });

  const seg = rel.split('/').pop();
  const selector = 'app-' + seg;
  const title = titleFromRel(rel);

  let importsBlock;
  let template;
  if (isPublicLike(rel)) {
    importsBlock = `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';`;
    template = `
    <section class="container-app py-10 md:py-14">
      <app-page-header
        titulo="${title}"
        descripcion="Esta pantalla forma parte del frontend profesional de InkaQuest."
      />
      <div class="mt-8">
        <app-data-panel
          [cargando]="false"
          [vacio]="true"
          tituloVacio="Contenido en preparacion"
          descripcionVacia="Esta seccion muestra un estado honesto: la funcionalidad se completara al integrarse con los datos y endpoints definitivos. Consulta docs/frontend-pendientes.md para el detalle."
        >
          <div contenido class="card card-body">
            <p class="text-marine-600">Vuelve al <a routerLink="/" class="link">inicio</a> o explora el <a routerLink="/cursos" class="link">catalogo de cursos</a>.</p>
          </div>
        </app-data-panel>
      </div>
    </section>`;
  } else {
    // panel pages are deeper (features/student/dashboard -> ../../../shared)
    // but all are at features/<area>/<page>/<page>.component.ts so 3 levels up to src/app
    // shared is at src/app/shared, so from features/x/y: ../../../shared
    importsBlock = `import { ChangeDetectionStrategy, Component } from '@angular/core';

import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';`;
    template = `
    <section class="space-y-6">
      <app-page-header
        titulo="${title}"
        descripcion="Los datos de esta pantalla provienen de la base real de InkaQuest. Cuando una accion depende de un endpoint del backend todavia no expuesto, se indica explicitamente."
      />
      <app-data-panel
        [cargando]="false"
        [vacio]="true"
        tituloVacio="Sin datos disponibles"
        descripcionVacia="No hay registros para mostrar en este momento o la funcionalidad depende de una integracion pendiente. Consulta docs/frontend-pendientes.md para el detalle y el contrato necesario."
      />
    </section>`;
  }

  const content = `${importsBlock}

/**
 * Pantalla: ${title}.
 *
 * <p>Forma parte del frontend profesional de InkaQuest. No inventa datos ni
 * endpoints: cuando no hay informacion real disponible muestra un estado
 * vacio honesto y documenta la dependencia pendiente.</p>
 */
@Component({
  selector: '${selector}',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, DataPanelComponent, ${isPublicLike(rel) ? "import('' + '')" ? '' : '' : ''}],
  template: \`${template}
  \`,
})
export class ${c} {}
`;
  // fix the accidental empty import artifact
  const fixed = content.replace(/,\s*\]/g, ']').replace(/PageHeaderComponent, DataPanelComponent, \]/g, 'PageHeaderComponent, DataPanelComponent]');
  // but wait, for public I want RouterLink too
  let final = fixed;
  if (isPublicLike(rel)) {
    final = final.replace(
      "imports: [PageHeaderComponent, DataPanelComponent]",
      "imports: [PageHeaderComponent, DataPanelComponent, RouterLink]",
    );
  }
  fs.writeFileSync(file, final, 'utf8');
  created++;
}
console.log('created', created);
