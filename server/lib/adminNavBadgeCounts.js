import pool from '../db.js';
import { countOrdersWithUnreadMessages } from './orderCommunications.js';

function parseSinceParam(raw) {
  if (raw == null || String(raw).trim() === '') return null;
  const d = new Date(String(raw));
  return Number.isNaN(d.getTime()) ? null : d;
}

async function countSince(table, since) {
  if (!since) return 0;
  const [[row]] = await pool.query(
    `SELECT COUNT(*) AS c FROM ${table} WHERE created_at > ?`,
    [since]
  );
  return Number(row?.c) || 0;
}

export async function getAdminNavBadgeCounts({ ordersSince, customizeSince } = {}) {
  const ordersFrom = parseSinceParam(ordersSince);
  const customizeFrom = parseSinceParam(customizeSince);

  const [orders, customizeRequests, communications] = await Promise.all([
    countSince('orders', ordersFrom),
    countSince('custom_quilt_requests', customizeFrom),
    countOrdersWithUnreadMessages(),
  ]);

  return { orders, customizeRequests, communications };
}
