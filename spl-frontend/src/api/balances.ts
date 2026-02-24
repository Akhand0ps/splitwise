import request from './client';

// Balance per user within a group as returned by the API
export interface Balance {
  user: { id: number; name: string };
  amount: number; // positive = owed, negative = owes
  status: 'owed' | 'owes';
}

// Suggested settlement transaction
export interface SuggestedTransaction {
  from: { id?: number; name: string };
  to: { id?: number; name: string };
  amount: number;
}

// GET /api/v1/balances/group/:groupId
export interface GroupBalances {
  balances: Balance[];
  transactions: SuggestedTransaction[];
}

// GET /api/v1/balances/me
export interface MyBalanceGroup {
  group: { id: number; name: string };
  balance: number;
  status: 'owed' | 'owes';
}
export interface MyBalancesResponse {
  overall: number;
  groups: MyBalanceGroup[];
}

export function getGroupBalances(groupId: number | string): Promise<GroupBalances> {
  return request<GroupBalances>(`/balances/group/${groupId}`);
}

export function getMyBalances(): Promise<MyBalancesResponse> {
  return request<MyBalancesResponse>('/balances/me');
}
