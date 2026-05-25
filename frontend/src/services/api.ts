const API_BASE_URL = '';

export interface Category {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
}

export interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  category: number;
  category_name: string;
  category_icon?: string | null;
  description: string;
  date: string;
  created_at: string;
}

export interface Budget {
  id: number;
  category: number;
  category_name: string;
  category_icon?: string | null;
  amount: number;
  spent: number;
  percentage: number;
  month: number;
  year: number;
}

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface SavingsGoal {
  id: number;
  name: string;
  description: string;
  icon: string;
  target_amount: number;
  current_amount: number;
  remaining_amount: number;
  progress_percent: number;
  deadline: string | null;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
}

// Helper for formatted amounts (dots to number)
export const parseAmount = (formatted: string): number => {
  return parseFloat(formatted.replace(/\./g, ''));
};

const api = {
  // Finance
  getTransactions: async (): Promise<Transaction[]> => {
    const res = await fetch(`${API_BASE_URL}/finance/api/transactions/`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  },
  
  createTransaction: async (data: any): Promise<Transaction> => {
    const res = await fetch(`${API_BASE_URL}/finance/api/transactions/create/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to create transaction');
    return res.json();
  },

  getCategories: async (): Promise<Category[]> => {
    const res = await fetch(`${API_BASE_URL}/finance/api/categories/`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  createCategory: async (data: { name: string; icon?: string }): Promise<Category> => {
    const res = await fetch(`${API_BASE_URL}/finance/api/categories/create/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to create category');
    return res.json();
  },

  // Budgets
  getBudgets: async (): Promise<Budget[]> => {
    const res = await fetch(`${API_BASE_URL}/budget/api/budgets/`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch budgets');
    return res.json();
  },

  // Notifications
  getNotifications: async (): Promise<AppNotification[]> => {
    const res = await fetch(`${API_BASE_URL}/budget/api/notifications/`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  markNotificationRead: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/budget/api/notifications/${id}/read/`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to mark notification as read');
  },

  // Dashboard Stats
  getBalance: async (): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/finance/api/balance/`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch balance');
    return res.json();
  },

  getTotalBalance: async (): Promise<number> => {
    const res = await fetch(`${API_BASE_URL}/finance/api/total-balance/`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch total balance');
    const data = await res.json();
    return data.balance as number;
  },

  getExpensesByCategory: async (): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/finance/api/expenses-by-category/`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch expenses by category');
    return res.json();
  },

  // Authentication APIs
  login: async (data: any): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/api/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to login');
    }
    return res.json();
  },

  register: async (data: any): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/api/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to register');
    }
    return res.json();
  },

  logout: async (): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/api/logout/`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to logout');
    return res.json();
  },

  me: async (): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/api/me/`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  },

  // Goals
  getGoals: async (): Promise<SavingsGoal[]> => {
    const res = await fetch(`${API_BASE_URL}/goals/api/goals/`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch goals');
    return res.json();
  },

  createGoal: async (data: {
    name: string;
    description?: string;
    icon?: string;
    target_amount: number;
    deadline?: string | null;
  }): Promise<SavingsGoal> => {
    const res = await fetch(`${API_BASE_URL}/goals/api/goals/create/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create goal');
    }
    return res.json();
  },

  depositGoal: async (id: number, amount: number): Promise<SavingsGoal> => {
    const res = await fetch(`${API_BASE_URL}/goals/api/goals/${id}/deposit/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to deposit');
    }
    return res.json();
  },

  deleteGoal: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/goals/api/goals/${id}/delete/`, {
      method: 'DELETE',
      credentials: 'include',
    });
    // 204 = deleted, 404 = already deleted — both are success for the UI
    if (!res.ok && res.status !== 404) throw new Error('Failed to delete goal');
  },
};

export default api;
