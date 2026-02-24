import request from './client';

export interface Settlement {
  id: number;
  groupId: number;
  groupName?: string;
  fromUser: { id: number; name: string };
  toUser: { id: number; name: string };
  amount: number;
  status: 'PENDING' | 'COMPLETED';
  createdAt: string;
}

export interface CreateSettlementPayload {
  groupId: number | string;
  toUser: number | string; // API field is "toUser", not "toUserId"
  amount: number;
  note?: string;
}

export function getSettlements(): Promise<Settlement[]> {
  return request<{ settlements: Settlement[] }>('/settlements').then((r) => r.settlements);
}

export function createSettlement(payload: CreateSettlementPayload): Promise<Settlement> {
  return request<{ settlement: Settlement }>('/settlements', {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((r) => r.settlement);
}

export function completeSettlement(id: number | string): Promise<Settlement> {
  return request<{ settlement: Settlement }>(`/settlements/${id}/complete`, {
    method: 'PATCH',
  }).then((r) => r.settlement);
}
