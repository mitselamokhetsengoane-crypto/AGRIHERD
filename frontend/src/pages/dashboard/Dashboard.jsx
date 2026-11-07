import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // One endpoint to rule them all - this fetches summary counts from DB
        const response = await api.get('/dashboard/summary');
        setData(response.data);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
        setError(
          error.response?.data?.detail
            || 'Dashboard data could not be loaded. Check your connection and try again.'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [retry]);

  if (loading) return <div className="p-8 text-center text-subtext">Loading dashboard...</div>;
  if (error) {
    return (
      <div role="alert" className="space-y-4 p-8 text-center text-error">
        <p>{error}</p>
        <button
          type="button"
          onClick={() => {
            setError('');
            setLoading(true);
            setRetry((attempt) => attempt + 1);
          }}
          className="rounded-md bg-primary px-4 py-2 text-white hover:bg-green-800"
        >
          Retry
        </button>
      </div>
    );
  }

  // If no data from backend yet, show empty states
  const summary = data || {
    livestock_count: 0,
    crop_count: 0,
    upcoming_tasks: 0,
    low_stock_alerts: 0,
    net_balance: 0,
    recent_activity: []
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-maintext">Good Morning, Farmer</h1>
          <p className="text-subtext mt-1">Here is what is happening on your farm today.</p>
        </div>
        <Link to="/tasks" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-green-800 transition">
          View Tasks
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center">
          <p className="text-sm text-subtext mb-1">Livestock</p>
          <p className="text-3xl font-bold text-maintext">{summary.livestock_count}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center">
          <p className="text-sm text-subtext mb-1">Active Crops</p>
          <p className="text-3xl font-bold text-maintext">{summary.crop_count}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center">
          <p className="text-sm text-subtext mb-1">Upcoming Tasks</p>
          <p className="text-3xl font-bold text-primary">{summary.upcoming_tasks}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center">
          <p className="text-sm text-subtext mb-1">Low Stock Alerts</p>
          <p className="text-3xl font-bold text-error">{summary.low_stock_alerts}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-1">
          <h3 className="font-bold text-maintext mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/livestock/add" className="bg-background text-primary text-center py-3 rounded-md text-sm font-medium hover:bg-primary hover:text-white transition">+ Add Animal</Link>
            <Link to="/crops/add" className="bg-background text-primary text-center py-3 rounded-md text-sm font-medium hover:bg-primary hover:text-white transition">+ Add Crop</Link>
            <Link to="/tasks/add" className="bg-background text-primary text-center py-3 rounded-md text-sm font-medium hover:bg-primary hover:text-white transition">+ Add Task</Link>
            <Link to="/disease-scanner" className="bg-background text-primary text-center py-3 rounded-md text-sm font-medium hover:bg-primary hover:text-white transition">Scan Disease</Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-1 lg:col-span-2">
          <h3 className="font-bold text-maintext mb-4">Recent Activity</h3>
          {summary.recent_activity.length === 0 ? (
            <p className="text-subtext text-sm">No recent activity recorded.</p>
          ) : (
            <div className="space-y-4">
              {summary.recent_activity.map((activity, idx) => (
                <div key={idx} className="flex justify-between items-center border-b border-gray-50 pb-2">
                  <span className="text-sm text-maintext">{activity.description}</span>
                  <span className="text-xs text-subtext">{activity.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;