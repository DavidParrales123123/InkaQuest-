import Phaser from 'phaser';

import { GUARDIANES, GUARDIAN_POR_DEFECTO } from './guardians-catalog';
import type { GuardianConfig } from './guardians-catalog';

/** Estructura de datos de una mejora accesible. */
export interface MejoraInfo {
  readonly id: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly rareza: 'comun' | 'academic' | 'legendario';
  readonly maxRango: number;
  readonly aplica: (scene: CombateScene) => void;
}

/** Mejoras comunes a ambos tipos de arma. Siempre presentes. */
const MEJORAS_COMUN: MejoraInfo[] = [
  { id: 'vida', nombre: 'Escudo Lógico', rareza: 'comun', maxRango: 4,
    descripcion: '+25 vida máxima y cura 25 (apilable)',
    aplica: (s) => { s.saludMax += 25; s.salud = Math.min(s.saludMax, s.salud + 25); } },
  { id: 'velocidad', nombre: 'Botas GPX', rareza: 'comun', maxRango: 4,
    descripcion: '+20% velocidad de movimiento (apilable)',
    aplica: (s) => { s.vel = Math.floor(s.vel * 1.2); } },
  { id: 'escudo', nombre: 'Escudo Predictivo', rareza: 'academic', maxRango: 3,
    descripcion: '+22% resistencia al daño (apilable, máx 85%)',
    aplica: (s) => { s.resistencia = Math.min(0.85, s.resistencia + 0.22); } },
  { id: 'regen', nombre: 'Código Médico', rareza: 'legendario', maxRango: 3,
    descripcion: 'Regenera +1 vida cada 2s por rango (1→2→3)',
    aplica: (s) => { s.regeneraRango += 1; } },
];

/** Mejoras con etiqueta de rango (balas). */
const MEJORAS_RANGO: MejoraInfo[] = [
  { id: 'dano', nombre: 'Espada Algorítmica', rareza: 'comun', maxRango: 5,
    descripcion: '+1 daño por bala (apilable)',
    aplica: (s) => { s.danoActual += 1; } },
  { id: 'cadencia', nombre: 'Cañón Aritmético', rareza: 'comun', maxRango: 4,
    descripcion: 'Disparo 20% más rápido (apilable)',
    aplica: (s) => { s.fireInterval = Math.max(90, Math.floor(s.fireInterval * 0.8)); } },
  { id: 'radio', nombre: 'Área Extendida', rareza: 'academic', maxRango: 3,
    descripcion: '+35% radio de impacto de las balas (apilable)',
    aplica: (s) => { s.bulletSize = Math.ceil(s.bulletSize * 1.35); } },
  { id: 'critico', nombre: 'Rayo Crítico', rareza: 'academic', maxRango: 3,
    descripcion: 'Cada 3er disparo es crítico (×3 → ×4 → ×5)',
    aplica: (s) => { s.criticoRango += 1; } },
];

/** Mejoras con etiqueta de haz (tajo cuerpo a cuerpo). */
const MEJORAS_HAZ: MejoraInfo[] = [
  { id: 'dano', nombre: 'Filo Colosal', rareza: 'comun', maxRango: 5,
    descripcion: '+1 daño por tajo (apilable)',
    aplica: (s) => { s.danoActual += 1; } },
  { id: 'cadencia', nombre: 'Reflejo del Guerrero', rareza: 'comun', maxRango: 4,
    descripcion: 'Tajo 20% más rápido (apilable)',
    aplica: (s) => { s.fireInterval = Math.max(90, Math.floor(s.fireInterval * 0.8)); } },
  { id: 'radio', nombre: 'Arco Exótico', rareza: 'academic', maxRango: 3,
    descripcion: '+35 px de alcance y +12° de arco en el tajo (apilable)',
    aplica: (s) => { s.meleeAlcance += 35; s.meleeArcRad += 0.2; } },
  { id: 'critico', nombre: 'Rayo Solar', rareza: 'academic', maxRango: 3,
    descripcion: 'Cada 3er tajo es crítico (×3 → ×4 → ×5)',
    aplica: (s) => { s.criticoRango += 1; } },
];

/** Pool completo (para el rank tracking y la aplica global en la escena). */
export const MEJORAS: MejoraInfo[] = [...MEJORAS_COMUN, ...MEJORAS_RANGO, ...MEJORAS_HAZ];

/** Devuelve el pool de mejoras según el tipo de arma del guardián. */
export function mejoresPara(modo: 'rango' | 'haz'): MejoraInfo[] {
  return [...MEJORAS_COMUN, ...(modo === 'rango' ? MEJORAS_RANGO : MEJORAS_HAZ)];
}

/** Extensión de reserva cuando el pool alcance su rango máximo. */
export const MEJORAS_EXTRA: MejoraInfo[] = [
  { id: 'vitalidad', nombre: 'Vitamina Vital', rareza: 'comun', maxRango: 99,
    descripcion: '+40 vida al instante',
    aplica: (s) => { s.salud = Math.min(s.saludMax, s.salud + 40); } },
];

/** Paletas de entorno por franja de hordas — el escenario respira el peligro. */
interface PaletaArena {
  readonly nombre: string;
  readonly piso: number;
  readonly grietas: number;
  readonly filo: number;
  readonly estrellas: number;
  readonly acento: number;
}
const PALETAS: PaletaArena[] = [
  { nombre: 'Cripta Eterna', piso: 0x141a35, grietas: 0x1f2750, filo: 0x2aa296, estrellas: 0x6c86ff, acento: 0xf2a541 },   // hordas 1-3
  { nombre: 'Fragua Ígnea',  piso: 0x2b1410, grietas: 0x3f1f16, filo: 0xdd5a1f, estrellas: 0xffb066, acento: 0xff7a1a },   // hordas 4-6
  { nombre: 'Ojo de Tormenta', piso: 0x0d2230, grietas: 0x163243, filo: 0x2bd2d8, estrellas: 0x8ff0ff, acento: 0x5ce1e6 }, // hordas 7-8
  { nombre: 'El Juicio',     piso: 0x120710, grietas: 0x240c1f, filo: 0xb3002d, estrellas: 0xff8080, acento: 0xffd700 },   // horda 9 / jefes
];
const paletaPara = (horda: number): PaletaArena =>
  horda <= 3 ? PALETAS[0] : horda <= 6 ? PALETAS[1] : horda <= 8 ? PALETAS[2] : PALETAS[3];

/** Estructura ligera de partícula. */
interface Particula {
  x: number; y: number; vx: number; vy: number;
  radio: number; color: number; vidaMs: number; maxVidaMs: number;
}

/** Escena Phaser en vivo: arena top-down de supervivencia por hordas. */
export class CombateScene extends Phaser.Scene {
  /** Dimensiones del arena del juego. */
  static readonly ARENA_W = 1280;
  static readonly ARENA_H = 720;

  player?: Phaser.Physics.Arcade.Image;
  salud = 100;
  saludMax = 100;
  xp = 0;
  kills = 0;
  danoActual = 1;
  fireInterval = 260;
  bulletSize = 6;
  resistencia = 0;
  vel = 240;
  criticoRango = 0;
  regeneraRango = 0;
  private criticoCounter = 0;
  private ranks: Record<string, number> = {};
  private emitHud?: () => void;
  private emitDestroy?: (victoria: boolean, matados: number, tiempo: number) => void;
  private emitUpgradePick?: () => void;

