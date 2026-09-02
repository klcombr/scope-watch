export interface User {
  id: number;
  email: string;
  name: string;
  plan: 'free' | 'pro';
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ScopeEntry {
  id: number;
  project_id: number;
  text: string;
  created_at: string;
}

export interface RequestItem {
  id: number;
  project_id: number;
  text: string;
  classification: 'IN_SCOPE' | 'OUT_OF_SCOPE' | 'DISCUSS';
  status: 'OPEN' | 'RESOLVED';
  created_at: string;
  change_order_id: number | null;
}

export interface ChangeOrder {
  id: number;
  project_id: number;
  title: string;
  description: string;
  hours: number;
  rate: number;
  amount: number;
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'PAID';
  share_token: string;
  created_at: string;
  decided_at: string | null;
  requests: RequestItem[];
}

export interface Project {
  id: number;
  user_id: number;
  title: string;
  status: 'active' | 'completed' | 'archived';
  hourly_rate: number;
  notes: string;
  created_at: string;
  updated_at: string;
  scope_entries: ScopeEntry[];
  requests: RequestItem[];
  change_orders: ChangeOrder[];
}

export interface ProjectStats {
  project_id: number;
  in_scope_count: number;
  out_of_scope_count: number;
  open_requests_count: number;
  change_orders_total: number;
  approved_amount: number;
  paid_amount: number;
  pending_amount: number;
}

export const CLASSIFICATION_LABELS: Record<RequestItem['classification'], string> = {
  IN_SCOPE: 'Em escopo',
  OUT_OF_SCOPE: 'Fora de escopo',
  DISCUSS: 'Em discussão',
};

export const ORDER_STATUS_LABELS: Record<ChangeOrder['status'], string> = {
  DRAFT: 'Rascunho',
  SENT: 'Enviada',
  APPROVED: 'Aprovada',
  REJECTED: 'Rejeitada',
  PAID: 'Paga',
};