import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import inventoryService from '../../services/inventoryService';
import { formatDate } from '../../utils/formatters';

const StockHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await inventoryService.getStockHistory();
        setHistory(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div className="p-8 text-center text-subtext">Loading history...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-maintext">Stock History</h1>
        <Link to="/inventory" className="text-primary hover:underline text-sm">Back to Inventory</Link>
      </div>

      {history.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-xl shadow-sm border border-gray-100">
          <p className="text-subtext">No stock changes recorded yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-medium text-subtext">Date</th>
                <th className="p-4 font-medium text-subtext">Item</th>
                <th className="p-4 font-medium text-subtext">Change</th>
                <th className="p-4 font-medium text-subtext">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.map((record) => (
                <tr key={record.id}>
                  <td className="p-4 text-subtext">{formatDate(record.created_at)}</td>
                  <td className="p-4 font-medium text-maintext">{record.item_name}</td>
                  <td className={`p-4 font-bold ${record.change_amount > 0 ? 'text-primary' : 'text-error'}`}>
                    {record.change_amount > 0 ? '+' : ''}{record.change_amount}
                  </td>
                  <td className="p-4 text-subtext">{record.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StockHistory;