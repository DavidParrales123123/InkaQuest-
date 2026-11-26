import { Injectable } from '@angular/core';

import { FilaCalificacion } from './gradebook.service';

/** Datos de una hoja del libro de calificaciones. */
export interface HojaCalificaciones {
  nombre: string;
  tipo: 'Evaluación' | 'Tarea';
  actividad: string;
  curso: string;
  fechaLimite?: string | null;
  filas: FilaCalificacion[];
}

const OBSERVACION: Record<string, string> = {
  pendiente: 'Aún dentro del plazo, sin registrar',
  no_entregado: 'No entregó / no rindió en el plazo',
  en_curso: 'Inició pero no finalizó',
  entregado: 'Entregado y calificado automáticamente',
  por_calificar: 'Entregado, pendiente de revisión',
  calificada: 'Revisada por el docente',
};

/**
 * Genera archivos .xlsx reales (Excel) con las calificaciones.
 * ExcelJS se importa de forma diferida para no cargarlo en el bundle inicial.
 */
@Injectable({ providedIn: 'root' })
export class ExcelExportService {
  async exportar(archivo: string, hojas: HojaCalificaciones[]): Promise<void> {
    const modulo = await import('exceljs');
    const ExcelJS = (modulo as any).default ?? modulo;
    const libro = new ExcelJS.Workbook();
    libro.creator = 'InkaQuest';
    libro.created = new Date();
    libro.modified = new Date();

    for (const hoja of hojas) {
      this.agregarHoja(libro, hoja);
    }

    const buffer = await libro.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = this.sanitizar(archivo) + '.xlsx';
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  }

  private agregarHoja(libro: any, datos: HojaCalificaciones): void {
    const hoja = libro.addWorksheet(this.sanitizarHoja(datos.nombre), {
      views: [{ state: 'frozen', ySplit: 6 }],
    });

    const azul = 'FF0F5D57';
    const gris = 'FFF2F6F5';

    hoja.mergeCells('A1:G1');
    const titulo = hoja.getCell('A1');
    titulo.value = `InkaQuest — Calificaciones de ${datos.tipo.toLowerCase()}`;
    titulo.font = { bold: true, size: 15, color: { argb: 'FFFFFFFF' } };
    titulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: azul } };
    titulo.alignment = { vertical: 'middle', horizontal: 'left' };
    hoja.getRow(1).height = 28;

    const meta = [
      ['Curso', datos.curso],
      ['Actividad', datos.actividad],
      ['Fecha límite', datos.fechaLimite ? new Date(datos.fechaLimite).toLocaleString() : 'Sin límite'],
      ['Estudiantes', String(datos.filas.length)],
      ['Generado', new Date().toLocaleString()],
    ];
    meta.forEach(([k, v], i) => {
      hoja.getCell(`A${i + 2}`).value = k;
      hoja.getCell(`A${i + 2}`).font = { bold: true, color: { argb: 'FF0F5D57' } };
      hoja.mergeCells(`B${i + 2}:G${i + 2}`);
      hoja.getCell(`B${i + 2}`).value = v;
    });

    const cabecera = ['N°', 'Estudiante', 'Correo', 'Estado', 'Nota / 20', 'Fecha', 'Observación'];
    const filaCabecera = hoja.getRow(7);
    filaCabecera.values = cabecera;
    filaCabecera.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    filaCabecera.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: azul } };
    filaCabecera.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    filaCabecera.height = 22;

    datos.filas.forEach((f, idx) => {
      const nota = f.nota === null ? null : Number(f.nota);
      const fila = hoja.addRow([
        idx + 1,
        f.nombre,
        f.email,
        f.estado.replace('_', ' '),
        nota,
        f.fecha ? new Date(f.fecha) : null,
        OBSERVACION[f.estado] ?? '',
      ]);
      fila.getCell(5).numFmt = '0.00';
      fila.getCell(6).numFmt = 'dd/mm/yyyy hh:mm';
      fila.alignment = { vertical: 'middle', wrapText: true };
      if (idx % 2 === 1) {
        fila.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: gris } };
      }
      if (f.estado === 'no_entregado') {
        fila.getCell(4).font = { bold: true, color: { argb: 'FFB42318' } };
      } else if (f.estado === 'entregado' || f.estado === 'calificada') {
        fila.getCell(4).font = { bold: true, color: { argb: 'FF067647' } };
      }
    });

    hoja.columns = [
      { width: 6 }, { width: 34 }, { width: 36 }, { width: 16 },
      { width: 12 }, { width: 20 }, { width: 42 },
    ];
    hoja.autoFilter = { from: 'A7', to: `G${Math.max(7, 7 + datos.filas.length)}` };
  }

  private sanitizar(valor: string): string {
    return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'Notas';
  }

  private sanitizarHoja(valor: string): string {
    return valor.replace(/[\\/?*\[\]:]/g, '_').slice(0, 31) || 'Calificaciones';
  }
}
