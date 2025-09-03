import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from 'date-fns';
import { FiSun, FiMoon, FiPlus, FiDownload, FiSearch, FiLogOut, FiUser, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { transactionAPI, categoriesAPI, dashboardAPI, debugTokenStatus, generateCurlForAPI } from '../services/api';
import Dashboard from './Dashboard';
import TransactionForm from './TransactionForm';
import Reports from './Reports';
import RecurringTransactions from './RecurringTransactions';

// Default categories (will be replaced by API data)
const DEFAULT_CATEGORIES = {
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

  // Transaction state
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [transactionError, setTransactionError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);

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



  // Load transactions from API
  const loadTransactions = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingTransactions(true);
    setTransactionError(null);
    
    try {
      const response = await transactionAPI.getTransactions({
        page: 0,
        size: 1000, // Load all transactions for now
        sort: 'date',
        direction: 'desc'
      });
      
      if (response.success) {
        setTransactions(response.data.transactions || []);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setTransactionError(error.message);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [user]);

  // Load categories from API
  const loadCategories = useCallback(async () => {
    try {
      const response = await categoriesAPI.getCategories();
      if (response.success && response.data) {
        // Convert array to object format expected by frontend
        const categoryData = response.data;
        if (Array.isArray(categoryData)) {
          // If it's an array, assume it's mixed categories
          const incomeCategories = categoryData.filter(cat => 
            ['Salary', 'Freelance', 'Investment', 'Business', 'Gift'].includes(cat)
          );
          const expenseCategories = categoryData.filter(cat => 
            !incomeCategories.includes(cat)
          );
          
          setCategories({
            income: incomeCategories.length > 0 ? incomeCategories : DEFAULT_CATEGORIES.income,
            expense: expenseCategories.length > 0 ? expenseCategories : DEFAULT_CATEGORIES.expense
          });
        } else {
          // If it's already an object with income/expense keys
          setCategories(categoryData);
        }
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      // Keep default categories on error
    }
  }, []);

  // Load dashboard summary from API
  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingDashboard(true);
    setDashboardError(null);
    
    try {
      const response = await dashboardAPI.getSummary({ period: 'month' });
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setDashboardError(error.message);
    } finally {
      setIsLoadingDashboard(false);
    }
  }, [user]);

  // Load initial data when user is authenticated
  useEffect(() => {
    if (user) {
      loadTransactions();
      loadCategories();
      loadDashboardData();
    }
  }, [user, loadTransactions, loadCategories, loadDashboardData]);

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

  // Debug function to check token status and generate cURL commands
  const handleDebugToken = () => {
    debugTokenStatus();
    
    // Generate cURL commands for common API endpoints
    console.log('🌐 Generating cURL commands for testing...');
    generateCurlForAPI('/dashboard/summary?period=month', 'GET');
    generateCurlForAPI('/transactions?page=0&size=10', 'GET');
    generateCurlForAPI('/transactions', 'POST', {
      type: 'EXPENSE',
      description: 'Test Transaction',
      amount: 100.00,
      category: 'Test',
      date: '2024-01-15'
    });
    generateCurlForAPI('/categories', 'GET');
    
    // Also test API calls to see if token is working
    console.log('🧪 Testing API calls with token...');
    
    // Test dashboard summary API
    dashboardAPI.getSummary({ period: 'month' })
      .then(response => {
        console.log('✅ Dashboard API call successful:', response);
      })
      .catch(error => {
        console.error('❌ Dashboard API call failed:', error);
      });
    
    // Test transactions API
    transactionAPI.getTransactions({ page: 0, size: 1 })
      .then(response => {
        console.log('✅ Transactions API call successful:', response);
      })
      .catch(error => {
        console.error('❌ Transactions API call failed:', error);
      });
  };

  // Manual refresh function for dashboard data
  const handleRefreshDashboard = async () => {
    console.log('🔄 Manually refreshing dashboard data...');
    await loadDashboardData();
    console.log('✅ Dashboard data refreshed');
  };

  // Add or update transaction
  const handleSaveTransaction = async (transactionData) => {
    try {
      if (editingTransaction) {
        // Update existing transaction
        const response = await transactionAPI.updateTransaction(editingTransaction.id, transactionData);
        if (response.success) {
          setTransactions(prev => 
            prev.map(t => 
              t.id === editingTransaction.id ? response.data : t
            )
          );
          // Refresh dashboard data to update totals and charts
          await loadDashboardData();
        }
      } else {
        // Add new transaction
        const response = await transactionAPI.createTransaction(transactionData);
        if (response.success) {
          setTransactions(prev => [response.data, ...prev]);
          // Refresh dashboard data to update totals and charts
          await loadDashboardData();
        }
      }
      
      setShowTransactionForm(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error('Failed to save transaction:', error);
      alert(`Failed to ${editingTransaction ? 'update' : 'create'} transaction: ${error.message}`);
    }
  };

  // Delete transaction
  const handleDeleteTransaction = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        const response = await transactionAPI.deleteTransaction(id);
        if (response.success) {
          setTransactions(prev => prev.filter(t => t.id !== id));
          // Refresh dashboard data to update totals and charts
          await loadDashboardData();
        }
      } catch (error) {
        console.error('Failed to delete transaction:', error);
        alert(`Failed to delete transaction: ${error.message}`);
      }
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

  // Use dashboard data from API for overall totals
  const overallTotals = useMemo(() => {
    if (dashboardData) {
      return {
        income: dashboardData.totalIncome || 0,
        expense: dashboardData.totalExpenses || 0,
        balance: dashboardData.balance || 0
      };
    }
    
    // Fallback to local calculation if API data not available
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
  }, [dashboardData, transactions]);

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
                {categories.income.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                {categories.expense.map(cat => (
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
              categories={categories}
              dashboardData={dashboardData}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
              isLoading={isLoadingTransactions || isLoadingDashboard}
              error={transactionError || dashboardError}
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
              categories={categories}
            />
          )}
        </main>

        {/* Transaction Form Modal */}
        {showTransactionForm && (
          <TransactionForm
            transaction={editingTransaction}
            categories={categories}
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