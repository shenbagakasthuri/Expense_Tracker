import { useState, useEffect } from 'react';
import { X, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { transactionService } from '../../services/transactionService';

export default function TransactionModal({
  isOpen,
  onClose,
  onSuccess,
  categories,
  initialData = null
}) {
  const isEditing = !!initialData;

  const [formData, setFormData] = useState({
    type: 'EXPENSE',
    category_id: '',
    amount: '',
    transaction_date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Populate form if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type || 'EXPENSE',
        category_id: String(initialData.category_id || ''),
        amount: String(initialData.amount || ''),
        transaction_date: initialData.transaction_date || new Date().toISOString().split('T')[0],
        description: initialData.description || ''
      });
    } else {
      // Reset form
      setFormData({
        type: 'EXPENSE',
        category_id: '',
        amount: '',
        transaction_date: new Date().toISOString().split('T')[0],
        description: ''
      });
    }
    setError('');
  }, [initialData, isOpen]);

  // Filter categories by selected type (INCOME or EXPENSE)
  const filteredCategories = categories.filter((c) => c.type === formData.type);

  // Auto-select first matching category if current selection is invalid for new type
  useEffect(() => {
    if (filteredCategories.length > 0) {
      const currentValid = filteredCategories.some(
        (c) => String(c.id) === String(formData.category_id)
      );
      if (!currentValid) {
        setFormData((prev) => ({
          ...prev,
          category_id: String(filteredCategories[0].id)
        }));
      }
    }
  }, [formData.type, categories]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleTypeChange = (newType) => {
    setFormData((prev) => ({ ...prev, type: newType }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category_id) {
      setError('Please select a valid category.');
      return;
    }
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      setError('Please enter a positive numeric amount.');
      return;
    }
    if (!formData.transaction_date) {
      setError('Please select a valid transaction date.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        category_id: Number(formData.category_id),
        amount: formData.amount,
        transaction_date: formData.transaction_date,
        description: formData.description
      };

      if (isEditing) {
        await transactionService.updateTransaction(initialData.id, payload);
      } else {
        await transactionService.createTransaction(payload);
      }

      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0] || 'Failed to save transaction.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} aria-modal="true" role="dialog">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEditing ? 'Edit Transaction' : 'Add New Transaction'}</h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Type Toggle: Income vs Expense */}
          <div className="type-toggle-group">
            <button
              type="button"
              className={`type-toggle-btn income-toggle ${formData.type === 'INCOME' ? 'active' : ''}`}
              onClick={() => handleTypeChange('INCOME')}
            >
              <ArrowUpRight size={16} />
              <span>Income</span>
            </button>
            <button
              type="button"
              className={`type-toggle-btn expense-toggle ${formData.type === 'EXPENSE' ? 'active' : ''}`}
              onClick={() => handleTypeChange('EXPENSE')}
            >
              <ArrowDownRight size={16} />
              <span>Expense</span>
            </button>
          </div>

          {/* Amount */}
          <div className="form-group">
            <label className="form-label" htmlFor="tx-amount">Amount (₹)</label>
            <input
              id="tx-amount"
              type="text"
              name="amount"
              className="form-input"
              placeholder="0.00"
              value={formData.amount}
              onChange={handleChange}
              required
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label" htmlFor="tx-category">Category</label>
            <select
              id="tx-category"
              name="category_id"
              className="form-select"
              value={formData.category_id}
              onChange={handleChange}
              required
            >
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="form-group">
            <label className="form-label" htmlFor="tx-date">Transaction Date</label>
            <input
              id="tx-date"
              type="date"
              name="transaction_date"
              className="form-input"
              value={formData.transaction_date}
              onChange={handleChange}
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="tx-desc">
              Description <span className="text-muted">(Optional)</span>
            </label>
            <input
              id="tx-desc"
              type="text"
              name="description"
              className="form-input"
              placeholder="e.g. Weekly grocery run"
              value={formData.description}
              onChange={handleChange}
              maxLength={255}
            />
          </div>

          {/* Modal Actions */}
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="spinner" size={16} />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? 'Save Changes' : 'Create Transaction'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
