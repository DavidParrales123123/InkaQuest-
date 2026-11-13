// @ts-nocheck
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PaginatedResponse } from './course.service';
import { SupabaseService } from './supabase.service';
import {
  Monedero,
  TransaccionMoneda,
  EventoGamificacion,
  ReglaProgresion,
  Temporada,
  Ranking,
} from '../models/domain.models';

/**
 * Servicio de gamificación: XP, nivel, insignias, rachas, misiones y ranking.
 *
 * Consume el backend REST API para:
 * - Consultar resumen gamificado del usuario
 * - Ver insignias y misiones
 * - Consultar ranking y temporadas
 * - Historial de XP y monedas
 *
 * El frontend NUNCA otorga recompensas - solo lee el estado que el backend registra.
 */
@Injectable({ providedIn: 'root' })
export class GamificationService {
  private readonly http = inject(HttpClient);
  private readonly supabase = inject(SupabaseService);
  private readonly baseUrl = `${environment.apiUrl}/gamificacion`;

  // === RESUMEN GAMIFICADO ===

  /** Obtiene el resumen completo de gamificación del usuario. */
  async obtenerResumen(): Promise<GamificacionResumenResponse> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<GamificacionResumenResponse>>(`${this.baseUrl}/yo`)
    );
    return res.data!;
  }

  // === RACHA ===

  /**
   * Obtiene la racha del usuario (fila propia en `public.racha`, vía RLS).
   * Si aún no existe, devuelve ceros.
   */
  async obtenerRacha(usuarioId: string): Promise<{ racha_actual: number; mejor_racha: number; ultima_actividad: string | null }> {    try {
      const { data, error } = await this.supabase.client
        .from(this.supabase.tabla.racha)
        .select('racha_actual, mejor_racha, ultima_actividad')
        .eq('usuario_id', usuarioId)
        .maybeSingle();
      if (error) {
        console.error('[InkaQuest] Error cargando la racha:', error.message);
        return { racha_actual: 0, mejor_racha: 0, ultima_actividad: null };
      }
      return data ?? { racha_actual: 0, mejor_racha: 0, ultima_actividad: null };
    } catch {
      return { racha_actual: 0, mejor_racha: 0, ultima_actividad: null };
    }
  }

  // === INSIGNIAS ===

  /** Obtiene el catálogo de insignias con el progreso del usuario. */
  async listarInsignias(): Promise<InsigniaCatalogoResponse[]> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<InsigniaCatalogoResponse[]>>(`${this.baseUrl}/insignias`)
    );
    return res.data || [];
  }

  // === MISIONES ===

  /** Obtiene las misiones activas con el progreso del usuario. */
  async listarMisiones(): Promise<MisionResponse[]> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<MisionResponse[]>>(`${this.baseUrl}/misiones`)
    );
    return res.data || [];
  }

  // === TEMPORADAS Y RANKING ===

  /** Obtiene la temporada activa. */
  async obtenerTemporadaActual(): Promise<TemporadaResponse | null> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<TemporadaResponse>>(`${this.baseUrl}/temporada-actual`)
    );
    return res.data;
  }

  /** Obtiene el ranking de la temporada activa con la posición del usuario. */
  async obtenerRanking(): Promise<RankingTemporadaResponse> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<RankingTemporadaResponse>>(`${this.baseUrl}/ranking`)
    );
    return res.data!;
  }

  // === HISTORIAL UNIFICADO (Supabase) ===

  /** Monedero del usuario (fila propia vía RLS). */
  async obtenerMonedero(usuarioId?: string): Promise<Monedero | null> {
    let consulta = this.client.from(this.supabase.tabla.monedero).select('*');
    if (usuarioId) consulta = consulta.eq('usuario_id', usuarioId);
    const { data, error } = await consulta.maybeSingle();
    if (error) {
      console.error('[InkaQuest] Error cargando monedero:', error.message);
      return null;
    }
    return (data as Monedero) ?? null;
  }

  /** Historial de transacciones de monedas del usuario. */
  async listarHistorialMonedas(usuarioId?: string, limite = 20): Promise<TransaccionMoneda[]> {
    let consulta = this.client
      .from(this.supabase.tabla.transaccionMoneda)
      .select('*')
      .order('creado_en', { ascending: false })
      .limit(limite);
    if (usuarioId) consulta = consulta.eq('usuario_id', usuarioId);
    const { data, error } = await consulta;
    if (error) {
      console.error('[InkaQuest] Error cargando historial de monedas:', error.message);
      return [];
    }
    return (data ?? []) as TransaccionMoneda[];
  }

  /** Eventos de gamificación activos. */
  async listarEventos(): Promise<EventoGamificacion[]> {
    const { data, error } = await this.client
      .from(this.supabase.tabla.eventoGamificacion)
      .select('*')
      .eq('activo', true)
      .order('fecha_inicio', { ascending: false });
    if (error) {
      console.error('[InkaQuest] Error cargando eventos:', error.message);
      return [];
    }
    return (data ?? []) as EventoGamificacion[];
  }

  /** Reglas de progresión activas ordenadas por tipo y XP. */
  async listarReglasProgresion(): Promise<ReglaProgresion[]> {
    const { data, error } = await this.client
      .from(this.supabase.tabla.reglaProgresion)
      .select('*')
      .eq('activa', true)
      .order('tipo', { ascending: true })
      .order('xp_requerido', { ascending: true });
    if (error) {
      console.error('[InkaQuest] Error cargando reglas de progresión:', error.message);
      return [];
    }
    return (data ?? []) as ReglaProgresion[];
  }

  /** Todas las temporadas. */
  async listarTemporadas(): Promise<Temporada[]> {
    const { data, error } = await this.client
      .from(this.supabase.tabla.temporada)
      .select('*')
      .order('fecha_inicio', { ascending: false });
    if (error) {
      console.error('[InkaQuest] Error cargando temporadas:', error.message);
      return [];
    }
    return (data ?? []) as Temporada[];
  }

  /** Ranking de una temporada (puntos desc). */
  async listarRanking(temporadaId?: string): Promise<Ranking[]> {
    let consulta = this.client
      .from(this.supabase.tabla.ranking)
      .select('*')
      .order('puntos', { ascending: false })
      .limit(50);
    if (temporadaId) consulta = consulta.eq('temporada_id', temporadaId);
    const { data, error } = await consulta;
    if (error) {
      console.error('[InkaQuest] Error cargando ranking:', error.message);
      return [];
    }
    return (data ?? []) as Ranking[];
  }

  /** Catálogo completo de insignias activas, con las obtenidas por el usuario. */
  async listarCatalogoInsignias(): Promise<InsigniaCatalogoResponse[]> {
    const { data, error } = await this.client
      .from(this.supabase.tabla.insignia)
      .select('*, insignia_usuario(usuario_id)')
      .eq('activa', true)
      .order('xp_otorgado', { ascending: true });
    if (error) {
      console.error('[InkaQuest] Error cargando catálogo de insignias:', error.message);
      return [];
    }
    return (data ?? []).map((i: any) => ({
      id: i.id,
      nombre: i.nombre,
      descripcion: i.descripcion,
      icono: i.icono ?? null,
      tipo: i.tipo ?? 'insignia',
      rareza: i.rareza ?? 'comun',
      xpRequerido: i.xp_otorgado ?? 0,
      activa: i.activa,
      obtenida: Array.isArray(i.insignia_usuario) ? i.insignia_usuario.length > 0 : false,
    })) as InsigniaCatalogoResponse[];
  }

  // === HISTORIAL ===

  /** Obtiene el historial de transacciones de XP paginado. */
  async listarHistorialXp(page = 0, size = 20): Promise<PaginatedResponse<TransaccionXpResponse>> {
    const params = { page: page.toString(), size: size.toString() };
    const res = await firstValueFrom(
      this.http.get<ApiResponse<PaginatedResponse<TransaccionXpResponse>>>(
        `${this.baseUrl}/transacciones-xp`,
        { params }
      )
    );
    return res.data!;
  }
}

