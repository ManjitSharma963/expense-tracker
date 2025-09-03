import React, { useState, useEffect, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from 'date-fns';
import { FiSun, FiMoon, FiPlus, FiDownload, FiSearch, FiLogOut, FiUser } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import Dashboard from './Dashboard';
import TransactionForm from './TransactionForm';
import Reports from './Reports';
import RecurringTransactions from './RecurringTransactions';

// Sample categories
const CATEGORIES = {
  income: ['Salary', 'Freelance', 'Investment', 'Business', 'Gift', 'Other Income'],
  expense: ['Food', 'Grocery', 'EMI', 'Bills', 'Entertainment', 'Transport', 'Shopping', 'Healthcare', 'Education', 'Other Expense']
};

const ExpenseTracker = () => {
  const { user, logout } = useAuth();
  
  // Theme state
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('expense-tracker-theme');
    return savedTheme || 'light';
  });

  // Transaction state - user-specific
  const [transactions, setTransactions] = useState(() => {
    const savedTransactions = localStorage.getItem(`expense-tracker-transactions-${user.id}`);
    return savedTransactions ? JSON.parse(savedTransactions) : [];
  });

  // UI state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  
  // Reports filter state (only used in Reports tab)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, income, expense
  const [filterCategory, setFilterCategory] = useState('all');
  const [dateRange, setDateRange] = useState('all'); // all, today, week, month, year

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('expense-tracker-theme', theme);
  }, [theme]);

  // Save transactions to localStorage (user-specific)
  useEffect(() => {
    if (user) {
      localStorage.setItem(`expense-tracker-transactions-${user.id}`, JSON.stringify(transactions));
    }
  }, [transactions, user]);

  // Toggle theme
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Handle logout
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  // Add or update transaction
  const handleSaveTransaction = (transactionData) => {
    if (editingTransaction) {
      setTransactions(prev => prev.map(t => 
        t.id === editingTransaction.id 
          ? { ...transactionData, id: editingTransaction.id }
          : t
      ));
      setEditingTransaction(null);
    } else {
      const newTransaction = {
        ...transactionData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        userId: user.id
      };
      setTransactions(prev => [newTransaction, ...prev]);
    }
    setShowTransactionForm(false);
  };

  // Delete transaction
  const handleDeleteTransaction = (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  // Edit transaction
  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionForm(true);
  };

  // Filter transactions based on search and filters
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(t => t.category === filterCategory);
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let dateInterval;

      switch (dateRange) {
        case 'today':
          const today = format(now, 'yyyy-MM-dd');
          filtered = filtered.filter(t => format(parseISO(t.date), 'yyyy-MM-dd') === today);
          break;
        case 'week':
          dateInterval = { start: startOfWeek(now), end: endOfWeek(now) };
          filtered = filtered.filter(t => isWithinInterval(parseISO(t.date), dateInterval));
          break;
        case 'month':
          dateInterval = { start: startOfMonth(now), end: endOfMonth(now) };
          filtered = filtered.filter(t => isWithinInterval(parseISO(t.date), dateInterval));
          break;
        case 'year':
          dateInterval = { start: startOfYear(now), end: endOfYear(now) };
          filtered = filtered.filter(t => isWithinInterval(parseISO(t.date), dateInterval));
          break;
        default:
          break;
      }
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, searchTerm, filterType, filterCategory, dateRange]);

  // Calculate overall totals (all transactions - for dashboard)
  const overallTotals = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      income,
      expense,
      balance: income - expense
    };
  }, [transactions]);

  // Calculate filtered totals (for current view)
  const filteredTotals = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      income,
      expense,
      balance: income - expense
    };
  }, [filteredTransactions]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        t.date,
        t.type,
        t.category,
        `"${t.description}"`,
        t.amount
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-tracker-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="App">
      {/* Theme Toggle */}
      <button 
        className="theme-toggle btn"
        onClick={toggleTheme}
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? <FiMoon /> : <FiSun />}
      </button>

      <div className="container">
        {/* Header */}
        <header className="app-header">
          <div className="header-left">
            <h1 className="app-title">Expense Tracker</h1>
            <div className="user-info">
              <FiUser />
              <span>Welcome, {user.name}</span>
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-primary"
              onClick={() => {
                setEditingTransaction(null);
                setShowTransactionForm(true);
              }}
            >
              <FiPlus /> Add Transaction
            </button>
            <button 
              className="btn"
              onClick={exportToCSV}
              title="Export to CSV"
            >
              <FiDownload /> Export
            </button>
            <button 
              className="btn btn-danger"
              onClick={handleLogout}
              title="Logout"
            >
              <FiLogOut /> Logout
            </button>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="nav-tabs">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'recurring', label: 'Recurring' },
            { id: 'reports', label: 'Reports' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Search and Filters */}
        {activeTab === 'reports' && (
          <div className="filters-section">
            <div className="search-box">
              <FiSearch className="search-icon" />
              <input
                type="text"
                className="input search-input"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="filters">
              <select
                className="select filter-select"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>

              <select
                className="select filter-select"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {CATEGORIES.income.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                {CATEGORIES.expense.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                className="select filter-select"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="main-content">
          {activeTab === 'dashboard' && (
            <Dashboard 
              transactions={transactions}
              totals={overallTotals}
              categories={CATEGORIES}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
            />
          )}
          
          {activeTab === 'recurring' && (
            <RecurringTransactions
              onAddTransaction={handleSaveTransaction}
            />
          )}
          
          {activeTab === 'reports' && (
            <Reports
              transactions={filteredTransactions}
              totals={filteredTotals}
              categories={CATEGORIES}
            />
          )}
        </main>

        {/* Transaction Form Modal */}
        {showTransactionForm && (
          <TransactionForm
            transaction={editingTransaction}
            categories={CATEGORIES}
            onSave={handleSaveTransaction}
            onCancel={() => {
              setShowTransactionForm(false);
              setEditingTransaction(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ExpenseTracker; 