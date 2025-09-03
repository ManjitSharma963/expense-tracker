import React, { useMemo } from 'react';
import { format, subDays, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import { Pie, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiPieChart, FiBarChart, FiActivity, FiEdit3, FiTrash2 } from 'react-icons/fi';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = ({ transactions, totals, categories, onEdit, onDelete }) => {
  // Calculate today's transactions
  const todayTransactions = useMemo(() => {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    
    return transactions.filter(t => 
      isWithinInterval(parseISO(t.date), { start: todayStart, end: todayEnd })
    );
  }, [transactions]);

  // Calculate today's totals
  const todayTotals = useMemo(() => {
    const income = todayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = todayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      income,
      expense,
      balance: income - expense
    };
  }, [todayTransactions]);

  // Category breakdown for pie chart
  const categoryData = useMemo(() => {
    const expensesByCategory = {};
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
      });

    const labels = Object.keys(expensesByCategory);
    const data = Object.values(expensesByCategory);
    
    const colors = [
      '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
      '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#f1c40f'
    ];

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 0,
        hoverOffset: 4
      }]
    };
  }, [transactions]);

  // Monthly trend data for line chart
  const monthlyTrendData = useMemo(() => {
    const last6Months = [];
    const monthlyData = { income: [], expense: [] };
    
    for (let i = 5; i >= 0; i--) {
      const date = subDays(new Date(), i * 30);
      const monthLabel = format(date, 'MMM yyyy');
      last6Months.push(monthLabel);
      
      const monthStart = startOfDay(subDays(date, 15));
      const monthEnd = endOfDay(subDays(date, -15));
      
      const monthTransactions = transactions.filter(t => 
        isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd })
      );
      
      const monthIncome = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const monthExpense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      monthlyData.income.push(monthIncome);
      monthlyData.expense.push(monthExpense);
    }

    return {
      labels: last6Months,
      datasets: [
        {
          label: 'Income',
          data: monthlyData.income,
          borderColor: '#2ecc71',
          backgroundColor: 'rgba(46, 204, 113, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Expense',
          data: monthlyData.expense,
          borderColor: '#e74c3c',
          backgroundColor: 'rgba(231, 76, 60, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };
  }, [transactions]);

  // Weekly comparison data for bar chart
  const weeklyComparisonData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyIncome = new Array(7).fill(0);
    const weeklyExpense = new Array(7).fill(0);
    
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      last7Days.push(subDays(new Date(), i));
    }
    
    last7Days.forEach((date, index) => {
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const dayTransactions = transactions.filter(t => 
        isWithinInterval(parseISO(t.date), { start: dayStart, end: dayEnd })
      );
      
      weeklyIncome[index] = dayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      weeklyExpense[index] = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    });

    return {
      labels: days,
      datasets: [
        {
          label: 'Income',
          data: weeklyIncome,
          backgroundColor: '#2ecc71',
          borderRadius: 8,
          borderSkipped: false,
        },
        {
          label: 'Expense',
          data: weeklyExpense,
          backgroundColor: '#e74c3c',
          borderRadius: 8,
          borderSkipped: false,
        }
      ]
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
        displayColors: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'var(--text-secondary)'
        }
      },
      y: {
        grid: {
          color: 'var(--text-secondary)',
          borderDash: [5, 5]
        },
        ticks: {
          color: 'var(--text-secondary)',
          callback: function(value) {
            return '₹' + value.toLocaleString();
          }
        }
      }
    }
  };

  const pieOptions = {
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

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="dashboard fade-in">
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card income">
          <div className="summary-card-title">
            <FiTrendingUp /> Total Income
          </div>
          <div className="summary-card-amount">
            {formatCurrency(totals.income)}
          </div>
          <div className="summary-card-subtitle">
            Today: {formatCurrency(todayTotals.income)}
          </div>
        </div>
        
        <div className="summary-card expense">
          <div className="summary-card-title">
            <FiTrendingDown /> Total Expense
          </div>
          <div className="summary-card-amount">
            {formatCurrency(totals.expense)}
          </div>
          <div className="summary-card-subtitle">
            Today: {formatCurrency(todayTotals.expense)}
          </div>
        </div>
        
        <div className="summary-card balance">
          <div className="summary-card-title">
            <FiDollarSign /> Balance
          </div>
          <div className="summary-card-amount">
            {formatCurrency(totals.balance)}
          </div>
          <div className="summary-card-subtitle">
            Today: {formatCurrency(todayTotals.balance)}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-2">
        {/* Category Breakdown */}
        <div className="chart-container">
          <h3 className="chart-title">
            <FiPieChart /> Expense by Category
          </h3>
          <div className="chart-wrapper">
            {categoryData.labels.length > 0 ? (
              <Pie data={categoryData} options={pieOptions} />
            ) : (
              <div className="empty-state">
                <FiPieChart className="empty-state-icon" />
                <p>No expense data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Comparison */}
        <div className="chart-container">
          <h3 className="chart-title">
            <FiBarChart /> Weekly Overview
          </h3>
          <div className="chart-wrapper">
            <Bar data={weeklyComparisonData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="chart-container">
        <h3 className="chart-title">
          <FiActivity /> 6-Month Trend
        </h3>
        <div className="chart-wrapper">
          <Line data={monthlyTrendData} options={chartOptions} />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Transactions</h3>
        </div>
        <div className="recent-transactions">
          {recentTransactions.length > 0 ? (
            recentTransactions.map(transaction => (
              <div key={transaction.id} className="recent-transaction-item">
                <div className="transaction-info">
                  <div className="transaction-description">
                    {transaction.description}
                  </div>
                  <div className="transaction-details">
                    <span className="transaction-category">
                      {transaction.category}
                    </span>
                    <span className="transaction-date">
                      {format(parseISO(transaction.date), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>
                <div className={`transaction-amount ${transaction.type}`}>
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </div>
                {onEdit && onDelete && (
                  <div className="transaction-actions">
                    <button
                      className="btn btn-small"
                      onClick={() => onEdit(transaction)}
                      title="Edit Transaction"
                    >
                      <FiEdit3 />
                    </button>
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => onDelete(transaction.id)}
                      title="Delete Transaction"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="empty-state">
              <FiActivity className="empty-state-icon" />
              <h4 className="empty-state-title">No Transactions Yet</h4>
              <p className="empty-state-description">
                Start by adding your first income or expense transaction.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 