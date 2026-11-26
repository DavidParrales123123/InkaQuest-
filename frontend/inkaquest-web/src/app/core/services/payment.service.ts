// @ts-nocheck
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { SupabaseService } from './supabase.service';

/**
 * Servicio de pagos, pedidos y cupones.
 *
 * FLUJO SEGURO (obligatorio):
 * 1. El estudiante selecciona un curso
 * 2. El backend valida el precio (el frontend nunca es la fuente de verdad)
 * 3. El backend crea el pedido y devuelve los datos para Culqi
 * 4. El backend procesa y verifica la operación
 * 5. La matrícula se activa automáticamente tras pago confirmado
 *
 * El frontend NUNCA guarda números de tarjeta ni CVV, y NO activa matrículas
 * por su cuenta: la seguridad la garantiza el backend y las políticas RLS.
 */
@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly supabase = inject(SupabaseService);
  private readonly client = this.supabase.client;
  private readonly baseUrl = `${environment.apiUrl}/pedidos`;
  private readonly cuponesUrl = `${environment.apiUrl}/cupones`;
  private readonly pagosUrl = `${environment.apiUrl}/pagos`;

  // === PEDIDOS ===

  /** Inicia la compra de un curso con token 3DS o tarjeta guardada. */
  async iniciarCompra(datos: {
    cursoSlug: string;
    codigoCupon?: string;
    culqiToken?: string;
    metodoPagoId?: string;
    claveIdempotencia?: string;
  }): Promise<PedidoResponse> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<PedidoResponse>>(
        `${this.baseUrl}/iniciar`,
        datos
      )
    );
    return res.data!;
  }

  /** Configuración pública de Culqi (llave pública para tokenizar/3DS). */
  async configuracionPago(): Promise<ConfiguracionPago> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<ConfiguracionPago>>(`${this.pagosUrl}/configuracion`),
    );
    return res.data!;
  }

  async listarTarjetas(): Promise<TarjetaGuardada[]> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<TarjetaGuardada[]>>(`${this.pagosUrl}/tarjetas`),
    );
    return res.data || [];
  }

  /** Guarda la tarjeta en el vault de Culqi (solo se envía el token). */
  async guardarTarjeta(tokenId: string): Promise<TarjetaGuardada> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<TarjetaGuardada>>(`${this.pagosUrl}/tarjetas`, { tokenId }),
    );
    return res.data!;
  }

  async eliminarTarjeta(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<ApiResponse<unknown>>(`${this.pagosUrl}/tarjetas/${id}`));
  }

  /** Paga un pedido pendiente con token 3DS o tarjeta guardada. */
  async pagarPedido(numero: string, datos: {
    culqiToken?: string;
    metodoPagoId?: string;
  }): Promise<PedidoResponse> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<PedidoResponse>>(
        `${this.baseUrl}/${encodeURIComponent(numero)}/pagar`,
        datos
      )
    );
    return res.data!;
  }

  /** Obtiene los pedidos del usuario autenticado. */
  async misPedidos(): Promise<PedidoResponse[]> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<PedidoResponse[]>>(`${this.baseUrl}/yo`)
    );
    return res.data || [];
  }

  /** Obtiene el detalle de un pedido por su número. */
  async obtenerPedido(numero: string): Promise<PedidoResponse> {
    const res = await firstValueFrom(
      this.http.get<ApiResponse<PedidoResponse>>(`${this.baseUrl}/${numero}`)
    );
    return res.data!;
  }

  // === CONSULTA (Supabase + RLS) ===

  /** Pedidos del estudiante autenticado (filtra por RLS). */
  async listarPedidos(usuarioId?: string): Promise<PedidoResponse[]> {
    let consulta = this.client
      .from(this.supabase.tabla.pedido)
      .select('*')
      .order('creado_en', { ascending: false });
    if (usuarioId) consulta = consulta.eq('usuario_id', usuarioId);

    const { data, error } = await consulta;
    if (error) {
      console.error('[InkaQuest] Error cargando pedidos:', error.message);
      return [];
    }
    return (data ?? []) as PedidoResponse[];
  }

  /** Transacciones del estudiante autenticado. */
  async listarTransacciones(usuarioId?: string): Promise<TransaccionResponse[]> {
    let consulta = this.client
      .from(this.supabase.tabla.transaccion)
      .select('*')
      .order('creado_en', { ascending: false });
    if (usuarioId) consulta = consulta.eq('usuario_id', usuarioId);

    const { data, error } = await consulta;
    if (error) {
      console.error('[InkaQuest] Error cargando transacciones:', error.message);
      return [];
    }
    return (data ?? []) as TransaccionResponse[];
  }

  /** Reembolsos del estudiante autenticado. */
  async listarReembolsos(usuarioId?: string): Promise<ReembolsoResponse[]> {
    let consulta = this.client
      .from(this.supabase.tabla.reembolso)
      .select('*')
      .order('creado_en', { ascending: false });
    if (usuarioId) consulta = consulta.eq('usuario_id', usuarioId);

    const { data, error } = await consulta;
    if (error) {
      console.error('[InkaQuest] Error cargando reembolsos:', error.message);
      return [];
    }
    return (data ?? []) as ReembolsoResponse[];
  }

  // === CUPONES ===

  /** Valida un cupón y calcula el descuento aplicable. */
  async validarCupon(codigo: string, subtotal: number): Promise<CuponValidacionResponse> {
    const params = { codigo, subtotal: subtotal.toString() };
    const res = await firstValueFrom(
      this.http.get<ApiResponse<CuponValidacionResponse>>(
        `${this.cuponesUrl}/validar`,
        { params }
      )
    );
    return res.data!;
  }
}

// === INTERFACES ===

export interface TransaccionResponse {
  id: string;
  pedido_id: string;
  usuario_id: string;
  estado: string;
  metodo: string;
  monto: number;
  moneda: string;
  proveedor: string;
  referencia: string | null;
  codigo_autorizacion: string | null;
  creado_en: string;
}

export interface ReembolsoResponse {
  id: string;
  transaccion_id: string;
  pedido_id: string | null;
  usuario_id: string;
  estado: string;
  monto: number;
  moneda: string;
  motivo: string | null;
  creado_en: string;
}

export interface PedidoResponse {
  id: string;
  numero: string;
  usuarioId: string;
  estado: string;
  subtotal: number;
  descuento: number;
  total: number;
  moneda: string;
  codigoCupon: string | null;
  creadoEn: string;
  pagadoEn: string | null;
  canceladoEn: string | null;
  items: ItemPedidoResponse[];
  culqiChargeId: string | null;
  culqiMetodoPago: string | null;
}

export interface ConfiguracionPago {
  publicKey: string;
  moneda: string;
  habilitado: boolean;
}

/** Solo metadata no sensible; el PAN y el CVV viven en Culqi. */
export interface TarjetaGuardada {
  id: string;
  marca: string | null;
  ultimos4: string;
  mesExpiracion: number | null;
  anioExpiracion: number | null;
  activo: boolean;
  creadoEn: string;
}

export interface ItemPedidoResponse {
  id: string;
  cursoId: string;
  cursoTitulo: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
}

export interface CuponValidacionResponse {
  valido: boolean;
  mensaje: string;
  cuponId: string | null;
  codigo: string | null;
  tipo: string | null;
  valor: number | null;
  descuentoCalculado: number | null;
  totalFinal: number | null;
}
