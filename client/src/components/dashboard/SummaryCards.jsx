import { Wallet, TrendingUp, TrendingDown, Receipt } from 'lucide-react';
import { formatINR } from '../../utils/formatters';

export default function SummaryCards({ totalBalance, totalIncome, totalExpenses, transactionCount }) {
  const isBalancePositive = !String(totalBalance).startsWith('-');

  return (
    <div className="summary-grid">
      {/* 1. Total Balance */}
      <div className="card summary-card balance-card">
        <div className="summary-card-header">
          <span className="summary-card-title">Total Balance</span>
          <div className="summary-icon-box icon-balance">
            <Wallet size={20} />
          </div>
        </div>
        <div className="summary-card-body">
          <div className={`summary-card-value ${isBalancePositive ? 'text-balance-pos' : 'text-balance-neg'}`}>
            {formatINR(totalBalance)}
          </div>
          <span className="summary-card-caption">Net savings to date</span>
        </div>
      </div>

      {/* 2. Total Income */}
      <div className="card summary-card income-card">
        <div className="summary-card-header">
          <span className="summary-card-title">Total Income</span>
          <div className="summary-icon-box icon-income">
            <TrendingUp size={20} />
          </div>
        </div>
        <div className="summary-card-body">
          <div className="summary-card-value text-income">
            {formatINR(totalIncome)}
          </div>
          <span className="summary-card-caption">All earnings recorded</span>
        </div>
      </div>

      {/* 3. Total Expenses */}
      <div className="card summary-card expense-card">
        <div className="summary-card-header">
          <span className="summary-card-title">Total Expenses</span>
          <div className="summary-icon-box icon-expense">
            <TrendingDown size={20} />
          </div>
        </div>
        <div className="summary-card-body">
          <div className="summary-card-value text-expense">
            {formatINR(totalExpenses)}
          </div>
          <span className="summary-card-caption">All spendings recorded</span>
        </div>
      </div>

      {/* 4. Transaction Count */}
      <div className="card summary-card count-card">
        <div className="summary-card-header">
          <span className="summary-card-title">Transactions</span>
          <div className="summary-icon-box icon-count">
            <Receipt size={20} />
          </div>
        </div>
        <div className="summary-card-body">
          <div className="summary-card-value">
            {transactionCount}
          </div>
          <span className="summary-card-caption">Total ledger entries</span>
        </div>
      </div>
    </div>
  );
}
