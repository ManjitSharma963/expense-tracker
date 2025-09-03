import React, { useState, useEffect, useMemo } from 'react';
import { format, addMonths, isAfter, isBefore, parseISO } from 'date-fns';
import { 
  FiPlus, 
  FiEdit3, 
  FiTrash2, 
  FiCalendar, 
  FiRepeat, 
  FiDollarSign,
  FiClock,
  FiPlay,
  FiPause,
  FiX,
  FiSave,
  FiFileText,
  FiTag,
  FiTrendingUp,
  FiTrendingDown
} from 'react-icons/fi';

const CATEGORIES = {
  income: ['Salary', 'Freelance', 'Investment', 'Rental', 'Business', 'Other Income'],
  expense: ['Rent', 'Utilities', 'Internet', 'Phone', 'Insurance', 'Loan EMI', 'Credit Card', 'Subscription', 'Groceries', 'Transport', 'Other Bills']
};

const FREQUENCIES = [
  { value: 'monthly', label: 'Monthly', days: 30 },
  { value: 'weekly', label: 'Weekly', days: 7 },
  { value: 'quarterly', label: 'Quarterly', days: 90 },
  { value: 'yearly', label: 'Yearly', days: 365 }
];

const RecurringTransactions = ({ onAddTransaction }) => {
  const [recurringTransactions, setRecurringTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [formData, setFormData] = useState({
    type: 'expense',
    description: '',
    amount: '',
    category: '',
    frequency: 'monthly',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
    isActive: true,
    lastProcessed: null,
    nextDue: null
  });

  // Load recurring transactions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recurringTransactions');
    if (saved) {
      setRecurringTransactions(JSON.parse(saved));
    }
  }, []);

  // Save recurring transactions to localStorage
  useEffect(() => {
    localStorage.setItem('recurringTransactions', JSON.stringify(recurringTransactions));
  }, [recurringTransactions]);

  // Process recurring transactions automatically
  useEffect(() => {
    const processRecurringTransactions = () => {
      const today = new Date();
      const updatedTransactions = [...recurringTransactions];
      let hasUpdates = false;

      updatedTransactions.forEach((recurring, index) => {
        if (!recurring.isActive) return;

        const nextDue = recurring.nextDue ? parseISO(recurring.nextDue) : parseISO(recurring.startDate);
        
        if (isAfter(today, nextDue) || format(today, 'yyyy-MM-dd') === format(nextDue, 'yyyy-MM-dd')) {
          // Create the actual transaction
          const newTransaction = {
            id: Date.now() + Math.random(),
            type: recurring.type,
            description: `${recurring.description} (Auto)`,
            amount: parseFloat(recurring.amount),
            category: recurring.category,
            date: format(today, 'yyyy-MM-dd'),
            isRecurring: true,
            recurringId: recurring.id
          };

          // Add to main transactions
          onAddTransaction(newTransaction);

          // Update recurring transaction
          const nextDueDate = addMonths(nextDue, recurring.frequency === 'monthly' ? 1 : 
                                      recurring.frequency === 'weekly' ? 0.25 : 
                                      recurring.frequency === 'quarterly' ? 3 : 12);

          updatedTransactions[index] = {
            ...recurring,
            lastProcessed: format(today, 'yyyy-MM-dd'),
            nextDue: format(nextDueDate, 'yyyy-MM-dd')
          };

          hasUpdates = true;
        }
      });

      if (hasUpdates) {
        setRecurringTransactions(updatedTransactions);
      }
    };

    // Process on component mount and then every hour
    processRecurringTransactions();
    const interval = setInterval(processRecurringTransactions, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [recurringTransactions, onAddTransaction]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'type' && { category: '' }) // Reset category when type changes
    }));
  };

  const calculateNextDue = (startDate, frequency) => {
    const start = parseISO(startDate);
    const today = new Date();
    
    if (isBefore(start, today)) {
      return format(today, 'yyyy-MM-dd');
    }
    
    return startDate;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount || !formData.category) {
      alert('Please fill in all required fields');
      return;
    }

    const nextDue = calculateNextDue(formData.startDate, formData.frequency);
    
    const recurringTransaction = {
      id: editingTransaction ? editingTransaction.id : Date.now(),
      ...formData,
      amount: parseFloat(formData.amount),
      nextDue,
      createdAt: editingTransaction ? editingTransaction.createdAt : new Date().toISOString()
    };

    if (editingTransaction) {
      setRecurringTransactions(prev => 
        prev.map(t => t.id === editingTransaction.id ? recurringTransaction : t)
      );
    } else {
      setRecurringTransactions(prev => [...prev, recurringTransaction]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      type: 'expense',
      description: '',
      amount: '',
      category: '',
      frequency: 'monthly',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: '',
      isActive: true,
      lastProcessed: null,
      nextDue: null
    });
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleEdit = (transaction) => {
    setFormData({
      ...transaction,
      startDate: transaction.startDate || format(new Date(), 'yyyy-MM-dd'),
      endDate: transaction.endDate || ''
    });
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this recurring transaction?')) {
      setRecurringTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const toggleActive = (id) => {
    setRecurringTransactions(prev =>
      prev.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t)
    );
  };

  const processNow = (id) => {
    const recurring = recurringTransactions.find(t => t.id === id);
    if (!recurring) return;

    const newTransaction = {
      id: Date.now() + Math.random(),
      type: recurring.type,
      description: `${recurring.description} (Manual)`,
      amount: parseFloat(recurring.amount),
      category: recurring.category,
      date: format(new Date(), 'yyyy-MM-dd'),
      isRecurring: true,
      recurringId: recurring.id
    };

    onAddTransaction(newTransaction);

    // Update next due date
    const nextDueDate = addMonths(new Date(), recurring.frequency === 'monthly' ? 1 : 
                                recurring.frequency === 'weekly' ? 0.25 : 
                                recurring.frequency === 'quarterly' ? 3 : 12);

    setRecurringTransactions(prev =>
      prev.map(t => t.id === id ? {
        ...t,
        lastProcessed: format(new Date(), 'yyyy-MM-dd'),
        nextDue: format(nextDueDate, 'yyyy-MM-dd')
      } : t)
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getTransactionIcon = (type) => {
    return type === 'income' ? <FiTrendingUp /> : <FiTrendingDown />;
  };

  const activeRecurring = useMemo(() => 
    recurringTransactions.filter(t => t.isActive), [recurringTransactions]
  );

  const inactiveRecurring = useMemo(() => 
    recurringTransactions.filter(t => !t.isActive), [recurringTransactions]
  );

  const upcomingTransactions = useMemo(() => {
    return activeRecurring
      .filter(t => t.nextDue)
      .sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue))
      .slice(0, 5);
  }, [activeRecurring]);

  return (
    <div className="recurring-transactions fade-in">
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <FiRepeat /> Recurring Transactions
          </h2>
          <button 
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            <FiPlus /> Add Recurring
          </button>
        </div>

        {/* Stats */}
        <div className="recurring-stats">
          <div className="stat-item">
            <div className="stat-value">{activeRecurring.length}</div>
            <div className="stat-label">Active</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {formatCurrency(activeRecurring.reduce((sum, t) => 
                sum + (t.type === 'income' ? t.amount : -t.amount), 0
              ))}
            </div>
            <div className="stat-label">Monthly Impact</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{upcomingTransactions.length}</div>
            <div className="stat-label">Due Soon</div>
          </div>
        </div>
      </div>

      {/* Upcoming Transactions */}
      {upcomingTransactions.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <FiClock /> Upcoming Transactions
            </h3>
          </div>
          <div className="upcoming-list">
            {upcomingTransactions.map(transaction => (
              <div key={transaction.id} className="upcoming-item">
                <div className="upcoming-info">
                  <div className="upcoming-description">
                    {getTransactionIcon(transaction.type)}
                    {transaction.description}
                  </div>
                  <div className="upcoming-details">
                    <span className="upcoming-category">{transaction.category}</span>
                    <span className="upcoming-date">
                      Due: {format(parseISO(transaction.nextDue), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>
                <div className={`upcoming-amount ${transaction.type}`}>
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </div>
                <button
                  className="btn btn-small btn-primary"
                  onClick={() => processNow(transaction.id)}
                  title="Process Now"
                >
                  <FiPlay />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              {editingTransaction ? 'Edit' : 'Add'} Recurring Transaction
            </h3>
            <button className="btn" onClick={resetForm}>
              <FiX />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="recurring-form">
            {/* Type Selector */}
            <div className="type-selector">
              <button
                type="button"
                className={`type-btn ${formData.type === 'income' ? 'active income' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, type: 'income', category: '' }))}
              >
                <FiTrendingUp /> Income
              </button>
              <button
                type="button"
                className={`type-btn ${formData.type === 'expense' ? 'active expense' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, type: 'expense', category: '' }))}
              >
                <FiTrendingDown /> Expense
              </button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <FiFileText /> Description
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="e.g., Monthly Rent, Salary, Netflix Subscription"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FiDollarSign /> Amount
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <FiTag /> Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="select"
                  required
                >
                  <option value="">Select Category</option>
                  {CATEGORIES[formData.type].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FiRepeat /> Frequency
                </label>
                <select
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleInputChange}
                  className="select"
                  required
                >
                  {FREQUENCIES.map(freq => (
                    <option key={freq.value} value={freq.value}>{freq.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <FiCalendar /> Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FiCalendar /> End Date (Optional)
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="input"
                  min={formData.startDate}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn" onClick={resetForm}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <FiSave /> {editingTransaction ? 'Update' : 'Create'} Recurring Transaction
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Recurring Transactions */}
      {activeRecurring.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Active Recurring Transactions</h3>
          </div>
          <div className="recurring-list">
            {activeRecurring.map(transaction => (
              <div key={transaction.id} className="recurring-item">
                <div className="recurring-info">
                  <div className="recurring-description">
                    {getTransactionIcon(transaction.type)}
                    {transaction.description}
                  </div>
                  <div className="recurring-details">
                    <span className="recurring-category">{transaction.category}</span>
                    <span className="recurring-frequency">
                      {FREQUENCIES.find(f => f.value === transaction.frequency)?.label}
                    </span>
                    {transaction.nextDue && (
                      <span className="recurring-next-due">
                        Next: {format(parseISO(transaction.nextDue), 'MMM dd')}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`recurring-amount ${transaction.type}`}>
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </div>
                <div className="recurring-actions">
                  <button
                    className="btn btn-small"
                    onClick={() => processNow(transaction.id)}
                    title="Process Now"
                  >
                    <FiPlay />
                  </button>
                  <button
                    className="btn btn-small"
                    onClick={() => toggleActive(transaction.id)}
                    title="Pause"
                  >
                    <FiPause />
                  </button>
                  <button
                    className="btn btn-small"
                    onClick={() => handleEdit(transaction)}
                    title="Edit"
                  >
                    <FiEdit3 />
                  </button>
                  <button
                    className="btn btn-small btn-danger"
                    onClick={() => handleDelete(transaction.id)}
                    title="Delete"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inactive Recurring Transactions */}
      {inactiveRecurring.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Paused Recurring Transactions</h3>
          </div>
          <div className="recurring-list">
            {inactiveRecurring.map(transaction => (
              <div key={transaction.id} className="recurring-item inactive">
                <div className="recurring-info">
                  <div className="recurring-description">
                    {getTransactionIcon(transaction.type)}
                    {transaction.description}
                  </div>
                  <div className="recurring-details">
                    <span className="recurring-category">{transaction.category}</span>
                    <span className="recurring-frequency">
                      {FREQUENCIES.find(f => f.value === transaction.frequency)?.label}
                    </span>
                    <span className="recurring-status">Paused</span>
                  </div>
                </div>
                <div className={`recurring-amount ${transaction.type}`}>
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </div>
                <div className="recurring-actions">
                  <button
                    className="btn btn-small btn-success"
                    onClick={() => toggleActive(transaction.id)}
                    title="Resume"
                  >
                    <FiPlay />
                  </button>
                  <button
                    className="btn btn-small"
                    onClick={() => handleEdit(transaction)}
                    title="Edit"
                  >
                    <FiEdit3 />
                  </button>
                  <button
                    className="btn btn-small btn-danger"
                    onClick={() => handleDelete(transaction.id)}
                    title="Delete"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {recurringTransactions.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <FiRepeat className="empty-state-icon" />
            <h3 className="empty-state-title">No Recurring Transactions</h3>
            <p className="empty-state-description">
              Set up automatic transactions for bills, salary, and subscriptions to save time and never miss a payment.
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              <FiPlus /> Create Your First Recurring Transaction
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurringTransactions; 