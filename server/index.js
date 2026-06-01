import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import pool from './db.js';
import {
  importProductsFromCsv,
  PRODUCT_CSV_TEMPLATE,
  productsToCsv,
} from './lib/csvProductImport.js';
import { ensureProductInventoryColumns } from './lib/ensureProductInventoryColumns.js';
import { ensureProductImagesTable } from './lib/ensureProductImagesTable.js';
import { ensureProductSizeColumn } from './lib/ensureProductSizeColumn.js';
import { ensureProductFeaturedColumn } from './lib/ensureProductFeaturedColumn.js';
import { ensurePagesTable } from './lib/ensurePagesTable.js';
import { ensureProductCategories } from './lib/ensureProductCategories.js';
import { ensureMediaAssetsTable } from './lib/ensureMediaAssetsTable.js';
import {
  listMediaAssets,
  scanUploadsIntoMedia,
  deleteMediaAsset,
  copyMediaIdsToProduct,
  renameMediaAsset,
} from './lib/mediaLibrary.js';
import {
  IMAGE_UPLOAD_MAX_BYTES,
  MEDIA_LIBRARY_UPLOAD_MAX,
  imageUploadFilename,
  imageUploadFileFilter,
  normalizeUploadedImageFiles,
} from './lib/imageUpload.js';
import { seedDemoProducts } from './lib/seedDemoProducts.js';
import { generateNextProductSku } from './lib/productSku.js';
import { sendOrderConfirmationEmail, sendOrderStaffNotificationEmail } from './lib/mail.js';
import { verifySendGridIfConfigured } from './lib/sendgridMail.js';
import { normalizeProductSize } from './lib/productSize.js';
import {
  ensureProductSizePricesColumn,
  hydrateProductRow,
  hydrateProductRows,
  parseProductPriceInput,
} from './lib/productSizePrices.js';
import { ensureStripeOrderColumns } from './lib/ensureStripeOrderColumns.js';
import { ensureCustomQuiltRequestsTable } from './lib/ensureCustomQuiltRequestsTable.js';
import {
  createCustomQuiltRequest,
  listCustomQuiltRequestsForAdmin,
  setCustomQuiltRequestAcknowledged,
} from './lib/customQuiltRequest.js';
import { ensureOrderTrackingColumns } from './lib/ensureOrderTrackingColumns.js';
import { ensureOrderShippingLabel } from './lib/ensureOrderShippingLabel.js';
import {
  normalizeLabelAddress,
  resolveLabelFrom,
  resolveLabelTo,
} from './lib/shippingLabel.js';
import { getDefaultShipFrom } from './lib/defaultShipFrom.js';
import { buildOrderInvoicePdf, invoicePdfFilename } from './lib/orderInvoicePdf.js';
import { emailCustomerOrderInvoice } from './lib/orderInvoiceEmail.js';
import { sendProductShareEmail } from './lib/productShareEmail.js';
import { ensureOrderInvoiceEmailColumn } from './lib/ensureOrderInvoiceEmailColumn.js';
import { sendOrderTrackingNotification } from './lib/orderTracking.js';
import { sendCustomQuiltTrackingNotification } from './lib/customQuiltTracking.js';
import { isAllowedCustomQuiltRequestStatus } from './lib/customQuiltStatuses.js';
import { updateAdminOrderStatus } from './lib/orderStatusUpdate.js';
import { ensureOrderMessagesTable } from './lib/ensureOrderMessagesTable.js';
import {
  listOrderMessages,
  getOrderMessage,
  sendOrderCustomerMessage,
  sendCustomerOrderReply,
  verifyCustomerOrderAccess,
} from './lib/orderMessages.js';
import { SHIPPING_CARRIERS } from './lib/shippingCarriers.js';
import {
  createStripeCheckoutSession,
  fulfillStripeCheckoutSession,
  getStripePublishableKey,
  handleStripeWebhook,
} from './lib/stripeCheckout.js';
import { createCustomQuiltStripeCheckoutSession } from './lib/customQuiltStripeCheckout.js';
import { ensureCustomizeWizardConfigTable } from './lib/ensureCustomizeWizardConfigTable.js';
import {
  loadCustomizeWizardConfig,
  saveCustomizeWizardConfig,
} from './lib/customizeWizardConfig.js';
import {
  OWN_DESIGN_URL_PREFIX,
  ownDesignUploadRoot,
} from './lib/customizeOwnDesignImage.js';
import { getClientOrigin, PRODUCTION_CLIENT_ORIGIN } from './lib/clientOrigin.js';
import { ensureOrderCustomPaymentsTable } from './lib/ensureOrderCustomPaymentsTable.js';
import { createCustomPayment, searchCustomerPaymentsByEmail } from './lib/customOrderPayment.js';
import {
  changeOrderLineItemProduct,
  previewOrderLineItemProductChange,
} from './lib/orderLineItemProduct.js';
import { ensureOrderAdjustmentColumns } from './lib/ensureOrderAdjustmentColumns.js';
import { lookupCustomerCustomQuiltRequests } from './lib/customQuiltCustomerLookup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirnameRoot = path.dirname(__filename);
const UPLOAD_ROOT = path.join(__dirnameRoot, 'uploads');

fs.mkdirSync(path.join(UPLOAD_ROOT, 'products'), { recursive: true });
fs.mkdirSync(ownDesignUploadRoot(UPLOAD_ROOT), { recursive: true });

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin';
const COOKIE_NAME = 'cms_token';

app.use(
  cors({
    origin: getClientOrigin(),
    credentials: true,
  })
);

app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];
  if (!signature) {
    return res.status(400).send('Missing Stripe-Signature header');
  }
  const result = await handleStripeWebhook(req.body, signature);
  if (!result.ok) {
    return res.status(result.status ?? 400).json({ error: result.error });
  }
  res.json({ received: true });
});

