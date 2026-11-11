import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import inventoryService from '../../services/inventoryService';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import { Plus, Package, History, ArrowRight, AlertTriangle } from 'lucide-react';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await inventoryService.getAllItems();
        setItems(data || []);
      } catch (error) {
        console.error('Failed to load inventory items:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  if (loading) return <LoadingIndicator label="Loading inventory items..." />;

  const lowStockCount = items.filter(
    (item) => Number(item.quantity || 0) <= Number(item.minimum_stock_level || 0)
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Farm Inventory"
        subtitle="Manage seeds, fertilizers, veterinary supplies, tools, and consumables."
      >
        <div className="flex items-center gap-3">
          <Link
            to="/app/inventory/history"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-maintext shadow-sm hover:bg-gray-50 transition"
          >
            <History className="h-4 w-4 text-subtext" />
            <span>Stock History</span>
          </Link>
          <Link
            to="/app/inventory/add"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-primary-hover transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Item</span>
          </Link>
        </div>
      </PageHeader>

      {lowStockCount > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs sm:text-sm text-amber-900 shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <span className="font-semibold">
              {lowStockCount} inventory item{lowStockCount > 1 ? 's are' : ' is'} below minimum threshold!
            </span>
          </div>
          <span className="text-xs font-bold text-amber-800">Restock Recommended</span>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={<Package className="h-8 w-8 text-navy" />}
          title="No Inventory Items Tracked"
          description="Keep track of your farm's feed, fertilizer, medicine, and equipment stock levels."
          actionText="Add Inventory Item"
          actionLink="/app/inventory/add"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => {
            const isLow = Number(item.quantity || 0) <= Number(item.minimum_stock_level || 0);
            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-gray-200 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-navy">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-maintext line-clamp-1">
                          {item.name}
                        </h3>
                        <p className="text-xs text-subtext">{item.category || 'General'}</p>
                      </div>
                    </div>
                    <StatusBadge
                      status={isLow ? 'Low Stock' : 'In Stock'}
                      size="xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 py-2 text-xs text-subtext border-t border-gray-50">
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-gray-400">Available</span>
                      <span className="text-sm font-bold text-maintext">
                        {item.quantity} {item.unit || 'units'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-gray-400">Minimum Level</span>
                      <span className="text-sm font-semibold text-subtext">
                        {item.minimum_stock_level || 0} {item.unit || 'units'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-subtext">Stock & Adjustments</span>
                  <Link
                    to={`/app/inventory/${item.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    <span>Manage Stock</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Inventory;
