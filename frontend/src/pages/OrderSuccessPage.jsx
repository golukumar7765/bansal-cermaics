import React from 'react';
import {
  CheckCircle2,
  Package,
  ArrowRight,
  Truck
} from 'lucide-react';

import {
  Link,
  useSearchParams
} from 'react-router-dom';

const OrderSuccessPage = () => {
  const [searchParams] =
    useSearchParams();

  const orderNumber =
    searchParams.get('order');

  let order = null;

  try {
    order = JSON.parse(
      localStorage.getItem(
        'lastOrder'
      ) || 'null'
    );
  } catch {
    order = null;
  }

  const finalOrderNumber =
    orderNumber ||
    order?.orderNumber ||
    '';

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">

      <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-3xl shadow-xl p-8 sm:p-12 text-center">

        {/* SUCCESS ICON */}
        <div className="mx-auto w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle2
            size={44}
            className="text-emerald-500"
          />
        </div>

        {/* SUCCESS LABEL */}
        <p className="mt-6 text-sm font-bold uppercase tracking-wider text-emerald-600">
          Payment Successful
        </p>

        {/* TITLE */}
        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900">
          Thank you for your order!
        </h1>

        {/* DESCRIPTION */}
        <p className="mt-4 text-slate-500 leading-7">
          Your payment has been verified and your
          order has been successfully received by
          Bansal Scientific.
        </p>

        {/* ORDER DETAILS */}
        <div className="mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-6">

          <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
            <Package size={16} />
            Order Number
          </div>

          <p className="mt-2 text-2xl font-extrabold text-blue-600">
            {finalOrderNumber ||
              'Order received'}
          </p>

          {order?.totalAmount != null && (
            <p className="mt-3 text-sm text-slate-500">
              Total paid:{' '}
              <strong className="text-slate-800">
                ₹
                {Number(
                  order.totalAmount
                ).toLocaleString(
                  'en-IN'
                )}
              </strong>
            </p>
          )}

        </div>

        {/* ACTION BUTTONS */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">

          {/* TRACK ORDER */}
          <Link
            to={
              finalOrderNumber
                ? `/track-order?order=${encodeURIComponent(
                    finalOrderNumber
                  )}`
                : '/track-order'
            }
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl transition"
          >
            <Truck size={17} />
            Track Order
          </Link>

          {/* CONTINUE SHOPPING */}
          <Link
            to="/"
            className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold px-5 py-3 rounded-xl border border-slate-300 transition"
          >
            Continue Shopping
            <ArrowRight size={17} />
          </Link>

          {/* CONTACT SUPPORT */}
          <Link
            to="/contact"
            className="sm:col-span-2 flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold px-5 py-3 rounded-xl border border-slate-300 transition"
          >
            Contact Support
          </Link>

        </div>

      </div>

    </main>
  );
};

export default OrderSuccessPage;