app.use(express.json({ limit: '8mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(UPLOAD_ROOT));

function authMiddleware(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

function parseProductSizeInput(body) {
  const raw = body?.product_size ?? body?.productSize;
  if (raw === undefined || raw === null || String(raw).trim() === '') return { ok: true, value: null };
  const v = normalizeProductSize(raw);
  if (!v) {
    return {
      ok: false,
      error: 'Invalid product_size. Allowed: standard, small, large, x-large, xx-large, xxx-large',
    };
  }
  return { ok: true, value: v };
}

function slugify(input) {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function isMissingProductColumnError(e) {
  return (
    e?.code === 'ER_BAD_FIELD_ERROR' ||
    String(e?.message || '').includes('Unknown column') ||
    String(e?.sqlMessage || '').includes('Unknown column')
  );
}

function sendProductSchemaMismatch(res) {
  res.status(500).json({
    error:
      'The products table is missing one or more expected columns (for example sku, stock_quantity, or updated_at).',
    hint:
      'Restart the API to apply automatic schema repair, or run: npm run db:bootstrap-products -w server, or npm run db:init -w server for a full reset.',
  });
}

const productImageUpload = multer({
  storage: multer.diskStorage({
    destination(req, _file, cb) {
      const id = String(req.params.id);
      const dir = path.join(UPLOAD_ROOT, 'products', id);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename(_req, file, cb) {
      cb(null, imageUploadFilename(file));
    },
  }),
  limits: { fileSize: IMAGE_UPLOAD_MAX_BYTES },
  fileFilter: imageUploadFileFilter,
});

const mediaLibraryUpload = multer({
  storage: multer.diskStorage({
    destination(_req, _file, cb) {
      const dir = path.join(UPLOAD_ROOT, 'media');
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename(_req, file, cb) {
      cb(null, imageUploadFilename(file));
    },
  }),
  limits: { fileSize: IMAGE_UPLOAD_MAX_BYTES },
  fileFilter: imageUploadFileFilter,
});

const customizeOwnDesignUpload = multer({
  storage: multer.diskStorage({
    destination(_req, _file, cb) {
      const dir = ownDesignUploadRoot(UPLOAD_ROOT);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename(_req, file, cb) {
      cb(null, imageUploadFilename(file));
    },
  }),
  limits: { fileSize: IMAGE_UPLOAD_MAX_BYTES, files: 1 },
  fileFilter: imageUploadFileFilter,
});

async function loadProductImages(productId) {
  const [rows] = await pool.query(
    'SELECT id, path AS url, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC',
    [productId]
  );
  return rows;
}

async function syncProductThumbnail(productId) {
  const [[first]] = await pool.query(
    'SELECT path FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC LIMIT 1',
    [productId]
  );
  await pool.query('UPDATE products SET image_url = ? WHERE id = ?', [first?.path ?? null, productId]);
}

function deleteDiskPath(webPath) {
  if (!webPath || typeof webPath !== 'string' || !webPath.startsWith('/uploads/')) return;
  const rel = webPath.replace(/^\/uploads\/?/, '');
  const abs = path.join(UPLOAD_ROOT, rel);
  if (fs.existsSync(abs)) {
    try {
      fs.unlinkSync(abs);
    } catch (_) {
      /* ignore */
    }
  }
}

// --- Public ---

app.get('/api/pages', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, slug, title, updated_at FROM pages ORDER BY title ASC'
    );
    res.json(hydrateProductRows(rows));
  } catch (e) {
    console.error(e);
    if (e.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({
        error: 'Database is missing the pages table.',
        hint: 'Run: npm run db:init -w server (from project root) to apply schema.sql.',
      });
    }
    if (e.code === 'ER_BAD_FIELD_ERROR' || String(e.sqlMessage || '').includes('Unknown column')) {
      return res.status(500).json({
        error: 'The pages table is missing expected columns (for example updated_at).',
        hint: 'Run: npm run db:init -w server, or restart the API so it can run pages schema repair.',
      });
    }
    res.status(500).json({ error: 'Failed to list pages' });
  }
});

app.get('/api/pages/by-slug/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;
    const [[page]] = await pool.query(
      'SELECT id, slug, title, body, updated_at FROM pages WHERE slug = ?',
      [slug]
    );
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    const [products] = await pool.query(
      `SELECT p.id, p.name, p.description, p.price, p.size_prices, p.image_url, p.stock_quantity, p.product_size
       FROM products p
       INNER JOIN page_products pp ON pp.product_id = p.id
       WHERE pp.page_id = ? AND p.is_published = 1
       ORDER BY pp.sort_order ASC, p.name ASC`,
      [page.id]
    );
    res.json({ page, products: hydrateProductRows(products) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load page' });
  }
});

app.get('/api/product-categories', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, slug, name, description, sort_order
       FROM product_categories
       ORDER BY sort_order ASC, name ASC`
    );
    res.json(hydrateProductRows(rows));
  } catch (e) {
    console.error(e);
    if (e.code === 'ER_NO_SUCH_TABLE') {
      return res.json([]);
    }
    res.status(500).json({ error: 'Failed to list product categories' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const categorySlug = String(req.query.category ?? '').trim();
    if (categorySlug) {
      const [[cat]] = await pool.query(
        'SELECT id FROM product_categories WHERE slug = ?',
        [categorySlug]
      );
      if (!cat) {
        return res.json([]);
      }
      const [rows] = await pool.query(
        `SELECT p.id, p.name, p.description, p.price, p.size_prices, p.image_url, p.stock_quantity, p.product_size
         FROM products p
         INNER JOIN product_category_products pcp ON pcp.product_id = p.id
         WHERE pcp.category_id = ? AND p.is_published = 1
         ORDER BY pcp.sort_order ASC, p.name ASC`,
        [cat.id]
      );
      return res.json(hydrateProductRows(rows));
    }
    const [rows] = await pool.query(
      `SELECT id, name, description, price, size_prices, image_url, stock_quantity, product_size
       FROM products
       WHERE is_published = 1
       ORDER BY updated_at DESC, name ASC`
    );
    res.json(hydrateProductRows(rows));
  } catch (e) {
    console.error(e);
    if (e.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({
        error: 'Database is missing the products table.',
        hint: 'Run: npm run db:init -w server (from project root) to apply schema.sql.',
      });
    }
    if (isMissingProductColumnError(e)) {
      return sendProductSchemaMismatch(res);
    }
    res.status(500).json({ error: 'Failed to list products' });
  }
});

/** Up to 4 published products marked featured (products page hero). */
app.get('/api/products/featured', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, description, price, size_prices, image_url, stock_quantity, product_size
       FROM products
       WHERE is_published = 1 AND is_featured = 1
       ORDER BY updated_at DESC, name ASC
       LIMIT 4`
    );
    res.json(hydrateProductRows(rows));
  } catch (e) {
    console.error(e);
    if (isMissingProductColumnError(e)) {
      try {
        const [rows] = await pool.query(
          `SELECT id, name, description, price, size_prices, image_url, stock_quantity, product_size
           FROM products
           WHERE is_published = 1
           ORDER BY updated_at DESC, name ASC
           LIMIT 4`
        );
        return res.json(hydrateProductRows(rows));
      } catch (e2) {
        console.error(e2);
        return res.json([]);
      }
    }
    res.status(500).json({ error: 'Failed to load featured products' });
  }
});

/** Top published products by total units sold (order_items); max 10. Falls back to recent products if none. */
app.get('/api/products/best-sellers', async (_req, res) => {
  try {
    const [ranked] = await pool.query(
      `SELECT p.id, p.name, p.description, p.price, p.size_prices, p.image_url, p.stock_quantity, p.product_size,
              agg.units_sold AS units_sold
       FROM products p
       INNER JOIN (
         SELECT oi.product_id, SUM(oi.quantity) AS units_sold
         FROM order_items oi
         INNER JOIN orders o ON o.id = oi.order_id
         GROUP BY oi.product_id
       ) agg ON agg.product_id = p.id
       WHERE p.is_published = 1
       ORDER BY agg.units_sold DESC, p.id ASC
       LIMIT 10`
    );
    if (ranked.length > 0) {
      return res.json(hydrateProductRows(ranked));
    }
    const [fallback] = await pool.query(
      `SELECT id, name, description, price, size_prices, image_url, stock_quantity, product_size, NULL AS units_sold
       FROM products
       WHERE is_published = 1
       ORDER BY updated_at DESC, name ASC
       LIMIT 10`
    );
    res.json(hydrateProductRows(fallback));
  } catch (e) {
    console.error(e);
    if (e.code === 'ER_NO_SUCH_TABLE') {
      try {
        const [rows] = await pool.query(
          `SELECT id, name, description, price, size_prices, image_url, stock_quantity, product_size, NULL AS units_sold
           FROM products
           WHERE is_published = 1
           ORDER BY updated_at DESC, name ASC
           LIMIT 10`
        );
        return res.json(hydrateProductRows(rows));
      } catch (e2) {
        console.error(e2);
        return res.json([]);
      }
    }
    if (isMissingProductColumnError(e)) {
      return sendProductSchemaMismatch(res);
    }
    res.status(500).json({ error: 'Failed to load best sellers' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid product id' });
    }
    const [[row]] = await pool.query(
      `SELECT id, name, description, price, size_prices, image_url, stock_quantity, product_size, updated_at
       FROM products
       WHERE id = ? AND is_published = 1`,
      [id]
    );
    if (!row) {
      return res.status(404).json({ error: 'Product not found' });
    }
    let images = [];
    try {
      images = await loadProductImages(id);
    } catch (e) {
      if (e.code !== 'ER_NO_SUCH_TABLE') throw e;
    }
    res.json({ ...hydrateProductRow(row), images });
  } catch (e) {
    console.error(e);
    if (isMissingProductColumnError(e)) {
      return sendProductSchemaMismatch(res);
    }
    res.status(500).json({ error: 'Failed to load product' });
  }
});

app.post('/api/products/:id/share', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid product id' });
    }
    const result = await sendProductShareEmail(id, req.body);
    if (!result.ok) {
      return res.status(result.status ?? 400).json({ error: result.error });
    }
    res.json({ ok: true, emailSent: !!result.emailSent });
  } catch (e) {
    console.error('[products/share]', e);
    res.status(500).json({ error: 'Could not send product share email.' });
  }
});

app.get('/api/config/stripe', (_req, res) => {
  const publishableKey = getStripePublishableKey();
  if (!publishableKey) {
    return res.status(503).json({ error: 'Stripe is not configured' });
  }
  res.json({ publishableKey });
});

app.post('/api/checkout/stripe-session', async (req, res) => {
  const result = await createStripeCheckoutSession(req.body);
  if (!result.ok) {
    return res.status(result.status ?? 500).json({ error: result.error });
  }
  res.json({
    url: result.url,
    sessionId: result.sessionId,
    orderNumber: result.orderNumber,
  });
});

