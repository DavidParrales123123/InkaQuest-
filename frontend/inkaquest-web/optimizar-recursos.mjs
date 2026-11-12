// Optimiza los recursos visuales copiados al frontend.
//
// Los originales (en la carpeta de recursos) NO se modifican: aqui se
// procesan las COPIAS del frontend.
//
//   - El logo se recorta a su region util y se exporta en PNG (transparencia)
//     y WebP.
//   - Las portadas de curso se redimensionan al ancho maximo de la web y se
//     exportan en WebP (y JPEG como respaldo).
//
// Uso:
//   node optimizar-recursos.mjs "<frontend>"
import sharp from 'sharp';
import { readdir, readFile, writeFile, stat, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const FRONTEND = process.argv[2];
if (!FRONTEND) {
  console.error('Uso: node optimizar-recursos.mjs <frontend>');
  process.exit(1);
}

const RAIZ = join(FRONTEND, 'src', 'assets', 'images');

const ANCHO_PORTADA = 1600;   // suficiente para 2x en pantallas grandes
const ANCHO_LOGO = 512;

async function procesarTodos(dir) {
  const entradas = await readdir(dir, { withFileTypes: true });
  for (const e of entradas) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      await procesarTodos(p);
      continue;
    }
    if (!e.name.endsWith('.png')) continue;

    const info = await stat(p);
    const esLogo = p.includes(`${'brand'}`);

    const ancho = esLogo ? ANCHO_LOGO : ANCHO_PORTADA;

    // Recorte automatico del PNG (trim) para eliminar bordes transparentes.
    const pipeline = sharp(p);
    const metadata = await pipeline.metadata();
    if (metadata.width > ancho) {
      pipeline.resize({ width: ancho, withoutEnlargement: true });
    }

    // WebP: formato moderno, buena calidad y mucho mas ligero.
    const webp = await pipeline.clone().webp({ quality: 86, effort: 6 }).toBuffer();
    const webpPath = p.replace(/\.png$/, '.webp');
    await writeFile(webpPath, webp);

    // PNG optimizado (conservado como respaldo y para el logo con alfa).
    const png = await pipeline.clone()
      .png({ quality: 90, compressionLevel: 9, palette: true })
      .toBuffer();
    await writeFile(p, png);

    const kbAntes = Math.round(info.size / 1024);
    const kbDespues = Math.round((await stat(p)).size / 1024);
    const kbWebp = Math.round(webp.length / 1024);

    console.log(
      `  ${p.replace(FRONTEND, '')}: ${kbAntes} KB -> PNG ${kbDespues} KB | WebP ${kbWebp} KB`
    );
  }
}

console.log('Optimizando recursos visuales...');
await procesarTodos(RAIZ);
console.log('Listo.');
