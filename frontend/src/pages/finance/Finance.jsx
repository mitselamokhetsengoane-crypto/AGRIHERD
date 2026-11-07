import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import financeService from '../../services/financeService';
import { formatCurrency } from '../../utils/formatters';

const Finance = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const data = await financeService.getOverview();
        setOverview(data);
      } catch (error) {
        console.error("Failed to load finance data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  if (loading) return <div className="p-8 text-center text-subtext">Loading financial data...</div>;
  if (!overview) return <div className="bg-white p-8 text-center rounded-xl shadow-sm border border-gray-100"><p className="text-subtext">No financial data available.</p></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-maintext">Finance Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-subtext mb-1">Total Income</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(overview.total_income)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-subtext mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-error">{formatCurrency(overview.total_expenses)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-subtext mb-1">Net Balance</p>
          <p className="text-2xl font-bold text-maintext">{formatCurrency(overview.net_balance)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center space-y-4">
          <h3 className="font-semibold text-maintext">Manage Transactions</h3>
          <div className="flex gap-4">
            <Link to="/finance/income" className="bg-primary text-white px-6 py-2 rounded-md hover:bg-green-800 transition">Income</Link>
            <Link to="/finance/expenses" className="bg-error text-white px-6 py-2 rounded-md hover:bg-red-700 transition">Expenses</Link>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center space-y-4">
          <h3 className="font-semibold text-maintext">Reports & History</h3>
          <div className="flex gap-4">
            <Link to="/finance/income" className="border border-primary text-primary px-6 py-2 rounded-md hover:bg-background transition">Income History</Link>
            <Link to="/finance/reports" className="border border-primary text-primary px-6 py-2 rounded-md hover:bg-background transition">Reports</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Finance;