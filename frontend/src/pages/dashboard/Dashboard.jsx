import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import financeService from '../../services/financeService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import StatCard from '../../components/dashboard/StatCard';
import ChartCard from '../../components/dashboard/ChartCard';
import QuickActionCard from '../../components/dashboard/QuickActionCard';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import ErrorMessage from '../../components/common/ErrorMessage';
import {
  Beef,
  Sprout,
  Package,
  TrendingUp,
  TrendingDown,
  ClipboardList,
  AlertTriangle,
  ScanSearch,
  Plus,
  ArrowRight,
  Clock,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  // Real backend dataset states
  const [summary, setSummary] = useState(null);
  const [finance, setFinance] = useState({ total_income: 0, total_expenses: 0, net_balance: 0 });
  const [livestockList, setLivestockList] = useState([]);
  const [cropsList, setCropsList] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [tasksList, setTasksList] = useState([]);
  const [diseaseScans, setDiseaseScans] = useState([]);

  useEffect(() => {
    let active = true;

    const loadDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
        const [
          summaryRes,
          financeRes,
          livestockRes,
          cropsRes,
          inventoryRes,
          tasksRes,
          scansRes,
        ] = await Promise.allSettled([
          api.get('/dashboard/summary'),
          financeService.getOverview().catch(() => ({ total_income: 0, total_expenses: 0, net_balance: 0 })),
          api.get('/livestock').catch(() => ({ data: [] })),
          api.get('/crops').catch(() => ({ data: [] })),
          api.get('/inventory').catch(() => ({ data: [] })),
          api.get('/tasks').catch(() => ({ data: [] })),
          api.get('/disease-scanner/history').catch(() => ({ data: [] })),
        ]);

        if (!active) return;

        if (summaryRes.status === 'fulfilled') {
          setSummary(summaryRes.value.data);
        } else {
          throw summaryRes.reason;
        }

        if (financeRes.status === 'fulfilled') setFinance(financeRes.value.data || financeRes.value || {});
        if (livestockRes.status === 'fulfilled') setLivestockList(livestockRes.value.data || []);
        if (cropsRes.status === 'fulfilled') setCropsList(cropsRes.value.data || []);
        if (inventoryRes.status === 'fulfilled') setInventoryList(inventoryRes.value.data || []);
        if (tasksRes.status === 'fulfilled') setTasksList(tasksRes.value.data || []);
        if (scansRes.status === 'fulfilled') setDiseaseScans(scansRes.value.data || []);
      } catch (err) {
        console.error('Failed to load farmer dashboard:', err);
        if (active) {
          setError(
            err.response?.data?.detail ||
              'Dashboard data could not be retrieved from the server. Please check your connection and try again.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDashboardData();
    return () => {
      active = false;
    };
  }, [retry]);

  if (loading) {
    return <LoadingIndicator label="Loading your farm dashboard..." />;
  }

  if (error) {
    return (
      <div className="py-12">
        <ErrorMessage
          message={error}
          onRetry={() => {
            setError('');
            setRetry((prev) => prev + 1);
          }}
        />
      </div>
    );
  }

  // Aggregate Real Livestock Distribution
  const livestockTypeCounts = livestockList.reduce((acc, item) => {
    const type = item.type || item.breed || 'Other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const livestockChartData = {
    labels: Object.keys(livestockTypeCounts),
    datasets: [
      {
        data: Object.values(livestockTypeCounts),
        backgroundColor: [
          '#1B5E20', // Forest Green
          '#2E7D32', // Secondary Green
          '#81C784', // Mint
          '#F59E0B', // Amber
          '#172B3A', // Navy
          '#94A3B8', // Slate
        ],
        borderWidth: 2,
        borderColor: '#FFFFFF',
      },
    ],
  };

  // Aggregate Real Crop Status / Variety Distribution
  const cropStageCounts = cropsList.reduce((acc, item) => {
    const stage = item.status || item.stage || 'Active';
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {});

  const cropsChartData = {
    labels: Object.keys(cropStageCounts),
    datasets: [
      {
        label: 'Crops by Stage',
        data: Object.values(cropStageCounts),
        backgroundColor: '#2E7D32',
        borderRadius: 6,
      },
    ],
  };

  // Financial Comparison Chart Data
  const financeChartData = {
    labels: ['Total Income', 'Total Expenses', 'Net Balance'],
    datasets: [
      {
        label: 'Amount (M)',
        data: [
          finance.total_income || 0,
          finance.total_expenses || 0,
          Math.max(0, (finance.total_income || 0) - (finance.total_expenses || 0)),
        ],
        backgroundColor: ['#1B5E20', '#DC2626', '#2E7D32'],
        borderRadius: 8,
      },
    ],
  };

  // Health and Low Stock Alerts
  const sickLivestock = livestockList.filter(
    (a) => a.health_status && a.health_status.toLowerCase() !== 'healthy'
  );

  const lowStockItems = inventoryList.filter(
    (item) =>
      Number(item.quantity || 0) <= Number(item.minimum_stock_level || 0)
  );

  const pendingTasks = tasksList.filter(
    (t) => String(t.status).toLowerCase() !== 'completed'
  );

  return (
    <div className="space-y-7">
      {/* 1. Header with Farmer Name, Farm Name, Date */}
      <DashboardHeader
        userName={user?.full_name || 'Farmer'}
        farmName={user?.farm_name}
        subtitle="Here is your live agricultural operations summary and farm health."
      >
        <Link
          to="/app/tasks/add"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-hover transition"
        >
          <Plus className="h-3.5 w-3.5" />
          New Task
        </Link>
      </DashboardHeader>

      {/* 2. Top Metric Statistics Cards (6 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <StatCard
          title="Total Livestock"
          value={summary?.livestock_count ?? livestockList.length}
          iconName="livestock"
          color="primary"
          link="/app/livestock"
          subtitle={`${livestockList.length} animals tracked`}
        />
        <StatCard
          title="Active Crops"
          value={summary?.crop_count ?? cropsList.length}
          iconName="crops"
          color="secondary"
          link="/app/crops"
          subtitle={`${cropsList.length} planted varieties`}
        />
        <StatCard
          title="Inventory Items"
          value={inventoryList.length}
          iconName="inventory"
          color="navy"
          link="/app/inventory"
          subtitle={
            lowStockItems.length > 0
              ? `${lowStockItems.length} low stock alert${lowStockItems.length > 1 ? 's' : ''}`
              : 'Stock levels healthy'
          }
        />
        <StatCard
          title="Monthly Income"
          value={formatCurrency(finance.total_income || 0)}
          icon={<TrendingUp className="h-5 w-5" />}
          color="primary"
          link="/app/finance/income"
          trend={{ value: 'Revenue', isPositive: true }}
        />
        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(finance.total_expenses || 0)}
          icon={<TrendingDown className="h-5 w-5" />}
          color="error"
          link="/app/finance/expenses"
          trend={{ value: 'Costs', isPositive: false }}
        />
        <StatCard
          title="Pending Tasks"
          value={pendingTasks.length}
          iconName="tasks"
          color={pendingTasks.length > 0 ? 'warning' : 'primary'}
          link="/app/tasks"
          subtitle={`${tasksList.length} total scheduled`}
        />
      </div>

      {/* 3. Dashboard Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Income vs Expenses */}
        <ChartCard
          title="Income vs Expenses"
          subtitle="Financial overview of operational cash flow"
          isEmpty={!finance.total_income && !finance.total_expenses}
          emptyMessage="No income or expense transactions recorded yet."
        >
          <Bar
            data={financeChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: { color: '#F3F4F6' },
                  ticks: { font: { size: 11 } },
                },
                x: {
                  grid: { display: false },
                  ticks: { font: { size: 11 } },
                },
              },
            }}
          />
        </ChartCard>

        {/* Livestock Distribution */}
        <ChartCard
          title="Livestock Distribution"
          subtitle="Breakdown of farm animals by species and breed"
          isEmpty={livestockList.length === 0}
          emptyMessage="No livestock animals registered on this farm yet."
        >
          <Doughnut
            data={livestockChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: { boxWidth: 12, font: { size: 11 } },
                },
              },
              cutout: '65%',
            }}
          />
        </ChartCard>

        {/* Crop Stage Distribution */}
        <ChartCard
          title="Crop Production Stages"
          subtitle="Status of active and harvested crops"
          isEmpty={cropsList.length === 0}
          emptyMessage="No crops planted or recorded on this farm yet."
        >
          <Bar
            data={cropsChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: { color: '#F3F4F6' },
                  ticks: { stepSize: 1, font: { size: 11 } },
                },
                x: {
                  grid: { display: false },
                  ticks: { font: { size: 11 } },
                },
              },
            }}
          />
        </ChartCard>
      </div>

      {/* 4. Quick Actions Grid */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-maintext">Quick Operations</h2>
          <span className="text-xs text-subtext">Direct shortcuts to add records</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <QuickActionCard
            to="/app/livestock/add"
            iconName="livestock"
            title="Add Animal"
            description="Register animal"
            color="primary"
          />
          <QuickActionCard
            to="/app/crops/add"
            iconName="crops"
            title="Add Crop"
            description="Record planting"
            color="secondary"
          />
          <QuickActionCard
            to="/app/inventory/add"
            iconName="inventory"
            title="Add Item"
            description="Restock inventory"
            color="navy"
          />
          <QuickActionCard
            to="/app/finance/income/add"
            iconName="finance"
            title="Record Income"
            description="Log harvest sale"
            color="primary"
          />
          <QuickActionCard
            to="/app/finance/expenses/add"
            iconName="wallet"
            title="Log Expense"
            description="Feed, seeds, fuel"
            color="warning"
          />
          <QuickActionCard
            to="/app/disease-scanner"
            iconName="scanner"
            title="Scan Crop"
            description="AI disease detection"
            color="secondary"
          />
        </div>
      </div>

      {/* 5. Alerts & Operational Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Health & Inventory Alerts */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              <h3 className="text-base font-bold text-maintext">Farm Health & Stock Alerts</h3>
            </div>
            {(sickLivestock.length > 0 || lowStockItems.length > 0) && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
                {sickLivestock.length + lowStockItems.length} active
              </span>
            )}
          </div>

          {sickLivestock.length === 0 && lowStockItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-subtext">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mb-2" />
              <p className="text-sm font-semibold text-maintext">All Systems Healthy</p>
              <p className="text-xs text-subtext mt-1">
                No sick animals or critically low inventory items reported.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
              {sickLivestock.map((animal) => (
                <Link
                  key={animal.id}
                  to={`/app/livestock/${animal.id}`}
                  className="flex items-start justify-between gap-2 rounded-lg border border-red-100 bg-red-50/50 p-3 transition hover:bg-red-50"
                >
                  <div>
                    <p className="text-xs font-bold text-red-900">
                      {animal.name || animal.tag_number || 'Animal'}: {animal.type}
                    </p>
                    <p className="text-[11px] text-red-700">Health: {animal.health_status}</p>
                  </div>
                  <StatusBadge status={animal.health_status} size="xs" />
                </Link>
              ))}

              {lowStockItems.map((item) => (
                <Link
                  key={item.id}
                  to={`/app/inventory/${item.id}`}
                  className="flex items-start justify-between gap-2 rounded-lg border border-amber-100 bg-amber-50/50 p-3 transition hover:bg-amber-50"
                >
                  <div>
                    <p className="text-xs font-bold text-amber-900">{item.name}</p>
                    <p className="text-[11px] text-amber-800">
                      Stock: {item.quantity} (Min: {item.minimum_stock_level})
                    </p>
                  </div>
                  <StatusBadge status="Low Stock" size="xs" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Tasks */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              <h3 className="text-base font-bold text-maintext">Upcoming Farm Tasks</h3>
            </div>
            <Link to="/app/tasks" className="text-xs font-semibold text-primary hover:underline">
              View All
            </Link>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-subtext">
              <ClipboardList className="h-10 w-10 text-gray-300 mb-2" />
              <p className="text-sm font-semibold text-maintext">No Pending Tasks</p>
              <p className="text-xs text-subtext mt-1">All scheduled farm activities are completed.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
              {pendingTasks.slice(0, 5).map((task) => (
                <Link
                  key={task.id}
                  to={`/app/tasks/${task.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3 transition hover:border-gray-200 hover:bg-white"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-maintext truncate">{task.name}</p>
                    <div className="flex items-center gap-2 text-[11px] text-subtext mt-0.5">
                      <Clock className="h-3 w-3" />
                      <span>{task.due_date || task.date ? formatDate(task.due_date || task.date) : 'No due date'}</span>
                    </div>
                  </div>
                  <StatusBadge status={task.status || 'Pending'} size="xs" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Farm Activities */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-secondary" />
              <h3 className="text-base font-bold text-maintext">Recent Activity</h3>
            </div>
            <span className="text-xs text-subtext">Live audit trail</span>
          </div>

          {!summary?.recent_activity || summary.recent_activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-subtext">
              <Clock className="h-10 w-10 text-gray-300 mb-2" />
              <p className="text-sm font-semibold text-maintext">No Recent Activities</p>
              <p className="text-xs text-subtext mt-1">Activities will appear as you record farm operations.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {summary.recent_activity.map((activity, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-primary mt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-maintext leading-relaxed">
                      {activity.description}
                    </p>
                    <p className="text-[10px] text-subtext mt-0.5">
                      {activity.time ? formatDate(activity.time) : 'Recent'}
                    </p>
                  </div>
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
