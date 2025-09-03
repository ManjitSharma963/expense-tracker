import React from 'react';
import { format, parseISO } from 'date-fns';
import { FiEdit3, FiTrash2, FiCalendar, FiTag, FiTrendingUp, FiTrendingDown, FiList } from 'react-icons/fi';

const TransactionList = ({ transactions, totals, onEdit, onDelete }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getTransactionIcon = (type) => {
    return type === 'income' ? <FiTrendingUp /> : <FiTrendingDown />;
  };

  if (transactions.length === 0) {
    return (
      <div className="transaction-list fade-in">
        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card income">
            <div className="summary-card-title">
              <FiTrendingUp /> Total Income
            </div>
            <div className="summary-card-amount">
              {formatCurrency(totals.income)}
            </div>
          </div>
          
          <div className="summary-card expense">
            <div className="summary-card-title">
              <FiTrendingDown /> Total Expense
            </div>
            <div className="summary-card-amount">
              {formatCurrency(totals.expense)}
            </div>
          </div>
          
          <div className="summary-card balance">
            <div className="summary-card-title">
              Balance
            </div>
            <div className="summary-card-amount">
              {formatCurrency(totals.balance)}
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="card">
          <div className="empty-state">
            <FiList className="empty-state-icon" />
            <h3 className="empty-state-title">No Transactions Found</h3>
            <p className="empty-state-description">
              No transactions match your current filters. Try adjusting your search criteria or add a new transaction.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-list fade-in">
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card income">
          <div className="summary-card-title">
            <FiTrendingUp /> Total Income
          </div>
          <div className="summary-card-amount">
            {formatCurrency(totals.income)}
          </div>
          <div className="summary-card-count">
            {transactions.filter(t => t.type === 'income').length} transactions
          </div>
        </div>
        
        <div className="summary-card expense">
          <div className="summary-card-title">
            <FiTrendingDown /> Total Expense
          </div>
          <div className="summary-card-amount">
            {formatCurrency(totals.expense)}
          </div>
          <div className="summary-card-count">
            {transactions.filter(t => t.type === 'expense').length} transactions
          </div>
        </div>
        
        <div className="summary-card balance">
          <div className="summary-card-title">
            Balance
          </div>
          <div className="summary-card-amount">
            {formatCurrency(totals.balance)}
          </div>
          <div className="summary-card-count">
            {transactions.length} total transactions
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <FiList /> All Transactions ({transactions.length})
          </h3>
        </div>
        
        <div className="transactions-container">
          {transactions.map((transaction, index) => (
            <div 
              key={transaction.id} 
              className="transaction-item"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="transaction-icon">
                <div className={`icon-wrapper ${transaction.type}`}>
                  {getTransactionIcon(transaction.type)}
                </div>
              </div>
              
              <div className="transaction-info">
                <div className="transaction-header">
                  <h4 className="transaction-description">
                    {transaction.description}
                  </h4>
                  <div className={`transaction-amount ${transaction.type}`}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
                
                <div className="transaction-details">
                  <span className="transaction-category">
                    <FiTag />
                    {transaction.category}
                  </span>
                  <span className="transaction-date">
                    <FiCalendar />
                    {formatDate(transaction.date)}
                  </span>
                </div>
              </div>
              
              <div className="transaction-actions">
                <button
                  className="action-btn edit"
                  onClick={() => onEdit(transaction)}
                  title="Edit transaction"
                >
                  <FiEdit3 />
                </button>
                <button
                  className="action-btn delete"
                  onClick={() => onDelete(transaction.id)}
                  title="Delete transaction"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction Stats */}
      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Income Breakdown</h4>
          </div>
          <div className="category-breakdown">
            {Object.entries(
              transactions
                .filter(t => t.type === 'income')
                .reduce((acc, t) => {
                  acc[t.category] = (acc[t.category] || 0) + t.amount;
                  return acc;
                }, {})
            )
              .sort(([,a], [,b]) => b - a)
              .map(([category, amount]) => (
                <div key={category} className="category-item">
                  <div className="category-info">
                    <span className="category-name">{category}</span>
                    <span className="category-amount income">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                  <div className="category-bar">
                    <div 
                      className="category-fill income"
                      style={{ 
                        width: `${(amount / totals.income) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Expense Breakdown</h4>
          </div>
          <div className="category-breakdown">
            {Object.entries(
              transactions
                .filter(t => t.type === 'expense')
                .reduce((acc, t) => {
                  acc[t.category] = (acc[t.category] || 0) + t.amount;
                  return acc;
                }, {})
            )
              .sort(([,a], [,b]) => b - a)
              .map(([category, amount]) => (
                <div key={category} className="category-item">
                  <div className="category-info">
                    <span className="category-name">{category}</span>
                    <span className="category-amount expense">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                  <div className="category-bar">
                    <div 
                      className="category-fill expense"
                      style={{ 
                        width: `${(amount / totals.expense) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionList; 