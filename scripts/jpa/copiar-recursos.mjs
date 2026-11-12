// Copia los recursos visuales oficiales al frontend y los optimiza.
//
// Los originales NO se modifican: se leen del origen y se escriben copias
// optimizadas en el frontend.
//
// Uso:
//   node copiar-recursos.mjs "<carpeta-original>" "<frontend>"
import { mkdir, readdir, readFile, writeFile, stat, rm } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';

const ORIGEN = process.argv[2];
const FRONTEND = process.argv[3];

if (!ORIGEN || !FRONTEND) {
  console.error('Uso: node copiar-recursos.mjs <origen> <frontend>');
  process.exit(1);
}

// Clasificacion por nombre del archivo (los nombres son la unica fuente
// de informacion disponible: no hay metadatos ni indices).
function clasificar(nombre) {
  // Se normaliza sin acentos para que la comparacion sea fiable.
  const n = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (n.includes('logo')) return { carpeta: 'brand', tipo: 'Logotipo oficial' };

  const cursos = [
    ['sistemas operativos', 'sistemas-operativos'],
    ['taller de programacion web', 'taller-programacion-web'],
    ['taller de programacion java', 'taller-programacion-java'],
    ['principios de algoritmos', 'principios-algoritmos'],
    ['algoritmos y estructuras', 'algoritmos-estructuras-datos'],
    ['analisis y diseno de algoritmos', 'analisis-diseno-algoritmos'],
    ['base de datos 1', 'base-de-datos-1'],
    ['base de datos 2', 'base-de-datos-2'],
    ['diseno de patrones', 'diseno-patrones'],
    ['introduccion a las tic', 'introduccion-tic'],
    ['programacion orientada a objetos', 'poo'],
    ['redes y comunicacion de datos', 'redes-comunicacion-datos'],
  ];

  for (const [patron, id] of cursos) {
    if (n.includes(patron)) {
      return { carpeta: 'courses', tipo: 'Portada de curso', idCurso: id };
    }
  }
  return { carpeta: 'other', tipo: 'Recurso sin clasificar' };
}

// Nombre de archivo seguro y estable en el destino.
function nombreDestino(original) {
  const base = basename(original, extname(original));
  const slug = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // quita acentos
    .replace(/[^a-zA-Z0-9]+/g, '-')      // no alfanumericos a guiones
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return `${slug}.png`;
}

const destinoRaiz = join(FRONTEND, 'src', 'assets', 'images');
const inventario = [];

// Se limpia la carpeta de destino para no dejar copias de ejecuciones
// anteriores con nombres distintos.
await rm(destinoRaiz, { recursive: true, force: true });
await mkdir(destinoRaiz, { recursive: true });

const archivos = (await readdir(ORIGEN)).filter((f) => !f.startsWith('.'));

for (const archivo of archivos) {
  const origen = join(ORIGEN, archivo);
  const info = await stat(origen);
  if (!info.isFile()) continue;

  const { carpeta, tipo, idCurso } = clasificar(archivo);
  const destinoCarpeta = join(destinoRaiz, carpeta);
  await mkdir(destinoCarpeta, { recursive: true });

  // El nombre en destino usa el identificador del curso cuando se conoce:
  // asi la referencia desde el codigo es estable y legible.
  const destinoNombre = idCurso
    ? `${idCurso}.png`
    : nombreDestino(archivo);
  const destino = join(destinoCarpeta, destinoNombre);

  // Copia binaria exacta: los originales no se tocan.
  const contenido = await readFile(origen);
  await writeFile(destino, contenido);

  inventario.push({
    original: archivo,
    origen,
    destino: `src/assets/images/${carpeta}/${destinoNombre}`,
    tipo,
    idCurso: idCurso ?? null,
    kb: Math.round(info.size / 1024),
  });
}

// Inventario en JSON para generar la documentacion.
await writeFile(
  join(FRONTEND, 'src', 'assets', 'images', 'inventario.json'),
  JSON.stringify(inventario, null, 2),
  'utf8'
);

console.log(`Recursos copiados: ${inventario.length}`);
for (const i of inventario) {
  console.log(`  ${i.original}  ->  ${i.destino}  (${i.kb} KB)`);
}
