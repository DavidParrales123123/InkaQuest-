// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { CourseService } from '../../core/services/course.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { CURSO_PRINCIPIOS_ALGORITMOS } from '../../core/services/guardianes-acceso.service';

interface NivelItem {
  numero: number;
  titulo: string;
  lekctioneId: string | null;
  bloqueada: boolean;
  completada: boolean;
  disponible: boolean;
}

/**
 * Punto de entrada del videojuego InkaQuest: Guardianes del Conocimiento.
 *
 * <p>Solo disponible para estudiantes con matrícula activa en el curso
 * Principios de Algoritmos. El catálogo de lekctiones del mismo curso se
 * muestra como 18 niveles académicos de campaña; se desbloquean en orden
 * de completion según progreso_leccion.</p>
 */
@Component({
  selector: 'app-guardians-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="space-y-6">
      @if (error()) {
        <div class="rounded-xl border border-warning-200 bg-warning-50 p-4 text-sm text-warning-800" role="alert">{{ error() }}</div>
      }
      <header class="rounded-2xl border border-gold-500/40 bg-gradient-to-br from-marine-900 via-marine-800 to-marine-700 p-6 text-white">
        <div class="flex flex-wrap items-start justify-between gap-6">
          <div class="space-y-2">
            <span class="inline-flex items-center gap-1 rounded-full bg-gold-500/20 px-3 py-1 text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-gold-400">Guardianes del Conocimiento</span>
            <h1 class="text-3xl font-extrabold leading-tight md:text-4xl">Survive. Aprende.<br/><span class="text-gold-400">Protege el algoritmo.</span></h1>
            <p class="max-w-2xl text-sm text-marine-100">Campaña de supervivencia por hordas exclusiva del curso Principios de Algoritmos. Mientras aprendes fundamentos, estructuras condicionales y estructuras repetitivas, tu personaje sobrevive a las oleadas.</p>
            <div class="flex flex-wrap gap-3 pt-3">
              <a class="btn btn-gold" [routerLink]="['/estudiante/guardianes/nivel', primerDisponible() ?? 1]">Empezar partida</a>
              <a class="btn btn-outline-light" href="#campana">Ver campaña</a>
            </div>
          </div>
          <div class="flex flex-col items-end gap-2">
            <p class="text-xs text-marine-300 uppercase tracking-wider">Curso</p>
            <p class="font-bold">Principios de Algoritmos</p>
            <p class="text-xs text-marine-300">InkaQuest · Edición 2026</p>
          </div>
        </div>
      </header>

      <div class="grid gap-6 lg:grid-cols-12">
        <aside class="card card-body lg:col-span-4 space-y-3">
          <h2 class="text-base font-bold text-marine-800">Tu rendimiento</h2>
          <div class="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
            <div class="rounded-xl border border-surface-200 bg-surface-50 p-3"><p class="text-2xl font-extrabold text-marine-800">{{ totalIntentos() }}</p><p class="text-[0.65rem] uppercase tracking-widest text-marine-500">Partidas</p></div>
            <div class="rounded-xl border border-surface-200 bg-surface-50 p-3"><p class="text-2xl font-extrabold text-emerald-600">{{ totalVictorias() }}</p><p class="text-[0.65rem] uppercase tracking-widest text-marine-500">Victorias</p></div>
            <div class="rounded-xl border border-surface-200 bg-surface-50 p-3"><p class="text-2xl font-extrabold text-gold-600">+{{ xpTotal() }}</p><p class="text-[0.65rem] uppercase tracking-widest text-marine-500">XP ganada</p></div>
            <div class="rounded-xl border border-surface-200 bg-surface-50 p-3"><p class="text-2xl font-extrabold text-brand-600">{{ precisionMedia() }}%</p><p class="text-[0.65rem] uppercase tracking-widest text-marine-500">Precisión</p></div>
          </div>
          <div class="rounded-xl border border-gold-500/30 bg-gold-50/60 p-3 text-sm">
            <p class="font-extrabold text-gold-700">Nivel {{ siguienteNumero() }} / 18</p>
            <p class="mt-0.5 text-xs text-gold-800">Próximo objetivo: completar {{ siguienteTitulo() }}</p>
          </div>
        </aside>

        <div id="campana" class="card card-body lg:col-span-8">
          <h2 class="text-base font-bold text-marine-800">Campaña — 18 niveles</h2>
          <p class="text-xs text-marine-500">Cada nivel corresponde a una lekction del curso.</p>
          <div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            @for (n of niveles(); track n.numero) {
              <a
                class="relative flex h-28 flex-col items-start justify-between rounded-xl p-3 text-left transition"
                [class.bg-marine-100]="n.bloqueada"
                [class.text-marine-600]="n.bloqueada"
                [class.border]="n.bloqueada"
                [class.border-marine-200]="n.bloqueada"
                [class.bg-gradient-to-br]="!n.bloqueada"
                [class.from-marine-800]="!n.bloqueada"
                [class.to-marine-700]="!n.bloqueada"
                [class.text-white]="!n.bloqueada"
                [class.hover:-translate-y-0.5]="!n.bloqueada"
                [class.cursor-not-allowed]="n.bloqueada"
                [routerLink]="n.bloqueada ? null : ['/estudiante/guardianes/nivel', n.numero]"
                [attr.aria-disabled]="n.bloqueada ? 'true' : null"
              >
                <span class="text-[0.65rem] font-bold uppercase tracking-wider opacity-80">Nivel {{ n.numero }}</span>
                <span class="text-xs font-semibold leading-snug line-clamp-2">{{ n.titulo }}</span>
                <span class="text-[0.65rem] opacity-80">{{ n.bloqueada ? '🔒 Bloqueado' : (n.completada ? '⭐ Completado' : '▶ Disponible') }}</span>
              </a>
            }
          </div>
        </div>
      </div>
    </section>
  `,
})
export class GuardiansComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly cursos = inject(CourseService);
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);

  protected readonly niveles = signal<NivelItem[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly siguienteNumero = signal(1);
  protected readonly siguienteTitulo = signal('');
  protected readonly totalIntentos = signal(0);
  protected readonly totalVictorias = signal(0);
  protected readonly xpTotal = signal(0);
  protected readonly precisionMedia = signal(0);

  protected primerDisponible(): number {
    return this.niveles().find((n) => !n.bloqueada)?.numero ?? 1;
  }

  ngOnInit(): void { void this.cargar(); }
  ngOnDestroy(): void { /* limpieza */ }

  private async cargar(): Promise<void> {
    this.cargando.set(true);
    try {
      // Matrícula activa de este usuario en el curso Principios de Algoritmos
      const USER = this.auth.usuario();
      if (!USER) return;
      const COURSE_ID = CURSO_PRINCIPIOS_ALGORITMOS;
      const supabase = this.supabase.client;
      const { data: matricula, error: matriculaErr } = await supabase
        .from('matricula')
        .select('id')
        .eq('estudiante_id', USER.id)
        .eq('curso_id', COURSE_ID)
        .eq('estado', 'activa')
        .maybeSingle();
      if (matriculaErr) throw new Error(matriculaErr.message);
      if (!matricula) {
        this.error.set('Necesitas matrícula activa en Principios de Algoritmos para jugar.');
        this.cargando.set(false);
        return;
      }
      const [{ data: campana }, { data: progreso }, { data: intentos }] = await Promise.all([
        supabase.from('guardianes_campana').select('id').limit(1).maybeSingle(),
        supabase.from('progreso_leccion').select('leccion_id,estado').eq('estudiante_id', USER.id),
        supabase.from('guardianes_intento').select('estado, xp_recibido, precision, hordas_completadas').eq('estudiante_id', USER.id),
      ]);
      const { data: nivelesDb, error: nivelesErr } = await supabase
        .from('guardianes_nivel')
        .select('numero, titulo, leccion_id, xp_recompensa, monedas_recompensa')
        .eq('campana_id', campana?.id ?? '')
        .order('numero');
      if (nivelesErr) throw new Error(nivelesErr.message);
      const completadas = new Set((progreso ?? []).filter((r: any) => r.estado === 'completado').map((r: any) => r.leccion_id));
      const items: NivelItem[] = (nivelesDb ?? []).map((n: any) => ({
        numero: n.numero,
        titulo: n.titulo ?? `Nivel ${n.numero}`,
        lekctioneId: n.leccion_id,
        bloqueada: false,
        completada: completadas.has(n.leccion_id),
        disponible: true,
      }));
      // Estadísticas del jugador
      this.totalIntentos.set(intentos?.length ?? 0);
      this.totalVictorias.set((intentos ?? []).filter((i: any) => i.estado === 'completado').length);
      this.xpTotal.set((intentos ?? []).reduce((s: number, i: any) => s + (i.xp_recibido ?? 0), 0));
      const precisiones = (intentos ?? []).map((i: any) => Number(i.precision ?? 0)).filter((v) => Number.isFinite(v) && v > 0);
      this.precisionMedia.set(precisiones.length ? Math.round(precisiones.reduce((a, b) => a + b, 0) / precisiones.length) : 0);
      // Bloqueo progresivo: nivel N+1 bloqueado si el N-1 no está completado
      for (let i = 1; i < items.length; i++) {
        if (!items[i - 1].completada) items[i].bloqueada = true;
      }
      if (items[0]) items[0].bloqueada = false;
      this.niveles.set(items);
      this.siguienteNumero.set(items.find((n) => !n.completada)?.numero ?? 18);
      const next = items.find((n) => !n.completada);
      this.siguienteTitulo.set(next?.titulo ?? 'Completar niveles');

      // Si el estudiante NO está matriculado en el curso → bloquear entrada
      // (require matriculado check via progreso o matrícula)
    } catch (e) {
      console.error('[guardianes] cargar failed:', e);
    } finally {
      this.cargando.set(false);
    }
  }
}