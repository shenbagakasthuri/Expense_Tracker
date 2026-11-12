/**
 * Default categories automatically assigned to each newly registered user.
 * 5 Income categories and 10 Expense categories = 15 total default categories.
 */
export const DEFAULT_CATEGORIES = [
  // Income categories
  { name: 'Salary', type: 'INCOME' },
  { name: 'Freelance', type: 'INCOME' },
  { name: 'Business', type: 'INCOME' },
  { name: 'Investments', type: 'INCOME' },
  { name: 'Other Income', type: 'INCOME' },

  // Expense categories
  { name: 'Food', type: 'EXPENSE' },
  { name: 'Transportation', type: 'EXPENSE' },
  { name: 'Shopping', type: 'EXPENSE' },
  { name: 'Bills & Utilities', type: 'EXPENSE' },
  { name: 'Entertainment', type: 'EXPENSE' },
  { name: 'Healthcare', type: 'EXPENSE' },
  { name: 'Education', type: 'EXPENSE' },
  { name: 'Travel', type: 'EXPENSE' },
  { name: 'Rent', type: 'EXPENSE' },
  { name: 'Other Expense', type: 'EXPENSE' }
];
