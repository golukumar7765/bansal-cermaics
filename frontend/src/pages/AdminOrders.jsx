import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Package,
  Truck,
  CreditCard,
  MapPin,
  User,
  FileText,
  History,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

import api, {
  getApiError
} from '../lib/api';

const STATUSES = [
  'All',
  'Payment Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Stock Review',
  'Cancelled',
  'Payment Failed',
  'Refunded'
];

const ACTIVE_FLOW = [
  'Payment Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered'
];

const getStatusClass = (status) => {
  switch (status) {
    case 'Confirmed':
      return 'bg-blue-50 text-blue-700 border-blue-200';

    case 'Processing':
      return 'bg-amber-50 text-amber-700 border-amber-200';

    case 'Shipped':
      return 'bg-purple-50 text-purple-700 border-purple-200';

    case 'Delivered':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';

    case 'Cancelled':
      return 'bg-red-50 text-red-700 border-red-200';

    case 'Refunded':
      return 'bg-pink-50 text-pink-700 border-pink-200';

    case 'Payment Failed':
      return 'bg-red-50 text-red-700 border-red-200';

    case 'Stock Review':
      return 'bg-orange-50 text-orange-700 border-orange-200';

    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

const formatMoney = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN')}`;

const formatDate = (date) => {
  if (!date) return '-';

  return new Date(date).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

/*
 * Returns statuses that make sense from the
 * current backend lifecycle.
 */
const getAllowedStatuses = (currentStatus, paymentStatus) => {
  const result = [currentStatus];

  const index = ACTIVE_FLOW.indexOf(currentStatus);

  /*
   * Normal forward movement.
   */
  if (
    index >= 0 &&
    index < ACTIVE_FLOW.length - 1
  ) {
    result.push(ACTIVE_FLOW[index + 1]);
  }

  /*
   * Payment Pending -> Confirmed
   */
  if (
    currentStatus === 'Payment Pending'
  ) {
    if (!result.includes('Confirmed')) {
      result.push('Confirmed');
    }

    result.push('Stock Review');
  }

  /*
   * Stock Review -> Confirmed
   */
  if (
    currentStatus === 'Stock Review'
  ) {
    result.push('Confirmed');
  }

  /*
   * Cancellation is allowed by backend only
   * from Confirmed / Processing.
   */
  if (
    currentStatus === 'Confirmed' ||
    currentStatus === 'Processing'
  ) {
    result.push('Cancelled');
  }

  /*
   * Refund is a financial operation.
   *
   * Backend allows refund for any paid order
   * that has not already been refunded.
   */
  if (
    paymentStatus === 'Paid' &&
    currentStatus !== 'Refunded' &&
    currentStatus !== 'Cancelled' &&
    currentStatus !== 'Payment Failed'
  ) {
    result.push('Refunded');
  }

  return [
    ...new Set(result)
  ];
};

const AdminOrders = () => {
  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [status, setStatus] =
    useState('All');

  const [page, setPage] =
    useState(1);

  const [pagination, setPagination] =
    useState({
      total: 0,
      page: 1,
      limit: 20,
      pages: 1
    });

  const [selectedOrder, setSelectedOrder] =
    useState(null);

  const [editForm, setEditForm] =
    useState({
      status: '',
      adminNote: '',
      courier: '',
      trackingNumber: '',
      trackingUrl: ''
    });

  const [cancellationReason, setCancellationReason] =
    useState('');

  const [showCancelBox, setShowCancelBox] =
    useState(false);

  const [showRefundBox, setShowRefundBox] =
    useState(false);

  const token =
    localStorage.getItem('adminToken');

  const authConfig = useMemo(
    () => ({
      headers: {
        Authorization: token
          ? `Bearer ${token}`
          : ''
      }
    }),
    [token]
  );

  const fetchOrders = useCallback(
    async () => {
      try {
        setLoading(true);
        setError('');

        const response =
          await api.get('/orders', {
            ...authConfig,
            params: {
              status,
              search,
              page,
              limit: 20
            }
          });

        const data =
          response.data;

        setOrders(
          Array.isArray(data?.data)
            ? data.data
            : []
        );

        setPagination(
          data?.pagination || {
            total: 0,
            page: 1,
            limit: 20,
            pages: 1
          }
        );
      } catch (err) {
        console.error(
          'Admin orders error:',
          err
        );

        setError(
          getApiError(
            err,
            'Unable to load orders.'
          )
        );
      } finally {
        setLoading(false);
      }
    },
    [
      authConfig,
      status,
      search,
      page
    ]
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    setPage(1);
  }, [status, search]);

  const openOrder = (order) => {
    setSelectedOrder(order);

    setEditForm({
      status:
        order.status ||
        'Payment Pending',

      adminNote:
        order.adminNote || '',

      courier:
        order.tracking?.courier ||
        '',

      trackingNumber:
        order.tracking?.trackingNumber ||
        '',

      trackingUrl:
        order.tracking?.trackingUrl ||
        ''
    });

    setCancellationReason('');
    setShowCancelBox(false);
    setShowRefundBox(false);
  };

  const closeOrder = () => {
    if (saving) return;

    setSelectedOrder(null);
    setShowCancelBox(false);
    setShowRefundBox(false);
    setCancellationReason('');
  };

  const updateField = (
    field,
    value
  ) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value
    }));

    if (
      field === 'status' &&
      value !== 'Cancelled'
    ) {
      setShowCancelBox(false);
    }

    if (
      field === 'status' &&
      value !== 'Refunded'
    ) {
      setShowRefundBox(false);
    }
  };

  const performUpdate = async (
    payload
  ) => {
    if (!selectedOrder?._id) {
      return;
    }

    try {
      setSaving(true);

      const response =
        await api.patch(
          `/orders/${selectedOrder._id}/status`,
          payload,
          authConfig
        );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            'Order update failed.'
        );
      }

      setSelectedOrder(
        response.data.data
      );

      setEditForm({
        status:
          response.data.data?.status ||
          payload.status,

        adminNote:
          response.data.data?.adminNote ||
          payload.adminNote ||
          '',

        courier:
          response.data.data?.tracking?.courier ||
          payload.courier ||
          '',

        trackingNumber:
          response.data.data?.tracking?.trackingNumber ||
          payload.trackingNumber ||
          '',

        trackingUrl:
          response.data.data?.tracking?.trackingUrl ||
          payload.trackingUrl ||
          ''
      });

      setShowCancelBox(false);
      setShowRefundBox(false);
      setCancellationReason('');

      await fetchOrders();

      return response.data.data;
    } catch (err) {
      console.error(
        'Order update error:',
        err
      );

      throw err;
    } finally {
      setSaving(false);
    }
  };

  const saveOrder = async () => {
    if (!selectedOrder?._id) {
      return;
    }

    const nextStatus =
      editForm.status;

    const currentStatus =
      selectedOrder.status;

    /*
     * Cancellation needs explicit confirmation.
     */
    if (
      nextStatus === 'Cancelled' &&
      currentStatus !== 'Cancelled'
    ) {
      setShowCancelBox(true);
      return;
    }

    /*
     * Refund needs explicit confirmation.
     */
    if (
      nextStatus === 'Refunded' &&
      currentStatus !== 'Refunded'
    ) {
      setShowRefundBox(true);
      return;
    }

    try {
      await performUpdate(
        editForm
      );

      alert(
        'Order updated successfully.'
      );
    } catch (err) {
      alert(
        getApiError(
          err,
          'Unable to update order.'
        )
      );
    }
  };

  const confirmCancellation = async () => {
    const reason =
      cancellationReason.trim();

    if (!reason) {
      alert(
        'Please enter a cancellation reason.'
      );
      return;
    }

    try {
      await performUpdate({
        ...editForm,
        status: 'Cancelled',
        cancellationReason:
          reason
      });

      alert(
        'Order cancelled successfully. Inventory was restored when applicable.'
      );
    } catch (err) {
      alert(
        getApiError(
          err,
          'Unable to cancel order.'
        )
      );
    }
  };

  const confirmRefund = async () => {
    if (
      selectedOrder?.payment?.status !==
      'Paid'
    ) {
      alert(
        'Only a paid order can be refunded.'
      );
      return;
    }

    try {
      const updated =
        await performUpdate({
          ...editForm,
          status: 'Refunded'
        });

      alert(
        'Refund successful. Inventory was restored.'
      );

      setSelectedOrder(updated);
    } catch (err) {
      alert(
        getApiError(
          err,
          'Refund failed.'
        )
      );
    }
  };

  const allowedStatuses =
    selectedOrder
      ? getAllowedStatuses(
          selectedOrder.status,
          selectedOrder.payment?.status
        )
      : [];

  return (
    <div className="p-4 sm:p-6">

      {/* HEADER */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Order Management
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Manage customer orders, payments,
            shipping and tracking.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-100 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700"
        >
          <RefreshCw
            size={16}
            className={
              loading
                ? 'animate-spin'
                : ''
            }
          />

          Refresh
        </button>
      </div>

      {/* FILTERS */}

      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5 shadow-sm">

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-3">

          <div className="relative">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search order number, customer, email or phone..."
              className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-blue-500"
            />

          </div>

          <select
            value={status}
            onChange={(e) =>
              setStatus(
                e.target.value
              )
            }
            className="border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            {STATUSES.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}
          </select>

        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* SUMMARY */}

      <div className="mb-4 text-sm text-slate-500">
        Showing{' '}
        <strong className="text-slate-800">
          {orders.length}
        </strong>{' '}
        of{' '}
        <strong className="text-slate-800">
          {pagination.total}
        </strong>{' '}
        orders
      </div>

      {/* TABLE */}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">

            <Package
              size={40}
              className="mx-auto text-slate-300 mb-3"
            />

            <h3 className="font-semibold text-slate-800">
              No orders found
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Try another search or status.
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[1000px]">

              <thead className="bg-slate-50 border-b border-slate-200">

                <tr className="text-left text-xs uppercase tracking-wider text-slate-500">

                  <th className="px-5 py-4">
                    Order
                  </th>

                  <th className="px-5 py-4">
                    Customer
                  </th>

                  <th className="px-5 py-4">
                    Items
                  </th>

                  <th className="px-5 py-4">
                    Total
                  </th>

                  <th className="px-5 py-4">
                    Payment
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {orders.map(
                  (order) => (
                    <tr
                      key={order._id}
                      className="hover:bg-slate-50"
                    >

                      <td className="px-5 py-4">

                        <div className="font-bold text-slate-900">
                          {order.orderNumber}
                        </div>

                        <div className="text-xs text-slate-500 mt-1">
                          {formatDate(
                            order.createdAt
                          )}
                        </div>

                      </td>

                      <td className="px-5 py-4">

                        <div className="font-semibold text-slate-800">
                          {order.customer?.name}
                        </div>

                        <div className="text-xs text-slate-500">
                          {order.customer?.email}
                        </div>

                        <div className="text-xs text-slate-500">
                          {order.customer?.phone}
                        </div>

                      </td>

                      <td className="px-5 py-4">

                        <div className="font-semibold text-slate-800">
                          {order.items?.length || 0}{' '}
                          product
                          {order.items?.length === 1
                            ? ''
                            : 's'}
                        </div>

                        <div className="text-xs text-slate-500">
                          Qty:{' '}
                          {order.items?.reduce(
                            (sum, item) =>
                              sum +
                              Number(
                                item.quantity || 0
                              ),
                            0
                          )}
                        </div>

                      </td>

                      <td className="px-5 py-4 font-bold text-slate-900">
                        {formatMoney(
                          order.totalAmount
                        )}
                      </td>

                      <td className="px-5 py-4">

                        <span
                          className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            order.payment?.status ===
                            'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-50 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {order.payment?.status ||
                            'Pending'}
                        </span>

                      </td>

                      <td className="px-5 py-4">

                        <span
                          className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold border ${getStatusClass(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>

                      </td>

                      <td className="px-5 py-4 text-right">

                        <button
                          onClick={() =>
                            openOrder(order)
                          }
                          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-semibold"
                        >
                          <Eye size={14} />
                          View
                        </button>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

        {/* PAGINATION */}

        {!loading &&
          pagination.pages > 1 && (
            <div className="border-t border-slate-200 px-5 py-4 flex items-center justify-between">

              <button
                disabled={page <= 1}
                onClick={() =>
                  setPage(
                    (prev) =>
                      Math.max(
                        1,
                        prev - 1
                      )
                  )
                }
                className="inline-flex items-center gap-1 px-3 py-2 border border-slate-200 rounded-lg text-sm disabled:opacity-40"
              >
                <ChevronLeft
                  size={16}
                />
                Previous
              </button>

              <span className="text-sm text-slate-500">
                Page{' '}
                <strong>
                  {pagination.page}
                </strong>{' '}
                of{' '}
                <strong>
                  {pagination.pages}
                </strong>
              </span>

              <button
                disabled={
                  page >=
                  pagination.pages
                }
                onClick={() =>
                  setPage(
                    (prev) =>
                      Math.min(
                        pagination.pages,
                        prev + 1
                      )
                  )
                }
                className="inline-flex items-center gap-1 px-3 py-2 border border-slate-200 rounded-lg text-sm disabled:opacity-40"
              >
                Next
                <ChevronRight
                  size={16}
                />
              </button>

            </div>
          )}

      </div>

      {/* ORDER DETAILS MODAL */}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl">

            {/* MODAL HEADER */}

            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">

              <div>
                <h2 className="font-bold text-lg text-slate-900">
                  {selectedOrder.orderNumber}
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  {formatDate(
                    selectedOrder.createdAt
                  )}
                </p>
              </div>

              <button
                onClick={closeOrder}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X size={20} />
              </button>

            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(92vh-80px)]">

              {/* TOP INFO */}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

                <div className="border border-slate-200 rounded-xl p-4">

                  <div className="flex items-center gap-2 text-xs text-slate-500 uppercase font-semibold mb-2">
                    <User size={14} />
                    Customer
                  </div>

                  <div className="font-bold text-slate-900">
                    {selectedOrder.customer?.name}
                  </div>

                  <div className="text-sm text-slate-600 mt-1">
                    {selectedOrder.customer?.email}
                  </div>

                  <div className="text-sm text-slate-600">
                    {selectedOrder.customer?.phone}
                  </div>

                  {selectedOrder.customer?.company && (
                    <div className="text-sm text-slate-600 mt-1">
                      {selectedOrder.customer.company}
                    </div>
                  )}

                </div>

                <div className="border border-slate-200 rounded-xl p-4">

                  <div className="flex items-center gap-2 text-xs text-slate-500 uppercase font-semibold mb-2">
                    <CreditCard size={14} />
                    Payment
                  </div>

                  <div className="font-bold text-slate-900">
                    {formatMoney(
                      selectedOrder.totalAmount
                    )}
                  </div>

                  <div className="text-sm mt-1">
                    Status:{' '}
                    <strong>
                      {selectedOrder.payment?.status ||
                        'Pending'}
                    </strong>
                  </div>

                  {selectedOrder.payment?.razorpayPaymentId && (
                    <div className="text-xs text-slate-500 mt-2 break-all">
                      Payment ID:{' '}
                      {selectedOrder.payment.razorpayPaymentId}
                    </div>
                  )}

                  {selectedOrder.payment?.paidAt && (
                    <div className="text-xs text-emerald-600 mt-2">
                      Paid:{' '}
                      {formatDate(
                        selectedOrder.payment.paidAt
                      )}
                    </div>
                  )}

                </div>

                <div className="border border-slate-200 rounded-xl p-4">

                  <div className="flex items-center gap-2 text-xs text-slate-500 uppercase font-semibold mb-2">
                    <Truck size={14} />
                    Shipping
                  </div>

                  <div className="font-bold text-slate-900">
                    {selectedOrder.tracking?.courier ||
                      'Not assigned'}
                  </div>

                  <div className="text-sm text-slate-600 mt-1">
                    {selectedOrder.tracking?.trackingNumber ||
                      'Tracking not assigned'}
                  </div>

                  {selectedOrder.tracking?.trackingUrl && (
                    <a
                      href={
                        selectedOrder.tracking.trackingUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-xs text-blue-600 hover:underline mt-2"
                    >
                      Open tracking
                    </a>
                  )}

                </div>

              </div>

              {/* ORDER LIFECYCLE */}

              <div className="border border-slate-200 rounded-xl p-5 mb-6">

                <div className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
                  <Truck size={17} />
                  Order Lifecycle
                </div>

                <div className="flex flex-wrap items-center gap-2">

                  {ACTIVE_FLOW.map(
                    (flowStatus, index) => {
                      const currentIndex =
                        ACTIVE_FLOW.indexOf(
                          selectedOrder.status
                        );

                      const completed =
                        currentIndex >= index;

                      return (
                        <React.Fragment
                          key={flowStatus}
                        >

                          <div
                            className={`px-3 py-2 rounded-lg text-xs font-semibold border ${
                              completed
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}
                          >
                            {flowStatus}
                          </div>

                          {index <
                            ACTIVE_FLOW.length -
                              1 && (
                            <span className="text-slate-300">
                              →
                            </span>
                          )}

                        </React.Fragment>
                      );
                    }
                  )}

                </div>

                {[
                  'Cancelled',
                  'Refunded',
                  'Payment Failed',
                  'Stock Review'
                ].includes(
                  selectedOrder.status
                ) && (
                  <div className="mt-4">

                    <span
                      className={`inline-flex px-3 py-2 rounded-lg text-xs font-semibold border ${getStatusClass(
                        selectedOrder.status
                      )}`}
                    >
                      {selectedOrder.status}
                    </span>

                  </div>
                )}

              </div>

              {/* ITEMS */}

              <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">

                <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <Package size={17} />
                  <strong>
                    Order Items
                  </strong>
                </div>

                <div className="divide-y divide-slate-100">

                  {selectedOrder.items?.map(
                    (item, index) => (
                      <div
                        key={`${item.sku}-${index}`}
                        className="p-5 flex items-center gap-4"
                      >

                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center">
                            <Package
                              size={22}
                              className="text-slate-400"
                            />
                          </div>
                        )}

                        <div className="flex-1">

                          <div className="font-bold text-slate-900">
                            {item.name}
                          </div>

                          <div className="text-xs text-slate-500 mt-1">
                            SKU: {item.sku}
                          </div>

                          <div className="text-sm text-slate-600 mt-1">
                            Qty: {item.quantity}
                          </div>

                        </div>

                        <div className="text-right">

                          <div className="text-sm text-slate-500">
                            {formatMoney(
                              item.unitPrice
                            )}{' '}
                            / unit
                          </div>

                          <div className="font-bold text-slate-900">
                            {formatMoney(
                              item.lineTotal
                            )}
                          </div>

                        </div>

                      </div>
                    )
                  )}

                </div>

              </div>

              {/* ADDRESS */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

                <div className="border border-slate-200 rounded-xl p-5">

                  <div className="flex items-center gap-2 font-semibold text-slate-900 mb-3">
                    <MapPin size={17} />
                    Shipping Address
                  </div>

                  <AddressBlock
                    address={
                      selectedOrder.shippingAddress
                    }
                  />

                </div>

                <div className="border border-slate-200 rounded-xl p-5">

                  <div className="flex items-center gap-2 font-semibold text-slate-900 mb-3">
                    <MapPin size={17} />
                    Billing Address
                  </div>

                  <AddressBlock
                    address={
                      selectedOrder.billingAddress
                    }
                  />

                </div>

              </div>

              {/* TOTAL */}

              <div className="border border-slate-200 rounded-xl p-5 mb-6">

                <div className="flex justify-between text-sm text-slate-600">
                  <span>
                    Subtotal
                  </span>

                  <span>
                    {formatMoney(
                      selectedOrder.subtotal
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-sm text-slate-600 mt-2">
                  <span>
                    Tax (
                    {selectedOrder.taxRate ||
                      0}
                    %)
                  </span>

                  <span>
                    {formatMoney(
                      selectedOrder.taxAmount
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-sm text-slate-600 mt-2">
                  <span>
                    Shipping
                  </span>

                  <span>
                    {formatMoney(
                      selectedOrder.shippingAmount
                    )}
                  </span>
                </div>

                <div className="border-t border-slate-200 mt-4 pt-4 flex justify-between">

                  <strong className="text-slate-900">
                    Total
                  </strong>

                  <strong className="text-xl text-slate-900">
                    {formatMoney(
                      selectedOrder.totalAmount
                    )}
                  </strong>

                </div>

              </div>

              {/* STATUS HISTORY */}

              <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">

                <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <History size={17} />
                  <strong>
                    Status History
                  </strong>
                </div>

                {!selectedOrder.statusHistory?.length ? (
                  <div className="p-5 text-sm text-slate-500">
                    No status history available.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">

                    {[
                      ...selectedOrder.statusHistory
                    ]
                      .reverse()
                      .map(
                        (
                          history,
                          index
                        ) => (
                          <div
                            key={`${history.changedAt}-${index}`}
                            className="p-4 flex gap-4"
                          >

                            <div className="mt-1">

                              <div
                                className={`w-3 h-3 rounded-full ${
                                  history.status ===
                                  'Cancelled' ||
                                  history.status ===
                                  'Payment Failed'
                                    ? 'bg-red-500'
                                    : history.status ===
                                      'Refunded'
                                    ? 'bg-pink-500'
                                    : 'bg-blue-500'
                                }`}
                              />

                            </div>

                            <div className="flex-1">

                              <div className="flex flex-wrap items-center gap-2">

                                <span
                                  className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold border ${getStatusClass(
                                    history.status
                                  )}`}
                                >
                                  {history.status}
                                </span>

                                <span className="text-xs text-slate-400">
                                  {formatDate(
                                    history.changedAt
                                  )}
                                </span>

                              </div>

                              {history.note && (
                                <div className="text-sm text-slate-600 mt-2">
                                  {history.note}
                                </div>
                              )}

                              <div className="text-xs text-slate-400 mt-1">
                                By:{' '}
                                {history.changedBy ||
                                  'system'}
                              </div>

                            </div>

                          </div>
                        )
                      )}

                  </div>
                )}

              </div>

              {/* ADMIN UPDATE */}

              <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-5">

                <div className="flex items-center gap-2 font-bold text-slate-900 mb-4">
                  <FileText size={17} />
                  Admin Order Update
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* STATUS */}

                  <div>

                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                      Order Status
                    </label>

                    <select
                      value={
                        editForm.status
                      }
                      onChange={(e) =>
                        updateField(
                          'status',
                          e.target.value
                        )
                      }
                      disabled={saving}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none disabled:bg-slate-100"
                    >

                      {allowedStatuses.map(
                        (item) => (
                          <option
                            key={item}
                            value={item}
                          >
                            {item}
                          </option>
                        )
                      )}

                    </select>

                    <p className="text-xs text-slate-500 mt-2">
                      Current status:{' '}
                      <strong>
                        {selectedOrder.status}
                      </strong>
                    </p>

                  </div>

                  {/* COURIER */}

                  <div>

                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                      Courier
                    </label>

                    <input
                      value={
                        editForm.courier
                      }
                      onChange={(e) =>
                        updateField(
                          'courier',
                          e.target.value
                        )
                      }
                      disabled={saving}
                      placeholder="e.g. Blue Dart"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none disabled:bg-slate-100"
                    />

                  </div>

                  {/* TRACKING NUMBER */}

                  <div>

                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                      Tracking Number
                    </label>

                    <input
                      value={
                        editForm.trackingNumber
                      }
                      onChange={(e) =>
                        updateField(
                          'trackingNumber',
                          e.target.value
                        )
                      }
                      disabled={saving}
                      placeholder="Tracking number"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none disabled:bg-slate-100"
                    />

                  </div>

                  {/* TRACKING URL */}

                  <div>

                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                      Tracking URL
                    </label>

                    <input
                      value={
                        editForm.trackingUrl
                      }
                      onChange={(e) =>
                        updateField(
                          'trackingUrl',
                          e.target.value
                        )
                      }
                      disabled={saving}
                      placeholder="https://..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none disabled:bg-slate-100"
                    />

                  </div>

                </div>

                {/* ADMIN NOTE */}

                <div className="mt-4">

                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                    Admin Note
                  </label>

                  <textarea
                    value={
                      editForm.adminNote
                    }
                    onChange={(e) =>
                      updateField(
                        'adminNote',
                        e.target.value
                      )
                    }
                    rows={3}
                    disabled={saving}
                    placeholder="Internal order note..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none resize-none disabled:bg-slate-100"
                  />

                </div>

                {/* CANCELLATION CONFIRMATION */}

                {showCancelBox && (
                  <div className="mt-5 border border-red-200 bg-red-50 rounded-xl p-4">

                    <div className="flex gap-3">

                      <AlertTriangle
                        size={20}
                        className="text-red-600 shrink-0 mt-0.5"
                      />

                      <div className="flex-1">

                        <div className="font-bold text-red-800">
                          Cancel this order?
                        </div>

                        <p className="text-sm text-red-700 mt-1">
                          If this is a paid order,
                          inventory will be restored.
                          Cancellation does not
                          automatically create a Razorpay
                          refund.
                        </p>

                        <textarea
                          value={
                            cancellationReason
                          }
                          onChange={(e) =>
                            setCancellationReason(
                              e.target.value
                            )
                          }
                          rows={3}
                          placeholder="Enter cancellation reason..."
                          className="w-full mt-3 bg-white border border-red-200 rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
                        />

                        <div className="flex justify-end gap-2 mt-3">

                          <button
                            onClick={() =>
                              setShowCancelBox(
                                false
                              )
                            }
                            disabled={saving}
                            className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm font-semibold"
                          >
                            Back
                          </button>

                          <button
                            onClick={
                              confirmCancellation
                            }
                            disabled={
                              saving ||
                              !cancellationReason.trim()
                            }
                            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50"
                          >
                            {saving
                              ? 'Cancelling...'
                              : 'Confirm Cancellation'}
                          </button>

                        </div>

                      </div>

                    </div>

                  </div>
                )}

                {/* REFUND CONFIRMATION */}

                {showRefundBox && (
                  <div className="mt-5 border border-pink-200 bg-pink-50 rounded-xl p-4">

                    <div className="flex gap-3">

                      <RotateCcw
                        size={20}
                        className="text-pink-600 shrink-0 mt-0.5"
                      />

                      <div className="flex-1">

                        <div className="font-bold text-pink-800">
                          Refund this payment?
                        </div>

                        <p className="text-sm text-pink-700 mt-1">
                          Razorpay will be asked to refund{' '}
                          <strong>
                            {formatMoney(
                              selectedOrder.totalAmount
                            )}
                          </strong>
                          . After a successful refund,
                          inventory will be restored.
                        </p>

                        <p className="text-xs text-pink-600 mt-2">
                          Payment ID:{' '}
                          {selectedOrder.payment
                            ?.razorpayPaymentId ||
                            'Missing'}
                        </p>

                        <div className="flex justify-end gap-2 mt-3">

                          <button
                            onClick={() =>
                              setShowRefundBox(
                                false
                              )
                            }
                            disabled={saving}
                            className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm font-semibold"
                          >
                            Back
                          </button>

                          <button
                            onClick={
                              confirmRefund
                            }
                            disabled={
                              saving
                            }
                            className="px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold disabled:opacity-50"
                          >
                            {saving
                              ? 'Processing Refund...'
                              : 'Confirm Refund'}
                          </button>

                        </div>

                      </div>

                    </div>

                  </div>
                )}

                {/* ACTION BUTTONS */}

                <div className="flex flex-wrap justify-end gap-3 mt-5">

                  <button
                    onClick={closeOrder}
                    disabled={saving}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700"
                  >
                    Close
                  </button>

                  <button
                    onClick={saveOrder}
                    disabled={
                      saving ||
                      !editForm.status
                    }
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    {saving
                      ? 'Saving...'
                      : editForm.status ===
                        'Cancelled'
                      ? 'Continue Cancellation'
                      : editForm.status ===
                        'Refunded'
                      ? 'Continue Refund'
                      : 'Save Order'}
                  </button>

                </div>

              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const AddressBlock = ({
  address
}) => {
  if (!address) {
    return (
      <div className="text-sm text-slate-500">
        No address available.
      </div>
    );
  }

  return (
    <div className="text-sm text-slate-600 leading-6">

      <div className="font-semibold text-slate-900">
        {address.fullName}
      </div>

      {address.company && (
        <div>
          {address.company}
        </div>
      )}

      <div>
        {address.addressLine1}
      </div>

      {address.addressLine2 && (
        <div>
          {address.addressLine2}
        </div>
      )}

      <div>
        {address.city},{' '}
        {address.state} -{' '}
        {address.postalCode}
      </div>

      <div>
        {address.country}
      </div>

      {address.phone && (
        <div className="mt-1">
          Phone: {address.phone}
        </div>
      )}

    </div>
  );
};

export default AdminOrders;