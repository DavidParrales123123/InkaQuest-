import { Injectable, inject } from '@angular/core';

import { SupabaseService } from './supabase.service';
import { CompraVirtual, Inventario, TiendaItem } from '../models/domain.models';

/**
 * Servicio de recompensas y tienda virtual.
 *
 * <p><b>Limite de autorizacion:</b> la escritura en {@code compra_virtual},
 * {@code inventario} y {@code monedero} esta reservada al administrador en la
 * RLS. Por eso la compra desde la interfaz debe pasar por el backend, que
 * valida el saldo y registra la operacion. El frontend solo consulta el
 * catalogo y el inventario; el contrato del endpoint de compra queda
 * documentado como dependencia pendiente.</p>
 */
@Injectable({ providedIn: 'root' })
export class RewardService {
  private readonly supabase = inject(SupabaseService);

  /** Catalogo activo de la tienda. */
  async listarTienda(): Promise<TiendaItem[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.tiendaItem)
      .select('*')
      .eq('activo', true)
      .order('nombre');

    if (error) {
      throw new Error(error.message);
    }
    return (data ?? []) as TiendaItem[];
  }

  /** Detalle de un articulo de la tienda. */
  async obtenerItem(id: string): Promise<TiendaItem | null> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.tiendaItem)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    return (data as TiendaItem) ?? null;
  }

  /** Inventario del usuario, con el articulo incluido. */
  async listarInventario(usuarioId: string): Promise<(Inventario & { item: TiendaItem | null })[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.inventario)
      .select('*, item:tienda_item(*)')
      .eq('usuario_id', usuarioId)
      .order('adquirido_en', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }
    const filas = (data ?? []) as (Inventario & { item?: TiendaItem | TiendaItem[] | null })[];
    return filas.map((f) => {
      const raw = f.item;
      const item = Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null);
      return { ...f, item } as Inventario & { item: TiendaItem | null };
    });
  }

  /** Historial de compras virtuales del usuario. */
  async listarCompras(usuarioId: string): Promise<CompraVirtual[]> {
    const { data, error } = await this.supabase.client
      .from(this.supabase.tabla.compraVirtual)
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('creado_en', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }
    return (data ?? []) as CompraVirtual[];
  }
}
