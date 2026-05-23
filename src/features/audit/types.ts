export interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorUserId: string | null;
  actorRole: string | null;
  summary: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditListParams {
  action?: string;
  entityType?: string;
  entityId?: string;
  actorUserId?: string;
  from?: string; // YYYY-MM-DD
  to?: string;
  page?: number;
  perPage?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}