app.post('/api/checkout/custom-quilt-stripe-session', async (req, res) => {
  const result = await createCustomQuiltStripeCheckoutSession(req.body);
  if (!result.ok) {
    return res.status(result.status ?? 500).json({ error: result.error });
  }
  res.json({
    url: result.url,
    sessionId: result.sessionId,
    requestNumber: result.requestNumber,
  });
});

app.get('/api/checkout/confirm', async (req, res) => {
  const sessionId = String(req.query.session_id ?? '').trim();
  if (!sessionId) {
    return res.status(400).json({ error: 'session_id is required' });
  }
  const result = await fulfillStripeCheckoutSession(sessionId);
  if (!result.ok) {
    return res.status(result.status ?? 500).json({ error: result.error });
  }
  res.json({
    ok: true,
    checkoutType: result.checkoutType ?? 'order',
    orderNumber: result.orderNumber ?? null,
    requestNumber: result.requestNumber ?? null,
    customerEmail: result.customerEmail,
    mail: result.mail,
    alreadyFulfilled: !!result.alreadyFulfilled,
  });
});

app.get('/api/customize/config', async (_req, res) => {
  try {
    const config = await loadCustomizeWizardConfig();
    res.json(config);
  } catch (e) {
    console.error('[customize/config]', e);
    res.status(500).json({ error: 'Failed to load customize wizard config' });
  }
});

app.post('/api/customize/own-design', (req, res, next) => {
  customizeOwnDesignUpload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Upload failed' });
    next();
  });
}, async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No image file received (use field name "image")' });
  }
  try {
    const [normalized] = await normalizeUploadedImageFiles([file]);
    const f = normalized ?? file;
    const url = `${OWN_DESIGN_URL_PREFIX}${f.filename}`;
    res.status(201).json({ ok: true, url });
  } catch (e) {
    console.error('[customize/own-design]', e);
    if (file?.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (_) {
        /* ignore */
      }
    }
    res.status(400).json({ error: e.message || 'Could not process image' });
  }
});

app.post('/api/custom-quilt-requests', async (req, res) => {
  try {
    const result = await createCustomQuiltRequest(req.body);
    if (!result.ok) {
      return res.status(result.status ?? 400).json({ error: result.error });
    }
    res.status(201).json({
      ok: true,
      requestNumber: result.requestNumber,
      requestId: result.requestId,
      mail: result.mail,
    });
  } catch (e) {
    console.error('[custom-quilt] create failed:', e);
    res.status(500).json({ error: 'Failed to submit custom quilt request' });
  }
});

/** Legacy direct order API — payments now go through Stripe Checkout. */
app.post('/api/orders', async (req, res) => {
  res.status(410).json({
    error: 'Card payments on this site use Stripe Checkout. Complete payment from the cart.',
  });
});

function normalizeCustomerEmail(email) {
  return String(email ?? '')
    .trim()
    .toLowerCase()
    .slice(0, 255);
}

/** Public: list orders for checkout email, or full detail when email + order_number match. */
app.post('/api/customer/orders', async (req, res) => {
  try {
    const email = normalizeCustomerEmail(req.body?.email);
    const orderNumber = String(req.body?.orderNumber ?? '').trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Enter the same email you used at checkout.' });
    }
    if (orderNumber) {
      if (orderNumber.length > 64) {
        return res.status(400).json({ error: 'Invalid order number.' });
      }
      const [[order]] = await pool.query(
        `SELECT id, order_number, status, customer_name, customer_email, customer_phone,
                shipping_address1, shipping_address2, shipping_city, shipping_state, shipping_postal_code, shipping_country,
                shipping_method, shipping_cost,
                billing_name, billing_address1, billing_address2, billing_city, billing_state, billing_postal_code, billing_country,
                card_last4, subtotal, tax_amount, total, created_at,
                original_subtotal, original_tax_amount, original_total, order_adjusted_at,
                tracking_carrier, tracking_number, tracking_notified_at
         FROM orders WHERE order_number = ? AND LOWER(TRIM(customer_email)) = ?`,
        [orderNumber, email]
      );
      if (!order) {
        return res.status(404).json({
          error: 'We could not find that order for this email.',
          hint: 'Use the exact order number from your confirmation and the checkout email address.',
        });
      }
      const [items] = await pool.query(
        `SELECT id, product_id, product_name, unit_price, quantity, line_total,
                line_refund_amount, line_refund_status, line_refund_at,
                original_product_id, original_product_name, original_unit_price, original_line_total
         FROM order_items WHERE order_id = ? ORDER BY id ASC`,
        [order.id]
      );
      return res.json({ mode: 'detail', order, items });
    }
    const [orders] = await pool.query(
      `SELECT id, order_number, status, customer_name, total, original_total, order_adjusted_at,
              created_at, card_last4, shipping_method, tracking_carrier, tracking_number
       FROM orders WHERE LOWER(TRIM(customer_email)) = ?
       ORDER BY created_at DESC`,
      [email]
    );
    res.json({ mode: 'list', orders });
  } catch (e) {
    console.error(e);
    if (e.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({
        error: 'Orders are not set up in the database yet.',
        hint: 'Run: npm run db:init-orders -w server',
      });
    }
    res.status(500).json({ error: 'Could not load orders.' });
  }
});

app.post('/api/customer/custom-quilt-requests', async (req, res) => {
  try {
    const result = await lookupCustomerCustomQuiltRequests(
      req.body?.email,
      req.body?.requestNumber ?? req.body?.customRequestNumber
    );
    if (!result.ok) {
      return res.status(result.status ?? 400).json({
        error: result.error,
        hint: result.hint,
      });
    }
    if (result.mode === 'detail') {
      return res.json({ mode: 'detail', request: result.request });
    }
    res.json({ mode: 'list', requests: result.requests });
  } catch (e) {
    console.error('[customer/custom-quilt-requests]', e);
    if (e.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({
        error: 'Custom quilt requests are not set up in the database yet.',
        hint: 'Restart the API server to apply schema updates.',
      });
    }
    res.status(500).json({ error: 'Could not load custom quilt requests.' });
  }
});

app.post('/api/customer/orders/messages', async (req, res) => {
  try {
    const email = normalizeCustomerEmail(req.body?.email);
    const orderNumber = String(req.body?.orderNumber ?? '').trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Enter the same email you used at checkout.' });
    }
    if (!orderNumber || orderNumber.length > 64) {
      return res.status(400).json({ error: 'Order number is required.' });
    }
    const order = await verifyCustomerOrderAccess(email, orderNumber);
    if (!order) {
      return res.status(404).json({
        error: 'We could not find that order for this email.',
        hint: 'Use the exact order number from your confirmation and the checkout email address.',
      });
    }
    const messages = await listOrderMessages(order.id, { ascending: true });
    res.json({ messages });
  } catch (e) {
    console.error(e);
    if (e.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({
        error: 'Messaging is not available yet.',
        hint: 'Restart the API to create the order_messages table.',
      });
    }
    res.status(500).json({ error: 'Could not load messages.' });
  }
});

app.post('/api/customer/orders/messages/view', async (req, res) => {
  try {
    const email = normalizeCustomerEmail(req.body?.email);
    const orderNumber = String(req.body?.orderNumber ?? '').trim();
    const messageId = Number(req.body?.messageId);
    if (!email || !orderNumber || !messageId) {
      return res.status(400).json({ error: 'Invalid request.' });
    }
    const order = await verifyCustomerOrderAccess(email, orderNumber);
    if (!order) {
      return res.status(404).json({ error: 'Order not found for this email.' });
    }
    const message = await getOrderMessage(order.id, messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    res.json(message);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not load message.' });
  }
});

app.post('/api/customer/orders/messages/reply', async (req, res) => {
  try {
    const email = normalizeCustomerEmail(req.body?.email);
    const orderNumber = String(req.body?.orderNumber ?? '').trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Enter the same email you used at checkout.' });
    }
    if (!orderNumber) {
      return res.status(400).json({ error: 'Order number is required.' });
    }
    const result = await sendCustomerOrderReply({
      email,
      orderNumber,
      body: req.body?.body ?? req.body?.message,
      subject: req.body?.subject,
    });
    if (!result.ok) {
      return res.status(result.status ?? 500).json({
        error: result.error,
        hint: result.hint ?? null,
      });
    }
    res.status(201).json({
      ok: true,
      message: result.message,
      emailSent: result.emailSent,
      warning: result.warning ?? null,
    });
  } catch (e) {
    console.error(e);
    if (e.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({
        error: 'Messaging is not available yet.',
        hint: 'Restart the API to create the order_messages table.',
      });
    }
    res.status(500).json({ error: 'Could not send your reply.' });
  }
});

