import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

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
  private readonly baseUrl = `${environment.apiUrl}/pedidos`;
  private readonly cuponesUrl = `${environment.apiUrl}/cupones`;

  // === PEDIDOS ===

  /** Inicia la compra de un curso (crea pedido pendiente). */
  async iniciarCompra(datos: {
    cursoId: string;
    codigoCupon?: string;
  }): Promise<PedidoResponse> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<PedidoResponse>>(
        `${this.baseUrl}/iniciar`,
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
