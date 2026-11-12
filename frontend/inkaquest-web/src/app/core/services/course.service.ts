import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

/**
 * Servicio del catálogo académico: cursos y su contenido.
 *
 * Consume el backend REST API para:
 * - Listar cursos publicados
 * - Obtener detalles de cursos
 * - Consultar estructura (unidades, módulos, lecciones)
 */
@Injectable({ providedIn: 'root' })
export class CourseService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/cursos`;

  // === CURSOS PÚBLICOS ===

  /** Lista cursos publicados con paginación y búsqueda. */
  async listarPublicos(opciones: {
    q?: string;
    categoriaId?: string;
    page?: number;
    size?: number;
  } = {}): Promise<PaginatedResponse<CursoResponse>> {
    const params: any = {};
    if (opciones.q) params.q = opciones.q;
    if (opciones.categoriaId) params.categoriaId = opciones.categoriaId;
    if (opciones.page !== undefined) params.page = opciones.page;
    if (opciones.size) params.size = opciones.size;

    const res = await firstValueFrom(
      this.http.get<ApiResponse<PaginatedResponse<CursoResponse>>>(this.baseUrl, { params })
    );
    return res.data!;
  }

  /** Obtiene el detalle de un curso por su slug. */
  async obtenerPorSlug(slug: string): Promise<CursoResponse> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<CursoResponse>>(`${this.baseUrl}/${slug}`)
    );
    return res.data!;
  }

  /** Lista categorías activas. */
  async listarCategorias(): Promise<CategoriaResponse[]> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<CategoriaResponse[]>>(`${environment.apiUrl}/categorias`)
    );
    return res.data || [];
  }

  // === ESTRUCTURA DEL CURSO ===

  /** Obtiene la estructura completa del curso (unidades → módulos → lecciones). */
  async obtenerEstructura(cursoSlug: string): Promise<EstructuraCursoResponse> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<EstructuraCursoResponse>>(
        `${environment.apiUrl}/gestion/cursos/${cursoSlug}/estructura`
      )
    );
    return res.data!;
  }
}

// === INTERFACES ===

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface CursoResponse {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string;
  imagenPortada: string | null;
  nivel: string;
  duracionHoras: number;
  precio: number;
  precioPrevio: number | null;
  estado: string;
  publicadoEn: string | null;
  categoria: CategoriaBasicaResponse | null;
  docenteId: string | null;
  docenteNombre: string | null;
  totalEstudiantes: number;
  promedioCalificacion: number;
  requisitos: string[];
  objetivos: string[];
  etiquetas: string[];
}

export interface CategoriaResponse {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  icono: string | null;
  color: string | null;
  orden: number;
  activo: boolean;
}

export interface CategoriaBasicaResponse {
  id: string;
  nombre: string;
  slug: string;
}

export interface EstructuraCursoResponse {
  cursoId: string;
  slug: string;
  titulo: string;
  unidades: UnidadResponse[];
}

export interface UnidadResponse {
  id: string;
  numero: number;
  titulo: string;
  descripcion: string | null;
  xpOtorgado: number;
  publicado: boolean;
  modulos: ModuloResponse[];
}

export interface ModuloResponse {
  id: string;
  numero: number;
  titulo: string;
  descripcion: string | null;
  xpOtorgado: number;
  publicado: boolean;
  lecciones: LeccionResponse[];
}

export interface LeccionResponse {
  id: string;
  numero: number;
  titulo: string;
  descripcion: string | null;
  tipoContenido: string | null;
  duracionMinutos: number | null;
  xpOtorgado: number;
  publicado: boolean;
  requeridoAprobacion: boolean;
  completada: boolean;
}
