import { ArrowUpRight, ArrowDownRight, Edit3, Trash2, ArrowRight } from 'lucide-react';
import { formatINR, formatDate } from '../../utils/formatters';

export default function RecentTransactionsTable({
  transactions,
  onEdit,
  onDelete,
  onViewAll
}) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="card-empty-state">
        <p className="empty-title">No transactions recorded</p>
        <p className="empty-subtitle">Click "Add Transaction" to log your first income or expense.</p>
      </div>
    );
  }

  return (
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
          {transactions.map((tx) => {
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
                      onClick={() => onEdit(tx)}
                      title="Edit transaction"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn text-danger"
                      onClick={() => onDelete(tx)}
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

      {onViewAll && (
        <div className="table-footer-action">
          <button type="button" className="btn-link flex-center gap-1" onClick={onViewAll}>
            <span>View All Transaction History</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