// --- Auth ---

app.post('/api/auth/login', (req, res) => {
  const { password } = req.body ?? {};
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({ ok: true });
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { sameSite: 'lax' });
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  const token = req.cookies[COOKIE_NAME];
  if (!token) {
    return res.json({ authenticated: false });
  }
  try {
    jwt.verify(token, JWT_SECRET);
    return res.json({ authenticated: true });
  } catch {
    return res.json({ authenticated: false });
  }
});

// --- Admin: pages ---

app.get('/api/admin/pages', authMiddleware, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, slug, title, body, updated_at FROM pages ORDER BY title ASC'
    );
    res.json(hydrateProductRows(rows));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list pages' });
  }
});

app.post('/api/admin/pages', authMiddleware, async (req, res) => {
  try {
    const { title, slug, body } = req.body ?? {};
    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }
    const finalSlug = slugify(slug || title);
    const [result] = await pool.query(
      'INSERT INTO pages (slug, title, body) VALUES (?, ?, ?)',
      [finalSlug, title, body ?? null]
    );
    res.status(201).json({ id: result.insertId, slug: finalSlug });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Slug already exists' });
    }
    console.error(e);
    res.status(500).json({ error: 'Failed to create page' });
  }
});

app.put('/api/admin/pages/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, slug, body } = req.body ?? {};
    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }
    const finalSlug = slugify(slug || title);
    const [result] = await pool.query(
      'UPDATE pages SET title = ?, slug = ?, body = ? WHERE id = ?',
      [title, finalSlug, body ?? null, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }
    res.json({ ok: true, slug: finalSlug });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Slug already exists' });
    }
    console.error(e);
    res.status(500).json({ error: 'Failed to update page' });
  }
});

app.delete('/api/admin/pages/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [result] = await pool.query('DELETE FROM pages WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete page' });
  }
});

// --- Admin: product categories ---

app.get('/api/admin/product-categories', authMiddleware, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, slug, name, description, sort_order, updated_at
       FROM product_categories
       ORDER BY sort_order ASC, name ASC`
    );
    res.json(hydrateProductRows(rows));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list categories' });
  }
});

app.post('/api/admin/product-categories', authMiddleware, async (req, res) => {
  try {
    const { name, slug, description, sort_order } = req.body ?? {};
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    const finalSlug = slugify(slug || name);
    const sort = Number.isFinite(Number(sort_order)) ? Number(sort_order) : 0;
    const [result] = await pool.query(
      'INSERT INTO product_categories (slug, name, description, sort_order) VALUES (?, ?, ?, ?)',
      [finalSlug, name, description ?? null, sort]
    );
    res.status(201).json({ id: result.insertId, slug: finalSlug });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Slug already exists' });
    }
    console.error(e);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

app.put('/api/admin/product-categories/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, slug, description, sort_order } = req.body ?? {};
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    const finalSlug = slugify(slug || name);
    const sort = Number.isFinite(Number(sort_order)) ? Number(sort_order) : 0;
    const [result] = await pool.query(
      'UPDATE product_categories SET slug = ?, name = ?, description = ?, sort_order = ? WHERE id = ?',
      [finalSlug, name, description ?? null, sort, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ ok: true, slug: finalSlug });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Slug already exists' });
    }
    console.error(e);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

app.delete('/api/admin/product-categories/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [result] = await pool.query('DELETE FROM product_categories WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

app.get('/api/admin/product-categories/:id/products', authMiddleware, async (req, res) => {
  try {
    const categoryId = Number(req.params.id);
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.is_published, pcp.sort_order
       FROM product_category_products pcp
       INNER JOIN products p ON p.id = pcp.product_id
       WHERE pcp.category_id = ?
       ORDER BY pcp.sort_order ASC, p.name ASC`,
      [categoryId]
    );
    res.json(hydrateProductRows(rows));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load category products' });
  }
});

app.put('/api/admin/product-categories/:id/products', authMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const categoryId = Number(req.params.id);
    const { productIds } = req.body ?? {};
    if (!Array.isArray(productIds)) {
      return res.status(400).json({ error: 'productIds must be an array' });
    }
    const [[cat]] = await conn.query('SELECT id FROM product_categories WHERE id = ?', [categoryId]);
    if (!cat) {
      return res.status(404).json({ error: 'Category not found' });
    }
    await conn.beginTransaction();
    await conn.query('DELETE FROM product_category_products WHERE category_id = ?', [categoryId]);
    let sort = 0;
    for (const pid of productIds) {
      const id = Number(pid);
      if (!id) continue;
      await conn.query(
        'INSERT INTO product_category_products (category_id, product_id, sort_order) VALUES (?, ?, ?)',
        [categoryId, id, sort++]
      );
    }
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    try {
      await conn.rollback();
    } catch {
      /* ignore */
    }
    console.error(e);
    res.status(500).json({ error: 'Failed to save category products' });
  } finally {
    conn.release();
  }
});

// --- Admin: products ---

app.post('/api/admin/products/seed-examples', authMiddleware, async (_req, res) => {
  const conn = await pool.getConnection();
  try {
    await ensureProductInventoryColumns(conn);
    await ensureProductImagesTable(conn);
    await seedDemoProducts(conn);
    const [[row]] = await conn.query('SELECT COUNT(*) AS cnt FROM products');
    res.json({ ok: true, productCount: Number(row.cnt) });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      error: e.message || 'Failed to seed example products',
    });
  } finally {
    conn.release();
  }
});

app.get('/api/admin/products/csv-template', authMiddleware, (_req, res) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="products-import-template.csv"');
  res.send(PRODUCT_CSV_TEMPLATE);
});

