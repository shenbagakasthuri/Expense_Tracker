import api from './api';

/**
 * Transaction Service
 * Communicates with /api/transactions endpoints.
 */
export const transactionService = {
  /**
   * Fetch all transactions with optional filters
   * @param {{ type?: string, category_id?: number, start_date?: string, end_date?: string }} filters
   */
  async getTransactions(filters = {}) {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.category_id) params.append('category_id', filters.category_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);

    const res = await api.get(`/transactions?${params.toString()}`);
    return res.data;
  },

  /**
   * Fetch a single transaction by ID
   * @param {number|string} id
   */
  async getTransactionById(id) {
    const res = await api.get(`/transactions/${id}`);
    return res.data;
  },

  /**
   * Create a new transaction
   * @param {{ category_id: number, amount: string|number, description?: string, transaction_date: string }} data
   */
  async createTransaction(data) {
    const res = await api.post('/transactions', data);
    return res.data;
  },

  /**
   * Update an existing transaction
   * @param {number|string} id
   * @param {{ category_id: number, amount: string|number, description?: string, transaction_date: string }} data
   */
  async updateTransaction(id, data) {
    const res = await api.put(`/transactions/${id}`, data);
    return res.data;
  },

  /**
   * Delete a transaction
   * @param {number|string} id
   */
  async deleteTransaction(id) {
    const res = await api.delete(`/transactions/${id}`);
    return res.data;
  }
};
