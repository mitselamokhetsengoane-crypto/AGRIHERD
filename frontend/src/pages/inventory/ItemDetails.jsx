import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import inventoryService from '../../services/inventoryService';
import { formatDate, getStatusColor } from '../../utils/formatters';

const ItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updateAmount, setUpdateAmount] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const data = await inventoryService.getItemById(id);
        setItem(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    try {
      await inventoryService.updateStock(id, { change_amount: parseFloat(updateAmount), reason });
      window.location.reload(); // Quick refresh to show new quantity
    } catch (error) {
      alert("Failed to update stock.");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      await inventoryService.deleteItem(id);
      navigate('/inventory');
    }
  };

  if (loading) return <div className="p-8 text-center text-subtext">Loading item details...</div>;
  if (!item) return <div className="p-8 text-center text-error">Item not found.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/inventory" className="text-primary hover:underline text-sm">Back to Inventory</Link>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div className="flex justify-between items-start border-b border-gray-100 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-maintext">{item.name}</h1>
            <p className="text-subtext">{item.category}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(item.stock_status)}`}>
            {item.stock_status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><p className="text-sm text-subtext">Current Quantity</p><p className="font-bold text-lg text-maintext">{item.quantity} {item.unit}</p></div>
          <div><p className="text-sm text-subtext">Min. Stock Level</p><p className="font-medium text-maintext">{item.minimum_stock_level} {item.unit}</p></div>
          <div><p className="text-sm text-subtext">Last Updated</p><p className="font-medium text-maintext">{formatDate(item.updated_at)}</p></div>
        </div>
      </div>

      {/* Update Stock Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <h3 className="font-semibold text-maintext">Update Stock</h3>
        <form onSubmit={handleUpdateStock} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm text-subtext mb-1">Amount (use negative for usage)</label>
            <input required type="number" step="any" className="w-full border border-gray-300 rounded-md px-4 py-2" value={updateAmount} onChange={e => setUpdateAmount(e.target.value)} />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-subtext mb-1">Reason</label>
            <input required type="text" className="w-full border border-gray-300 rounded-md px-4 py-2" value={reason} onChange={e => setReason(e.target.value)} />
          </div>
          <button type="submit" className="bg-primary text-white px-6 py-2 rounded-md hover:bg-green-800 transition h-[42px]">Update</button>
        </form>
      </div>

      <div className="flex gap-4">
        <button onClick={handleDelete} className="w-full bg-white border border-error text-error py-2 rounded-md hover:bg-red-50">Delete Item</button>
      </div>
    </div>
  );
};

export default ItemDetails;