import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ordersApi } from './api';
import type {
  AddOrderItemInput,
  AmendOrderInput,
  CancelOrderInput,
  OrderCreateInput,
  OrderListParams,
  OrderUpdateInput,
} from './types';

export const ordersKeys = {
  all: ['orders'] as const,
  list: (params: OrderListParams) => ['orders', 'list', params] as const,
  detail: (idOrCode: string) => ['orders', 'detail', idOrCode] as const,
};

export function useOrdersList(params: OrderListParams) {
  return useQuery({
    queryKey: ordersKeys.list(params),
    queryFn: () => ordersApi.list(params),
  });
}

export function useOrderDetail(idOrCode: string | null) {
  return useQuery({
    queryKey: ordersKeys.detail(idOrCode ?? ''),
    queryFn: () => ordersApi.get(idOrCode as string),
    enabled: Boolean(idOrCode),
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: OrderCreateInput) => ordersApi.create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: OrderUpdateInput }) =>
      ordersApi.update(id, input),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: ordersKeys.all });
      void qc.invalidateQueries({ queryKey: ordersKeys.detail(variables.id) });
    },
  });
}

export function useAddOrderItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AddOrderItemInput }) =>
      ordersApi.addItem(id, input),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: ordersKeys.detail(variables.id) });
      void qc.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });
}

export function useRemoveOrderItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, itemId }: { id: string; itemId: string }) =>
      ordersApi.removeItem(id, itemId),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: ordersKeys.detail(variables.id) });
      void qc.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });
}

export function useValidateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ordersApi.validate(id),
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: ordersKeys.all });
      void qc.invalidateQueries({ queryKey: ordersKeys.detail(id) });
    },
  });
}

export function useDeliverOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ordersApi.deliver(id),
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: ordersKeys.all });
      void qc.invalidateQueries({ queryKey: ordersKeys.detail(id) });
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CancelOrderInput }) =>
      ordersApi.cancel(id, input),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: ordersKeys.all });
      void qc.invalidateQueries({ queryKey: ordersKeys.detail(variables.id) });
    },
  });
}

export function useAmendOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AmendOrderInput }) =>
      ordersApi.amend(id, input),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: ordersKeys.all });
      void qc.invalidateQueries({ queryKey: ordersKeys.detail(variables.id) });
    },
  });
}
