import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock3,
  XCircle,
  RefreshCw,
  ArrowLeft,
  ExternalLink,
  MapPin,
  CreditCard,
  ShoppingBag
} from 'lucide-react';

import api from '../lib/api';

const STATUS_STEPS = [
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered'
];

const STATUS_META = {
  'Payment Pending': {
    label: 'Payment Pending',
    icon: CreditCard,
    description: 'Waiting for payment confirmation.'
  },
  Confirmed: {
    label: 'Order Confirmed',
    icon: CheckCircle2,
    description: 'Your order has been confirmed successfully.'
  },
  Processing: {
    label: 'Processing',
    icon: Package,
    description: 'Our team is preparing your order.'
  },
  Shipped: {
    label: 'Shipped',
    icon: Truck,
    description: 'Your order has been dispatched.'
  },
  Delivered: {
    label: 'Delivered',
    icon: CheckCircle2,
    description: 'Your order has been delivered.'
  },
  'Stock Review': {
    label: 'Stock Review',
    icon: Clock3,
    description: 'Our team is reviewing stock availability.'
  },
  Cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    description: 'This order has been cancelled.'
  },
  'Payment Failed': {
    label: 'Payment Failed',
    icon: XCircle,
    description: 'Payment for this order was unsuccessful.'
  },
  Refunded: {
    label: 'Refunded',
    icon: RefreshCw,
    description: 'The payment has been refunded.'
  }
};

