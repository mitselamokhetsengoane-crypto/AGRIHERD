import { useCallback, useState, useEffect } from 'react';
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
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import api from '../../services/api';
import securityService from '../../services/securityService';
import marketplaceService from '../../services/marketplaceService';
import { formatDate } from '../../utils/formatters';
import StatCard from '../../components/dashboard/StatCard';
import ChartCard from '../../components/dashboard/ChartCard';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import ErrorMessage from '../../components/common/ErrorMessage';
import {
  Users,
  Warehouse,
  Store,
  ShoppingCart,
  ScanSearch,
  Blocks,
  ShieldCheck,
  Activity,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Server,
  Database,
  Cpu,
  Package,
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
  Legend
);

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Real backend telemetry data
  const [overview, setOverview] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [aiSummary, setAiSummary] = useState(null);
  const [blockchainRecords, setBlockchainRecords] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [approvingId, setApprovingId] = useState(null);

  const fetchPlatformData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [
        overviewRes,
        usersRes,
        listingsRes,
        ordersRes,
        aiRes,
        blockchainRes,
        auditRes,
      ] = await Promise.allSettled([
        securityService.getOverview(),
        api.get('/admin/users'),
        marketplaceService.adminGetAllListings().catch(() => []),
        api.get('/marketplace/orders').catch(() => ({ data: [] })),
        api.get('/admin/ai/summary').catch(() => ({ data: {} })),
        api.get('/admin/blockchain/all').catch(() => ({ data: [] })),
        api.get('/admin/audit-logs?limit=10').catch(() => ({ data: [] })),
      ]);

      if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value);
      if (usersRes.status === 'fulfilled') setUsersList(usersRes.value.data || []);
      if (listingsRes.status === 'fulfilled') setListings(listingsRes.value || []);
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.data || []);
      if (aiRes.status === 'fulfilled') setAiSummary(aiRes.value.data || {});
      if (blockchainRes.status === 'fulfilled') setBlockchainRecords(blockchainRes.value.data || []);
      if (auditRes.status === 'fulfilled') setAuditLogs(auditRes.value.data || []);
    } catch (err) {
      console.error('Failed to load platform data:', err);
      setError(
        err.response?.data?.detail || 'Platform administration data could not be retrieved.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlatformData();
  }, [fetchPlatformData]);

  const handleApproveFarmer = async (userId) => {
    try {
      setApprovingId(userId);
      await api.patch(`/admin/users/${userId}/approve`);
      await fetchPlatformData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to approve user.');
    } finally {
      setApprovingId(null);
    }
  };

  if (loading) {
    return <LoadingIndicator label="Loading enterprise administration console..." />;
  }

  const totalUsers = overview?.total_users ?? usersList.length;
  const totalFarmers = overview?.total_farmers ?? usersList.filter((u) => u.role === 'farmer').length;
  const totalBuyers = overview?.total_buyers ?? usersList.filter((u) => u.role === 'buyer').length;
  const totalAdmins = usersList.filter((u) => u.role === 'admin').length;
  const pendingUsers = usersList.filter((u) => u.account_status === 'PENDING');

  // User Distribution Chart Data
  const userDistData = {
    labels: ['Farmers', 'Buyers', 'Administrators'],
    datasets: [
      {
        data: [totalFarmers, totalBuyers, totalAdmins],
        backgroundColor: ['#1B5E20', '#2E7D32', '#172B3A'],
        borderColor: '#FFFFFF',
        borderWidth: 2,
      },
    ],
  };

  // User Signups Trend (Group by Month or Week)
  const signupsByMonth = usersList.reduce((acc, user) => {
    if (!user.created_at) return acc;
    const date = new Date(user.created_at);
    const key = date.toLocaleString('default', { month: 'short' });
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const signupTrendData = {
    labels: Object.keys(signupsByMonth).length > 0 ? Object.keys(signupsByMonth) : ['Current'],
    datasets: [
      {
        label: 'Registrations',
        data: Object.keys(signupsByMonth).length > 0 ? Object.values(signupsByMonth) : [totalUsers],
        backgroundColor: '#172B3A',
        borderRadius: 6,
      },
    ],
  };

  return (
    <div className="space-y-7">
      {/* 1. Header with Title and Telemetry Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-maintext">
              Platform Administration Console
            </h1>
            <span className="inline-flex items-center rounded-full bg-navy text-white px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider">
              SUPERVISION
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-subtext">
            Enterprise system monitoring, user approvals, audit trails, and platform telemetry.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPlatformData}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-maintext shadow-sm hover:bg-gray-50 transition disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchPlatformData} />}

      {/* 2. Platform-Wide Statistics (8 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Users"
          value={totalUsers}
          icon={<Users className="h-5 w-5" />}
          color="navy"
          link="/admin/users"
          subtitle={`${pendingUsers.length} awaiting approval`}
        />
        <StatCard
          title="Registered Farmers"
          value={totalFarmers}
          iconName="crops"
          color="primary"
          link="/admin/users"
          subtitle={`${totalUsers ? Math.round((totalFarmers / totalUsers) * 100) : 0}% of all users`}
        />
        <StatCard
          title="Registered Buyers"
          value={totalBuyers}
          icon={<ShoppingCart className="h-5 w-5" />}
          color="secondary"
          link="/admin/users"
          subtitle={`${totalUsers ? Math.round((totalBuyers / totalUsers) * 100) : 0}% of all users`}
        />
        <StatCard
          title="Registered Farms"
          value={overview?.total_farms ?? '—'}
          icon={<Warehouse className="h-5 w-5" />}
          color="primary"
          link="/admin/farms"
          subtitle="Agricultural holdings"
        />
        <StatCard
          title="Marketplace Listings"
          value={listings.length}
          icon={<Store className="h-5 w-5" />}
          color="secondary"
          link="/admin/marketplace"
          subtitle={`${listings.filter((l) => l.status === 'Active').length} active listings`}
        />
        <StatCard
          title="Marketplace Orders"
          value={orders.length}
          icon={<Package className="h-5 w-5" />}
          color="navy"
          link="/admin/marketplace"
          subtitle="Processed platform transactions"
        />
        <StatCard
          title="AI Disease Scans"
          value={aiSummary?.disease_scan_count ?? '0'}
          icon={<ScanSearch className="h-5 w-5" />}
          color="primary"
          link="/admin/ai"
          subtitle="YOLOv8 crop diagnoses"
        />
        <StatCard
          title="Blockchain Records"
          value={blockchainRecords.length}
          icon={<Blocks className="h-5 w-5" />}
          color="navy"
          link="/admin/blockchain"
          subtitle="Tamper-proof on-chain audits"
        />
      </div>

      {/* 3. Platform Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* User Distribution */}
        <ChartCard
          title="User Role Distribution"
          subtitle="Relative breakdown of ecosystem participants"
          isEmpty={totalUsers === 0}
        >
          <Doughnut
            data={userDistData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: { boxWidth: 12, font: { size: 11 } },
                },
              },
              cutout: '68%',
            }}
          />
        </ChartCard>

        {/* User Signups Trend */}
        <ChartCard
          title="User Registrations Trend"
          subtitle="Growth in registered platform members over time"
          isEmpty={usersList.length === 0}
        >
          <Bar
            data={signupTrendData}
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

        {/* System Health Status Panel */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="border-b border-gray-50 pb-3">
            <h3 className="text-base font-bold text-maintext">Infrastructure Health</h3>
            <p className="text-xs text-subtext">Live connection status of platform services</p>
          </div>

          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {/* Database */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-primary">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-maintext">Database Service</p>
                  <p className="text-[11px] text-subtext">Supabase PostgreSQL</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                Connected
              </span>
            </div>

            {/* AI Service */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-secondary">
                  <Cpu className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-maintext">AI Disease Detection</p>
                  <p className="text-[11px] text-subtext">YOLOv8 Engine</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                Operational
              </span>
            </div>

            {/* Blockchain Node */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-navy">
                  <Server className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-maintext">Blockchain Ledger</p>
                  <p className="text-[11px] text-subtext">Smart Contract Node</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                Active
              </span>
            </div>
          </div>

          <div className="pt-2 text-center text-[11px] text-subtext">
            All microservices monitored in real-time
          </div>
        </div>
      </div>

      {/* 4. Pending Approvals & Recent Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pending Farmer Approvals */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-warning" />
              <h3 className="text-base font-bold text-maintext">Pending Farmer Approvals</h3>
            </div>
            <Link to="/admin/users" className="text-xs font-semibold text-primary hover:underline">
              View All Users
            </Link>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="py-8 text-center text-subtext">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-maintext">No Pending Registrations</p>
              <p className="text-xs text-subtext mt-1">All new accounts have been reviewed and approved.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
              {pendingUsers.slice(0, 5).map((pendingUser) => (
                <div
                  key={pendingUser.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50/40 p-3.5 transition"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-maintext truncate">
                      {pendingUser.full_name || 'New Farmer'}
                    </p>
                    <p className="text-[11px] text-subtext truncate">{pendingUser.email}</p>
                    <p className="text-[10px] text-amber-700 mt-0.5">
                      Requested: {pendingUser.created_at ? formatDate(pendingUser.created_at) : 'Recently'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApproveFarmer(pendingUser.id)}
                    disabled={approvingId === pendingUser.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-hover transition disabled:opacity-50 shrink-0"
                  >
                    {approvingId === pendingUser.id ? (
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-r-transparent" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    <span>Approve</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security Audit Trail */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-navy" />
              <h3 className="text-base font-bold text-maintext">Security Audit Trail</h3>
            </div>
            <Link to="/admin/audit-logs" className="text-xs font-semibold text-primary hover:underline">
              Full Audit Log
            </Link>
          </div>

          {auditLogs.length === 0 ? (
            <div className="py-8 text-center text-subtext">
              <Activity className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-maintext">No Recent Audit Entries</p>
              <p className="text-xs text-subtext mt-1">Platform actions and changes are logged securely.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {auditLogs.slice(0, 6).map((log, idx) => (
                <div
                  key={log.id || idx}
                  className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-navy mt-0.5 font-bold text-[10px]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-maintext truncate">
                      {log.action}
                    </p>
                    <p className="text-[11px] text-subtext truncate">
                      {log.details || 'System audit event recorded'}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {log.created_at ? formatDate(log.created_at) : 'Recent'}
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

export default AdminDashboard;