  hordaActual = 1;
  evaluacionMode = false;
  private readonly totalHordas = 9;
  private startedAt = 0;
  private phaseMs = 0;
  private pickingUpgrade = false;
  private gameEnded = false;
  private regenTick = 0;
  private spawnTimer = 0;
  private fireTimer = 0;
  private spawnBossCounter = 0;

  private enemies: Phaser.Physics.Arcade.Sprite[] = [];
  private bullets: Phaser.Physics.Arcade.Sprite[] = [];
  private enemyBullets: Phaser.Physics.Arcade.Sprite[] = [];
  private particulas: Particula[] = [];
  private particulasGfx?: Phaser.GameObjects.Graphics;
  private bossHpGfx?: Phaser.GameObjects.Graphics;
  private bossLabel?: Phaser.GameObjects.Text;
  private avisoHorda?: Phaser.GameObjects.Text;
  private pisoGfx?: Phaser.GameObjects.Graphics;
  /** true cuando el arena usa el mapa de niveles 1–5 como fondo. */
  private usarMapaBioma = false;
  private aimX: number = 640;
  private aimY = 160;
  private playerShadow?: Phaser.GameObjects.Image;
  private mirarIzquierda = false;

  // ─── Personaje/guardián elegido ───
  guardian?: GuardianConfig;
  attackMode: 'rango' | 'haz' = 'rango';
  private bulletSpeedMult = 1;
  private bulletSizeBoost = 1;
  private healOnKill = 0;
  private contadorAtaque = 0;
  private attackPulse = 0;
  private ramboAnimActiva = false;
  private attackLungeUntil = 0;
  meleeAlcance = 140;
  meleeArcRad = 1.05;

  constructor() {
    super({ key: 'Combate' });
  }

  init(data: { onUpdate?: () => void; onEnd?: (victoria: boolean, matados: number, tiempo: number) => void; onUpgrade?: () => void } = {}): void {
    this.emitHud = data.onUpdate;
    this.emitDestroy = data.onEnd;
    this.emitUpgradePick = data.onUpgrade;
  }

  preload(): void {
    // Sprites de los guardianes (pre-cargados para creación instantánea)
    for (const g of GUARDIANES) {
      this.load.image('guard_' + g.id, g.sprite);
    }
    // Fondos de arena por bioma (niveles 1–5 templo · 6–9 desierto)
    this.load.image('arena_mapa_1_5', 'assets/guardianes/mapa-nivel-1-5-v2.jpg');
    this.load.image('arena_mapa_6_9', 'assets/guardianes/mapa-nivel-6-9-v1.jpg');
    this.load.image('arena_mapa_10_15', 'assets/guardianes/mapa-nivel-10-15-v1.jpg');
    this.load.image('arena_mapa_16_18', 'assets/guardianes/mapa-nivel-16-18-v1.jpg');
    // Enemigos (imagen oficial) — el canvas queda como fallback si la carga falla
    // enemy_red=Asesino · enemy_orange=Esqueleto · enemy_vampiro=Vampiro · enemy_barbaro=Bárbaro
    // enemy_zombi=Zombi (élite hordas jefe) · enemy_alien=Pistolero · boss=jefe_1
    for (const id of ['enemy_red', 'enemy_orange', 'enemy_vampiro', 'enemy_barbaro', 'enemy_zombi', 'enemy_alien', 'boss']) {
      this.load.image(id, `assets/guardianes/enemigos/${id}.png`);
    }
    // Frames del ciclo de marcha / ataque de Guardianes
    for (let i = 0; i <= 5; i++) {
      this.load.image('rambo_walk_' + i, `assets/guardianes/walk/rambo_walk_${i}.png`);
      this.load.image('maga_walk_' + i, `assets/guardianes/walk/maga_walk_${i}.png`);
    }
    for (let i = 0; i <= 2; i++) {
      this.load.image('sasuke_walk_' + i, `assets/guardianes/walk/sasuke_walk_${i}.png`);
      this.load.image('sasuke_atk_' + i, `assets/guardianes/walk/sasuke_atk_${i}.png`);
      this.load.image('scythe_walk_' + i, `assets/guardianes/walk/scythe_walk_${i}.png`);
    }
    // Maga castillo: 2-frame IDLE posing (sin saltar)
    this.load.image('maga_atk_0', 'assets/guardianes/walk/maga_atk_0.png');
    this.load.image('maga_atk_1', 'assets/guardianes/walk/maga_atk_1.png');
    // Maga idle sutil: respiración + vaivén de la vara/gema (manita)
    for (let i = 0; i <= 2; i++) {
      this.load.image('maga_idle_' + i, `assets/guardianes/walk/maga_idle_${i}.png`);
    }
    this.load.image('scythe_atk_0', 'assets/guardianes/walk/scythe_atk_0.png');
    this.load.image('scythe_atk_1', 'assets/guardianes/walk/scythe_atk_1.png');
    // Si algo falla, lo mostramos en consola para depurar
    this.load.once('loaderror', (file: { key?: string }) => {
      // eslint-disable-next-line no-console
      console.error('[guardianes] asset falló en carga:', file?.key);
    }, this);
  }

  create(): void {
    this.createTextures();

    // ─── Arena — mapa InkaQuest (niveles 1–5) o paleta procedural ───
    const mapaSel = this.game.registry.get('mapaArena') as string | undefined;
    const mapaKey = mapaSel === '1-5' ? 'arena_mapa_1_5' : mapaSel === '6-9' ? 'arena_mapa_6_9' : mapaSel === '10-15' ? 'arena_mapa_10_15' : mapaSel === '16-18' ? 'arena_mapa_16_18' : undefined;
    this.usarMapaBioma = mapaKey !== undefined && this.textures.exists(mapaKey);
    if (this.usarMapaBioma) {
      this.add
        .image(CombateScene.ARENA_W / 2, CombateScene.ARENA_H / 2, mapaKey!)
        .setDisplaySize(CombateScene.ARENA_W, CombateScene.ARENA_H)
        .setDepth(-20);
      // Velo navy suave: mantiene el contraste de enemigos y telas
      this.add.rectangle(CombateScene.ARENA_W / 2, CombateScene.ARENA_H / 2, CombateScene.ARENA_W, CombateScene.ARENA_H, 0x0f1a33, 0.14).setDepth(-19);
    }
    this.pisoGfx = this.add.graphics();
    this.dibujarPiso();

    // ─── Capas de ambiente ───
    this.particulasGfx = this.add.graphics();
    this.bossHpGfx = this.add.graphics().setDepth(40);
    this.bossLabel = this.add.text(CombateScene.ARENA_W / 2, 34, 'REY CARMESÍ', {
      fontSize: '10px',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#ffd700',
      letterSpacing: 4,
    }).setOrigin(0.5).setDepth(45).setVisible(false);

    // ─── Jugador: guardián elegido (sprite del catálogo, normalizado a 72×72) ───
    const chosen = this.guardianElegido();
    this.player = this.physics.add.sprite(CombateScene.ARENA_W / 2, CombateScene.ARENA_H / 2, 'guard_' + chosen.id);
    this.player.setCircle(19);
    this.player.setScale(1.15);
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0);
    this.physics.world.setBounds(0, 0, CombateScene.ARENA_W, CombateScene.ARENA_H);
    this.aplicarGuardian(chosen);
    // Sombra suave bajo el personaje para que no "flote" sobre el arena
    this.playerShadow = this.add.image(this.player.x, this.player.y + 10, 'player_shadow').setScale(1.3, 0.6).setAlpha(0.55).setDepth(4);

