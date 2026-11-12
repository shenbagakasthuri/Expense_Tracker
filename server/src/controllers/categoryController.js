import { getCategoriesByUserId } from '../models/categoryModel.js';

/**
 * GET /api/categories
 * Retrieves all categories belonging strictly to the authenticated user.
 */
export async function getCategoriesHandler(req, res, next) {
  try {
    const userId = req.user.id;
    const categories = await getCategoriesByUserId(userId);

    return res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
}