app.get('/api/admin/products/export.csv', authMiddleware, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, sku, name, description, price, stock_quantity, product_size, image_url, is_published, is_featured
       FROM products ORDER BY id ASC`
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="products-export.csv"');
    res.send(productsToCsv(rows));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to export products' });
  }
});

app.post('/api/admin/products/import', authMiddleware, async (req, res) => {
  try {
    const csv = req.body?.csv;
    if (typeof csv !== 'string') {
      return res.status(400).json({ error: 'JSON body must include a string field "csv"' });
    }
    const result = await importProductsFromCsv(pool, csv);
    res.json(result);
  } catch (e) {
    if (e.code === 'ER_BAD_FIELD_ERROR' || String(e.message || '').includes('Unknown column')) {
      return res.status(500).json({
        error: 'Database is missing sku/stock columns.',
        hint: 'Run: npm run db:bootstrap-products -w server',
      });
    }
    console.error(e);
    res.status(500).json({ error: 'Import failed' });
  }
});

app.get('/api/admin/products', authMiddleware, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, sku, name, description, price, size_prices, stock_quantity, product_size, image_url, is_published, is_featured, created_at, updated_at FROM products ORDER BY name ASC'
    );
    res.json(hydrateProductRows(rows));
  } catch (e) {
    console.error(e);
    if (isMissingProductColumnError(e)) {
      return sendProductSchemaMismatch(res);
    }
    res.status(500).json({ error: 'Failed to list products' });
  }
});

app.get('/api/admin/products/next-sku', authMiddleware, async (_req, res) => {
  try {
    const sku = await generateNextProductSku(pool);
    res.json({ sku });
  } catch (e) {
    console.error(e);
    if (isMissingProductColumnError(e)) {
      return sendProductSchemaMismatch(res);
    }
    res.status(500).json({ error: 'Failed to generate SKU', detail: e.message });
  }
});

app.get('/api/admin/products/by-id/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid product id' });
    }
    const [[product]] = await pool.query(
      `SELECT id, sku, name, description, price, size_prices, stock_quantity, product_size, image_url, is_published, is_featured, updated_at
       FROM products WHERE id = ?`,
      [id]
    );
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    let images = [];
    try {
      images = await loadProductImages(id);
    } catch (e) {
      if (e.code !== 'ER_NO_SUCH_TABLE') throw e;
    }
    res.json({ ...hydrateProductRow(product), images });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load product' });
  }
});

app.post(
  '/api/admin/products/:id/images',
  authMiddleware,
  (req, res, next) => {
    productImageUpload.array('images', 16)(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message || 'Upload failed' });
      next();
    });
  },
  async (req, res) => {
    const productId = Number(req.params.id);
    if (!productId) {
      return res.status(400).json({ error: 'Invalid product id' });
    }
    let files = req.files;
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'No image files received (use field name "images")' });
    }
    try {
      files = await normalizeUploadedImageFiles(files);
      const [[p]] = await pool.query('SELECT id FROM products WHERE id = ?', [productId]);
      if (!p) {
        for (const f of files) {
          try {
            fs.unlinkSync(f.path);
          } catch (_) {
            /* ignore */
          }
        }
        return res.status(404).json({ error: 'Product not found' });
      }
      const [[rowMax]] = await pool.query(
        'SELECT COALESCE(MAX(sort_order), -1) AS mx FROM product_images WHERE product_id = ?',
        [productId]
      );
      let sortOrder = Number(rowMax.mx) + 1;
      for (const f of files) {
        const publicPath = `/uploads/products/${productId}/${f.filename}`;
        await pool.query('INSERT INTO product_images (product_id, path, sort_order) VALUES (?, ?, ?)', [
          productId,
          publicPath,
          sortOrder,
        ]);
        sortOrder += 1;
      }
      try {
        await syncProductThumbnail(productId);
      } catch (syncErr) {
        console.error('[syncProductThumbnail]', syncErr);
      }
      const images = await loadProductImages(productId);
      res.status(201).json({ ok: true, images });
    } catch (e) {
      console.error(e);
      for (const f of files) {
        try {
          fs.unlinkSync(f.path);
        } catch (_) {
          /* ignore */
        }
      }
      if (e.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({
          error: 'product_images table is missing.',
          hint: 'Run: npm run db:migrate-product-images -w server, or restart the API.',
        });
      }
      if (isMissingProductColumnError(e)) {
        return res.status(500).json({
          error: 'The products table is missing a column needed for image uploads (often image_url).',
          hint: 'Restart the API to apply automatic schema repair, or run: npm run db:init -w server',
          detail: e.sqlMessage || e.message,
        });
      }
      const msg = e?.message || '';
      if (/heic/i.test(msg)) {
        return res.status(400).json({ error: msg });
      }
      res.status(500).json({
        error: 'Failed to save uploads',
        detail: e.sqlMessage || e.message,
      });
    }
  }
);

app.delete(
  '/api/admin/products/:productId/images/:imageId',
  authMiddleware,
  async (req, res) => {
    try {
      const productId = Number(req.params.productId);
      const imageId = Number(req.params.imageId);
      if (!productId || !imageId) {
        return res.status(400).json({ error: 'Invalid id' });
      }
      const [[row]] = await pool.query(
        'SELECT path FROM product_images WHERE id = ? AND product_id = ?',
        [imageId, productId]
      );
      if (!row) {
        return res.status(404).json({ error: 'Image not found' });
      }
      deleteDiskPath(row.path);
      await pool.query('DELETE FROM product_images WHERE id = ?', [imageId]);
      await syncProductThumbnail(productId);
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to delete image' });
    }
  }
);

app.get('/api/admin/media', authMiddleware, async (_req, res) => {
  try {
    const items = await listMediaAssets(pool);
    res.json(items);
  } catch (e) {
    console.error(e);
    if (e.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({
        error: 'media_assets table is missing.',
        hint: 'Restart the API to create it automatically.',
      });
    }
    res.status(500).json({ error: 'Failed to load media library' });
  }
});

app.post(
  '/api/admin/media',
  authMiddleware,
  (req, res, next) => {
    mediaLibraryUpload.array('images', MEDIA_LIBRARY_UPLOAD_MAX)(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message || 'Upload failed' });
      next();
    });
  },
  async (req, res) => {
    let files = req.files;
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'No image files received (use field name "images")' });
    }
    try {
      files = await normalizeUploadedImageFiles(files);
      const created = [];
      for (const f of files) {
        const publicPath = `/uploads/media/${f.filename}`;
        const [result] = await pool.query(
          'INSERT INTO media_assets (path, filename, source) VALUES (?, ?, ?)',
          [publicPath, f.filename, 'upload']
        );
        created.push(result.insertId);
      }
      let items = [];
      if (created.length) {
        const placeholders = created.map(() => '?').join(',');
        const [rows] = await pool.query(
          `SELECT id, path, filename, source, created_at
           FROM media_assets WHERE id IN (${placeholders})
           ORDER BY created_at DESC, id DESC`,
          created
        );
        items = rows;
      }
      res.status(201).json({ ok: true, items });
    } catch (e) {
      console.error(e);
      for (const f of files) {
        try {
          fs.unlinkSync(f.path);
        } catch (_) {
          /* ignore */
        }
      }
      if (e.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({
          error: 'media_assets table is missing.',
          hint: 'Restart the API to create it automatically.',
        });
      }
      const msg = e?.message || '';
      if (/heic/i.test(msg)) {
        return res.status(400).json({ error: msg });
      }
      res.status(500).json({ error: 'Failed to save media uploads', detail: msg });
    }
  }
);

app.post('/api/admin/media/scan', authMiddleware, async (_req, res) => {
  try {
    const result = await scanUploadsIntoMedia(pool, UPLOAD_ROOT);
    const items = await listMediaAssets(pool);
    res.json({ ok: true, ...result, items });
  } catch (e) {
    console.error(e);
    if (e.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({
        error: 'media_assets table is missing.',
        hint: 'Restart the API to create it automatically.',
      });
    }
    res.status(500).json({ error: 'Failed to scan uploads folder' });
  }
});

app.delete('/api/admin/media/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid media id' });
    const result = await deleteMediaAsset(pool, UPLOAD_ROOT, id);
    if (!result.ok) return res.status(result.status).json({ error: result.error });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete media' });
  }
});

app.patch('/api/admin/media/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid media id' });
    const filename = req.body?.filename;
    if (filename == null || String(filename).trim() === '') {
      return res.status(400).json({ error: 'filename is required' });
    }
    const result = await renameMediaAsset(pool, UPLOAD_ROOT, id, filename);
    if (!result.ok) return res.status(result.status).json({ error: result.error });
    res.json({ ok: true, item: result.item });
  } catch (e) {
    console.error(e);
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A file with that name already exists' });
    }
    res.status(500).json({ error: 'Failed to rename media file', detail: e.message });
  }
});

app.post('/api/admin/products/:id/images/from-library', authMiddleware, async (req, res) => {
  const productId = Number(req.params.id);
  if (!productId) return res.status(400).json({ error: 'Invalid product id' });
  const mediaIds = Array.isArray(req.body?.mediaIds) ? req.body.mediaIds : [];
  try {
    const result = await copyMediaIdsToProduct(pool, UPLOAD_ROOT, productId, mediaIds);
    if (!result.ok) return res.status(result.status).json({ error: result.error });
    if (!result.added?.length) {
      return res.status(400).json({ error: 'No images were added (files may be missing on disk)' });
    }
    try {
      await syncProductThumbnail(productId);
    } catch (syncErr) {
      console.error('[syncProductThumbnail]', syncErr);
    }
    const images = await loadProductImages(productId);
    res.status(201).json({ ok: true, images });
  } catch (e) {
    console.error(e);
    if (e.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({
        error: 'product_images or media_assets table is missing.',
        hint: 'Restart the API.',
      });
    }
    res.status(500).json({ error: 'Failed to add images from library' });
  }
});

app.post('/api/admin/products', authMiddleware, async (req, res) => {
  try {
    const { name, description, image_url, is_published, is_featured, sku, stock_quantity, product_size } =
      req.body ?? {};
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    const priceParsed = parseProductPriceInput(req.body);
    if (!priceParsed.ok) {
      return res.status(400).json({ error: priceParsed.error });
    }
    const sizeParsed = parseProductSizeInput({ product_size });
    if (!sizeParsed.ok) {
      return res.status(400).json({ error: sizeParsed.error });
    }
    const skuVal = sku != null && String(sku).trim() !== '' ? String(sku).trim().slice(0, 64) : null;
    const stock = Math.max(0, Math.min(9999999, Math.floor(Number(stock_quantity) || 0)));
    const [result] = await pool.query(
      'INSERT INTO products (name, description, price, size_prices, image_url, is_published, is_featured, sku, stock_quantity, product_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        name,
        description ?? null,
        priceParsed.price,
        priceParsed.sizePricesJson,
        image_url ?? null,
        is_published ? 1 : 0,
        is_featured ? 1 : 0,
        skuVal,
        stock,
        sizeParsed.value,
      ]
    );
    res.status(201).json({ id: result.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'SKU already in use' });
    }
    console.error(e);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.get('/api/admin/products/:id/categories', authMiddleware, async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const [rows] = await pool.query(
      `SELECT c.id, c.slug, c.name
       FROM product_categories c
       INNER JOIN product_category_products pcp ON pcp.category_id = c.id
       WHERE pcp.product_id = ?
       ORDER BY c.sort_order ASC, c.name ASC`,
      [productId]
    );
    res.json(hydrateProductRows(rows));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load product categories' });
  }
});

app.put('/api/admin/products/:id/categories', authMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const productId = Number(req.params.id);
    const { categoryIds } = req.body ?? {};
    if (!Array.isArray(categoryIds)) {
      return res.status(400).json({ error: 'categoryIds must be an array' });
    }
    const [[product]] = await conn.query('SELECT id FROM products WHERE id = ?', [productId]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    await conn.beginTransaction();
    await conn.query('DELETE FROM product_category_products WHERE product_id = ?', [productId]);
    for (const rawId of categoryIds) {
      const categoryId = Number(rawId);
      if (!categoryId) continue;
      const [[cat]] = await conn.query('SELECT id FROM product_categories WHERE id = ?', [categoryId]);
      if (!cat) continue;
      const [[maxRow]] = await conn.query(
        'SELECT COALESCE(MAX(sort_order), -1) AS mx FROM product_category_products WHERE category_id = ?',
        [categoryId]
      );
      const sort = Number(maxRow.mx) + 1;
      await conn.query(
        'INSERT INTO product_category_products (category_id, product_id, sort_order) VALUES (?, ?, ?)',
        [categoryId, productId, sort]
      );
    }
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    try {
      await conn.rollback();
    } catch {
      /* ignore */
    }
    console.error(e);
    res.status(500).json({ error: 'Failed to save product categories' });
  } finally {
    conn.release();
  }
});

app.put('/api/admin/products/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, description, image_url, is_published, is_featured, sku, stock_quantity, product_size } =
      req.body ?? {};
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    const priceParsed = parseProductPriceInput(req.body);
    if (!priceParsed.ok) {
      return res.status(400).json({ error: priceParsed.error });
    }
    const sizeParsed = parseProductSizeInput({ product_size });
    if (!sizeParsed.ok) {
      return res.status(400).json({ error: sizeParsed.error });
    }
    const skuVal = sku != null && String(sku).trim() !== '' ? String(sku).trim().slice(0, 64) : null;
    const stock = Math.max(0, Math.min(9999999, Math.floor(Number(stock_quantity) || 0)));
    const [result] = await pool.query(
      'UPDATE products SET name = ?, description = ?, price = ?, size_prices = ?, image_url = ?, is_published = ?, is_featured = ?, sku = ?, stock_quantity = ?, product_size = ? WHERE id = ?',
      [
        name,
        description ?? null,
        priceParsed.price,
        priceParsed.sizePricesJson,
        image_url ?? null,
        is_published ? 1 : 0,
        is_featured ? 1 : 0,
        skuVal,
        stock,
        sizeParsed.value,
        id,
      ]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    try {
      await syncProductThumbnail(id);
    } catch (_) {
      /* product_images table may be missing on old DBs */
    }
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'SKU already in use' });
    }
    console.error(e);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.patch('/api/admin/products/:id/visibility', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid product id' });
    if (typeof req.body?.is_published !== 'boolean') {
      return res.status(400).json({ error: 'is_published must be a boolean' });
    }
    const isPublished = req.body.is_published ? 1 : 0;
    const [result] = await pool.query('UPDATE products SET is_published = ? WHERE id = ?', [
      isPublished,
      id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ ok: true, is_published: !!isPublished });
  } catch (e) {
    console.error(e);
    if (isMissingProductColumnError(e)) {
      return sendProductSchemaMismatch(res);
    }
    res.status(500).json({ error: 'Failed to update product visibility' });
  }
});

app.delete('/api/admin/products/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    let imgs = [];
    try {
      const [rows] = await pool.query('SELECT path FROM product_images WHERE product_id = ?', [id]);
      imgs = rows;
    } catch (_) {
      /* product_images may not exist */
    }
    for (const im of imgs) {
      deleteDiskPath(im.path);
    }
    const dir = path.join(UPLOAD_ROOT, 'products', String(id));
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    await pool.query('DELETE FROM order_items WHERE product_id = ?', [id]);
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// --- Admin: assign products to page ---

app.get('/api/admin/pages/:id/products', authMiddleware, async (req, res) => {
  try {
    const pageId = Number(req.params.id);
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.is_published, pp.sort_order
       FROM page_products pp
       INNER JOIN products p ON p.id = pp.product_id
       WHERE pp.page_id = ?
       ORDER BY pp.sort_order ASC, p.name ASC`,
      [pageId]
    );
    res.json(hydrateProductRows(rows));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load page products' });
  }
});

