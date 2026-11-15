import Phaser from 'phaser';

/** Escena Phaser en vivo: arena top-down de supervivencia. */
export class CombateScene extends Phaser.Scene {
  private player?: Phaser.Physics.Arcade.Image;
  private salud = 100;
  private xp = 0;
  private startMs = 0;
  private spawnTimer = 0;
  private hordaTimer = 0;
  private fireTimer = 0;
  private damageBlink = 0;

  private emitHud?: () => void;
  private emitDestroy?: () => void;

  constructor() {
    super({ key: 'Combate' });
  }

  init(data: { onUpdate?: () => void; onEnd?: (victoria: boolean) => void } = {}): void {
    this.emitHud = data.onUpdate;
    this.emitDestroy = () => data.onEnd?.(false);
  }

  create(): void {
    const world = this.add.rectangle(440, 260, 880, 520, 0x0f1a33);
    world.setStrokeStyle(2, 0xf2a541, 0.3);
    // Estrellas de fondo
    for (let i = 0; i < 300; i++) {
      this.add.rectangle(Math.random() * 880, Math.random() * 520, 2, 2, 0xbfd3ff);
    }

    // Crear textures de sprite procedural (círculo dorado, enemigo rojo, bala blanca)
    this.createTextures();

    this.player = this.physics.add.sprite(440, 260, 'player_gold');
    this.player.setCircle(14);
    this.player.setCollideWorldBounds(true);
    this.physics.world.setBounds(0, 0, 880, 520);

    this.startMs = this.time.now;
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
    make('enemy_red', 28, (ctx, s) => {
      ctx.fillStyle = '#b3002d'; ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = '#450b16';
      ctx.fillRect(s * 0.28, s * 0.3, 4, 4);
      ctx.fillRect(s * 0.62, s * 0.3, 4, 4);
    });
    make('bullet_white', 8, (ctx, s) => {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, s, s);
    });
  }

  private enemies: Phaser.Physics.Arcade.Sprite[] = [];
  private bullets: Phaser.Physics.Arcade.Sprite[] = [];

  update(_time: number, deltaMs: number): void {
    if (!this.player) return;

    const dt = deltaMs / 1000;
    const speed = 240;
    let vx = 0, vy = 0;

    const kb = this.input.keyboard!;
    const isDown = (code: number): boolean => kb.addKey(code).isDown;
    if (isDown(65)) vx = -speed;
    else if (isDown(68)) vx = speed;
    if (isDown(87)) vy = -speed;
    else if (isDown(83)) vy = speed;

    this.player.setVelocity(vx, vy);

    // Spawn enemigos
    this.spawnTimer += deltaMs;
    if (this.spawnTimer > 900) {
      this.spawnTimer = 0;
      this.spawnEnemy();
    }

    // Arrastrar enemigos hacia el jugador
    for (const e of this.enemies) {
      if (!e.active) continue;
      this.physics.moveTo(e, this.player.x, this.player.y, 95);
    }

    // Disparo automático
    this.fireTimer += deltaMs;
    if (this.fireTimer > 260 && this.enemies.length) {
      this.fireTimer = 0;
      const bullet = this.physics.add.sprite(this.player.x, this.player.y, 'bullet_white').setCircle(4).refreshBody();
      const nearest = this.nearestEnemy();
      if (nearest) {
        const dx = nearest!.x - this.player.x;
        const dy = nearest!.y - this.player.y;
        const len = Math.hypot(dx, dy) || 1;
        bullet.setVelocity((dx / len) * 520, (dy / len) * 520);
        this.bullets.push(bullet);
      }
    }

    // Limpiar balas fuera
    this.bullets = this.bullets.filter((b) => b.active && b.x >= -20 && b.x <= 900 && b.y >= -20 && b.y <= 540);

    // Colisiones balas con enemigos
    for (const b of this.bullets) {
      for (const e of this.enemies) {
        if (!e.active) continue;
        if (!b.active) break;
        const bdist = Phaser.Math.Distance.BetweenPoints(b, e);
        if (bdist < 18) {
          this.hitEnemy(e);
          b.destroy();
          this.xp += 5;
          this.emitHud?.();
        }
      }
    }

    // Colisiones enemigos con jugador
    for (const e of this.enemies) {
      if (!e.active) continue;
      const d = Phaser.Math.Distance.BetweenPoints(this.player, e);
      if (d < 18) {
        this.damageBlink += deltaMs;
        if (this.damageBlink > 350) {
          this.damageBlink = 0;
          this.salud = Math.max(0, this.salud - 5);
          this.emitHud?.();
        }
      }
    }

    // Hordas por tiempo
    this.hordaTimer += deltaMs;

    // Estado terminal
    if (this.salud <= 0) {
      this.emitDestroy?.();
      this.scene.start('gameOver');
      return;
    }
    if (this.time.now - this.startMs > 90_000) {
      this.emitHud?.();
      this.scene.start('gameOver');
      return;
    }
    this.emitHud?.();
  }

  private nearestEnemy(): Phaser.Physics.Arcade.Sprite | null {
    let best: Phaser.Physics.Arcade.Sprite | null = null;
    let mejor = Infinity;
    for (const e of this.enemies) {
      if (!e.active) continue;
      const d = Phaser.Math.Distance.BetweenPoints(this.player!, e);
      if (d < mejor) { mejor = d; best = e; }
    }
    return best;
  }

  private spawnEnemy(): void {
    const side = Math.floor(Math.random() * 4);
    const x = side === 0 ? 0 : side === 1 ? 880 : Math.random() * 880;
    const y = side === 2 ? 0 : side === 3 ? 520 : Math.random() * 520;
    const e = this.physics.add.sprite(x, y, 'enemy_red');
    e.setCircle(12);
    e.setTint(0xb3002d);
    this.enemies.push(e);
  }

  private hitEnemy(e: Phaser.Physics.Arcade.Sprite): void {
    e.destroy();
    this.enemies = this.enemies.filter((x) => x !== e);
  }
}