    // Animaciones de marcha y ataque extraídas de los sprite sheets
    const anims = this.anims as unknown as { create: (cfg: unknown) => void; exists: (k: string) => boolean };
    if (this.textures.exists('rambo_walk_0') && !anims.exists('rambo_walk')) {
      anims.create({
        key: 'rambo_walk',
        frames: [0, 1, 2, 3, 4, 5].map((i) => ({ key: 'rambo_walk_' + i })),
        frameRate: 9,
        repeat: -1,
      });
    }
    if (this.textures.exists('sasuke_walk_0') && !anims.exists('sasuke_walk')) {
      anims.create({
        key: 'sasuke_walk',
        frames: [0, 1, 2].map((i) => ({ key: 'sasuke_walk_' + i })),
        frameRate: 8,
        repeat: -1,
      });
    }
    if (this.textures.exists('sasuke_atk_0') && !anims.exists('sasuke_atk')) {
      anims.create({
        key: 'sasuke_atk',
        frames: [0, 1, 2].map((i) => ({ key: 'sasuke_atk_' + i })),
        frameRate: 12,
        repeat: 0,
      });
    }
    if (this.textures.exists('maga_walk_0') && !anims.exists('maga_walk')) {
      anims.create({
        key: 'maga_walk',
        // Ciclo plantado: 0 → 1 → 4 → 5 → 4 → 1 (sin frames de suspensión,
        // todos con el mismo alto y baseline → marcha, no salto)
        frames: [0, 1, 4, 5, 4, 1].map((i) => ({ key: 'maga_walk_' + i })),
        frameRate: 8,
        repeat: -1,
      });
    }
    if (this.textures.exists('maga_atk_0') && !anims.exists('maga_atk')) {
      anims.create({
        key: 'maga_atk',
        frames: [0, 1].map((i) => ({ key: 'maga_atk_' + i })),
        frameRate: 11,
        repeat: 0,
      });
    }
    if (this.textures.exists('maga_idle_0') && !anims.exists('maga_idle')) {
      anims.create({
        key: 'maga_idle',
        // 0 → 1 → 2 (gema cargada) → 1: respiración y balanceo de la vara.
        frames: [0, 1, 2, 1].map((i) => ({ key: 'maga_idle_' + i })),
        frameRate: 3.5,
        repeat: -1,
      });
    }
    if (this.textures.exists('scythe_walk_0') && !anims.exists('scythe_walk')) {
      anims.create({
        key: 'scythe_walk',
        frames: [0, 1, 2].map((i) => ({ key: 'scythe_walk_' + i })),
        frameRate: 8,
        repeat: -1,
      });
    }
    if (this.textures.exists('scythe_atk_0') && !anims.exists('scythe_atk')) {
      anims.create({
        key: 'scythe_atk',
        frames: [0, 1].map((i) => ({ key: 'scythe_atk_' + i })),
        frameRate: 10,
        repeat: 0,
      });
    }