app.put('/api/admin/pages/:id/products', authMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const pageId = Number(req.params.id);
    const { productIds } = req.body ?? {};
    if (!Array.isArray(productIds)) {
      return res.status(400).json({ error: 'productIds must be an array' });
    }
    const [[page]] = await conn.query('SELECT id FROM pages WHERE id = ?', [pageId]);
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    await conn.beginTransaction();
    await conn.query('DELETE FROM page_products WHERE page_id = ?', [pageId]);
    let sort = 0;
    for (const pid of productIds) {
      const id = Number(pid);
      if (!id) continue;
      await conn.query(
        'INSERT INTO page_products (page_id, product_id, sort_order) VALUES (?, ?, ?)',
        [pageId, id, sort++]
      );
    }
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    try {
      await conn.rollback();
    } catch {
      /* ignore */
    }
    console.error(e);
    res.status(500).json({ error: 'Failed to save page products' });
  } finally {
    conn.release();
  }
});

// --- Admin: customize wizard (/customize) ---

app.get('/api/admin/customize-config', authMiddleware, async (_req, res) => {
  try {
    const config = await loadCustomizeWizardConfig();
    res.json(config);
  } catch (e) {
    console.error('[admin/customize-config]', e);
    res.status(500).json({ error: 'Failed to load customize wizard config' });
  }
});

app.put('/api/admin/customize-config', authMiddleware, async (req, res) => {
  try {
    const config = await saveCustomizeWizardConfig(req.body);
    res.json({ ok: true, config });
  } catch (e) {
    console.error('[admin/customize-config]', e);
    res.status(500).json({ error: 'Failed to save customize wizard config' });
  }
});

// --- Admin: custom quilt requests ---

app.get('/api/admin/custom-quilt-requests', authMiddleware, async (_req, res) => {
  try {
    const rows = await listCustomQuiltRequestsForAdmin();
    res.json(hydrateProductRows(rows));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list custom quilt requests' });
  }
});

app.put('/api/admin/custom-quilt-requests/:id/acknowledged', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid request id' });
    const result = await setCustomQuiltRequestAcknowledged(id, req.body?.acknowledged);
    if (!result.ok) return res.status(result.status ?? 500).json({ error: result.error });
    res.json({ ok: true, acknowledged: result.acknowledged });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update acknowledged flag' });
  }
});

app.put('/api/admin/custom-quilt-requests/:id/status', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const status = String(req.body?.status ?? '').trim().toLowerCase();
    if (!id) return res.status(400).json({ error: 'Invalid request id' });
    if (!isAllowedCustomQuiltRequestStatus(status)) {
      return res.status(400).json({ error: 'Invalid request status' });
    }
    const [result] = await pool.query('UPDATE custom_quilt_requests SET status = ? WHERE id = ?', [
      status,
      id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Custom quilt request not found' });
    }
    res.json({ ok: true, status });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update custom quilt request status' });
  }
});