// === INTERFACES ===

export interface GamificacionResumenResponse {
  usuarioId: string;
  nivel: number;
  xpActual: number;
  xpSiguienteNivel: number;
  porcentajeNivel: number;
  totalXp: number;
  
  // Racha
  rachaDias: number;
  rachaMaxima: number;
  ultimaActividad: string | null;
  
  // Monedas
  monedasOro: number;
  monedasPlata: number;
  
  // Insignias
  insigniasObtenidas: number;
  insigniasTotales: number;
  
  // Misiones
  misionesActivas: number;
  misionesCompletadas: number;
  
  // Ranking
  posicionRanking: number | null;
  puntosRanking: number | null;
}

export interface InsigniaCatalogoResponse {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string | null;
  tipo: string;
  rareza: string;
  xpRequerido: number;
  activa: boolean;
  obtenida: boolean;
  obteidaEn: string | null;
}

export interface MisionResponse {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: string;
  objetivo: number;
  recompensaXp: number;
  recompensaMonedas: number;
  fechaInicio: string;
  fechaFin: string | null;
  activa: boolean;
  
  // Progreso del usuario
  progreso: number;
  completada: boolean;
  completadaEn: string | null;
}

export interface TemporadaResponse {
  id: string;
  nombre: string;
  descripcion: string | null;
  fechaInicio: string;
  fechaFin: string;
  activa: boolean;
  recompensas: string | null;
}

export interface RankingTemporadaResponse {
  temporadaId: string;
  temporadaNombre: string;
  top: RankingEntradaResponse[];
  miPuesto: RankingEntradaResponse | null;
}

export interface RankingEntradaResponse {
  posicion: number;
  usuarioId: string;
  nombreUsuario: string;
  puntos: number;
  insigniasPrincipales: string[];
}

export interface TransaccionXpResponse {
  id: string;
  usuarioId: string;
  cantidad: number;
  tipo: string;
  descripcion: string | null;
  origenId: string | null;
  origenTipo: string | null;
  creadoEn: string;
}