    this.startedAt = this.time.now;
    this.startHorda(1);
  }

  private guardianElegido(): GuardianConfig {
    let id = GUARDIAN_POR_DEFECTO;
    try {
      const stored = (typeof localStorage !== 'undefined' ? localStorage.getItem('guardianes-personaje') : null);
      if (stored) id = stored;
    } catch { /* ignore */ }
    return GUARDIANES.find((g) => g.id === id) ?? GUARDIANES[0];
  }

  private aplicarGuardian(g: GuardianConfig): void {
    this.guardian = g;
    this.attackMode = g.ataque;
    this.danoActual = g.danoBase;
    this.saludMax = 100 + g.vidaExtra;
    this.salud = this.saludMax;
    this.vel = 240 + g.velocidadExtra;
    this.fireInterval = g.intervaloAtaque;
    this.bulletSpeedMult = g.id === 'rambo' ? 1.35 : g.id === 'maga' ? 1.1 : 1;
    if (g.id === 'maga') this.bulletSize = Math.ceil(this.bulletSize * 1.5); // Cometa Azul
    this.healOnKill = g.id === 'scythe' ? 4 : 0;
    this.emitHud?.();
  }

  /** Redibuja el piso según la franja de hordas vigente (transición de bioma). */
  private dibujarPiso(): void {
    const g = this.pisoGfx!;
    g.clear();
    // Con mapa de bioma solo encuadramos el arena (el arte manda)
    if (this.usarMapaBioma) {
      g.lineStyle(6, 0xf2a541, 0.35);
      g.strokeRect(3, 3, CombateScene.ARENA_W - 6, CombateScene.ARENA_H - 6);
      g.lineStyle(2, 0xf2a541, 0.55);
      g.strokeRect(10, 10, CombateScene.ARENA_W - 20, CombateScene.ARENA_H - 20);
      return;
    }
    const p = paletaPara(this.hordaActual);
    // Base
    g.fillStyle(p.piso, 1);
    g.fillRect(0, 0, CombateScene.ARENA_W, CombateScene.ARENA_H);
    // Estrellas/elementos lejanos
    for (let i = 0; i < 200; i++) {
      const alpha = 0.25 + Math.random() * 0.5;
      g.fillStyle(p.estrellas, alpha);
      const size = Math.random() < 0.88 ? 2 : 3;
      g.fillRect(Math.random() * CombateScene.ARENA_W, Math.random() * CombateScene.ARENA_H, size, size);
    }
    // Grietas/cuarcitas procedurales
    g.lineStyle(2, p.grietas, 1);
    for (let i = 0; i < 14; i++) {
      const x = Math.random() * CombateScene.ARENA_W;
      const y = Math.random() * CombateScene.ARENA_H;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + 30 + Math.random() * 70, y + (Math.random() - 0.5) * 40);
      g.lineTo(x + 50 + Math.random() * 60, y + (Math.random() - 0.5) * 80);
      g.strokePath();
    }
    // Orillas brillantes (biomas con energía)
    g.lineStyle(6, p.filo, 0.8);
    g.strokeRect(3, 3, CombateScene.ARENA_W - 6, CombateScene.ARENA_H - 6);
    g.lineStyle(2, p.acento, 0.9);
    g.strokeRect(10, 10, CombateScene.ARENA_W - 20, CombateScene.ARENA_H - 20);
  }

  private createTextures(): void {
    const make = (key: string, size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void) => {
      if (this.textures.exists(key)) return;
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const ctx = c.getContext('2d')!;
      draw(ctx, size);
      this.textures.addCanvas(key, c);
    };
    const radial = (ctx: CanvasRenderingContext2D, x: number, y: number, r0: number, r1: number, c0: string, c1: string): void => {
      const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
      g.addColorStop(0, c0);
      g.addColorStop(1, c1);
      ctx.fillStyle = g;
    };

    // ─── Jugador: guerrero de patata, estilo Brotato ───
    make('player_potato', 44, (ctx, s) => {
      const c = s / 2;
      // cuerpo patata (marrón cálido) con sombra
      radial(ctx, c - 2, c - 3, 4, c, '#f6c453', '#c67d10');
      ctx.beginPath();
      ctx.ellipse(c, c + 2, c - 4, c - 1, 0, 0, Math.PI * 2);
      ctx.fill();
      // sombra inferior
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath();
      ctx.ellipse(c, c + 7, c - 6, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      // borde oscuro
      ctx.strokeStyle = '#3d2600';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(c, c + 2, c - 4, c - 1, 0, 0, Math.PI * 2);
      ctx.stroke();
      // visor (banda cian brillante)
      radial(ctx, c, c - 2, 2, 10, '#8ff0ff', '#0f7d8a');
      ctx.beginPath();
      ctx.roundRect(c - 11, c - 6, 22, 8, 4);
      ctx.fill();
      ctx.strokeStyle = '#01333b';
      ctx.lineWidth = 2;
      ctx.roundRect(c - 11, c - 6, 22, 8, 4);
      ctx.stroke();
      // brillo del visor
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(c - 8, c - 5, 6, 2);
      // antenas
      ctx.strokeStyle = '#3d2600';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(c - 5, c - 9); ctx.lineTo(c - 8, c - 14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(c + 5, c - 9); ctx.lineTo(c + 8, c - 14); ctx.stroke();
      ctx.fillStyle = '#ffd700';
      ctx.beginPath(); ctx.arc(c - 8, c - 14, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(c + 8, c - 14, 2, 0, Math.PI * 2); ctx.fill();
      // ojos brillantes detrás del visor
      ctx.fillStyle = '#fffb00';
      ctx.beginPath(); ctx.arc(c - 5, c - 2, 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(c + 5, c - 2, 1.6, 0, Math.PI * 2); ctx.fill();
    });

    // ─── Espinita (rojo): bicho con 6 púas — enjambre de hordas 1-3 ───
    make('enemy_red', 36, (ctx, s) => {
      const c = s / 2;
      // púas
      ctx.fillStyle = '#7c0a1e';
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const px = c + Math.cos(a) * (c - 3);
        const py = c + Math.sin(a) * (c - 3);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(c + Math.cos(a - 0.35) * (c - 12), c + Math.sin(a - 0.35) * (c - 12));
        ctx.lineTo(c + Math.cos(a + 0.35) * (c - 12), c + Math.sin(a + 0.35) * (c - 12));
        ctx.closePath();
        ctx.fill();
      }
      // cuerpo
      radial(ctx, c, c - 1, 3, c - 4, '#ff4d4d', '#b3002d');
      ctx.beginPath();
      ctx.arc(c, c, c - 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3a0513';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(c, c, c - 4, 0, Math.PI * 2); ctx.stroke();
      // ojos
      ctx.fillStyle = '#fffb00';
      ctx.beginPath(); ctx.arc(c - 6, c - 2, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(c + 6, c - 2, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath(); ctx.arc(c - 6, c - 2, 1.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(c + 6, c - 2, 1.2, 0, Math.PI * 2); ctx.fill();
    });

    // ─── Bug Infector (naranja): bicho con cuernos — hordas 4-6 ───
    make('enemy_orange', 40, (ctx, s) => {
      const c = s / 2;
      // cuernos
      ctx.fillStyle = '#5a1c00';
      ctx.beginPath(); ctx.moveTo(c - 8, c - 12); ctx.lineTo(c - 13, c - 18); ctx.lineTo(c - 4, c - 12); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(c + 8, c - 12); ctx.lineTo(c + 13, c - 18); ctx.lineTo(c + 4, c - 12); ctx.closePath(); ctx.fill();
      // cuerpo alargado
      radial(ctx, c, c, 3, c - 3, '#ff8c42', '#c2410c');
      ctx.beginPath();
      ctx.ellipse(c, c, c - 5, c - 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3b0f00';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(c, c, c - 5, c - 2, 0, 0, Math.PI * 2); ctx.stroke();
      // mandíbulas
      ctx.strokeStyle = '#3b0f00';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(c - 7, c + 9); ctx.lineTo(c - 4, c + 5); ctx.moveTo(c - 7, c + 9); ctx.lineTo(c - 10, c + 5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(c + 7, c + 9); ctx.lineTo(c + 4, c + 5); ctx.moveTo(c + 7, c + 9); ctx.lineTo(c + 10, c + 5); ctx.stroke();
      // ojos verdes (infectado)
      ctx.fillStyle = '#8af56b';
      ctx.beginPath(); ctx.arc(c - 6, c - 3, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(c + 6, c - 3, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#061f00';
      ctx.beginPath(); ctx.arc(c - 6, c - 3, 1.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(c + 6, c - 3, 1.2, 0, Math.PI * 2); ctx.fill();
    });



    // ─── Jefe: Rey de la Cripta — araña-corona ───
    make('boss', 72, (ctx, s) => {
      const c = s / 2;
      // corona (5 puntas)
      ctx.fillStyle = '#ffd700';
      ctx.strokeStyle = '#3d2c00';
      ctx.lineWidth = 2.5;
      const coronoY = c - 17;
      ctx.beginPath();
      ctx.moveTo(c - 17, coronoY); ctx.lineTo(c - 17, coronoY - 7); ctx.lineTo(c - 11, coronoY); ctx.lineTo(c - 6, coronoY - 9); ctx.lineTo(c, coronoY - 14); ctx.lineTo(c + 6, coronoY - 9); ctx.lineTo(c + 11, coronoY); ctx.lineTo(c + 17, coronoY - 7); ctx.lineTo(c + 17, coronoY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // cuerpo-saco púrpura/rojo
      radial(ctx, c, c + 3, 6, c - 3, '#c1133a', '#740a1e');
      ctx.beginPath();
      ctx.ellipse(c, c + 4, c - 6, c - 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2b020e';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(c, c + 4, c - 6, c - 2, 0, 0, Math.PI * 2); ctx.stroke();
      // ojos carmesí grandes
      radial(ctx, c - 9, c, 1, 6, '#ff6b6b', '#b3002d');
      ctx.beginPath(); ctx.arc(c - 9, c + 1, 5, 0, Math.PI * 2); ctx.fill();
      radial(ctx, c + 9, c, 1, 6, '#ff6b6b', '#b3002d');
      ctx.beginPath(); ctx.arc(c + 9, c + 1, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#200209';
      ctx.beginPath(); ctx.arc(c - 9, c + 1, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(c + 9, c + 1, 2.2, 0, Math.PI * 2); ctx.fill();
      // patas
      ctx.strokeStyle = '#2b020e';
      ctx.lineWidth = 3;
      for (const sign of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(c + sign * 14, c + 3); ctx.lineTo(c + sign * 26, c + 10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(c + sign * 14, c + 8); ctx.lineTo(c + sign * 27, c + 20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(c + sign * 10, c - 4); ctx.lineTo(c + sign * 22, c - 10); ctx.stroke();
      }
      // colmillos
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(c - 5, c + 13); ctx.lineTo(c - 2, c + 20); ctx.lineTo(c + 1, c + 13); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(c + 5, c + 13); ctx.lineTo(c + 2, c + 20); ctx.lineTo(c - 1, c + 13); ctx.closePath(); ctx.fill();
    });

    // ─── Proyectiles: energía pura ───
    make('player_shadow', 80, (ctx, s) => {
      const c = s / 2;
      const g = ctx.createRadialGradient(c, c, 2, c, c, c - 2);
      g.addColorStop(0, 'rgba(0,0,0,0.55)');
      g.addColorStop(0.7, 'rgba(0,0,0,0.18)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
    });
    make('bullet_white', 14, (ctx, s) => {
      const c = s / 2;
      radial(ctx, c, c, 1, c, '#ffffff', 'rgba(255,255,255,0)');
      ctx.beginPath(); ctx.arc(c, c, c, 0, Math.PI * 2); ctx.fill();
      radial(ctx, c, c, 1, 4, '#ffffff', '#8ff0ff');
      ctx.beginPath(); ctx.arc(c, c, 4, 0, Math.PI * 2); ctx.fill();
    });
    make('bullet_critical', 18, (ctx, s) => {
      const c = s / 2;
      radial(ctx, c, c, 1, c, '#fffb00', 'rgba(255,251,0,0)');
      ctx.beginPath(); ctx.arc(c, c, c, 0, Math.PI * 2); ctx.fill();
      radial(ctx, c, c, 1, 5, '#fffb00', '#ff8c00');
      ctx.beginPath(); ctx.arc(c, c, 5, 0, Math.PI * 2); ctx.fill();
    });
    // Bala del alienígena: plasma como las de Rambo pero más pequeño (violeta)
    make('alien_bolt', 12, (ctx, s) => {
      const c = s / 2;
      radial(ctx, c, c, 1, c, '#ffffff', 'rgba(255,255,255,0)');
      ctx.beginPath(); ctx.arc(c, c, c, 0, Math.PI * 2); ctx.fill();
      radial(ctx, c, c, 1, 3.2, '#ffffff', '#a78bfa');
      ctx.beginPath(); ctx.arc(c, c, 3.2, 0, Math.PI * 2); ctx.fill();
    });

    // ─── Arco de tajo (sable / hacha / guadaña) ───
    make('slash_arc', 150, (ctx, s) => {
      const c = s / 2;
      ctx.translate(c, c);
      const g = ctx.createRadialGradient(0, 0, 12, 0, 0, c - 3);
      g.addColorStop(0, 'rgba(255,236,120,0)');
      g.addColorStop(0.55, '#ffe473');
      g.addColorStop(0.92, '#ff9e1a');
      g.addColorStop(1, 'rgba(255,158,26,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, c - 3, -1.1, 1.1);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, c - 14, -0.95, 0.95);
      ctx.stroke();
    });

    // ─── Impacto/flash ───
    make('impact_flash', 32, (ctx, s) => {
      const c = s / 2;
      radial(ctx, c, c, 1, c, '#ffffff', 'rgba(255,255,255,0)');
      ctx.beginPath(); ctx.arc(c, c, c, 0, Math.PI * 2); ctx.fill();
    });
  }

  private startHorda(h: number): void {
    this.hordaActual = h;
    this.phaseMs = 0;
    this.spawnTimer = 0;
    this.enemies.forEach((e) => e.destroy());
    this.enemies = [];
    this.bullets.forEach((b) => b.destroy());
    this.bullets = [];
    this.dibujarPiso();
    this.mostrarAviso(h);
    this.emitHud?.();
  }

  /** Banner gigante de peligro (cambio de bioma o jefe). */
  private mostrarAviso(horda: number): void {
    this.avisoHorda?.destroy();
    const p = paletaPara(horda);
    const esJefe = horda === 9 || (this.evaluacionMode && (horda === 3 || horda === 6));
    const texto = esJefe ? '⚠ JEFE ⚠' : `HORDA ${horda}`;
    const sub = esJefe ? paletaPara(horda).nombre : paletaPara(horda).nombre;
    this.avisoHorda = this.add.text(CombateScene.ARENA_W / 2, 150, texto, {
      fontSize: esJefe ? '64px' : '44px',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontStyle: 'bold',
      color: '#ffd700',
      stroke: '#1a0a00',
      strokeThickness: 8,
      align: 'center',
    }).setOrigin(0.5).setDepth(50).setAlpha(0);
    const subT = this.add.text(CombateScene.ARENA_W / 2, 210, sub.toUpperCase(), {
      fontSize: '15px',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#ffffff',
      letterSpacing: 6,
      align: 'center',
    }).setOrigin(0.5).setDepth(50).setAlpha(0);
    this.tweens.add({ targets: this.avisoHorda, alpha: 1, duration: 180 });
    this.tweens.add({ targets: subT, alpha: 0.9, duration: 180, delay: 120 });
    this.time.delayedCall(1700, () => {
      this.tweens.add({ targets: [this.avisoHorda, subT], alpha: 0, duration: 380, onComplete: () => { this.avisoHorda?.destroy(); subT.destroy(); } });
    });
  }

  update(_time: number, deltaMs: number): void {
    if (!this.player || this.pickingUpgrade || this.gameEnded) {
      // Overlays (mejora / chequeo académico): congelar al jugador y a los
      // enemigos en su sitio — nada debe desplazarse hasta las paredes.
      if (this.player?.active && this.player.body) {
        this.player.setVelocity(0, 0);
        const ps = this.player as unknown as Phaser.Physics.Arcade.Sprite;
        if (this.guardian?.id === 'maga' && ps.anims) {
          // Quieta, pero "viva": respiración sutil en lugar de pose congelada
          ps.anims.play('maga_idle', true);
        } else {
          ps.anims?.stop();
        }
        this.player.setRotation(0);
      }
      for (const e of this.enemies) {
        if (e?.active && e.body) e.setVelocity(0, 0);
      }
      return;
    }

    const ptr = this.input.activePointer;
    if (ptr) {
      this.aimX = ptr.worldX ?? ptr.x;
      this.aimY = ptr.worldY ?? ptr.y;
    }

    // Movimiento (WASD + flechas) — el mouse NO mueve al guardián
    const kb = this.input.keyboard!;
    const isDown = (code: number): boolean => kb.addKey(code).isDown;
    const KEY_A = 65, KEY_W = 87, KEY_D = 68, KEY_S = 83;
    const LEFT = 37, UP = 38, RIGHT = 39, DOWN = 40;
    let vx = 0, vy = 0;
    if (isDown(KEY_A) || isDown(LEFT)) vx = -this.vel;
    else if (isDown(KEY_D) || isDown(RIGHT)) vx = this.vel;
    if (isDown(KEY_W) || isDown(UP)) vy = -this.vel;
    else if (isDown(KEY_S) || isDown(DOWN)) vy = this.vel;
    this.player.setVelocity(vx, vy);

    // ─── Mirada lateral: en movimiento manda WASD; en reposo manda el cursor ───
    const moviendoIzq = vx < 0;
    const moviendoDer = vx > 0;
    const mirarIzquierda = moviendoIzq ? true : moviendoDer ? false : this.aimX < this.player.x;
    if (mirarIzquierda !== this.mirarIzquierda) {
      this.mirarIzquierda = mirarIzquierda;
      (this.player as unknown as Phaser.GameObjects.Image).setFlipX(mirarIzquierda);
    }
    if (this.playerShadow) {
      this.playerShadow.setPosition(this.player.x, this.player.y + 10);
    }

    // Animación de movimiento:
    //  - Rambo y Maga (rango): ciclo de walk de 6 frames.
    //  - Sasuke y La Herencia (haz): ciclo de walk de 3 frames.
    // WTR: el walk SIEMPRE manda cuando te mueves — congelar la pose de
    // ataque hacía que el personaje se deslizara sin animar los pies.
    // El golpe sigue viéndose por el arco/destello del arma.
    const moving = vx !== 0 || vy !== 0;
    const ahora = this.time.now;
    const playerSprite = this.player as unknown as Phaser.Physics.Arcade.Sprite;
    const esRambo = this.guardian?.id === 'rambo';
    const esMaga = this.guardian?.id === 'maga';
    const esSasuke = this.guardian?.id === 'sasuke';
    const esScythe = this.guardian?.id === 'scythe';
    if (moving && playerSprite.anims) {
      const walkKey = esSasuke ? 'sasuke_walk' : esMaga ? 'maga_walk' : esScythe ? 'scythe_walk' : esRambo ? 'rambo_walk' : null;
      if (walkKey) playerSprite.anims.play(walkKey, true);
    } else if (playerSprite.anims) {
      if (esMaga) {
        // Idle sutil: respiración + vaivén de la vara (manita)
        playerSprite.anims.play('maga_idle', true);
      } else if ((esSasuke && ahora >= this.attackLungeUntil) || esScythe || esRambo) {
        playerSprite.anims.stop();
      }
      this.player.setRotation(0);
    }
    if (this.attackPulse > 0) this.attackPulse = Math.max(0, this.attackPulse - deltaMs / 170);

    // Regeneración pasiva
    if (this.regeneraRango > 0) {
      this.regenTick += deltaMs;
      if (this.regenTick > 2000) {
        this.regenTick = 0;
        this.salud = Math.min(this.saludMax, this.salud + this.regeneraRango);
        this.emitHud?.();
      }
    }

    // Spawn por horda
    this.phaseMs += deltaMs;
    this.spawnTimer += deltaMs;
    const hordaWindowMs = 33 * 1000;
    const spawnInterval = Math.max(280, 700 - this.hordaActual * 50);
    if (this.phaseMs < hordaWindowMs) {
      if (this.enemies.length < 4 + this.hordaActual * 2 && this.spawnTimer > spawnInterval) {
        this.spawnTimer = 0;
        this.spawnEnemy();
      }
    } else if (!this.enemies.length) {
      this.marcarHordaCompletada();
    }

    // ─── Enemigos: IA + caminata (wobble) + ataque con arma ───
    for (const e of this.enemies) {
      if (!e?.active) continue;
      const spr = e as unknown as Phaser.Physics.Arcade.Sprite & {
        esGunner?: boolean;
        spawnSeed?: number;
        atkCdUntil?: number;
        atkAnimUntil?: number;
        fireCdUntil?: number;
        dano?: number;
        atkRange?: number;
      };
      const dist = Phaser.Math.Distance.Between(spr.x, spr.y, this.player.x, this.player.y);
      const seed = spr.spawnSeed ?? 0;

      if (spr.esGunner) {
        // Pistolero: dispara plasma desde cualquier distancia (cadencia ~1.5-2.1s)
        if (dist < 225) {
          const anguloFuera = Math.atan2(spr.y - this.player.y, spr.x - this.player.x);
          this.physics.moveTo(spr, spr.x + Math.cos(anguloFuera) * 200, spr.y + Math.sin(anguloFuera) * 200, 110);
        } else if (dist > 425) {
          this.physics.moveTo(spr, this.player.x, this.player.y, 80);
        } else {
          this.physics.moveTo(spr, spr.x + Math.cos(seed) * 60, spr.y + Math.sin(seed) * 60, 30);
        }
        if (ahora >= (spr.fireCdUntil ?? 0)) {
          spr.fireCdUntil = ahora + 1500 + Math.random() * 650;
          this.spawnAlienBullet(spr);
        }
      } else {
        // Cuerpo a cuerpo: persigue y ataca cuando está en rango de arma
        this.physics.moveTo(spr, this.player.x, this.player.y, 90 + this.hordaActual * 10);
        const rango = spr.atkRange ?? 48;
        if (dist < rango && ahora >= (spr.atkCdUntil ?? 0)) {
          const key = spr.texture.key;
          const cd = key === 'boss' ? 1050 : key === 'enemy_barbaro' || key === 'enemy_zombi' ? 850 : 700;
          spr.atkCdUntil = ahora + cd;
          spr.atkAnimUntil = ahora + 340;
          this.playEnemyAttackAnim(spr);
          this.hitPlayer(spr.dano ?? 6);
        }
      }

      // Caminata: balanceo sutil del cuerpo (excepto durante el swing)
      if ((spr.atkAnimUntil ?? 0) <= ahora) {
        const amp = spr.esGunner ? 2 : 4;
        const velocidad = spr.esGunner ? 260 : 205;
        spr.setAngle(Math.sin(((ahora + seed * 137) % 100000) / velocidad * Math.PI * 2) * amp);
      }
    }

    // Disparo/tajo automático + pulso de ataque
    this.fireTimer += deltaMs;
    if (this.fireTimer > this.fireInterval) {
      if (this.attackMode === 'rango') {
        if (this.enemies.length) { this.fireTimer = 0; this.attackPulse = 1; this.spawnBullet(); this.muzzleFlash(); this.playGuardianAtk(); }
      } else {
        this.fireTimer = 0;
        this.attackPulse = 1;
        this.spawnSlash();
        this.playGuardianAtk();
      }
    }

    // Limpieza de balas
    this.bullets = this.bullets.filter((b) => b.active && b.x >= -30 && b.x <= CombateScene.ARENA_W + 30 && b.y >= -30 && b.y <= CombateScene.ARENA_H + 30);

    // Colisiones balas ↔ enemigos (hitbox generoso por enemigo)
    for (const b of this.bullets) {
      if (!b.active) continue;
      for (const e of this.enemies) {
        if (!e.active) continue;
        const hitRadius = (e as unknown as { hitRadius?: number }).hitRadius ?? 24;
        if (Phaser.Math.Distance.BetweenPoints(b, e) < this.bulletSize + hitRadius) {
          const danoMult = (b as unknown as { danoMult?: number }).danoMult ?? 1;
          const dano = this.danoActual * danoMult;
          this.hitEnemy(e, dano);
          const impacto = this.add.image(b.x, b.y, 'impact_flash').setDepth(30).setBlendMode(Phaser.BlendModes.ADD).setScale(0.8);
          this.tweens.add({ targets: impacto, scale: 1.6, alpha: 0, duration: 160, onComplete: () => impacto.destroy() });
          b.destroy();
          break;
        }
      }
    }

    // ─── Balas del alienígena: avanzan, expiran e impactan ───
    this.enemyBullets = this.enemyBullets.filter((b) => b.active && b.x >= -25 && b.x <= CombateScene.ARENA_W + 25 && b.y >= -25 && b.y <= CombateScene.ARENA_H + 25);
    for (const b of this.enemyBullets) {
      if (!b.active) continue;
      if (Phaser.Math.Distance.BetweenPoints(b, this.player) < 22) {
        b.destroy();
        this.hitPlayer(8);
      }
    }

    // Actualizar partículas
    this.tickParticulas(deltaMs);
    this.drawBossHpBar();

    // Estado terminal
    if (this.salud <= 0) {
      this.finalizar(false);
      return;
    }
    this.emitHud?.();
  }



  /** Muzzle flash: destello breve en el arma. */
  private muzzleFlash(): void {
    if (!this.player) return;
    // cálculo aproximado de la punta del arma en la dirección del cursor
    const ang = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.aimX, this.aimY);
    const px = this.player.x + Math.cos(ang) * 22;
    const py = this.player.y + Math.sin(ang) * 22;
    const flash = this.add.image(px, py, 'impact_flash').setDepth(28).setBlendMode(Phaser.BlendModes.ADD).setScale(0.55).setAlpha(0.9);
    this.tweens.add({ targets: flash, scale: 1.1, alpha: 0, duration: 110, onComplete: () => flash.destroy() });
  }

  private spawnBullet(): void {
    if (!this.player) return;
    this.criticoCounter++;
    const critico = this.criticoRango > 0 && this.criticoCounter % 3 === 0;
    const bullet = this.physics.add.sprite(this.player.x, this.player.y, critico ? 'bullet_critical' : 'bullet_white');
    (bullet as unknown as { danoMult: number }).danoMult = critico ? 2 + this.criticoRango : 1;

    let dx = this.aimX - this.player.x;
    let dy = this.aimY - this.player.y;
    let len = Math.hypot(dx, dy);
    if (len < 8) {
      const nearest = this.nearestEnemy();
      if (nearest) { dx = nearest.x - this.player.x; dy = nearest.y - this.player.y; len = Math.hypot(dx, dy) || 1; }
      else return;
    }
    const dirX = dx / len;
    const dirY = dy / len;
    const speed = 560 * this.bulletSpeedMult;
    bullet.setVelocity(dirX * speed, dirY * speed);
    bullet.setDepth(25);
    bullet.body!.setCircle(this.bulletSize);
    this.bullets.push(bullet);
  }

  private spawnSlash(): void {
    const p = this.player!;
    const baseAng = Math.atan2(this.aimY - p.y, this.aimX - p.x);
    this.contadorAtaque++;
    this.criticoCounter++;
    const critico = this.criticoRango > 0 && this.criticoCounter % 3 === 0;
    const danoMult = critico ? 2 + this.criticoRango : 1;
    const dano = this.danoActual * danoMult;

    // Arco visual del tajo
    const impacto = this.add.image(p.x, p.y, 'slash_arc').setDepth(30).setRotation(baseAng).setAlpha(0.9);
    this.tweens.add({ targets: impacto, scale: 1.25, alpha: 0, duration: 190, onComplete: () => impacto.destroy() });

    // Aplicar daño a enemigos dentro del arco
    for (const e of this.enemies) {
      if (!e.active) continue;
      const distancia = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y);
      if (distancia > this.meleeAlcance) continue;
      const ang = Math.atan2(e.y - p.y, e.x - p.x);
      let diff = ang - baseAng;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) > this.meleeArcRad) continue;
      this.hitEnemy(e, dano);
    }

  }

  /** Inicializa un enemigo con física, HP, daño de contacto y semilla de caminata. */
  private initEnemy(
    e: Phaser.Physics.Arcade.Sprite,
    hp: number,
    radio: number,
    escala: number,
    dano: number,
    opciones: { tint?: number; gunner?: boolean; atkRange?: number } = {},
  ): void {
    const o = opciones as unknown as Record<string, unknown>;
    (e as unknown as { hp: number }).hp = hp;
    (e as unknown as { hpMax: number }).hpMax = hp;
    (e as unknown as { dano: number }).dano = dano;
    o['esGunner'] = Boolean(opciones.gunner);
    o['spawnSeed'] = Math.random() * 1000;
    o['atkCdUntil'] = 0;
    o['atkAnimUntil'] = 0;
    o['fireCdUntil'] = this.time.now + 900 + Math.random() * 1100;
    o['atkRange'] = opciones.atkRange ?? 48;
    // Cuerpo levemente más grande que el sprite visible: el golpe se siente justo
    e.setCircle(radio + 3);
    o['hitRadius'] = radio + 8;
    e.setScale(escala);
    if (opciones.tint) e.setTint(opciones.tint);
    e.setDepth(20);
    e.setCollideWorldBounds(true, 0, 0, false);
    this.enemies.push(e);
  }

  private spawnEnemy(): void {
    const side = Math.floor(Math.random() * 4);
    const x = side === 0 ? 0 : side === 1 ? CombateScene.ARENA_W : Math.random() * CombateScene.ARENA_W;
    const y = side === 2 ? 0 : side === 3 ? CombateScene.ARENA_H : Math.random() * CombateScene.ARENA_H;
    const esHordaJefe = this.hordaActual === 9 || (this.evaluacionMode && (this.hordaActual === 3 || this.hordaActual === 6));
    this.spawnBossCounter++;
    // ─── Jefe: jefe_1 (Rey de la Cripta) ───
    if (esHordaJefe && this.spawnBossCounter % 4 === 1) {
      const hpJefe = this.hordaActual >= 9 ? 14 : this.hordaActual >= 6 ? 9 : 6;
      const boss = this.physics.add.sprite(x, y, 'boss');
      this.initEnemy(boss, hpJefe, 40, 1.55, 18, { atkRange: 64 });
      return;
    }
    // ─── Élites dorados que acompañan al jefe ───
    if (esHordaJefe) {
      const pool = ['enemy_zombi', 'enemy_barbaro', 'enemy_vampiro'] as const;
      const e = this.physics.add.sprite(x, y, pool[Math.floor(Math.random() * pool.length)]);
      this.initEnemy(e, 5, 18, 1.4, 12, { tint: 0xffd24d, atkRange: 50 });
      return;
    }
    // ─── Pistolero alienígena (desde horda 4, máx. 2 activos) ───
    const gunnersVivos = this.enemies.filter((e) => e.active && (e as unknown as { esGunner?: boolean }).esGunner).length;
    if (this.hordaActual >= 4 && gunnersVivos < 2 && Math.random() < 0.24) {
      const e = this.physics.add.sprite(x, y, 'enemy_alien');
      this.initEnemy(e, this.hordaActual >= 7 ? 3 : 2, 17, 1.35, 5, { gunner: true });
      return;
    }
    // ─── Tiers por horda ───
    const tier = this.hordaActual <= 3 ? 0 : this.hordaActual <= 6 ? 1 : 2;
    const pool = tier === 0 ? ['enemy_red'] : tier === 1 ? ['enemy_orange', 'enemy_vampiro'] : ['enemy_barbaro', 'enemy_zombi', 'enemy_vampiro'];
    const key = pool[Math.floor(Math.random() * pool.length)];
    const hp = tier === 0 ? 1 : tier === 1 ? 2 : 3;
    const alcance = tier === 0 ? 44 : tier === 1 ? 46 : 50;
    const e = this.physics.add.sprite(x, y, key);
    this.initEnemy(e, hp, 18, 1.35, tier === 0 ? 6 : tier === 1 ? 8 : 12, { atkRange: alcance });
  }

  /** Daño al jugador con resistencia aplicada. */
  private hitPlayer(dmg: number): void {
    const daño = Math.max(1, Math.round(dmg * (1 - this.resistencia)));
    this.salud = Math.max(0, this.salud - daño);
    this.cameras.main.shake(130, 0.004);
  }

  /** El alienígena dispara plasma hacia el jugador (con destello de boca). */
  private spawnAlienBullet(spr: Phaser.Physics.Arcade.Sprite): void {
    if (!this.player) return;
    const ang = Math.atan2(this.player.y - spr.y, this.player.x - spr.x);
    const b = this.physics.add.sprite(spr.x, spr.y, 'alien_bolt');
    b.setDepth(26);
    b.body!.setCircle(6);
    b.setVelocity(Math.cos(ang) * 320, Math.sin(ang) * 320);
    this.enemyBullets.push(b);
    const f = this.add.image(spr.x + Math.cos(ang) * 18, spr.y + Math.sin(ang) * 18, 'impact_flash')
      .setDepth(28).setBlendMode(Phaser.BlendModes.ADD).setScale(0.42).setTint(0xc07aff).setAlpha(0.95);
    this.tweens.add({ targets: f, scale: 0.85, alpha: 0, duration: 110, onComplete: () => f.destroy() });
  }

  /** Swing del arma del enemigo: giro rápido hacia el jugador + arco visual de tajo. */
  private playEnemyAttackAnim(spr: Phaser.Physics.Arcade.Sprite): void {
    if (!this.player) return;
    const ang = Math.atan2(this.player.y - spr.y, this.player.x - spr.x);
    // Giro de "barrido" del arma
    this.tweens.add({
      targets: spr,
      angle: { from: -22, to: 14 },
      duration: 150,
      yoyo: true,
      onComplete: () => { spr.angle = 0; },
    });
    // Arco de impacto en la dirección del tajo
    const slash = this.add.image(spr.x, spr.y, 'slash_arc').setDepth(28).setRotation(ang).setAlpha(0.78);
    this.tweens.add({ targets: slash, scale: 0.9, alpha: 0, duration: 160, onComplete: () => slash.destroy() });
  }

  private nearestEnemy(): Phaser.Physics.Arcade.Sprite | null {
    if (!this.player) return null;
    let best: Phaser.Physics.Arcade.Sprite | null = null;
    let mejor = Infinity;
    for (const e of this.enemies) {
      if (!e.active) continue;
      const d = Phaser.Math.Distance.BetweenPoints(this.player, e);
      if (d < mejor) { mejor = d; best = e; }
    }
    return best;
  }

  private hitEnemy(e: Phaser.Physics.Arcade.Sprite, dano: number): void {
    const target = e as unknown as { hp: number };
    target.hp = (target.hp ?? 1) - dano;
    // Flash de impacto (Phaser 4: setTint → setTintFill)
    e.setTint(0xffffff);
    e.setTintFill();
    this.time.delayedCall(60, () => { if (e.active) e.clearTint(); });
    // Partículas
    this.spawnParticulas(e.x, e.y, target.hp <= 0 ? 0xffd700 : 0xffffff, target.hp <= 0 ? 12 : 5);
    // Número flotante de daño
    this.floatingText(`-${dano}`, e.x, e.y - 10, target.hp <= 0 ? '#ffd700' : '#ffffff', target.hp <= 0 ? 15 : 12);
    if (target.hp <= 0) {
      e.destroy();
      this.enemies = this.enemies.filter((x) => x !== e);
      this.xp += 5;
      this.kills += 1;
      // Pasiva de la Herencia de la Guadaña: cada kill cura
      if (this.healOnKill > 0) this.salud = Math.min(this.saludMax, this.salud + this.healOnKill);
      this.cameras.main.shake(90, 0.0025);
      this.emitHud?.();
    }
  }

  /** Sistema de partículas ligero — estallidos al matar. */
  private spawnParticulas(x: number, y: number, color: number, cantidad: number): void {
    for (let i = 0; i < cantidad; i++) {
      const ang = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 180;
      this.particulas.push({
        x, y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        radio: 2 + Math.random() * 2.5,
        color,
        vidaMs: 380 + Math.random() * 220,
        maxVidaMs: 380 + Math.random() * 220,
      });
    }
  }

  private tickParticulas(deltaMs: number): void {
    if (!this.particulasGfx) return;
    this.particulasGfx.clear();
    this.particulas = this.particulas.filter((p) => {
      p.vidaMs -= deltaMs;
      p.x += (p.vx * deltaMs) / 1000;
      p.y += (p.vy * deltaMs) / 1000;
      p.vx *= 0.92;
      p.vy *= 0.92;
      const vidaRatio = Math.max(0, p.vidaMs / p.maxVidaMs);
      this.particulasGfx!.fillStyle(p.color, vidaRatio);
      this.particulasGfx!.fillCircle(p.x, p.y, p.radio * vidaRatio + 0.5);
      return p.vidaMs > 0;
    });
  }

  private floatingText(texto: string, x: number, y: number, color: string, size: number): void {
    const t = this.add.text(x, y, texto, {
      fontSize: `${size}px`,
      fontFamily: 'Inter, system-ui, sans-serif',
      fontStyle: 'bold',
      color,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(45).setAlpha(0.95);
    this.tweens.add({ targets: t, y: y - 42, alpha: 0, duration: 720, ease: 'Sine.easeOut', onComplete: () => t.destroy() });
  }

  /** Dibuja la barra del jefe superior cuando hay uno en escena. */
  private drawBossHpBar(): void {
    const g = this.bossHpGfx;
    if (!g) return;
    g.clear();
    const boss = this.enemies.find((e) => e.active && e.texture.key === 'boss');
    if (!boss) { this.bossLabel?.setVisible(false); return; }
    const target = boss as unknown as { hp: number; hpMax: number };
    const max = target.hpMax ?? target.hp;
    if (max <= 0) { this.bossLabel?.setVisible(false); return; }
    const ratio = Math.max(0, Math.min(1, target.hp / max));
    const w = 600;
    const x = CombateScene.ARENA_W / 2 - w / 2;
    const y = 14;
    g.fillStyle(0x120710, 0.85);
    g.fillRect(x - 6, y - 6, w + 12, 22);
    g.lineStyle(2, 0xffd700, 0.9);
    g.strokeRect(x - 6, y - 6, w + 12, 22);
    g.fillStyle(0x2a0510, 1);
    g.fillRect(x, y, w, 10);
    g.fillStyle(ratio > 0.5 ? 0xd1345b : 0xff0055, 1);
    g.fillRect(x, y, Math.max(1, w * ratio), 10);
    this.bossLabel?.setVisible(true);
  }

  /** Reproduce la animación de ataque del guardián actual y dispara lunge físico. */
  private playGuardianAtk(): void {
    const id = this.guardian?.id;
    if (!id || !this.player) return;
    const playerSprite = this.player as unknown as Phaser.Physics.Arcade.Sprite;
    if (!playerSprite.anims) return;
    const key = id === 'sasuke' ? 'sasuke_atk'
              : id === 'scythe' ? 'scythe_atk'
              : id === 'maga'  ? 'maga_atk'
              : null;
    if (!key) return;
    playerSprite.anims.play(key, true);
    this.attackLungeUntil = this.time.now + 260;
  }

  getRango(id: string): number {
    return this.ranks[id] ?? 0;
  }

  applyUpgrade(id: string): void {
    const mejora = [...MEJORAS, ...MEJORAS_EXTRA].find((m) => m.id === id);
    if (!mejora) return;
    this.ranks[id] = this.getRango(id) + 1;
    mejora.aplica(this);
  }

  comenzarSiguienteHorda(): void {
    if (this.hordaActual >= this.totalHordas) {
      this.finalizar(true);
      return;
    }
    this.startHorda(this.hordaActual + 1);
    // Defensivo: al retomar, los cuerpos arrancan en reposo
    if (this.player?.active && this.player.body) this.player.setVelocity(0, 0);
    for (const e of this.enemies) if (e?.active && e.body) e.setVelocity(0, 0);
    this.pickingUpgrade = false;
  }

  private marcarHordaCompletada(): void {
    this.pickingUpgrade = true;
    this.emitUpgradePick?.();
  }

  private finalizar(victoria: boolean): void {
    if (this.gameEnded) return;
    this.gameEnded = true;
    this.physics.pause();
    const t = Math.floor((this.time.now - this.startedAt) / 1000);
    // Celebra con estallido dorado de partículas en el jugador
    if (victoria && this.player) {
      this.spawnParticulas(this.player.x, this.player.y, 0xffd700, 30);
      this.spawnParticulas(this.player.x, this.player.y, 0xffffff, 12);
    }
    this.emitDestroy?.(victoria, this.kills, t);
  }
}
