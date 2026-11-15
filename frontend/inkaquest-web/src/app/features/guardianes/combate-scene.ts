import Phaser from 'phaser';

/** Estructura de datos de una mejora accesible. */
export interface MejoraInfo {
  readonly id: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly rareza: 'comun' | 'academic' | 'legendario';
  readonly maxRango: number;
  readonly aplica: (scene: CombateScene) => void;
}

/**
 * Mejoras posibles entre hordas. Cada una es apilable por rangos: al elegirla
 * sube su nivel y el efecto se acumula (Espada Algorítmica I → II → III…).
 * Ofrecidas 3 al azar por horda ⇒ 9 hordas × 3 = 27 tarjetas por nivel.
 */
export const MEJORAS: MejoraInfo[] = [
  { id: 'dano', nombre: 'Espada Algorítmica', rareza: 'comun', maxRango: 5,
    descripcion: '+1 daño por bala (apilable)',
    aplica: (s) => { s.danoActual += 1; } },
  { id: 'vida', nombre: 'Escudo Lógico', rareza: 'comun', maxRango: 4,
    descripcion: '+25 vida máxima y cura 25 (apilable)',
    aplica: (s) => { s.saludMax += 25; s.salud = Math.min(s.saludMax, s.salud + 25); } },
  { id: 'velocidad', nombre: 'Botas GPX', rareza: 'comun', maxRango: 4,
    descripcion: '+20% velocidad de movimiento (apilable)',
    aplica: (s) => { s.vel = Math.floor(s.vel * 1.2); } },
  { id: 'cadencia', nombre: 'Cañón Aritmético', rareza: 'comun', maxRango: 4,
    descripcion: 'Disparo 20% más rápido (apilable)',
    aplica: (s) => { s.fireInterval = Math.max(90, Math.floor(s.fireInterval * 0.8)); } },
  { id: 'radio', nombre: 'Área Extendida', rareza: 'academic', maxRango: 3,
    descripcion: '+35% radio de impacto de las balas (apilable)',
    aplica: (s) => { s.bulletSize = Math.ceil(s.bulletSize * 1.35); } },
  { id: 'escudo', nombre: 'Escudo Predictivo', rareza: 'academic', maxRango: 3,
    descripcion: '+22% resistencia al daño (apilable, máx 85%)',
    aplica: (s) => { s.resistencia = Math.min(0.85, s.resistencia + 0.22); } },
  { id: 'critico', nombre: 'Rayo Crítico', rareza: 'academic', maxRango: 3,
    descripcion: 'Cada 3er disparo es crítico (×3 → ×4 → ×5)',
    aplica: (s) => { s.criticoRango += 1; } },
  { id: 'regen', nombre: 'Código Médico', rareza: 'legendario', maxRango: 3,
    descripcion: 'Regenera +1 vida cada 2s por rango (1→2→3)',
    aplica: (s) => { s.regeneraRango += 1; } },
];

/** Extensión de reserva cuando el pool alcance su rango máximo (nunca faltan tarjetas). */
export const MEJORAS_EXTRA: MejoraInfo[] = [
  { id: 'vitalidad', nombre: 'Vitamina Vital', rareza: 'comun', maxRango: 99,
    descripcion: '+40 vida al instante',
    aplica: (s) => { s.salud = Math.min(s.saludMax, s.salud + 40); } },
];

/** Escena Phaser en vivo: arena top-down de supervivencia por hordas. */
export class CombateScene extends Phaser.Scene {
  // Estado público leído por el componente Angular para el HUD
  player?: Phaser.Physics.Arcade.Image;
  salud = 100;
  saludMax = 100;
  xp = 0;
  kills = 0;
  danoActual = 1;
  fireInterval = 260;
  bulletSize = 4;
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
  /** true en niveles de evaluación (6, 12, 18: prácticas calificadas y examen final):
   *  hordas 3, 6 y 9 lanzan jefes en lugar de enemigos comunes. */
  evaluacionMode = false;
  private readonly totalHordas = 9;
  private startedAt = 0;
  private phaseMs = 0;
  private pickingUpgrade = false;
  private gameEnded = false;
  private regenTick = 0;
  private spawnTimer = 0;
  private fireTimer = 0;
  private damageAccum = 0;

  private enemies: Phaser.Physics.Arcade.Sprite[] = [];
  private bullets: Phaser.Physics.Arcade.Sprite[] = [];
  private aimX = 440;
  private aimY = 160;

  constructor() {
    super({ key: 'Combate' });
  }

  init(data: { onUpdate?: () => void; onEnd?: (victoria: boolean, matados: number, tiempo: number) => void; onUpgrade?: () => void } = {}): void {
    this.emitHud = data.onUpdate;
    this.emitDestroy = data.onEnd;
    this.emitUpgradePick = data.onUpgrade;
  }

