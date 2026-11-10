import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import financeService from '../../services/financeService';
import { formatCurrency, formatDate } from '../../utils/formatters';

const Income = () => {
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncome = async () => {
      try {
        setIncomes(await financeService.getIncome());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchIncome();
  }, []);

  if (loading) return <div className="p-8 text-center text-subtext">Loading income records...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-maintext">Income Records</h1>
        <Link to="/finance/income/add" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-green-800 transition">+ Add Income</Link>
      </div>

      {incomes.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-xl shadow-sm border border-gray-100">
          <p className="text-subtext">No income records found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-medium text-subtext">Date</th>
                <th className="p-4 font-medium text-subtext">Source</th>
                <th className="p-4 font-medium text-subtext">Category</th>
                <th className="p-4 font-medium text-subtext">Description</th>
                <th className="p-4 font-medium text-subtext text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {incomes.map((inc) => (
                <tr key={inc.id}>
                  <td className="p-4 text-subtext">{formatDate(inc.date)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      inc.source === 'MARKETPLACE_SALE'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {inc.source === 'MARKETPLACE_SALE' ? 'Marketplace Sale' : 'Manual'}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-maintext">{inc.category || 'General'}</td>
                  <td className="p-4 text-subtext">{inc.description}</td>
                  <td className="p-4 text-right font-bold text-primary">{formatCurrency(inc.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Link to="/finance" className="text-primary hover:underline text-sm inline-block mt-4">Back to Finance</Link>
    </div>
  );
};

export default Income;