# Bansal Scientific

Two storefronts share one catalog backend:

- **Scientific (B2B):** `/scientific`
- **Lifestyle (B2C):** `/lifestyle`

## Local setup

1. Copy `backend/.env.example` to `backend/.env` and set real service credentials.
2. Copy `frontend/.env.example` to `frontend/.env` and set `REACT_APP_API_BASE_URL`.
3. Start the backend with `npm run dev` from `backend/`.
4. Start the frontend with `npm start` from `frontend/`.

## Production handover requirements

- Set `CORS_ORIGIN` to the exact deployed frontend domain (comma-separate multiple allowed domains).
- Use production MongoDB, Cloudinary, mailer and Razorpay credentials; do not commit `.env` files.
- Register the Razorpay webhook at `/api/payment/webhook` and set `RAZORPAY_WEBHOOK_SECRET`.
- Configure SPA fallback so direct routes such as `/scientific/category/...` load the React app.
- Configure `REACT_APP_API_BASE_URL` to the deployed API before building the frontend.
