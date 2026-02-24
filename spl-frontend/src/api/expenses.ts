import request from './client';

export type SplitType = 'EQUAL' | 'EXACT' | 'PERCENTAGE';

// customSplits entries — value means ₹ amount for EXACT, percentage for PERCENTAGE
export interface SplitInput {
  userId: number | string;
  value: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  splitType: SplitType;
  paidBy: { id: string; name: string };
  createdAt: string;
  splits: Array<{
    user: { id: string; name: string };
    amount: number;
  }>;
}

export interface CreateExpensePayload {
  groupId: string;
  description: string;
  amount: number;
  splitType: SplitType;
  customSplits?: SplitInput[];
}

// README: getGroupExpenses is registered as POST in the router
export function getGroupExpenses(groupId: string): Promise<Expense[]> {
  return request<{ expenses: Expense[] }>(`/expenses/group/${groupId}`, { method: 'POST' }).then(
    (r) => r.expenses,
  );
}

export function createExpense(payload: CreateExpensePayload): Promise<Expense> {
  return request<{ expense: Expense }>('/expenses', {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((r) => r.expense);
}
