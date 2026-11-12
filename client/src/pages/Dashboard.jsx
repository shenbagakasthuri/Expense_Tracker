import { useState, useMemo } from 'react';
import SummaryCards from '../components/dashboard/SummaryCards';
import { IncomeVsExpenseChart, CategoryExpensePieChart } from '../components/dashboard/DashboardCharts';
import RecentTransactionsTable from '../components/dashboard/RecentTransactionsTable';
import { sumDecimalAmounts, formatINR } from '../utils/formatters';
import { Plus, ArrowRight, Loader2, Sparkles } from 'lucide-react';

export default function Dashboard({
  transactions,
  loading,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
  onNavigateToTransactions
}) {
  // Compute financial totals accurately using exact decimal cents aggregation
  const { totalIncome, totalExpenses, totalBalance } = useMemo(() => {
    const incomeList = transactions.filter((t) => t.type === 'INCOME').map((t) => t.amount);
    const expenseList = transactions.filter((t) => t.type === 'EXPENSE').map((t) => t.amount);

    const inc = sumDecimalAmounts(incomeList);
    const exp = sumDecimalAmounts(expenseList);

    // Balance = Income - Expenses
    const bal = sumDecimalAmounts([inc, `-${exp}`]);

    return { totalIncome: inc, totalExpenses: exp, totalBalance: bal };
  }, [transactions]);

  // Compute monthly trend for Income vs Expense Bar Chart
  const monthlyChartData = useMemo(() => {
    const monthMap = {};

    transactions.forEach((tx) => {
      if (!tx.transaction_date) return;
      // Key: YYYY-MM
      const monthKey = tx.transaction_date.substring(0, 7);
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { name: monthKey, incomeCents: 0, expenseCents: 0 };
      }

      const cents = Math.round(Number(tx.amount) * 100);
      if (tx.type === 'INCOME') {
        monthMap[monthKey].incomeCents += cents;
      } else {
        monthMap[monthKey].expenseCents += cents;
      }
    });

    return Object.keys(monthMap)
      .sort()
      .slice(-6) // Last 6 months
      .map((k) => ({
        name: k,
        income: Number((monthMap[k].incomeCents / 100).toFixed(2)),
        expense: Number((monthMap[k].expenseCents / 100).toFixed(2))
      }));
  }, [transactions]);

  // Compute Category breakdown for Pie Chart
  const categoryPieData = useMemo(() => {
    const catMap = {};

    transactions
      .filter((t) => t.type === 'EXPENSE')
      .forEach((tx) => {
        const name = tx.category_name || 'Other';
        const cents = Math.round(Number(tx.amount) * 100);
        catMap[name] = (catMap[name] || 0) + cents;
      });

    return Object.entries(catMap).map(([name, cents]) => ({
      name,
      value: Number((cents / 100).toFixed(2))
    }));
  }, [transactions]);

  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  if (loading) {
    return (
      <div className="flex-center page-loading-state">
        <Loader2 className="spinner icon-primary" size={32} />
        <p className="loading-text">Loading financial dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* 1. Metric Summary Cards */}
      <SummaryCards
        totalBalance={totalBalance}
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        transactionCount={transactions.length}
      />

      {/* 2. Charts Section */}
      <div className="grid-two-col mt-4">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Income vs Expense Trends</h3>
            <span className="card-subtitle">Monthly financial comparison</span>
          </div>
          <div className="card-body">
            <IncomeVsExpenseChart data={monthlyChartData} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Expense Breakdown by Category</h3>
            <span className="card-subtitle">Where your money goes</span>
          </div>
          <div className="card-body">
            <CategoryExpensePieChart data={categoryPieData} />
          </div>
        </div>
      </div>

      {/* 3. Recent Transactions & Quick Action */}
      <div className="card mt-4">
        <div className="card-header flex-between">
          <div>
            <h3 className="card-title">Recent Transactions</h3>
            <span className="card-subtitle">Latest 5 financial entries</span>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onOpenAddModal}
          >
            <Plus size={14} />
            <span>Add Entry</span>
          </button>
        </div>
        <div className="card-body p-0">
          <RecentTransactionsTable
            transactions={recentTransactions}
            onEdit={onEditTransaction}
            onDelete={onDeleteTransaction}
            onViewAll={onNavigateToTransactions}
          />
        </div>
      </div>
    </div>
  );
}
