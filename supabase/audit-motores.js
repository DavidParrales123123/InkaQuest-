// Auditoría automatizada motor-por-motor (Catálogo DB vs aplicación).
// Uso: node audit-motores.js <motores-db.json>
const fs = require('fs');
const path = require('path');

const dbFile = process.argv[2];
const raw = fs.readFileSync(dbFile, 'utf8');
// El CLI imprime líneas de progreso y luego un objeto JSON { rows: [...] }.
const start = raw.indexOf('{\n  "boundary"') >= 0 ? raw.indexOf('{\n  "boundary"') : raw.indexOf('{');
const end = raw.lastIndexOf('}');
const parsed = JSON.parse(raw.slice(start, end + 1));
const motores = Array.isArray(parsed) ? parsed : (parsed.rows ?? []);
console.log(`Motores en BD: ${motores.length}`);

// 1) Instrucciones precargadas vs catálogo
const instruccionesPath = path.join(
  __dirname,
  '..', 'frontend', 'inkaquest-web',
  'src', 'app', 'core', 'data', 'engine-instructions.ts',
);
const instruccionesSrc = fs.readFileSync(instruccionesPath, 'utf8');
const claves = [...instruccionesSrc.matchAll(/^\s*'([a-z0-9-]+)':\s*'/gm)].map(m => m[1]);
console.log(`Instrucciones cargadas en engine-instructions.ts: ${claves.length}`);

const faltantesInstrucciones = motores
  .map(m => m.codigo)
  .filter(c => !claves.includes(c));
console.log(`Faltan instrucciones para: ${faltantesInstrucciones.length ? faltantesInstrucciones.join(', ') : 'ninguno'}`);

const instruccionesExtra = claves.filter(c => !motores.some(m => m.codigo === c));
console.log(`Instrucciones sin catálogo (obsoletas): ${instruccionesExtra.length ? instruccionesExtra.join(', ') : 'ninguna'}`);

// 2) Clasificación por familia de contenido (mismas reglas que el modal docente)
const esQuiz = /quiz|seleccion-multiple|verdadero-falso|desafio-pensamiento|enigma-matematico|completar-codigo|practica-/;
const esPares = /simulador-memoria|emparejamiento|memoria|relacionar|crucigrama/;
const buckets = { quiz: [], pares: [], generico: [] };
for (const m of motores) {
  const c = String(m.codigo).toLowerCase();
  if (esQuiz.test(c)) buckets.quiz.push(c);
  else if (esPares.test(c)) buckets.pares.push(c);
  else buckets.generico.push(c);
}
console.log(`\nClasificación de contenido al crear (modal docente):`);
console.log(`  Quiz (preguntas de opción múltiple): ${buckets.quiz.length}`);
for (const c of buckets.quiz) console.log(`    - ${c}`);
console.log(`  Pares (memoria / emparejamiento):    ${buckets.pares.length}`);
for (const c of buckets.pares) console.log(`    - ${c}`);
console.log(`  Genérico (tarjetas de estudio/items): ${buckets.generico.length}`);
for (const c of buckets.generico) console.log(`    - ${c}`);

// 3) Simuladores/mecánicas especiales sin motor propio registrado (informativo)
const SIMULADORES = [
  'arbol-binario', 'grafos-interactivos', 'busqueda-binaria-visual', 'visualizador-algoritmos',
  'ordenamiento-visual', 'visualizador-complejidad', 'pathfinding-visual', 'backtracking-visual',
  'programacion-dinamica', 'divide-conquista', 'algoritmos-greedy', 'simulador-pila-cola',
  'simulador-recursion', 'simulador-busqueda', 'torre-hanoi', 'laberinto-logico',
  'git-simulator', 'terminal-simulator', 'docker-practice', 'kubernetes-sim', 'ci-cd-pipeline',
  'cloud-deployment', 'deployment-sim', 'api-tester', 'database-query', 'regex-practice',
  'sudoku-codigo', 'puzzle-logico', 'pizarra-digital', 'editor-diagramas-flujo', 'editor-visual',
];
console.log(`\nMotores de tipo simulador/mecánica especial (runtime genérico, no mecánica dedicada):`);
const simEnDb = SIMULADORES.filter(s => motores.some(m => m.codigo === s));
for (const c of simEnDb) console.log(`    - ${c}`);
console.log(`Total: ${simEnDb.length}`);

// 4) Resumen
console.log(`\n=== RESUMEN ===`);
console.log(`Catálogo: ${motores.length} motores · Instrucciones: ${claves.length - faltantesInstrucciones.length}/${motores.length} cubiertas`);
console.log(`Familia Quiz: ${buckets.quiz.length} · Familia Pares: ${buckets.pares.length} · Genérico: ${buckets.generico.length}`);