  create(): void {
    this.add.rectangle(440, 260, 880, 520, 0x0f1a33).setStrokeStyle(2, 0xf2a541, 0.3);
    for (let i = 0; i < 300; i++) this.add.rectangle(Math.random() * 880, Math.random() * 520, 2, 2, 0xbfd3ff);
    this.createTextures();

    this.player = this.physics.add.sprite(440, 260, 'player_gold');
    this.player.setCircle(14);
    this.player.setCollideWorldBounds(true);
    this.physics.world.setBounds(0, 0, 880, 520);
    this.startedAt = this.time.now;
    this.startHorda(1);
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
    make('player_gold', 32, (ctx, s) => {
      ctx.fillStyle = '#f2a541'; ctx.beginPath(); ctx.arc(s / 2, s / 2, s / 2 - 1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1b2a4a'; ctx.beginPath(); ctx.arc(s / 2, s / 2, s / 2 - 8, 0, Math.PI * 2); ctx.fill();
    });
    make('enemy_red', 28, (ctx, s) => { ctx.fillStyle = '#b3002d'; ctx.fillRect(0, 0, s, s); ctx.fillStyle = '#450b16'; ctx.fillRect(s * 0.28, s * 0.3, 4, 4); ctx.fillRect(s * 0.62, s * 0.3, 4, 4); });
    make('enemy_orange', 28, (ctx, s) => { ctx.fillStyle = '#ff4500'; ctx.fillRect(0, 0, s, s); ctx.fillStyle = '#7c2700'; ctx.fillRect(s * 0.28, s * 0.3, 4, 4); ctx.fillRect(s * 0.62, s * 0.3, 4, 4); });
    make('enemy_gold', 32, (ctx, s) => { ctx.fillStyle = '#ffd700'; ctx.fillRect(0, 0, s, s); ctx.fillStyle = '#5a4600'; ctx.fillRect(s * 0.28, s * 0.3, 5, 5); ctx.fillRect(s * 0.62, s * 0.3, 5, 5); });
    make('boss', 56, (ctx, s) => { ctx.fillStyle = '#7c0a0a'; ctx.fillRect(0, 0, s, s); ctx.fillStyle = '#ffd700'; ctx.fillRect(s * 0.25, s * 0.38, 8, 8); ctx.fillRect(s * 0.6, s * 0.38, 8, 8); ctx.fillStyle = '#ffffff'; ctx.fillRect(s * 0.35, s * 0.6, 8, 4); });
    make('bullet_white', 8, (ctx, s) => { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, s, s); });
    make('bullet_critical', 10, (ctx, s) => { ctx.fillStyle = '#fffb00'; ctx.fillRect(0, 0, s, s); });
  }

  private startHorda(h: number): void {
    this.hordaActual = h;
    this.phaseMs = 0;
    this.spawnTimer = 0;
    this.enemies.forEach((e) => e.destroy());
    this.enemies = [];
    this.bullets.forEach((b) => b.destroy());
    this.bullets = [];
    this.emitHud?.();
  }

  update(_time: number, deltaMs: number): void {
    if (!this.player || this.pickingUpgrade || this.gameEnded) return;

    // Apuntado con el mouse — lectura pura para el disparo (sin dibujo en pantalla)
    const ptr = this.input.activePointer;
    if (ptr) {
      this.aimX = ptr.worldX ?? ptr.x;
      this.aimY = ptr.worldY ?? ptr.y;
    }

    // Movimiento (WASD + flechas)
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

    // Regeneración pasiva (mejora "Código Médico", +regeneraRango vida/2s)
    if (this.regeneraRango > 0) {
      this.regenTick += deltaMs;
      if (this.regenTick > 2000) {
        this.regenTick = 0;
        this.salud = Math.min(this.saludMax, this.salud + this.regeneraRango);
        this.emitHud?.();
      }
    }

    // Spawn por horda — cada horda tiene ~33s de ventana de aparición
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

    // Los enemigos persiguen al jugador
    for (const e of this.enemies) {
      if (e.active) this.physics.moveTo(e, this.player.x, this.player.y, 90 + this.hordaActual * 10);
    }

    // Disparo automático al enemigo más cercano
    this.fireTimer += deltaMs;
    if (this.fireTimer > this.fireInterval && this.enemies.length) {
      this.fireTimer = 0;
      this.spawnBullet();
    }

    // Limpieza de balas fuera de la arena
    this.bullets = this.bullets.filter((b) => b.active && b.x >= -30 && b.x <= 910 && b.y >= -30 && b.y <= 550);

    // Colisiones balas ↔ enemigos (con daño real y HP de enemigo)
    const radioImpacto = this.bulletSize + 8;
    for (const b of this.bullets) {
      if (!b.active) continue;
      for (const e of this.enemies) {
        if (!e.active) continue;
        if (Phaser.Math.Distance.BetweenPoints(b, e) < radioImpacto) {
          const danoMult = (b as unknown as { danoMult?: number }).danoMult ?? 1;
          this.hitEnemy(e, this.danoActual * danoMult);
          b.destroy();
          break;
        }
      }
    }

    // Colisiones enemigos ↔ jugador (daño con resistencia)
    for (const e of this.enemies) {
      if (!e.active) continue;
      if (Phaser.Math.Distance.BetweenPoints(this.player, e) < 18) {
        this.damageTick(deltaMs);
      }
    }

    // Estado terminal
    if (this.salud <= 0) {
      this.finalizar(false);
      return;
    }
    this.emitHud?.();
  }

