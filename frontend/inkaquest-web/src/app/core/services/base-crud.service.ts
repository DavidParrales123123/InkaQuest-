// @ts-nocheck
/**
 * Servicio base genérico para operaciones CRUD.
 *
 * Reduce duplicación de código al proveer métodos estándar para:
 * - Listar recursos con filtros
 * - Obtener un recurso por ID
 * - Crear un recurso
 * - Actualizar un recurso
 * - Eliminar un recurso
 *
 * Uso:
 * ```typescript
 * @Injectable({ providedIn: 'root' })
 * export class CursoService extends BaseCrudService<Curso, CursoCrear, CursoActualizar> {
 *   protected readonly endpoint = 'cursos';
 *
 *   // Métodos específicos adicionales...
 * }
 * ```
 */
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';

/**
 * Contrato de respuesta estándar del backend.
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
  path?: string;
  errors?: Record<string, string>;
}

/**
 * Clase base abstracta para servicios CRUD.
 *
 * @template T Tipo del modelo de dominio
 * @template TCreate Tipo del DTO de creación (por defecto Partial<T>)
 * @template TUpdate Tipo del DTO de actualización (por defecto Partial<T>)
 */
export abstract class BaseCrudService<T, TCreate = Partial<T>, TUpdate = Partial<T>> {
  protected readonly http = inject(HttpClient);

  /**
   * Endpoint del recurso (sin /api/v1 ni trailing slash).
   * Debe ser definido por cada servicio concreto.
   *
   * Ejemplo: 'cursos', 'actividades', 'tareas'
   */
  protected abstract readonly endpoint: string;

  /**
   * URL base completa del recurso.
   */
  protected get baseUrl(): string {
    return `${environment.apiUrl}/${this.endpoint}`;
  }

  /**
   * Lista todos los recursos con filtros opcionales.
   *
   * @param params Objeto con parámetros de query (filtros, paginación, etc.)
   * @returns Promise con array de recursos
   */
  async listar(params?: Record<string, any>): Promise<T[]> {
    let httpParams = new HttpParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }

    const res = await firstValueFrom(
      this.http.get<ApiResponse<T[]>>(this.baseUrl, { params: httpParams })
    );

    return res.data || [];
  }

  /**
   * Obtiene un recurso por su ID.
   *
   * @param id ID del recurso
   * @returns Promise con el recurso
   * @throws Error si el recurso no existe (404)
   */
  async obtener(id: string): Promise<T> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<T>>(`${this.baseUrl}/${id}`)
    );

    if (!res.data) {
      throw new Error('Recurso no encontrado');
    }

    return res.data;
  }

  /**
   * Crea un nuevo recurso.
   *
   * @param data Datos del recurso a crear
   * @returns Promise con el recurso creado
   */
  async crear(data: TCreate): Promise<T> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<T>>(this.baseUrl, data)
    );

    if (!res.data) {
      throw new Error('Error al crear el recurso');
    }

    return res.data;
  }

  /**
   * Actualiza un recurso existente.
   *
   * @param id ID del recurso a actualizar
   * @param data Datos a actualizar (parciales)
   * @returns Promise con el recurso actualizado
   */
  async actualizar(id: string, data: TUpdate): Promise<T> {
    const res = await firstValueFrom(
      this.http.put<ApiResponse<T>>(`${this.baseUrl}/${id}`, data)
    );

    if (!res.data) {
      throw new Error('Error al actualizar el recurso');
    }

    return res.data;
  }

  /**
   * Elimina un recurso.
   *
   * @param id ID del recurso a eliminar
   * @returns Promise que se resuelve cuando se elimina
   */
  async eliminar(id: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`)
    );
  }

  /**
   * Actualización parcial (PATCH).
   *
   * @param id ID del recurso
   * @param data Datos parciales a actualizar
   * @returns Promise con el recurso actualizado
   */
  async actualizarParcial(id: string, data: Partial<T>): Promise<T> {
    const res = await firstValueFrom(
      this.http.patch<ApiResponse<T>>(`${this.baseUrl}/${id}`, data)
    );

    if (!res.data) {
      throw new Error('Error al actualizar el recurso');
    }

    return res.data;
  }
}
