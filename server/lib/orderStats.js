const PERIODS = new Set(['day', 'week', 'month']);

function parseDateInput(value, endOfDay = false) {
  if (!value) return null;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  if (endOfDay) {
    d.setHours(23, 59, 59, 999);
  } else {
    d.setHours(0, 0, 0, 0);
  }
  return d;
}

function defaultRange(period) {
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  const from = new Date(to);
  if (period === 'day') {
    from.setDate(from.getDate() - 29);
  } else if (period === 'week') {
    from.setDate(from.getDate() - 7 * 11);
  } else {
    from.setMonth(from.getMonth() - 11);
    from.setDate(1);
  }
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function startOfMonth(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  return d;
}

function bucketKey(date, period) {
  if (period === 'day') {
    return date.toISOString().slice(0, 10);
  }
  if (period === 'week') {
    return startOfWeek(date).toISOString().slice(0, 10);
  }
  const d = startOfMonth(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function advanceBucket(date, period) {
  const d = new Date(date);
  if (period === 'day') {
    d.setDate(d.getDate() + 1);
    return d;
  }
  if (period === 'week') {
    d.setDate(d.getDate() + 7);
    return d;
  }
  d.setMonth(d.getMonth() + 1);
  return d;
}

function formatBucketLabel(key, period) {
  const d = new Date(`${key}T12:00:00`);
  if (Number.isNaN(d.getTime())) return key;
  if (period === 'day') {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  if (period === 'week') {
    return `Week of ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  }
  return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

function fillBuckets(rows, period, from, to) {
  const map = new Map();
  for (const row of rows) {
    const key =
      row.bucket instanceof Date
        ? row.bucket.toISOString().slice(0, 10)
        : String(row.bucket).slice(0, 10);
    map.set(key, {
      key,
      label: formatBucketLabel(key, period),
      count: Number(row.count) || 0,
      revenue: Number(row.revenue) || 0,
    });
  }

  const filled = [];
  let cursor =
    period === 'week'
      ? startOfWeek(from)
      : period === 'month'
        ? startOfMonth(from)
        : new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);

  while (cursor <= end) {
    const key = bucketKey(cursor, period);
    filled.push(
      map.get(key) ?? {
        key,
        label: formatBucketLabel(key, period),
        count: 0,
        revenue: 0,
      }
    );
    cursor = advanceBucket(cursor, period);
  }

  return filled;
}

function groupSql(period) {
  if (period === 'day') return 'DATE(created_at)';
  if (period === 'week') {
    return 'DATE(DATE_SUB(created_at, INTERVAL WEEKDAY(created_at) DAY))';
  }
  return "DATE_FORMAT(created_at, '%Y-%m-01')";
}

export async function getOrderStats(
  pool,
  { period, granularity, from: fromInput, to: toInput } = {}
) {
  const normalizedPeriod = String(granularity ?? period ?? 'day')
    .trim()
    .toLowerCase();
  if (!PERIODS.has(normalizedPeriod)) {
    return { ok: false, status: 400, error: 'granularity must be day, week, or month' };
  }

  const defaults = defaultRange(normalizedPeriod);
  const from = parseDateInput(fromInput) ?? defaults.from;
  const to = parseDateInput(toInput, true) ?? defaults.to;

  if (from > to) {
    return { ok: false, status: 400, error: 'from must be before to' };
  }

  const groupExpr = groupSql(normalizedPeriod);

  const [rows] = await pool.query(
    `SELECT ${groupExpr} AS bucket,
            COUNT(*) AS count,
            COALESCE(SUM(total), 0) AS revenue
     FROM orders
     WHERE created_at >= ? AND created_at <= ?
     GROUP BY bucket
     ORDER BY bucket ASC`,
    [from, to]
  );

  const buckets = fillBuckets(rows, normalizedPeriod, from, to).map((b) => ({
    key: b.key,
    label: b.label,
    orderCount: b.count,
    revenue: b.revenue,
  }));
  const orderCount = buckets.reduce((sum, b) => sum + b.orderCount, 0);
  const revenue = buckets.reduce((sum, b) => sum + b.revenue, 0);

  return {
    ok: true,
    granularity: normalizedPeriod,
    from: from.toISOString(),
    to: to.toISOString(),
    totals: { orderCount, revenue },
    buckets,
  };
}
