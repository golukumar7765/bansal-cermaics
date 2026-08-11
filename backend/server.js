const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

const connectDB = require('./config/db');
const Order = require('./models/Order');

const {
  releaseExpiredReservations
} = require('./services/inventoryService');
const {
  updateCurrencyRates
} = require(
  './services/exchangeRateService'
);
dotenv.config();

connectDB();

const app = express();

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

/*
 * ---------------------------------------------------------
 * RAZORPAY WEBHOOK
 * ---------------------------------------------------------
 *
 * IMPORTANT:
 *
 * This route MUST be registered before
 * express.json().
 *
 * Razorpay signature validation requires
 * the exact raw request body.
 */

app.use(
  '/api/payment/webhook',
  express.raw({
    type: 'application/json'
  }),
  require('./routes/paymentRoutes')
);

/*
 * ---------------------------------------------------------
 * BODY PARSERS
 * ---------------------------------------------------------
 */

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = Buffer.from(buf);
    }
  })
);

app.use(
  express.urlencoded({
    extended: true
  })
);

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

startInventoryCleanup();

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

startExchangeRateSync();
const PORT =
  process.env.PORT || 5000;

app.listen(
  PORT,
  () => {
    console.log(
      `🚀 Server running on port ${PORT}`
    );
  }
);