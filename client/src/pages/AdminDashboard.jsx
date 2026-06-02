import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { adminApi } from '../api.js';
import PageLoading from '../components/PageLoading.jsx';

const STRIPE_DASHBOARD_URL =
  'https://dashboard.stripe.com/acct_1TZW4zBQe8WfAxpb/test/dashboard';

const GRANULARITY_OPTIONS = [
  { value: 'day', label: 'By day', subtitle: 'Last 30 days' },
  { value: 'week', label: 'By week', subtitle: 'Last 12 weeks' },
  { value: 'month', label: 'By month', subtitle: 'Last 12 months' },
];

const PIE_COLORS = [
  '#111111',
  '#374151',
  '#6b7280',
  '#9ca3af',
  '#b91c1c',
  '#1d4ed8',
  '#059669',
  '#d97706',
  '#7c3aed',
  '#0891b2',
  '#be185d',
  '#4d7c0f',
];

function formatPrice(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(
    Number(n) || 0
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  return (
    <div className="admin-chart-tooltip">
      <strong>{label ?? row?.label}</strong>
      <div>{row?.orderCount ?? 0} orders</div>
      <div>{formatPrice(row?.revenue)} revenue</div>
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  return (
    <div className="admin-chart-tooltip">
      <strong>{row?.label}</strong>
      <div>{row?.orderCount ?? 0} orders</div>
      <div>{formatPrice(row?.revenue)} revenue</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [granularity, setGranularity] = useState('day');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportBusy, setReportBusy] = useState(false);

  async function downloadMonthlySalesReport() {
    setReportBusy(true);
    setError(null);
    try {
      const monthValue = new Date().toISOString().slice(0, 7);
      await adminApi.downloadMonthlySalesReportPdf(monthValue);
    } catch (e) {
      setError(e.body?.error || e.message);
    } finally {
      setReportBusy(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await adminApi.orderStats(granularity);
        if (!cancelled) setStats(data);
      } catch (e) {
        if (!cancelled) setError(e.body?.error || e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [granularity]);

  const barData = useMemo(() => stats?.buckets ?? [], [stats]);
  const pieData = useMemo(
    () => barData.filter((b) => b.orderCount > 0),
    [barData]
  );

  const activeGranularity = GRANULARITY_OPTIONS.find((o) => o.value === granularity);

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted admin-dashboard__subtitle">
            Order volume and revenue — {activeGranularity?.subtitle?.toLowerCase() ?? 'overview'}
          </p>
          <a
            className="admin-dashboard__stripe-link"
            href={STRIPE_DASHBOARD_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Launch stripe payment portal (Transaction history)
          </a>
          <button
            type="button"
            className="admin-dashboard__report-link"
            onClick={downloadMonthlySalesReport}
            disabled={reportBusy}
          >
            {reportBusy ? 'Generating monthly sales report…' : 'Download monthly sales report'}
          </button>
        </div>
        <div className="admin-dashboard__toggle" role="group" aria-label="Time grouping">
          {GRANULARITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`admin-dashboard__toggle-btn${granularity === opt.value ? ' active' : ''}`}
              aria-pressed={granularity === opt.value}
              onClick={() => {
                if (opt.value !== granularity) setGranularity(opt.value);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {loading && !stats ? (
        <PageLoading active label="Loading order stats…" />
      ) : (
        <>
          <div className="admin-dashboard__summary" style={{ opacity: loading ? 0.55 : 1 }}>
            <div className="admin-dashboard__stat card">
              <span className="admin-dashboard__stat-label">Total orders</span>
              <strong className="admin-dashboard__stat-value">{stats?.totals?.orderCount ?? 0}</strong>
            </div>
            <div className="admin-dashboard__stat card">
              <span className="admin-dashboard__stat-label">Total revenue</span>
              <strong className="admin-dashboard__stat-value">
                {formatPrice(stats?.totals?.revenue)}
              </strong>
            </div>
          </div>

          <div className="admin-dashboard__charts">
            <section className="card admin-dashboard__chart-card">
              <h2 className="admin-dashboard__chart-title">Orders bar chart</h2>
              <p className="muted admin-dashboard__chart-desc">
                Number of orders per {granularity === 'day' ? 'day' : granularity === 'week' ? 'week' : 'month'}
              </p>
              {barData.length === 0 ? (
                <p className="muted">No order data yet.</p>
              ) : (
                <div className="admin-dashboard__chart-wrap">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: '#4b5563' }}
                        interval={granularity === 'day' ? 4 : 0}
                        angle={granularity === 'day' ? -35 : 0}
                        textAnchor={granularity === 'day' ? 'end' : 'middle'}
                        height={granularity === 'day' ? 60 : 40}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: '#4b5563' }}
                        width={36}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="orderCount" name="Orders" fill="#111111" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="card admin-dashboard__chart-card">
              <h2 className="admin-dashboard__chart-title">Orders pie chart</h2>
              <p className="muted admin-dashboard__chart-desc">
                Share of orders per {granularity === 'day' ? 'day' : granularity === 'week' ? 'week' : 'month'}
              </p>
              {pieData.length === 0 ? (
                <p className="muted">No orders in this period.</p>
              ) : (
                <div className="admin-dashboard__chart-wrap admin-dashboard__chart-wrap--pie">
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="orderCount"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        innerRadius={48}
                        paddingAngle={2}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={entry.key} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                      <Legend
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                        wrapperStyle={{ fontSize: '0.8rem', lineHeight: 1.35 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
