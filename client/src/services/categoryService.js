import api from './api';

/**
 * Category Service
 * Communicates with /api/categories endpoints.
 */
export const categoryService = {
  /**
   * Fetch categories belonging to the authenticated user
   */
  async getCategories() {
    const res = await api.get('/categories');
    return res.data;
  }
};
