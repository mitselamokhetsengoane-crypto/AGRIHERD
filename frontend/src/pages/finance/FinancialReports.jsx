import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import financeService from '../../services/financeService';
import { formatCurrency } from '../../utils/formatters';

const FinancialReports = () => {
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await financeService.getReports();
        setReport(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) return <div className="p-8 text-center text-subtext">Generating reports...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-maintext">Monthly Financial Reports</h1>
        <Link to="/finance" className="text-primary hover:underline text-sm">Back to Finance</Link>
      </div>

      {report.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-xl shadow-sm border border-gray-100">
          <p className="text-subtext">Not enough data to generate reports.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {report.map((monthData, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-maintext text-lg">{monthData.month}</h3>
              <div className="flex gap-8">
                <div className="text-right">
                  <p className="text-xs text-subtext">Income</p>
                  <p className="font-bold text-primary">{formatCurrency(monthData.income)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-subtext">Expenses</p>
                  <p className="font-bold text-error">{formatCurrency(monthData.expenses)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-subtext">Net Balance</p>
                  <p className="font-bold text-maintext">{formatCurrency(monthData.balance)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FinancialReports;