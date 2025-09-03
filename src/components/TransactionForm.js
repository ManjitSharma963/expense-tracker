import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FiX, FiSave, FiDollarSign, FiCalendar, FiTag, FiFileText, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const TransactionForm = ({ transaction, categories, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const [errors, setErrors] = useState({});

  // Populate form when editing
  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        amount: transaction.amount.toString(),
        category: transaction.category,
        description: transaction.description,
        date: transaction.date
      });
    }
  }, [transaction]);

  // Update category options when type changes
  useEffect(() => {
    if (formData.type && !categories[formData.type].includes(formData.category)) {
      setFormData(prev => ({
        ...prev,
        category: categories[formData.type][0] || ''
      }));
    }
  }, [formData.type, categories, formData.category]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Please enter a description';
    }

    if (!formData.date) {
      newErrors.date = 'Please select a date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const transactionData = {
      ...formData,
      amount: parseFloat(formData.amount),
      description: formData.description.trim()
    };

    onSave(transactionData);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal slide-up">
        <div className="modal-header">
          <h2 className="modal-title">
            {transaction ? 'Edit Transaction' : 'Add New Transaction'}
          </h2>
          <button 
            className="modal-close"
            onClick={onCancel}
            type="button"
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Transaction Type */}
            <div className="form-group">
              <label className="form-label">
                Transaction Type
              </label>
              <div className="type-selector">
                <button
                  type="button"
                  className={`type-btn ${formData.type === 'income' ? 'active income' : ''}`}
                  onClick={() => handleInputChange({ target: { name: 'type', value: 'income' } })}
                >
                  <FiTrendingUp />
                  Income
                </button>
                <button
                  type="button"
                  className={`type-btn ${formData.type === 'expense' ? 'active expense' : ''}`}
                  onClick={() => handleInputChange({ target: { name: 'type', value: 'expense' } })}
                >
                  <FiTrendingDown />
                  Expense
                </button>
              </div>
            </div>

            {/* Amount and Date Row */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <FiDollarSign /> Amount
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className={`input ${errors.amount ? 'error' : ''}`}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
                {errors.amount && (
                  <div className="error-message">{errors.amount}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FiCalendar /> Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className={`input ${errors.date ? 'error' : ''}`}
                />
                {errors.date && (
                  <div className="error-message">{errors.date}</div>
                )}
              </div>
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label">
                <FiTag /> Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`select ${errors.category ? 'error' : ''}`}
              >
                <option value="">Select a category</option>
                {categories[formData.type]?.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && (
                <div className="error-message">{errors.category}</div>
              )}
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">
                <FiFileText /> Description
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={`input ${errors.description ? 'error' : ''}`}
                placeholder="Enter transaction description"
                maxLength={100}
              />
              {errors.description && (
                <div className="error-message">{errors.description}</div>
              )}
              <div className="character-count">
                {formData.description.length}/100
              </div>
            </div>

            {/* Preview */}
            {formData.amount && formData.category && formData.description && (
              <div className="transaction-preview">
                <h4>Preview</h4>
                <div className="preview-item">
                  <div className="preview-info">
                    <div className="preview-description">
                      {formData.description}
                    </div>
                    <div className="preview-details">
                      <span className="preview-category">
                        {formData.category}
                      </span>
                      <span className="preview-date">
                        {format(new Date(formData.date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                  <div className={`preview-amount ${formData.type}`}>
                    {formData.type === 'income' ? '+' : '-'}
                    ₹{parseFloat(formData.amount || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn ${formData.type === 'income' ? 'btn-success' : 'btn-danger'}`}
            >
              <FiSave />
              {transaction ? 'Update' : 'Save'} Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm; 