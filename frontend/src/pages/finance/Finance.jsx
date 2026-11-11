import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import financeService from '../../services/financeService';
import { formatCurrency } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/dashboard/StatCard';
import QuickActionCard from '../../components/dashboard/QuickActionCard';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  FileSpreadsheet,
  ArrowUpRight,
  Receipt,
  DollarSign,
} from 'lucide-react';

const Finance = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const data = await financeService.getOverview();
        setOverview(data);
      } catch (error) {
        console.error('Failed to load finance data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  if (loading) return <LoadingIndicator label="Loading financial data..." />;

  const totalIncome = overview?.total_income || 0;
  const totalExpenses = overview?.total_expenses || 0;
  const netBalance = overview?.net_balance || totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Management"
        subtitle="Track farm revenue, recurring operating expenditures, cash flow, and tax reports."
      >
        <div className="flex items-center gap-2.5">
          <Link
            to="/app/finance/income/add"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-primary-hover transition"
          >
            <Plus className="h-4 w-4" />
            <span>Record Income</span>
          </Link>
          <Link
            to="/app/finance/expenses/add"
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs sm:text-sm font-bold text-error shadow-sm hover:bg-red-100 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Log Expense</span>
          </Link>
        </div>
      </PageHeader>

      {/* Financial Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          title="Total Gross Income"
          value={formatCurrency(totalIncome)}
          icon={<TrendingUp className="h-5 w-5" />}
          color="primary"
          link="/app/finance/income"
          subtitle="All recorded produce & livestock sales"
          trend={{ value: 'Revenue', isPositive: true }}
        />
        <StatCard
          title="Total Operating Expenses"
          value={formatCurrency(totalExpenses)}
          icon={<TrendingDown className="h-5 w-5" />}
          color="error"
          link="/app/finance/expenses"
          subtitle="Feed, fertilizer, equipment, fuel"
          trend={{ value: 'Expenses', isPositive: false }}
        />
        <StatCard
          title="Net Farm Balance"
          value={formatCurrency(netBalance)}
          icon={<Wallet className="h-5 w-5" />}
          color={netBalance >= 0 ? 'secondary' : 'error'}
          subtitle={netBalance >= 0 ? 'Profitable cash position' : 'Operating at deficit'}
        />
      </div>

      {/* Navigation Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-maintext">Transaction Ledgers</h3>
              <p className="text-xs text-subtext">Review detailed income and expense entries</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Link
              to="/app/finance/income"
              className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 transition"
            >
              <div>
                <p className="text-xs font-bold text-primary">Income Ledger</p>
                <p className="text-[11px] text-subtext mt-0.5">Sales & harvests</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-primary" />
            </Link>

            <Link
              to="/app/finance/expenses"
              className="flex items-center justify-between p-3.5 rounded-xl border border-red-100 bg-red-50/50 hover:bg-red-50 transition"
            >
              <div>
                <p className="text-xs font-bold text-error">Expense Ledger</p>
                <p className="text-[11px] text-subtext mt-0.5">Costs & supplies</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-error" />
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-navy">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-maintext">Financial Reports & Exports</h3>
              <p className="text-xs text-subtext">Generate periodic profit & loss summaries</p>
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/app/finance/reports"
              className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-gray-100 transition"
            >
              <div>
                <p className="text-xs font-bold text-maintext">Comprehensive Financial Reports</p>
                <p className="text-[11px] text-subtext mt-0.5">Filter by date ranges and export CSV data</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-gray-500" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Finance;
