import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import inventoryService from '../../services/inventoryService';
import { getStatusColor } from '../../utils/formatters';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await inventoryService.getAllItems();
        setItems(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  if (loading) return <div className="p-8 text-center text-subtext">Loading inventory...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-maintext">Inventory</h1>
        <div className="space-x-4">
          <Link to="/inventory/history" className="text-primary hover:underline text-sm font-medium">Stock History</Link>
          <Link to="/inventory/add" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-green-800 transition">+ Add Item</Link>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-xl shadow-sm border border-gray-100">
          <p className="text-subtext">No inventory items found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-maintext">{item.name}</h3>
                  <p className="text-sm text-subtext">{item.category}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.stock_status)}`}>
                  {item.stock_status}
                </span>
              </div>
              <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                <div>
                  <p className="text-xs text-subtext">Quantity</p>
                  <p className="font-bold text-maintext">{item.quantity} {item.unit}</p>
                </div>
                <Link to={`/inventory/${item.id}`} className="text-primary text-sm font-medium hover:underline">Manage</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Inventory;