app.post('/api/admin/custom-quilt-requests/:id/tracking', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await sendCustomQuiltTrackingNotification(id, {
      carrier: req.body?.carrier,
      trackingNumber: req.body?.trackingNumber,
      sendEmail: req.body?.sendEmail !== false,
    });
    if (!result.ok) {
      return res.status(result.status ?? 500).json({ error: result.error });
    }
    res.json({
      ok: true,
      requestNumber: result.requestNumber,
      carrier: result.carrier,
      trackingNumber: result.trackingNumber,
      trackingUrl: result.trackingUrl,
      status: result.status,
      emailSent: !!result.emailSent,
      warning: result.warning ?? null,
    });
  } catch (e) {
    console.error('[custom-quilt tracking] notify failed:', e);
    res.status(500).json({ error: 'Failed to send tracking notification' });
  }
});

// --- Admin: custom payment links ---

app.get('/api/admin/custom-payments/orders', authMiddleware, async (req, res) => {
  try {
    const result = await searchCustomerPaymentsByEmail(req.query.email);
    if (!result.ok) {
      return res.status(result.status ?? 400).json({ error: result.error });
    }
    res.json({
      email: result.email,
      orders: result.orders,
      customRequests: result.customRequests,
    });
  } catch (e) {
    console.error('[admin/custom-payments/orders]', e);
    res.status(500).json({ error: 'Failed to search orders' });
  }
});

app.post('/api/admin/custom-payments', authMiddleware, async (req, res) => {
  try {
    const result = await createCustomPayment({
      orderId: req.body?.orderId,
      customQuiltRequestId: req.body?.customQuiltRequestId,
      amount: req.body?.amount,
      adminNote: req.body?.adminNote ?? req.body?.note,
      sendEmail: req.body?.sendEmail !== false,
    });
    if (!result.ok) {
      return res.status(result.status ?? 500).json({ error: result.error });
    }
    res.status(201).json(result);
  } catch (e) {
    console.error('[admin/custom-payments]', e);
    res.status(500).json({ error: 'Failed to create payment link' });
  }
});

// --- Admin: orders ---

