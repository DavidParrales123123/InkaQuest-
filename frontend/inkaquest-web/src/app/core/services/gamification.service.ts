// @ts-nocheck
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PaginatedResponse } from './course.service';

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
  private readonly baseUrl = `${environment.apiUrl}/gamificacion`;

  // === RESUMEN GAMIFICADO ===

  /** Obtiene el resumen completo de gamificación del usuario. */
  async obtenerResumen(): Promise<GamificacionResumenResponse> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<GamificacionResumenResponse>>(`${this.baseUrl}/yo`)
    );
    return res.data!;
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