  private damageTick(ms: number): void {
    this.damageAccum += ms;
    if (this.damageAccum > 500) {
      this.damageAccum = 0;
      const daño = Math.max(1, Math.round(5 * (1 - this.resistencia)));
      this.salud = Math.max(0, this.salud - daño);
      this.emitHud?.();
    }
  }

  private spawnBullet(): void {
    if (!this.player) return;
    this.criticoCounter++;
    const critico = this.criticoRango > 0 && this.criticoCounter % 3 === 0;
    const bullet = this.physics.add.sprite(this.player.x, this.player.y, critico ? 'bullet_critical' : 'bullet_white');
    (bullet as unknown as { danoMult: number }).danoMult = critico ? 2 + this.criticoRango : 1;

    // Disparo hacia donde apunta el mouse; si el cursor coincide con el jugador,
    // usa al enemigo más cercano como dirección de respaldo
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
    const speed = 560;
    bullet.setVelocity(dirX * speed, dirY * speed);
    bullet.body!.setCircle(this.bulletSize);
    this.bullets.push(bullet);
  }

  private spawnBossCounter = 0;

  private spawnEnemy(): void {
    const side = Math.floor(Math.random() * 4);
    const x = side === 0 ? 0 : side === 1 ? 880 : Math.random() * 880;
    const y = side === 2 ? 0 : side === 3 ? 520 : Math.random() * 520;
    // Hordas 1-3 Espinita · 4-6 Bug Infector · 7-8 Excepción · 9 Jefe
    // Niveles de evaluación (6/12/18): además de la horda 9, también hay jefes
    // en las hordas 3 y 6. En hordas de jefe, 1 de cada 4 apariciones es jefe real.
    const esHordaJefe = this.hordaActual === 9 || (this.evaluacionMode && (this.hordaActual === 3 || this.hordaActual === 6));
    this.spawnBossCounter++;
    if (esHordaJefe && this.spawnBossCounter % 4 === 1) {
      const hpJefe = this.hordaActual >= 9 ? 14 : this.hordaActual >= 6 ? 9 : 6;
      const boss = this.physics.add.sprite(x, y, 'boss');
      (boss as unknown as { hp: number }).hp = hpJefe;
      boss.setCircle(25);
      this.enemies.push(boss);
      return;
    }
    if (esHordaJefe) {
      // Esbirros de la horda de jefe: Excepción dorada con más vida
      const e = this.physics.add.sprite(x, y, 'enemy_gold');
      (e as unknown as { hp: number }).hp = 4;
      e.setCircle(12);
      this.enemies.push(e);
      return;
    }
    const tier = this.hordaActual <= 3 ? 0 : this.hordaActual <= 6 ? 1 : 2;
    const keys = ['enemy_red', 'enemy_orange', 'enemy_gold'];
    const e = this.physics.add.sprite(x, y, keys[tier]);
    (e as unknown as { hp: number }).hp = tier === 0 ? 1 : tier === 1 ? 2 : 3;
    e.setCircle(12);
    this.enemies.push(e);
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
    if (target.hp <= 0) {
      e.destroy();
      this.enemies = this.enemies.filter((x) => x !== e);
      this.xp += 5;
      this.kills += 1;
      this.emitHud?.();
    }
  }

  /** Nivel actual alcanzado de una mejora (0 si no se ha tomado). */
  getRango(id: string): number {
    return this.ranks[id] ?? 0;
  }

  /** Llamado externamente por el componente Angular tras el pick de mejora. */
  applyUpgrade(id: string): void {
    const mejora = [...MEJORAS, ...MEJORAS_EXTRA].find((m) => m.id === id);
    if (!mejora) return;
    this.ranks[id] = this.getRango(id) + 1;
    mejora.aplica(this);
  }

  /** Angular bridge: arrancar la siguiente horda tras elegir mejora; en la horda 9 dispara la victoria. */
  comenzarSiguienteHorda(): void {
    if (this.hordaActual >= this.totalHordas) {
      this.finalizar(true);
      return;
    }
    this.startHorda(this.hordaActual + 1);
    this.pickingUpgrade = false;
  }

  private marcarHordaCompletada(): void {
    // Todas las hordas (incluida la 9) ofrecen 3 mejoras ⇒ 9 × 3 = 27 tarjetas por nivel.
    // En la horda 9, la elección actúa como ceremonia final antes de la victoria.
    this.pickingUpgrade = true;
    this.emitUpgradePick?.();
  }

  private finalizar(victoria: boolean): void {
    if (this.gameEnded) return;
    this.gameEnded = true;
    this.physics.pause();
    const t = Math.floor((this.time.now - this.startedAt) / 1000);
    this.emitDestroy?.(victoria, this.kills, t);
  }
}
