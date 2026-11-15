/**
 * Catálogo de guardianes jugables para Guardianes del Conocimiento.
 *
 * Cada personaje tiene un ARMA y una PASIVA, y modificar la forma de
 * combatir:
 *   - `ataque: 'rango'` → los disparos son balas que vuelan hacia el cursor.
 *   - `ataque: 'haz'`   → corte en arco hacia el cursor, daño en área.
 */
export type GuardianeRareza = 'comun' | 'heroe' | 'leyenda';

export interface GuardianConfig {
  readonly id: string;
  readonly nombre: string;
  readonly titulo: string;
  readonly descripcion: string;
  readonly ataque: 'rango' | 'haz';
  readonly sprite: string;
  readonly danoBase: number;
  readonly vidaExtra: number;
  readonly velocidadExtra: number;
  readonly intervaloAtaque: number;
  readonly pasivaNombre: string;
  readonly pasivaDescripcion: string;
  readonly rareza: GuardianeRareza;
}

export const GUARDIANES: readonly GuardianConfig[] = [
  {
    id: 'rambo',
    nombre: 'Rambo',
    titulo: 'Cóndor de la Selva',
    descripcion: 'Soldado veterano con rifle de asalto. Alcance, velocidad y cadencia ideales para cualquier situación.',
    ataque: 'rango',
    sprite: 'assets/guardianes/rambo.png',
    danoBase: 2,
    vidaExtra: 0,
    velocidadExtra: 0,
    intervaloAtaque: 260,
    pasivaNombre: 'Balas veloces',
    pasivaDescripcion: 'Sus balas vuelan un 35% más rápido.',
    rareza: 'comun',
  },
  {
    id: 'pistola',
    nombre: 'Chispa',
    titulo: 'Pistola Infernal',
    descripcion: 'Miniatura explosiva que empuña un arma enorme. Marcaje grande, plomo más contundente.',
    ataque: 'rango',
    sprite: 'assets/guardianes/gunner.png',
    danoBase: 3,
    vidaExtra: 0,
    velocidadExtra: 0,
    intervaloAtaque: 320,
    pasivaNombre: 'Plomo de Otro Mundo',
    pasivaDescripcion: 'Sus balas son un 50% más grandes.',
    rareza: 'comun',
  },
  {
    id: 'sasuke',
    nombre: 'Sasuke',
    titulo: 'Sombra Lunar',
    descripcion: 'Ninja de la hoja. Golpe seco, defensa compacta y velocidad inigualable.',
    ataque: 'haz',
    sprite: 'assets/guardianes/sasuke.png',
    danoBase: 2,
    vidaExtra: 0,
    velocidadExtra: 45,
    intervaloAtaque: 210,
    pasivaNombre: 'Furia Sombra',
    pasivaDescripcion: '+45 de velocidad de movimiento.',
    rareza: 'heroe',
  },
  {
    id: 'hacha',
    nombre: 'Natalia',
    titulo: 'Hacha Esmeralda',
    descripcion: 'Matona del hacha. Daño en área brutal y ganancia dramática cada cuatro tajos.',
    ataque: 'haz',
    sprite: 'assets/guardianes/axegirl.png',
    danoBase: 4,
    vidaExtra: 25,
    velocidadExtra: 0,
    intervaloAtaque: 340,
    pasivaNombre: 'Golpe sísmico',
    pasivaDescripcion: 'Cada 4º ataque: estallido que daña a todos los cercanos.',
    rareza: 'heroe',
  },
  {
    id: 'scythe',
    nombre: 'La Herencia',
    titulo: 'Heredera de la Guadaña',
    descripcion: 'El último de la sangre Guadaña. Cada alma cosechada alimenta su vida.',
    ataque: 'haz',
    sprite: 'assets/guardianes/scythe.png',
    danoBase: 3,
    vidaExtra: 40,
    velocidadExtra: 0,
    intervaloAtaque: 280,
    pasivaNombre: 'Cosechadora',
    pasivaDescripcion: 'Cada enemigo que derrotas te cura 4 vida.',
    rareza: 'leyenda',
  },
];

export const GUARDIAN_POR_DEFECTO = 'rambo';

/** Mejor mensaje legible para mostrar en UI. */
export function nombreArma(g: GuardianConfig): string {
  return g.ataque === 'rango' ? 'Rango · Rifle/Gatillo' : 'Haz · Corte cuerpo a cuerpo';
}
