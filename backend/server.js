const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

const connectDB = require('./config/db');
const Order = require('./models/Order');
const siteContentRoutes = require('./routes/siteContentRoutes');
const { rateLimit } = require('./middleware/rateLimitMiddleware');

const {
  releaseExpiredReservations
} = require('./services/inventoryService');
const {
  updateCurrencyRates
} = require(
  './services/exchangeRateService'
);
dotenv.config();

// Yahan se connectDB() hata diya gaya hai kyunki use neeche await ke sath start karenge

const app = express();

// Baseline HTTP hardening without adding a new deployment dependency. TLS must
// still be terminated by the production host/reverse proxy.
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

/*
 * ---------------------------------------------------------------
 * CORS
 * ---------------------------------------------------------
 */

const allowedOrigins = (
  process.env.CORS_ORIGIN ||
  'http://localhost:3000'
)
  .split(',')
  .map((origin) =>
    origin.trim()
  )
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(
          origin
        )
      ) {
        return callback(
          null,
          true
        );
      }

      return callback(
        new Error(
          'Origin is not allowed by CORS'
        )
      );
    }
  })
);

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, keyPrefix: 'api' }));

/*
 * ---------------------------------------------------------
 * BODY PARSERS
 * ---------------------------------------------------------
 */

app.use(
  express.json({
    limit: '100kb',
    verify: (req, res, buf) => {
      req.rawBody = Buffer.from(buf);
    }
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '100kb'
  })
);

// The JSON parser's verify hook retains the exact raw body for Razorpay HMAC
// validation while still parsing ordinary API requests normally.
app.use('/api/site-content', siteContentRoutes);

/*
 * ---------------------------------------------------------
 * API ROUTES
 * ---------------------------------------------------------
 */

app.use(
  '/api/auth',
  require('./routes/authRoutes')
);

app.use(
  '/api/products',
  require('./routes/productRoutes')
);

app.use(
  '/api/categories',
  require('./routes/categoryRoutes')
);

app.use(
  '/api/inquiries',
  require('./routes/inquiryRoutes')
);

app.use(
  '/api/payment',
  require('./routes/paymentRoutes')
);

app.use(
  '/api/orders',
  require('./routes/orderRoutes')
);
app.use(
  '/api/categories',
  require('./routes/categoryRoutes')
);
app.use(
  '/api/currencies',
  require('./routes/currencyRoutes')
);

app.use(
  '/api/pricing',
  require('./routes/pricingRoutes')
);

/*
 * ---------------------------------------------------------
 * HEALTH CHECK
 * ---------------------------------------------------------
 */

app.get(
  '/',
  (req, res) => {
    res.json({
      success: true,

      message:
        'Bansal Scientific API is running.',

      timestamp:
        new Date().toISOString()
    });
  }
);

/*
 * ---------------------------------------------------------
 * ERROR HANDLER
 * ---------------------------------------------------------
 */

app.use(
  (err, req, res, next) => {
    if (
      err.message ===
      'Origin is not allowed by CORS'
    ) {
      return res.status(403).json({
        success: false,
        message:
          err.message
      });
    }

    console.error(err);

    return res.status(
      err.status || 500
    ).json({
      success: false,
      message:
        'Unexpected server error.'
    });
  }
);

/*
 * ---------------------------------------------------------
 * EXPIRED INVENTORY CLEANUP
 * ---------------------------------------------------------
 *
 * Runs every minute.
 *
 * Reserved + expired
 *        ↓
 * Released
 *        ↓
 * Stock restored
 */

const startInventoryCleanup =
  () => {
    const intervalMs =
      60 * 1000;

    setInterval(
      async () => {
        try {
          const released =
            await releaseExpiredReservations(
              Order
            );

          if (released > 0) {
            console.log(
              `♻️ Released ${released} expired inventory reservation(s).`
            );
          }
        } catch (error) {
          console.error(
            'Inventory cleanup error:',
            error
          );
        }
      },
      intervalMs
    );
  };

/*
 * ---------------------------------------------------------
 * SERVER
 * ---------------------------------------------------------
 */
const startExchangeRateSync =
  () => {
    /*
     * Update immediately on startup.
     */
    updateCurrencyRates()
      .then((result) => {
        console.log(
          `💱 Currency rates updated: ${result.updated} currency(s).`
        );
      })
      .catch((error) => {
        console.error(
          'Currency rate startup sync failed:',
          error
        );
      });

    /*
     * Refresh every 6 hours.
     */
    setInterval(
      async () => {
        try {
          const result =
            await updateCurrencyRates();

          console.log(
            `💱 Currency rates refreshed: ${result.updated} currency(s).`
          );
        } catch (error) {
          console.error(
            'Currency rate sync error:',
            error
          );
        }
      },
      6 * 60 * 60 * 1000
    );
  };
const startServerSequence = async () => {
  try {
    const requiredPaymentConfig = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET'];
    const missingPaymentConfig = requiredPaymentConfig.filter((key) => !String(process.env[key] || '').trim());
    if (missingPaymentConfig.length) {
      throw new Error(`Missing required payment configuration: ${missingPaymentConfig.join(', ')}`);
    }
    if (process.env.NODE_ENV === 'production') {
      if (!String(process.env.CORS_ORIGIN || '').trim()) {
        throw new Error('CORS_ORIGIN must be configured in production.');
      }
      if (String(process.env.JWT_SECRET || '').length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters in production.');
      }
    }
    // 1. Pehle database connect hone ka pura intezaar karo
    await connectDB();

    // 2. Uske baad baki services start karo
    startInventoryCleanup();
    startExchangeRateSync();

    // 3. Phir Express server start karo
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server due to DB connection:", err);
  }
};

if (require.main === module) {
  startServerSequence();
}

module.exports = { app, startServerSequence };
