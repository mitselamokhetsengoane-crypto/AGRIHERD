import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import financeService from '../../services/financeService';

const TransactionForm = ({ type }) => {
  const navigate = useNavigate();
  const isExpense = type === 'expense';
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const title = isExpense ? 'Add Expense' : 'Add Income';

  const updateField = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount),
      };
      if (isExpense) {
        await financeService.addExpense(payload);
      } else {
        await financeService.addIncome(payload);
      }
      navigate(isExpense ? '/finance/expenses' : '/finance/income');
    } catch (requestError) {
      console.error(`Failed to add ${type}`, requestError);
      setError(`${title} could not be saved. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-maintext">{title}</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-error">{error}</p>}
        <div>
          <label htmlFor="transaction-amount" className="mb-1 block text-sm text-subtext">Amount (M)</label>
          <input id="transaction-amount" name="amount" type="number" min="0.01" step="0.01" required value={formData.amount} onChange={updateField} className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-primary" />
        </div>
        <div>
          <label htmlFor="transaction-category" className="mb-1 block text-sm text-subtext">Category</label>
          <input id="transaction-category" name="category" required maxLength="100" value={formData.category} onChange={updateField} className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-primary" />
        </div>
        <div>
          <label htmlFor="transaction-date" className="mb-1 block text-sm text-subtext">Date</label>
          <input id="transaction-date" name="date" type="date" required value={formData.date} onChange={updateField} className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-primary" />
        </div>
        <div>
          <label htmlFor="transaction-description" className="mb-1 block text-sm text-subtext">Description</label>
          <textarea id="transaction-description" name="description" rows="3" value={formData.description} onChange={updateField} className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-primary" />
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <button type="submit" disabled={loading} className={`rounded-md px-5 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 ${isExpense ? 'bg-error hover:bg-red-700' : 'bg-primary hover:bg-green-800'}`}>
            {loading ? 'Saving...' : title}
          </button>
          <button type="button" onClick={() => navigate(isExpense ? '/finance/expenses' : '/finance/income')} className="rounded-md border border-gray-300 bg-white px-5 py-2 font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;
