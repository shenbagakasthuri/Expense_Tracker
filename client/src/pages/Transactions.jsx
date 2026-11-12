import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Edit3,
  Trash2,
  Calendar,
  X
} from 'lucide-react';
import { formatINR, formatDate } from '../utils/formatters';

export default function Transactions({
  transactions,
  categories,
  loading,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
  filters,
  onFilterChange,
  onResetFilters
}) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter transactions in-memory by search term
  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) return transactions;
    const term = searchTerm.toLowerCase();

    return transactions.filter((t) => {
      const matchDesc = t.description?.toLowerCase().includes(term);
      const matchCat = t.category_name?.toLowerCase().includes(term);
      const matchAmount = String(t.amount).includes(term);
      return matchDesc || matchCat || matchAmount;
    });
  }, [transactions, searchTerm]);

  return (
    <div className="transactions-page">
      {/* Action and Filter Controls Bar */}
      <div className="card filters-card">
        <div className="filters-grid">
          {/* Search bar */}
          <div className="filter-item search-box">
            <div className="input-wrapper">
              <Search className="input-icon" size={16} />
              <input
                type="text"
                className="form-input with-icon"
                placeholder="Search by description, category, or amount..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="input-clear-btn"
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Type Filter */}
          <div className="filter-item">
            <select
              name="type"
              className="form-select"
              value={filters.type || ''}
              onChange={(e) => onFilterChange('type', e.target.value)}
            >
              <option value="">All Types (Income & Expense)</option>
              <option value="INCOME">Income Only</option>
              <option value="EXPENSE">Expense Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="filter-item">
            <select
              name="category_id"
              className="form-select"
              value={filters.category_id || ''}
              onChange={(e) => onFilterChange('category_id', e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="filter-item date-item">
            <label className="filter-label">From:</label>
            <input
              type="date"
              name="start_date"
              className="form-input form-input-sm"
              value={filters.start_date || ''}
              onChange={(e) => onFilterChange('start_date', e.target.value)}
            />
          </div>

          {/* End Date */}
          <div className="filter-item date-item">
            <label className="filter-label">To:</label>
            <input
              type="date"
              name="end_date"
              className="form-input form-input-sm"
              value={filters.end_date || ''}
              onChange={(e) => onFilterChange('end_date', e.target.value)}
            />
          </div>

          {/* Filter Reset Button */}
          {(filters.type || filters.category_id || filters.start_date || filters.end_date) && (
            <div className="filter-item">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onResetFilters}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Transactions Table Card */}
      <div className="card mt-4">
        <div className="card-header flex-between">
          <div>
            <h3 className="card-title">Transaction History</h3>
            <span className="card-subtitle">
              Showing {filteredTransactions.length} of {transactions.length} records
            </span>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onOpenAddModal}
          >
            <Plus size={16} />
            <span>Add Transaction</span>
          </button>
        </div>

        <div className="card-body p-0">
          {filteredTransactions.length === 0 ? (
            <div className="card-empty-state">
              <p className="empty-title">No transactions found</p>
              <p className="empty-subtitle">
                {searchTerm || filters.type || filters.category_id || filters.start_date
                  ? 'No entries match your search or filter criteria.'
                  : 'Start by clicking "Add Transaction" to create an income or expense record.'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Description</th>
                    <th className="text-right">Amount</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => {
                    const isIncome = tx.type === 'INCOME';
                    return (
                      <tr key={tx.id}>
                        <td>
                          <span className={`badge ${isIncome ? 'badge-income' : 'badge-expense'}`}>
                            {isIncome ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            <span>{tx.type}</span>
                          </span>
                        </td>
                        <td>
                          <span className="font-medium text-main">{tx.category_name}</span>
                        </td>
                        <td className="text-muted">{formatDate(tx.transaction_date)}</td>
                        <td className="text-desc">{tx.description || '—'}</td>
                        <td className={`text-right font-semibold ${isIncome ? 'text-income' : 'text-expense'}`}>
                          {isIncome ? '+' : '-'}{formatINR(tx.amount)}
                        </td>
                        <td className="text-center">
                          <div className="table-action-group">
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => onEditTransaction(tx)}
                              title="Edit transaction"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              type="button"
                              className="icon-btn text-danger"
                              onClick={() => onDeleteTransaction(tx)}
                              title="Delete transaction"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