const CustomerOrderTracking = () => {
  const [searchParams] = useSearchParams();

  const orderNumber =
    searchParams.get('order') ||
    searchParams.get('orderNumber');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadOrder = async (silent = false) => {
    if (!orderNumber) {
      setLoading(false);
      setError('Order number is missing.');
      return;
    }

    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      /*
       * Customer tracking endpoint.
       *
       * If your backend exposes public tracking as:
       * GET /api/orders/track/:orderNumber
       * api baseURL already contains /api.
       */
      const response = await api.get(
        `/orders/track/${encodeURIComponent(orderNumber)}`
      );

      const data =
        response.data?.data ||
        response.data?.order ||
        response.data;

      setOrder(data);
    } catch (err) {
      console.error('Order tracking error:', err);

      const message =
        err?.response?.data?.message ||
        'Unable to load order details. Please check the order number.';

      setError(message);
      setOrder(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderNumber]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <RefreshCw
            size={28}
            className="mx-auto text-blue-600 animate-spin"
          />

          <p className="mt-4 text-sm font-semibold text-slate-600">
            Loading your order...
          </p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="max-w-xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            Back to Products
          </Link>

          <div className="mt-8 bg-white border border-red-200 rounded-3xl p-8 text-center shadow-sm">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
              <XCircle
                size={34}
                className="text-red-500"
              />
            </div>

            <h1 className="mt-5 text-2xl font-extrabold text-slate-900">
              Order Not Found
            </h1>

            <p className="mt-3 text-sm text-slate-500 leading-6">
              {error ||
                'We could not find this order.'}
            </p>

            {orderNumber && (
              <p className="mt-4 text-xs text-slate-400">
                Order number:{' '}
                <strong className="text-slate-600">
                  {orderNumber}
                </strong>
              </p>
            )}

            <Link
              to="/"
              className="mt-7 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const status = order.status || 'Confirmed';

  const meta =
    STATUS_META[status] ||
    STATUS_META.Confirmed;

  const StatusIcon = meta.icon;

  const currentStepIndex =
    STATUS_STEPS.indexOf(status);

  const isCancelled =
    status === 'Cancelled' ||
    status === 'Payment Failed' ||
    status === 'Refunded';

  const customer = order.customer || {};

  const shippingAddress =
    order.shippingAddress ||
    order.shipping ||
    {};

  const items = Array.isArray(order.items)
    ? order.items
    : [];

  const totalAmount =
    Number(order.totalAmount) || 0;

  const formatDate = (date) => {
    if (!date) return '—';

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return '—';
    }

    return parsed.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            Continue Shopping
          </Link>

          <button
            onClick={() => loadOrder(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-blue-300 text-slate-700 font-semibold px-4 py-2.5 rounded-xl transition disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? 'animate-spin'
                  : ''
              }
            />

            Refresh Status
          </button>
        </div>

        {/* ORDER HEADER */}
        <section className="mt-6 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
                  Order Tracking
                </p>

                <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {order.orderNumber ||
                    orderNumber}
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  Placed on{' '}
                  {formatDate(order.createdAt)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <StatusIcon
                    size={25}
                    className="text-blue-600"
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Current Status
                  </p>

                  <p className="text-lg font-extrabold text-slate-900">
                    {meta.label}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <p className="text-sm font-semibold text-slate-800">
                {meta.description}
              </p>
            </div>
          </div>
        </section>

        {/* TRACKING TIMELINE */}
        <section className="mt-6 bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Truck
              size={21}
              className="text-blue-600"
            />

            <h2 className="text-xl font-extrabold text-slate-900">
              Shipment Progress
            </h2>
          </div>

          {isCancelled ? (
            <div className="mt-6 flex items-center gap-4 p-5 rounded-2xl bg-red-50 border border-red-200">
              <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0">
                <XCircle
                  size={25}
                  className="text-red-500"
                />
              </div>

              <div>
                <p className="font-extrabold text-red-800">
                  {meta.label}
                </p>

                <p className="text-sm text-red-700 mt-1">
                  {meta.description}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-8">
              {STATUS_STEPS.map(
                (step, index) => {
                  const completed =
                    currentStepIndex >= index;

                  const active =
                    status === step;

                  const stepMeta =
                    STATUS_META[step];

                  const StepIcon =
                    stepMeta.icon;

                  return (
                    <div
                      key={step}
                      className="relative flex gap-4"
                    >
                      {index <
                        STATUS_STEPS.length -
                          1 && (
                        <div
                          className={`absolute left-[18px] top-10 w-0.5 h-14 ${
                            currentStepIndex >
                            index
                              ? 'bg-blue-600'
                              : 'bg-slate-200'
                          }`}
                        />
                      )}

                      <div
                        className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 ${
                          completed
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-slate-300 text-slate-400'
                        }`}
                      >
                        <StepIcon size={17} />
                      </div>

                      <div className="pb-10">
                        <p
                          className={`font-bold ${
                            active
                              ? 'text-blue-600'
                              : completed
                              ? 'text-slate-900'
                              : 'text-slate-400'
                          }`}
                        >
                          {stepMeta.label}
                        </p>

                        <p className="text-sm text-slate-500 mt-1">
                          {stepMeta.description}
                        </p>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* SHIPPING / TRACKING */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">

          <section className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <Truck
                size={20}
                className="text-blue-600"
              />

              <h2 className="text-lg font-extrabold text-slate-900">
                Shipping Details
              </h2>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Courier
                </p>

                <p className="mt-1 font-semibold text-slate-800">
                  {order.tracking?.courier ||
                    'Not assigned yet'}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Tracking Number
                </p>

                <p className="mt-1 font-semibold text-slate-800 break-all">
                  {order.tracking
                    ?.trackingNumber ||
                    'Not assigned yet'}
                </p>
              </div>

              {order.tracking
                ?.trackingUrl && (
                <a
                  href={
                    order.tracking.trackingUrl
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700"
                >
                  Track Shipment
                  <ExternalLink
                    size={15}
                  />
                </a>
              )}

              {order.shippedAt && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Shipped At
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {formatDate(
                      order.shippedAt
                    )}
                  </p>
                </div>
              )}

              {order.deliveredAt && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Delivered At
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {formatDate(
                      order.deliveredAt
                    )}
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <MapPin
                size={20}
                className="text-blue-600"
              />

              <h2 className="text-lg font-extrabold text-slate-900">
                Delivery Address
              </h2>
            </div>

            <div className="mt-5 text-sm text-slate-600 leading-7">
              <p className="font-bold text-slate-900">
                {shippingAddress.fullName ||
                  customer.name ||
                  'Customer'}
              </p>

              {shippingAddress.company && (
                <p>
                  {shippingAddress.company}
                </p>
              )}

              {shippingAddress.addressLine1 && (
                <p>
                  {shippingAddress.addressLine1}
                </p>
              )}

              {shippingAddress.addressLine2 && (
                <p>
                  {shippingAddress.addressLine2}
                </p>
              )}

              <p>
                {[
                  shippingAddress.city,
                  shippingAddress.state,
                  shippingAddress.postalCode
                ]
                  .filter(Boolean)
                  .join(', ')}
              </p>

              {shippingAddress.country && (
                <p>
                  {shippingAddress.country}
                </p>
              )}
            </div>
          </section>
        </div>

        {/* CUSTOMER */}
        <section className="mt-6 bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
          <h2 className="text-lg font-extrabold text-slate-900">
            Customer Details
          </h2>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-2xl p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Name
              </p>

              <p className="mt-1 font-semibold text-slate-800">
                {customer.name || '—'}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Email
              </p>

              <p className="mt-1 font-semibold text-slate-800 break-all">
                {customer.email || '—'}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Phone
              </p>

              <p className="mt-1 font-semibold text-slate-800">
                {customer.phone || '—'}
              </p>
            </div>
          </div>
        </section>

        {/* ITEMS */}
        <section className="mt-6 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <ShoppingBag
                size={20}
                className="text-blue-600"
              />

              <h2 className="text-lg font-extrabold text-slate-900">
                Order Items
              </h2>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">
                No item details available.
              </div>
            ) : (
              items.map((item, index) => (
                <div
                  key={
                    item._id ||
                    item.productId ||
                    index
                  }
                  className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-bold text-slate-900">
                      {item.name ||
                        item.productName ||
                        'Product'}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Quantity:{' '}
                      {item.quantity || 1}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-extrabold text-slate-900">
                      ₹
                      {Number(
                        item.lineTotal ??
                          item.total ??
                          (Number(
                            item.unitPrice ||
                              item.price ||
                              0
                          ) *
                            Number(
                              item.quantity ||
                                1
                            ))
                      ).toLocaleString(
                        'en-IN'
                      )}
                    </p>

                    {item.unitPrice != null && (
                      <p className="text-xs text-slate-400 mt-1">
                        ₹
                        {Number(
                          item.unitPrice
                        ).toLocaleString(
                          'en-IN'
                        )}{' '}
                        / unit
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-700">
              Total
            </span>

            <span className="text-2xl font-extrabold text-blue-600">
              ₹
              {totalAmount.toLocaleString(
                'en-IN'
              )}
            </span>
          </div>
        </section>

        {/* ADMIN NOTE */}
        {order.adminNote && (
          <section className="mt-6 bg-amber-50 border border-amber-200 rounded-3xl p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
              Order Note
            </p>

            <p className="mt-2 text-sm text-amber-900 leading-6">
              {order.adminNote}
            </p>
          </section>
        )}

      </div>
    </main>
  );
};

export default CustomerOrderTracking;