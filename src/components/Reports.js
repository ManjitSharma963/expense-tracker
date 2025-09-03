import React, { useMemo, useState } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO, subDays, subMonths } from 'date-fns';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { FiBarChart, FiTrendingUp, FiPieChart, FiCalendar, FiDownload, FiFileText } from 'react-icons/fi';

const Reports = ({ transactions, totals, categories }) => {
  const [reportPeriod, setReportPeriod] = useState('month'); // week, month, year, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Get filtered transactions based on report period
  const filteredTransactions = useMemo(() => {
    if (reportPeriod === 'custom' && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      return transactions.filter(t => 
        isWithinInterval(parseISO(t.date), { start, end })
      );
    }

    const now = new Date();
    let dateInterval;

    switch (reportPeriod) {
      case 'week':
        dateInterval = { start: startOfWeek(now), end: endOfWeek(now) };
        break;
      case 'month':
        dateInterval = { start: startOfMonth(now), end: endOfMonth(now) };
        break;
      case 'year':
        dateInterval = { start: startOfYear(now), end: endOfYear(now) };
        break;
      default:
        return transactions;
    }

    return transactions.filter(t => 
      isWithinInterval(parseISO(t.date), dateInterval)
    );
  }, [transactions, reportPeriod, customStartDate, customEndDate]);

  // Calculate period totals
  const periodTotals = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      income,
      expense,
      balance: income - expense,
      savings: income > 0 ? ((income - expense) / income * 100) : 0
    };
  }, [filteredTransactions]);

  // Monthly comparison data
  const monthlyComparisonData = useMemo(() => {
    const months = [];
    const monthlyIncome = [];
    const monthlyExpense = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      months.push(format(date, 'MMM yyyy'));
      
      const monthTransactions = transactions.filter(t => 
        isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd })
      );
      
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      monthlyIncome.push(income);
      monthlyExpense.push(expense);
    }

    return {
      labels: months,
      datasets: [
        {
          label: 'Income',
          data: monthlyIncome,
          backgroundColor: '#2ecc71',
          borderRadius: 8,
          borderSkipped: false,
        },
        {
          label: 'Expense',
          data: monthlyExpense,
          backgroundColor: '#e74c3c',
          borderRadius: 8,
          borderSkipped: false,
        }
      ]
    };
  }, [transactions]);

  // Category spending trends
  const categoryTrendData = useMemo(() => {
    const categoryTotals = {};
    
    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      });

    const sortedCategories = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8); // Top 8 categories

    const colors = [
      '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
      '#1abc9c', '#34495e', '#e67e22'
    ];

    return {
      labels: sortedCategories.map(([category]) => category),
      datasets: [{
        data: sortedCategories.map(([, amount]) => amount),
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 4
      }]
    };
  }, [filteredTransactions]);

  // Daily spending pattern
  const dailyPatternData = useMemo(() => {
    const last30Days = [];
    const dailyExpenses = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      last30Days.push(format(date, 'MMM dd'));
      
      const dayExpenses = transactions
        .filter(t => 
          t.type === 'expense' && 
          format(parseISO(t.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        )
        .reduce((sum, t) => sum + t.amount, 0);
      
      dailyExpenses.push(dayExpenses);
    }

    return {
      labels: last30Days,
      datasets: [{
        label: 'Daily Expenses',
        data: dailyExpenses,
        borderColor: '#e74c3c',
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 2,
        pointHoverRadius: 6
      }]
    };
  }, [transactions]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          color: 'var(--text-primary)'
        }
      },
      tooltip: {
        backgroundColor: 'var(--bg-secondary)',
        titleColor: 'var(--text-primary)',
        bodyColor: 'var(--text-primary)',
        borderColor: 'var(--accent-primary)',
        borderWidth: 1,
        cornerRadius: 10,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ₹${context.parsed.y?.toLocaleString() || context.parsed?.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'var(--text-secondary)' }
      },
      y: {
        grid: { color: 'var(--text-secondary)', borderDash: [5, 5] },
        ticks: {
          color: 'var(--text-secondary)',
          callback: function(value) {
            return '₹' + value.toLocaleString();
          }
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 20,
          usePointStyle: true,
          color: 'var(--text-primary)'
        }
      },
      tooltip: {
        backgroundColor: 'var(--bg-secondary)',
        titleColor: 'var(--text-primary)',
        bodyColor: 'var(--text-primary)',
        borderColor: 'var(--accent-primary)',
        borderWidth: 1,
        cornerRadius: 10,
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed * 100) / total).toFixed(1);
            return `${context.label}: ₹${context.parsed.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const exportReport = () => {
    const reportData = {
      period: reportPeriod,
      startDate: customStartDate || 'N/A',
      endDate: customEndDate || 'N/A',
      totals: periodTotals,
      transactionCount: filteredTransactions.length,
      transactions: filteredTransactions
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-report-${reportPeriod}-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="reports fade-in">
      {/* Report Controls */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <FiFileText /> Report Settings
          </h3>
          <button className="btn btn-primary" onClick={exportReport}>
            <FiDownload /> Export Report
          </button>
        </div>
        
        <div className="report-controls">
          <div className="form-group">
            <label className="form-label">Report Period</label>
            <select
              className="select"
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          
          {reportPeriod === 'custom' && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="input"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="input"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Period Summary */}
      <div className="summary-cards">
        <div className="summary-card income">
          <div className="summary-card-title">
            <FiTrendingUp /> Period Income
          </div>
          <div className="summary-card-amount">
            {formatCurrency(periodTotals.income)}
          </div>
          <div className="summary-card-subtitle">
            {filteredTransactions.filter(t => t.type === 'income').length} transactions
          </div>
        </div>
        
        <div className="summary-card expense">
          <div className="summary-card-title">
            Period Expense
          </div>
          <div className="summary-card-amount">
            {formatCurrency(periodTotals.expense)}
          </div>
          <div className="summary-card-subtitle">
            {filteredTransactions.filter(t => t.type === 'expense').length} transactions
          </div>
        </div>
        
        <div className="summary-card balance">
          <div className="summary-card-title">
            Net Balance
          </div>
          <div className="summary-card-amount">
            {formatCurrency(periodTotals.balance)}
          </div>
          <div className="summary-card-subtitle">
            {periodTotals.savings.toFixed(1)}% savings rate
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-2">
        {/* Monthly Comparison */}
        <div className="chart-container">
          <h3 className="chart-title">
            <FiBarChart /> 6-Month Comparison
          </h3>
          <div className="chart-wrapper">
            <Bar data={monthlyComparisonData} options={chartOptions} />
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="chart-container">
          <h3 className="chart-title">
            <FiPieChart /> Top Expense Categories
          </h3>
          <div className="chart-wrapper">
            {categoryTrendData.labels.length > 0 ? (
              <Doughnut data={categoryTrendData} options={doughnutOptions} />
            ) : (
              <div className="empty-state">
                <FiPieChart className="empty-state-icon" />
                <p>No expense data for selected period</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Pattern */}
      <div className="chart-container">
        <h3 className="chart-title">
          <FiTrendingUp /> 30-Day Spending Pattern
        </h3>
        <div className="chart-wrapper">
          <Line data={dailyPatternData} options={chartOptions} />
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Spending Insights</h4>
          </div>
          <div className="insights-list">
            <div className="insight-item">
              <div className="insight-label">Average Daily Expense</div>
              <div className="insight-value expense">
                {formatCurrency(periodTotals.expense / Math.max(filteredTransactions.filter(t => t.type === 'expense').length, 1))}
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-label">Largest Single Expense</div>
              <div className="insight-value expense">
                {formatCurrency(Math.max(...filteredTransactions.filter(t => t.type === 'expense').map(t => t.amount), 0))}
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-label">Most Frequent Category</div>
              <div className="insight-value">
                {Object.entries(
                  filteredTransactions.reduce((acc, t) => {
                    acc[t.category] = (acc[t.category] || 0) + 1;
                    return acc;
                  }, {})
                ).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-label">Transaction Frequency</div>
              <div className="insight-value">
                {(filteredTransactions.length / Math.max(1, 
                  reportPeriod === 'week' ? 7 : 
                  reportPeriod === 'month' ? 30 : 
                  reportPeriod === 'year' ? 365 : 30
                )).toFixed(1)} per day
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Financial Health</h4>
          </div>
          <div className="health-metrics">
            <div className="metric-item">
              <div className="metric-label">Savings Rate</div>
              <div className="metric-bar">
                <div 
                  className={`metric-fill ${periodTotals.savings >= 20 ? 'good' : periodTotals.savings >= 10 ? 'average' : 'poor'}`}
                  style={{ width: `${Math.min(periodTotals.savings, 100)}%` }}
                />
              </div>
              <div className="metric-value">{periodTotals.savings.toFixed(1)}%</div>
            </div>
            
            <div className="metric-item">
              <div className="metric-label">Income vs Expense Ratio</div>
              <div className="metric-bar">
                <div 
                  className={`metric-fill ${periodTotals.balance > 0 ? 'good' : 'poor'}`}
                  style={{ width: `${Math.min((periodTotals.income / Math.max(periodTotals.expense, 1)) * 50, 100)}%` }}
                />
              </div>
              <div className="metric-value">
                {(periodTotals.income / Math.max(periodTotals.expense, 1)).toFixed(2)}:1
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports; 