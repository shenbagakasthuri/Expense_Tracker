import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { sumDecimalAmounts, formatINR } from '../utils/formatters';
import { Calendar, ArrowDownRight, ArrowUpRight, PiggyBank } from 'lucide-react';

export default function Reports({ transactions }) {
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear().toString());

  // Extract distinct years present in the dataset
  const availableYears = useMemo(() => {
    const yearsSet = new Set();
    transactions.forEach((tx) => {
      if (tx.transaction_date) {
        yearsSet.add(tx.transaction_date.substring(0, 4));
      }
    });
    if (yearsSet.size === 0) {
      yearsSet.add(new Date().getFullYear().toString());
    }
    return Array.from(yearsSet).sort().reverse();
  }, [transactions]);

  // Aggregate monthly breakdown for the chosen year
  const monthlyReportData = useMemo(() => {
    const months = [
      { num: '01', name: 'Jan' },
      { num: '02', name: 'Feb' },
      { num: '03', name: 'Mar' },
      { num: '04', name: 'Apr' },
      { num: '05', name: 'May' },
      { num: '06', name: 'Jun' },
      { num: '07', name: 'Jul' },
      { num: '08', name: 'Aug' },
      { num: '09', name: 'Sep' },
      { num: '10', name: 'Oct' },
      { num: '11', name: 'Nov' },
      { num: '12', name: 'Dec' }
    ];

    return months.map((m) => {
      const prefix = `${selectedYear}-${m.num}`;
      const monthTx = transactions.filter((t) => t.transaction_date?.startsWith(prefix));

      const incList = monthTx.filter((t) => t.type === 'INCOME').map((t) => t.amount);
      const expList = monthTx.filter((t) => t.type === 'EXPENSE').map((t) => t.amount);

      const incStr = sumDecimalAmounts(incList);
      const expStr = sumDecimalAmounts(expList);
      const savStr = sumDecimalAmounts([incStr, `-${expStr}`]);

      return {
        month: m.name,
        income: Number(incStr),
        expense: Number(expStr),
        savings: Number(savStr),
        incomeFormatted: formatINR(incStr),
        expenseFormatted: formatINR(expStr),
        savingsFormatted: formatINR(savStr)
      };
    });
  }, [transactions, selectedYear]);

  // Year-to-date totals
  const annualSummary = useMemo(() => {
    const yearTx = transactions.filter((t) => t.transaction_date?.startsWith(selectedYear));
    const incList = yearTx.filter((t) => t.type === 'INCOME').map((t) => t.amount);
    const expList = yearTx.filter((t) => t.type === 'EXPENSE').map((t) => t.amount);

    const totalInc = sumDecimalAmounts(incList);
    const totalExp = sumDecimalAmounts(expList);
    const totalSav = sumDecimalAmounts([totalInc, `-${totalExp}`]);

    const savingsRate =
      Number(totalInc) > 0
        ? ((Number(totalSav) / Number(totalInc)) * 100).toFixed(1)
        : '0.0';

    return {
      totalIncome: totalInc,
      totalExpenses: totalExp,
      totalSavings: totalSav,
      savingsRate
    };
  }, [transactions, selectedYear]);

  return (
    <div className="reports-page">
      {/* Year Filter Header */}
      <div className="card flex-between flex-wrap gap-3">
        <div>
          <h2 className="card-title">Annual & Monthly Reports</h2>
          <span className="card-subtitle">Comprehensive breakdown of your savings rate and trends</span>
        </div>
        <div className="flex-center gap-2">
          <Calendar size={16} className="text-muted" />
          <span className="filter-label">Select Year:</span>
          <select
            className="form-select form-select-sm"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Annual Summary Metrics */}
      <div className="summary-grid mt-4">
        <div className="card summary-card income-card">
          <div className="summary-card-header">
            <span className="summary-card-title">{selectedYear} Total Income</span>
            <div className="summary-icon-box icon-income">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div className="summary-card-body">
            <div className="summary-card-value text-income">
              {formatINR(annualSummary.totalIncome)}
            </div>
            <span className="summary-card-caption">All earnings in {selectedYear}</span>
          </div>
        </div>

        <div className="card summary-card expense-card">
          <div className="summary-card-header">
            <span className="summary-card-title">{selectedYear} Total Expenses</span>
            <div className="summary-icon-box icon-expense">
              <ArrowDownRight size={20} />
            </div>
          </div>
          <div className="summary-card-body">
            <div className="summary-card-value text-expense">
              {formatINR(annualSummary.totalExpenses)}
            </div>
            <span className="summary-card-caption">All spendings in {selectedYear}</span>
          </div>
        </div>

        <div className="card summary-card balance-card">
          <div className="summary-card-header">
            <span className="summary-card-title">{selectedYear} Net Savings</span>
            <div className="summary-icon-box icon-balance">
              <PiggyBank size={20} />
            </div>
          </div>
          <div className="summary-card-body">
            <div className="summary-card-value text-balance-pos">
              {formatINR(annualSummary.totalSavings)}
            </div>
            <span className="summary-card-caption">Savings Rate: {annualSummary.savingsRate}%</span>
          </div>
        </div>
      </div>

      {/* Monthly Savings Trend Chart */}
      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">Monthly Cashflow Overview ({selectedYear})</h3>
          <span className="card-subtitle">Comparing Monthly Income vs Monthly Spend</span>
        </div>
        <div className="card-body">
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyReportData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                <Tooltip
                  formatter={(val) => [formatINR(val), '']}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">Monthly Detailed Ledger ({selectedYear})</h3>
          <span className="card-subtitle">Precise financial accounting per calendar month</span>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th className="text-right">Total Income</th>
                  <th className="text-right">Total Expenses</th>
                  <th className="text-right">Net Savings</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {monthlyReportData.map((row) => {
                  const isPositive = row.savings >= 0;
                  return (
                    <tr key={row.month}>
                      <td className="font-medium text-main">{row.month} {selectedYear}</td>
                      <td className="text-right text-income font-medium">{row.incomeFormatted}</td>
                      <td className="text-right text-expense font-medium">{row.expenseFormatted}</td>
                      <td className={`text-right font-semibold ${isPositive ? 'text-balance-pos' : 'text-danger'}`}>
                        {row.savingsFormatted}
                      </td>
                      <td className="text-center">
                        <span className={`badge ${isPositive ? 'badge-income' : 'badge-expense'}`}>
                          {isPositive ? 'Surplus' : 'Deficit'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
