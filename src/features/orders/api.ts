import { api } from '@shared/api/client';

import type {
  AddOrderItemInput,
  AmendOrderInput,
  CancelOrderInput,
  OrderCreateInput,
  OrderDetail,
  OrderListItem,
  OrderListParams,
  OrderUpdateInput,
  Paginated,
} from './types';

export const ordersApi = {
  async list(params: OrderListParams = {}): Promise<Paginated<OrderListItem>> {
    const { data } = await api.get<Paginated<OrderListItem>>('/orders', { params });
    return data;
  },

  async get(idOrCode: string): Promise<OrderDetail> {
    const { data } = await api.get<OrderDetail>(`/orders/${idOrCode}`);
    return data;
  },

  async create(input: OrderCreateInput): Promise<OrderDetail> {
    const { data } = await api.post<OrderDetail>('/orders', input);
    return data;
  },

  async update(id: string, input: OrderUpdateInput): Promise<OrderDetail> {
    const { data } = await api.patch<OrderDetail>(`/orders/${id}`, input);
    return data;
  },

  async addItem(id: string, input: AddOrderItemInput): Promise<unknown> {
    const { data } = await api.post(`/orders/${id}/items`, input);
    return data;
  },

  async removeItem(id: string, itemId: string): Promise<void> {
    await api.delete(`/orders/${id}/items/${itemId}`);
  },

  async validate(id: string): Promise<OrderDetail> {
    const { data } = await api.post<OrderDetail>(`/orders/${id}/validate`);
    return data;
  },

  async deliver(id: string): Promise<OrderDetail> {
    const { data } = await api.post<OrderDetail>(`/orders/${id}/deliver`);
    return data;
  },

  async cancel(id: string, input: CancelOrderInput): Promise<OrderDetail> {
    const { data } = await api.post<OrderDetail>(`/orders/${id}/cancel`, input);
    return data;
  },

  async amend(id: string, input: AmendOrderInput): Promise<OrderDetail> {
    const { data } = await api.post<OrderDetail>(`/orders/${id}/amend`, input);
    return data;
  },
};
