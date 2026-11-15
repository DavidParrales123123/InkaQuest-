import Phaser from 'phaser';

/** Estructura de datos de una mejora accesible. */
export interface MejoraInfo {
  readonly id: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly rareza: 'comun' | 'academic' | 'legendario';
  readonly aplica: (scene: CombateScene) => void;
}

/** Mejoras posibles entre hordas. Se ofrecen 3 al azar; el estudiante elige una. */
export const MEJORAS: MejoraInfo[] = [
  { id: 'dano', nombre: 'Espada Algorítmica', rareza: 'comun', descripcion: '+1 daño por bala',
    aplica: (s) => { s.danoActual += 1; } },
  { id: 'vida', nombre: 'Escudo Lógico', rareza: 'comun', descripcion: '+25 salud máxima (cura 25)',
    aplica: (s) => { s.saludMax += 25; s.salud = Math.min(s.saludMax, s.salud + 25); } },
  { id: 'velocidad', nombre: 'Botas GPX', rareza: 'comun', descripcion: '+25% velocidad de movimiento',
    aplica: (s) => { s.vel = Math.floor(s.vel * 1.25); } },
  { id: 'cadencia', nombre: 'Cañón Aritmético', rareza: 'comun', descripcion: 'Disparo 25% más rápido',
    aplica: (s) => { s.fireInterval = Math.max(90, Math.floor(s.fireInterval * 0.75)); } },
  { id: 'radio', nombre: 'Área Extendida', rareza: 'academic', descripcion: '+50% radio de impacto de las balas',
    aplica: (s) => { s.bulletSize = Math.ceil(s.bulletSize * 1.5); } },
  { id: 'escudo', nombre: 'Escudo Predictivo', rareza: 'academic', descripcion: 'Recibir daño 30% reducido',
    aplica: (s) => { s.resistencia = Math.min(0.9, s.resistencia + 0.3); } },
  { id: 'critico', nombre: 'Rayo Crítico', rareza: 'academic', descripcion: 'Cada 3er disparo hace daño crítico (×3)',
    aplica: (s) => { s.tieneCritico = true; } },
  { id: 'regen', nombre: 'Código Médico', rareza: 'legendario', descripcion: 'Regenera 1 vida cada 2 segundos',
    aplica: (s) => { s.regenera = true; } },
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
  tieneCritico = false;
  regenera = false;

  private criticoCounter = 0;
  private emitHud?: () => void;
  private emitDestroy?: (victoria: boolean, matados: number, tiempo: number) => void;
  private emitUpgradePick?: () => void;

  hordaActual = 1;
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

    // Regeneración pasiva (mejora "Código Médico")
    if (this.regenera) {
      this.regenTick += deltaMs;
      if (this.regenTick > 2000) {
        this.regenTick = 0;
        this.salud = Math.min(this.saludMax, this.salud + 1);
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
          const critico = b.texture.key === 'bullet_critical';
          const dano = critico ? this.danoActual * 3 : this.danoActual;
          this.hitEnemy(e, dano);
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
    const nearest = this.nearestEnemy();
    if (!nearest || !this.player) return;
    this.criticoCounter++;
    const critico = this.tieneCritico && this.criticoCounter % 3 === 0;
    const bullet = this.physics.add.sprite(this.player.x, this.player.y, critico ? 'bullet_critical' : 'bullet_white');
    const dx = nearest.x - this.player.x;
    const dy = nearest.y - this.player.y;
    const len = Math.hypot(dx, dy) || 1;
    const speed = 540;
    bullet.setVelocity((dx / len) * speed, (dy / len) * speed);
    bullet.body!.setCircle(this.bulletSize);
    this.bullets.push(bullet);
  }

  private spawnEnemy(): void {
    const side = Math.floor(Math.random() * 4);
    const x = side === 0 ? 0 : side === 1 ? 880 : Math.random() * 880;
    const y = side === 2 ? 0 : side === 3 ? 520 : Math.random() * 520;
    // Hordas 1-3 Espinita · 4-6 Bug Infector · 7-8 Excepción · 9 Jefe
    const tier = this.hordaActual <= 3 ? 0 : this.hordaActual <= 6 ? 1 : this.hordaActual <= 8 ? 2 : 3;
    if (tier === 3) {
      const boss = this.physics.add.sprite(x, y, 'boss');
      (boss as unknown as { hp: number }).hp = 12;
      boss.setCircle(25);
      this.enemies.push(boss);
    } else {
      const keys = ['enemy_red', 'enemy_orange', 'enemy_gold'];
      const e = this.physics.add.sprite(x, y, keys[tier]);
      (e as unknown as { hp: number }).hp = tier === 0 ? 1 : tier === 1 ? 2 : 3;
      e.setCircle(12);
      this.enemies.push(e);
    }
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

  /** Llamado externamente por el componente Angular tras el pick de mejora. */
  applyUpgrade(id: string): void {
    const mejora = MEJORAS.find((m) => m.id === id);
    if (mejora) mejora.aplica(this);
  }

  /** Angular bridge: arrancar la siguiente horda tras elegir mejora. */
  comenzarSiguienteHorda(): void {
    this.startHorda(this.hordaActual + 1);
    this.pickingUpgrade = false;
  }

  private marcarHordaCompletada(): void {
    if (this.hordaActual >= this.totalHordas) {
      this.finalizar(true);
      return;
    }
    // Pausa la simulación y pide al componente Angular que muestre el overlay de mejoras
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
