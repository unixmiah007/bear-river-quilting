import pool from '../db.js';
import { MESSAGE_DIRECTION } from './orderMessages.js';

function previewText(bodyText, max = 120) {
  const flat = String(bodyText ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max)}…`;
}

export async function countOrdersWithUnreadMessages() {
  try {
    const [[row]] = await pool.query(
      `SELECT COUNT(DISTINCT order_id) AS c
       FROM order_messages
       WHERE direction = ? AND admin_read_at IS NULL`,
      [MESSAGE_DIRECTION.CUSTOMER]
    );
    return Number(row?.c) || 0;
  } catch (e) {
    if (e.code === 'ER_NO_SUCH_TABLE' || e.code === 'ER_BAD_FIELD_ERROR') return 0;
    throw e;
  }
}

export async function listOrderCommunicationThreads() {
  const [rows] = await pool.query(
    `SELECT
       o.id,
       o.order_number,
       o.customer_name,
       o.customer_email,
       o.status,
       o.created_at AS order_created_at,
       agg.message_count,
       agg.unread_count,
       agg.last_message_at,
       lm.id AS last_message_id,
       lm.subject AS last_subject,
       lm.direction AS last_direction,
       lm.body_text AS last_body_text
     FROM orders o
     INNER JOIN (
       SELECT
         order_id,
         COUNT(*) AS message_count,
         SUM(
           CASE WHEN direction = ? AND admin_read_at IS NULL THEN 1 ELSE 0 END
         ) AS unread_count,
         MAX(created_at) AS last_message_at
       FROM order_messages
       GROUP BY order_id
     ) agg ON agg.order_id = o.id
     LEFT JOIN order_messages lm ON lm.id = (
       SELECT om2.id
       FROM order_messages om2
       WHERE om2.order_id = o.id
       ORDER BY om2.created_at DESC, om2.id DESC
       LIMIT 1
     )
     ORDER BY agg.last_message_at DESC`,
    [MESSAGE_DIRECTION.CUSTOMER]
  );

  return rows.map((r) => ({
    id: r.id,
    order_number: r.order_number,
    customer_name: r.customer_name,
    customer_email: r.customer_email,
    status: r.status,
    order_created_at: r.order_created_at,
    message_count: Number(r.message_count) || 0,
    unread_count: Number(r.unread_count) || 0,
    has_unread: Number(r.unread_count) > 0,
    last_message_at: r.last_message_at,
    last_message_id: r.last_message_id,
    last_subject: r.last_subject,
    last_direction: r.last_direction,
    last_body_preview: previewText(r.last_body_text, 120),
  }));
}