app.get('/api/admin/orders', authMiddleware, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, order_number, status, customer_name, customer_email, subtotal, tax_amount, shipping_cost, total, created_at
       FROM orders
       ORDER BY created_at DESC`
    );
    res.json(hydrateProductRows(rows));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list orders' });
  }
});

app.get('/api/admin/orders/:id/invoice.pdf', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [[order]] = await pool.query(
      `SELECT id, order_number, status, customer_name, customer_email, customer_phone,
              shipping_address1, shipping_address2, shipping_city, shipping_state, shipping_postal_code, shipping_country,
              shipping_method, shipping_cost,
              billing_name, billing_address1, billing_address2, billing_city, billing_state, billing_postal_code, billing_country,
              card_last4, subtotal, tax_amount, total, created_at,
              tracking_carrier, tracking_number
       FROM orders WHERE id = ?`,
      [id]
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const [items] = await pool.query(
      `SELECT product_name, unit_price, quantity, line_total
       FROM order_items WHERE order_id = ? ORDER BY id ASC`,
      [id]
    );
    const pdf = await buildOrderInvoicePdf(order, items);
    const filename = invoicePdfFilename(order.order_number);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdf);
  } catch (e) {
    console.error('[invoice] PDF failed:', e);
    res.status(500).json({ error: 'Failed to generate invoice PDF' });
  }
});

app.post('/api/admin/orders/:id/invoice/email', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid order id' });
    const result = await emailCustomerOrderInvoice(pool, id);
    if (!result.ok) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    res.json({ ok: true, invoiceEmailedAt: result.invoiceEmailedAt });
  } catch (e) {
    console.error('[invoice] email failed:', e);
    res.status(500).json({
      error: e.message || 'Failed to email invoice',
    });
  }
});

app.get('/api/admin/orders/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [[order]] = await pool.query(
      `SELECT id, order_number, status, customer_name, customer_email, customer_phone,
              shipping_address1, shipping_address2, shipping_city, shipping_state, shipping_postal_code, shipping_country,
              shipping_method, shipping_cost,
              billing_name, billing_address1, billing_address2, billing_city, billing_state, billing_postal_code, billing_country,
              card_last4, subtotal, tax_amount, total, created_at,
              tracking_carrier, tracking_number, tracking_notified_at, invoice_emailed_at,
              label_from_name, label_from_address1, label_from_address2,
              label_from_city, label_from_state, label_from_postal_code, label_from_country, label_from_phone,
              stripe_payment_intent_id
       FROM orders WHERE id = ?`,
      [id]
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const [items] = await pool.query(
      `SELECT id, product_id, product_name, unit_price, quantity, line_total,
              line_refund_amount, line_refund_status, stripe_refund_id, line_refund_at
       FROM order_items WHERE order_id = ? ORDER BY id ASC`,
      [id]
    );
    res.json({ order, items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load order details' });
  }
});

app.get('/api/admin/shipping-carriers', authMiddleware, (_req, res) => {
  res.json(SHIPPING_CARRIERS.map(({ id, label }) => ({ id, label })));
});

app.get('/api/admin/orders/:id/shipping-label', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [[order]] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({
      orderNumber: order.order_number,
      from: resolveLabelFrom(order),
      to: resolveLabelTo(order),
      defaultFrom: getDefaultShipFrom(),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load shipping label addresses' });
  }
});

app.put('/api/admin/orders/:id/shipping-label', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const fromParsed = normalizeLabelAddress(req.body?.from, { requireName: true, requireLine1: true });
    if (!fromParsed.ok) {
      return res.status(400).json({ error: `From address: ${fromParsed.error}` });
    }
    const toParsed = normalizeLabelAddress(req.body?.to, { requireName: true, requireLine1: true });
    if (!toParsed.ok) {
      return res.status(400).json({ error: `Ship-to address: ${toParsed.error}` });
    }
    const from = fromParsed.value;
    const to = toParsed.value;

    const [result] = await pool.query(
      `UPDATE orders SET
        label_from_name = ?, label_from_address1 = ?, label_from_address2 = ?,
        label_from_city = ?, label_from_state = ?, label_from_postal_code = ?, label_from_country = ?, label_from_phone = ?,
        customer_name = ?, customer_phone = ?,
        shipping_address1 = ?, shipping_address2 = ?,
        shipping_city = ?, shipping_state = ?, shipping_postal_code = ?, shipping_country = ?
       WHERE id = ?`,
      [
        from.name,
        from.address1,
        from.address2 || null,
        from.city,
        from.state,
        from.postalCode,
        from.country,
        from.phone || null,
        to.name,
        to.phone || null,
        to.address1,
        to.address2 || null,
        to.city,
        to.state,
        to.postalCode,
        to.country,
        id,
      ]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to save shipping label addresses' });
  }
});

app.post('/api/admin/orders/:id/tracking', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await sendOrderTrackingNotification(id, {
      carrier: req.body?.carrier,
      trackingNumber: req.body?.trackingNumber,
      sendEmail: req.body?.sendEmail !== false,
    });
    if (!result.ok) {
      return res.status(result.status ?? 500).json({ error: result.error });
    }
    res.json({
      ok: true,
      orderNumber: result.orderNumber,
      carrier: result.carrier,
      trackingNumber: result.trackingNumber,
      trackingUrl: result.trackingUrl,
      status: result.status,
      emailSent: !!result.emailSent,
      warning: result.warning ?? null,
    });
  } catch (e) {
    console.error('[tracking] notify failed:', e);
    res.status(500).json({ error: 'Failed to send tracking notification' });
  }
});

app.post(
  '/api/admin/orders/:orderId/items/:itemId/product-preview',
  authMiddleware,
  async (req, res) => {
    try {
      const result = await previewOrderLineItemProductChange({
        orderId: req.params.orderId,
        itemId: req.params.itemId,
        productId: req.body?.productId,
      });
      if (!result.ok) {
        return res.status(result.status ?? 400).json({ error: result.error });
      }
      res.json(result);
    } catch (e) {
      console.error('[admin] line item product preview failed:', e);
      res.status(500).json({ error: e.message || 'Failed to preview line item change' });
    }
  }
);

app.put('/api/admin/orders/:orderId/items/:itemId/product', authMiddleware, async (req, res) => {
  try {
    const result = await changeOrderLineItemProduct({
      orderId: req.params.orderId,
      itemId: req.params.itemId,
      productId: req.body?.productId,
    });
    if (!result.ok) {
      return res.status(result.status ?? 400).json({ error: result.error });
    }
    res.json(result);
  } catch (e) {
    console.error('[admin] line item product change failed:', e);
    res.status(500).json({ error: e.message || 'Failed to update line item product' });
  }
});

app.put('/api/admin/orders/:id/status', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await updateAdminOrderStatus(id, req.body?.status);
    if (!result.ok) {
      return res.status(result.status ?? 500).json({ error: result.error });
    }
    res.json({
      ok: true,
      status: result.status,
      statusLabel: result.statusLabel,
      emailSent: !!result.emailSent,
      emailError: result.emailError ?? null,
      unchanged: !!result.unchanged,
      warning: result.warning ?? null,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

app.get('/api/admin/orders/:id/messages', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid order id' });
    const [[order]] = await pool.query('SELECT id FROM orders WHERE id = ?', [id]);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const messages = await listOrderMessages(id);
    res.json(messages);
  } catch (e) {
    console.error(e);
    if (e.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({
        error: 'order_messages table is missing.',
        hint: 'Restart the API to create it automatically.',
      });
    }
    res.status(500).json({ error: 'Failed to load message history' });
  }
});

app.get('/api/admin/orders/:id/messages/:messageId', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const messageId = Number(req.params.messageId);
    if (!id || !messageId) return res.status(400).json({ error: 'Invalid id' });
    const message = await getOrderMessage(id, messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    res.json(message);
  } catch (e) {
    console.error(e);
    if (e.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({
        error: 'order_messages table is missing.',
        hint: 'Restart the API to create it automatically.',
      });
    }
    res.status(500).json({ error: 'Failed to load message' });
  }
});

app.post('/api/admin/orders/:id/messages', authMiddleware, async (req, res) => {
  try {
    const result = await sendOrderCustomerMessage(req.params.id, {
      subject: req.body?.subject,
      body: req.body?.body ?? req.body?.message,
    });
    if (!result.ok) {
      return res.status(result.status ?? 500).json({ error: result.error });
    }
    res.status(201).json({
      ok: true,
      message: result.message,
      emailSent: result.emailSent,
      warning: result.warning ?? null,
    });
  } catch (e) {
    console.error(e);
    if (e.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({
        error: 'order_messages table is missing.',
        hint: 'Restart the API to create it automatically.',
      });
    }
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// --- Admin: test email ---

app.post('/api/admin/test-email', authMiddleware, async (req, res) => {
  const toEmail =
    String(req.body?.email ?? '').trim() ||
    process.env.MAIL_FROM_ADDRESS?.trim() ||
    '';

  if (!toEmail) {
    return res.status(400).json({
      error:
        'No recipient address. Pass an "email" field in the request body or set MAIL_FROM_ADDRESS (verified SendGrid sender).',
    });
  }

  const testOrderNumber = `TEST-${Date.now()}`;
  const testItems = [
    {
      productName: 'Test Quilt Item',
      quantity: 1,
      unitPrice: 29.99,
      lineTotal: 29.99,
    },
  ];
  const testTotal = 42.45;
  const testShipping = {
    address1: '123 Main St',
    address2: '',
    city: 'Logan',
    state: 'UT',
    postalCode: '84321',
    country: 'US',
  };

  try {
    await Promise.all([
      sendOrderConfirmationEmail({
        to: toEmail,
        orderNumber: testOrderNumber,
        customerName: 'Test Customer',
        total: testTotal,
        items: testItems,
      }),
      sendOrderStaffNotificationEmail({
        orderNumber: testOrderNumber,
        customerName: 'Test Customer',
        customerEmail: toEmail,
        customerPhone: '',
        total: testTotal,
        items: testItems,
        shipping: testShipping,
        shippingMethod: 'standard',
        shippingCost: 9.99,
      }),
    ]);
    res.json({ ok: true, orderNumber: testOrderNumber, sentTo: toEmail });
  } catch (e) {
    console.error('[test-email]', e?.message || e);
    res.status(500).json({ error: 'Failed to send test email', detail: e?.message || String(e) });
  }
});

/** Production: serve Vite build from same origin so /customize/success and /api share one host. */
const clientDist = path.join(__dirnameRoot, '..', 'client', 'dist');
const clientIndexHtml = path.join(clientDist, 'index.html');
if (fs.existsSync(clientIndexHtml)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(clientIndexHtml, (err) => (err ? next(err) : undefined));
  });
}

async function startServer() {
  try {
    await ensurePagesTable(pool);
  } catch (e) {
    console.error('[ensurePagesTable]', e?.message || e);
  }
  try {
    await ensureProductInventoryColumns(pool);
  } catch (e) {
    console.error('[ensureProductInventoryColumns]', e?.message || e);
  }
  try {
    await ensureProductImagesTable(pool);
  } catch (e) {
    console.error('[ensureProductImagesTable]', e?.message || e);
  }
  try {
    await ensureProductSizeColumn(pool);
  } catch (e) {
    console.error('[ensureProductSizeColumn]', e?.message || e);
  }
  try {
    await ensureProductSizePricesColumn(pool);
  } catch (e) {
    console.error('[ensureProductSizePricesColumn]', e?.message || e);
  }
  try {
    await ensureProductFeaturedColumn(pool);
  } catch (e) {
    console.error('[ensureProductFeaturedColumn]', e?.message || e);
  }
  try {
    await ensureProductCategories(pool);
  } catch (e) {
    console.error('[ensureProductCategories]', e?.message || e);
  }
  try {
    await ensureMediaAssetsTable(pool);
  } catch (e) {
    console.error('[ensureMediaAssetsTable]', e?.message || e);
  }
  try {
    await ensureStripeOrderColumns(pool);
  } catch (e) {
    console.error('[ensureStripeOrderColumns]', e?.message || e);
  }
  try {
    await ensureCustomQuiltRequestsTable(pool);
  } catch (e) {
    console.error('[ensureCustomQuiltRequestsTable]', e?.message || e);
  }
  try {
    await ensureOrderCustomPaymentsTable(pool);
  } catch (e) {
    console.error('[ensureOrderCustomPaymentsTable]', e?.message || e);
  }
  try {
    await ensureCustomizeWizardConfigTable(pool);
    await loadCustomizeWizardConfig();
  } catch (e) {
    console.error('[ensureCustomizeWizardConfigTable]', e?.message || e);
  }
  try {
    await ensureOrderTrackingColumns(pool);
  } catch (e) {
    console.error('[ensureOrderTrackingColumns]', e?.message || e);
  }
  try {
    await ensureOrderInvoiceEmailColumn(pool);
  } catch (e) {
    console.error('[ensureOrderInvoiceEmailColumn]', e?.message || e);
  }
  try {
    await ensureOrderShippingLabel(pool);
  } catch (e) {
    console.error('[ensureOrderShippingLabel]', e?.message || e);
  }
  try {
    await ensureOrderMessagesTable(pool);
  } catch (e) {
    console.error('[ensureOrderMessagesTable]', e?.message || e);
  }
  try {
    await ensureOrderAdjustmentColumns(pool);
  } catch (e) {
    console.error('[ensureOrderAdjustmentColumns]', e?.message || e);
  }
  app.listen(PORT, async () => {
    const stripeOk = !!process.env.STRIPE_SECRET_KEY;
    const clientOrigin = getClientOrigin();
    console.log(`[stripe] ${stripeOk ? 'configured (test/live per secret key)' : 'not configured — set STRIPE_SECRET_KEY'}`);
    console.log(`[client] CLIENT_ORIGIN=${clientOrigin}`);
    if (process.env.NODE_ENV === 'production' && !process.env.CLIENT_ORIGIN) {
      console.log(
        `[client] Using default production origin ${PRODUCTION_CLIENT_ORIGIN} (set CLIENT_ORIGIN to override)`
      );
    }
    console.log(`[stripe] Custom quilt success URL: ${clientOrigin}/customize/success?session_id={CHECKOUT_SESSION_ID}`);
    console.log(`API listening on http://localhost:${PORT}`);
    await verifySendGridIfConfigured();
  });
}

startServer();
