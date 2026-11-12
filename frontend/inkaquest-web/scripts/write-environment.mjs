import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const required = ['VITE_API_URL', 'VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
const missing = required.filter((name) => !process.env[name]?.trim());

if (missing.length) {
  console.error(`Faltan variables de entorno para compilar InkaQuest: ${missing.join(', ')}`);
  console.error('Configúralas en Vercel → Settings → Environment Variables y vuelve a desplegar.');
  process.exit(1);
}

const apiUrl = process.env.VITE_API_URL.trim().replace(/\/$/, '');
const supabaseUrl = process.env.VITE_SUPABASE_URL.trim().replace(/\/$/, '');

for (const [name, value] of [['VITE_API_URL', apiUrl], ['VITE_SUPABASE_URL', supabaseUrl]]) {
  let parsed;
  try { parsed = new URL(value); } catch {
    console.error(`${name} no contiene una URL válida.`);
    process.exit(1);
  }
  if (parsed.protocol !== 'https:') {
    console.error(`${name} debe utilizar HTTPS en producción.`);
    process.exit(1);
  }
}

if (!apiUrl.endsWith('/api/v1')) {
  console.error('VITE_API_URL debe terminar exactamente en /api/v1.');
  process.exit(1);
}

const source = `/** Archivo generado automáticamente. No editar manualmente. */\nexport const environment = {\n  production: true,\n  apiUrl: ${JSON.stringify(apiUrl)},\n  supabaseUrl: ${JSON.stringify(supabaseUrl)},\n  supabaseAnonKey: ${JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY.trim())},\n} as const;\n`;
await writeFile(resolve(here, '../src/environments/environment.prod.ts'), source, 'utf8');
console.log('Configuración de producción de InkaQuest generada correctamente.');
