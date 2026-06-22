const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const getCsrfToken = (): string => {
  const name = 'csrftoken';
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
  return '';
};

const originalFetch = window.fetch;
const fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const initCopy = init ? { ...init } : {};
  const method = initCopy.method || 'GET';
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    const headers = { ...(initCopy.headers as Record<string, string>) };
    const token = getCsrfToken();
    if (token) {
      headers['X-CSRFToken'] = token;
    }
    initCopy.headers = headers;
  }
  return originalFetch(input, initCopy);
};

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
  warning_threshold?: number;
  critical_threshold?: number;
}

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface BalanceSummary {
  balance: number;
  month_income: number;
  month_expense: number;
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
  getTransactions: async (filters?: {
    search?: string;
    category_id?: string;
    transaction_type?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<Transaction[]> => {
    const cleanFilters: any = {};
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          cleanFilters[key] = val;
        }
      });
    }
    const params = new URLSearchParams(cleanFilters).toString();
    const url = params
      ? `${API_BASE_URL}/finance/api/transactions/?${params}`
      : `${API_BASE_URL}/finance/api/transactions/`;
    const res = await fetch(url, {
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

  createBulkTransactions: async (transactions: any[]): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/finance/api/transactions/bulk/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(transactions),
      credentials: 'include',
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || errData.detail || 'Error uploading transactions');
    }
    return res.json();
  },

  updateTransaction: async (id: number, data: any): Promise<Transaction> => {
    const res = await fetch(`${API_BASE_URL}/finance/api/transactions/${id}/update/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to update transaction');
    return res.json();
  },

  deleteTransaction: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/finance/api/transactions/${id}/delete/`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete transaction');
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

  updateCategory: async (id: number, data: { name: string; icon?: string }): Promise<Category> => {
    const res = await fetch(`${API_BASE_URL}/finance/api/categories/${id}/update/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to update category');
    return res.json();
  },

  deleteCategory: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/finance/api/categories/${id}/delete/`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete category');
  },

  // Budgets
  getBudgets: async (): Promise<Budget[]> => {
    const res = await fetch(`${API_BASE_URL}/budget/api/budgets/`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch budgets');
    return res.json();
  },

  createBudget: async (data: { 
    category: number; 
    amount: number; 
    month: number; 
    year: number; 
    warning_threshold?: number;
    critical_threshold?: number;
  }): Promise<Budget> => {
    const res = await fetch(`${API_BASE_URL}/budget/api/budgets/create/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create budget');
    }
    return res.json();
  },

  updateBudget: async (id: number, data: { 
    amount: number; 
    warning_threshold?: number;
    critical_threshold?: number;
  }): Promise<Budget> => {
    const res = await fetch(`${API_BASE_URL}/budget/api/budgets/${id}/update/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update budget');
    }
    return res.json();
  },

  deleteBudget: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/budget/api/budgets/${id}/delete/`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete budget');
  },

  getBudgetHistory: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE_URL}/budget/api/budgets/history/`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch budget history');
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

  deleteNotification: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/budget/api/notifications/${id}/delete/`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete notification');
  },

  clearAllNotifications: async (): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/budget/api/notifications/clear/`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to clear notifications');
  },

  // Dashboard Stats
  getBalance: async (): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/finance/api/balance/`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch balance');
    return res.json();
  },

  getTotalBalance: async (): Promise<BalanceSummary> => {
    const res = await fetch(`${API_BASE_URL}/finance/api/total-balance/`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch total balance summary');
    return res.json();
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

  verifyEmail: async (data: { email: string; code: string }): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/api/verify-email/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to verify email');
    }
    return res.json();
  },

  resendCode: async (data: { email: string }): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/api/resend-code/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to resend code');
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

  firebaseLogin: async (idToken: string): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/api/firebase-login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      credentials: 'include',
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to login with Google');
    }
    return res.json();
  },

  updateGoal: async (id: number, data: Partial<SavingsGoal>): Promise<SavingsGoal> => {
    const res = await fetch(`${API_BASE_URL}/goals/api/goals/${id}/update/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update goal');
    }
    return res.json();
  },

  updateProfile: async (data: {
    monthly_budget?: number;
    alert_at_80_percent?: boolean;
    alert_at_100_percent?: boolean;
    timezone?: string;
    personal_activity?: string;
    tastes?: string;
    monthly_income?: number;
    is_survey_completed?: boolean;
  }): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/api/profile/update/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update profile');
    }
    return res.json();
  },
};

export default api;
