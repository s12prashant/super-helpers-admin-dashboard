export const orderPageSizeOptions = [10, 25, 50, 100] as const;

export type OrderPackageOption = {
  id: number;
  package_name: string;
  package_price: number;
  package_gst_percentage: number;
  package_validity_days: number | null;
  package_active: boolean | null;
};

export type OrderEmployerOption = {
  id: number;
  name: string | null;
  email: string | null;
  mobile: string | null;
};

export type AdminOrder = {
  orderKey: string;
  orderRecordId: number | null;
  paymentRecordId: number | null;
  order_id: string | null;
  payment_order_id: string | null;
  employer_id: number | null;
  employer_name: string | null;
  employer_email: string | null;
  employer_mobile: string | null;
  order_package_id: number | null;
  order_package_name: string | null;
  order_package_price: number;
  order_package_gst: number;
  coupon_used: string | null;
  refferal_point: number;
  value_of_id: number;
  payment_status: string | null;
  original_payment_price: number;
  package_id: number | null;
  payment_type: string | null;
  payment_gst: number;
  payment_total_ammount: number;
  payment_ammount_without_gst: number;
  payment_ammount_with_offer: number;
  offer_taken: number;
  payment_ammount: number;
  is_replacement_activate: boolean | null;
  contact_take: number;
  payment_initated_date: string | null;
  payment_expiry_date: string | null;
  metadata: unknown;
  created_at: string | null;
  updated_at: string | null;
  provider: {
    rzp_payment_id: string | null;
    rzp_order_id: string | null;
    rzp_signature: string | null;
    rzp_status: string | null;
    rzp_method: string | null;
  };
};

export type AdminOrderRow = {
  order_key: string;
  order_record_id: number | null;
  payment_record_id: number | null;
  order_id: string | null;
  payment_order_id: string | null;
  employer_id: number | null;
  employer_name: string | null;
  employer_email: string | null;
  employer_mobile: string | null;
  order_package_id: number | null;
  order_package_name: string | null;
  order_package_price: unknown;
  order_package_gst: unknown;
  coupon_used: string | null;
  refferal_point: unknown;
  value_of_id: unknown;
  payment_status: string | null;
  original_payment_price: unknown;
  package_id: number | null;
  payment_type: string | null;
  payment_gst: unknown;
  payment_total_ammount: unknown;
  payment_ammount_without_gst: unknown;
  payment_ammount_with_offer: unknown;
  offer_taken: unknown;
  payment_ammount: unknown;
  is_replacement_activate: boolean | null;
  contact_take: unknown;
  payment_initated_date: Date | string | null;
  payment_expiry_date: Date | string | null;
  metadata: unknown;
  created_at: Date | string | null;
  updated_at: Date | string | null;
  rzp_payment_id: string | null;
  rzp_order_id: string | null;
  rzp_signature: string | null;
  rzp_status: string | null;
  rzp_method: string | null;
};

export type OrderGeneratedRecord = {
  id: number;
  order_id: string;
  employee_id: number | null;
  order_package_id: number | null;
  order_package_name: string | null;
  order_package_price: unknown;
  order_package_gst: unknown;
  order_package_created_at: Date | string | null;
  coupon_used: string | null;
  refferal_point: unknown;
  value_of_id: unknown;
};

export type PaymentDetailsRecord = {
  id: number;
  payment_order_id: string;
  employer_id: number | null;
  payment_status: string | null;
  original_payment_price: unknown;
  package_id: number | null;
  payment_type: string | null;
  payment_gst: unknown;
  payment_total_ammount: unknown;
  payment_ammount_without_gst: unknown;
  payment_ammount_with_offer: unknown;
  offer_taken: unknown;
  payment_ammount: unknown;
  is_replacement_activate: boolean | null;
  contact_take: unknown;
  payment_initated_date: Date | string | null;
  payment_expiry_date: Date | string | null;
  metadata: unknown;
  employer_mobile: string | null;
  rzp_payment_id: string | null;
  rzp_order_id: string | null;
  rzp_signature: string | null;
  rzp_status: string | null;
  rzp_method: string | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
};

export type OrdersPagination = {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
};

export type OrdersListResponseData = {
  orders: AdminOrder[];
  packages: OrderPackageOption[];
  employers: OrderEmployerOption[];
  paymentStatuses: string[];
  pagination: OrdersPagination;
};

export function mapAdminOrderRow(row: AdminOrderRow): AdminOrder {
  return {
    orderKey: row.order_key,
    orderRecordId: row.order_record_id,
    paymentRecordId: row.payment_record_id,
    order_id: row.order_id,
    payment_order_id: row.payment_order_id,
    employer_id: row.employer_id,
    employer_name: row.employer_name,
    employer_email: row.employer_email,
    employer_mobile: row.employer_mobile,
    order_package_id: row.order_package_id,
    order_package_name: row.order_package_name,
    order_package_price: toNumber(row.order_package_price),
    order_package_gst: toNumber(row.order_package_gst),
    coupon_used: row.coupon_used,
    refferal_point: toNumber(row.refferal_point),
    value_of_id: toNumber(row.value_of_id),
    payment_status: row.payment_status,
    original_payment_price: toNumber(row.original_payment_price),
    package_id: row.package_id,
    payment_type: row.payment_type,
    payment_gst: toNumber(row.payment_gst),
    payment_total_ammount: toNumber(row.payment_total_ammount),
    payment_ammount_without_gst: toNumber(row.payment_ammount_without_gst),
    payment_ammount_with_offer: toNumber(row.payment_ammount_with_offer),
    offer_taken: toNumber(row.offer_taken),
    payment_ammount: toNumber(row.payment_ammount),
    is_replacement_activate: row.is_replacement_activate,
    contact_take: toNumber(row.contact_take),
    payment_initated_date: toIso(row.payment_initated_date),
    payment_expiry_date: toIso(row.payment_expiry_date),
    metadata: row.metadata,
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
    provider: {
      rzp_payment_id: row.rzp_payment_id,
      rzp_order_id: row.rzp_order_id,
      rzp_signature: row.rzp_signature,
      rzp_status: row.rzp_status,
      rzp_method: row.rzp_method,
    },
  };
}

export function combineOrderRecords({
  employer,
  order,
  payment,
}: {
  employer?: OrderEmployerOption | null;
  order?: OrderGeneratedRecord | null;
  payment?: PaymentDetailsRecord | null;
}): AdminOrder {
  const orderKey = order?.order_id ?? payment?.payment_order_id ?? "";

  return mapAdminOrderRow({
    order_key: orderKey,
    order_record_id: order?.id ?? null,
    payment_record_id: payment?.id ?? null,
    order_id: order?.order_id ?? null,
    payment_order_id: payment?.payment_order_id ?? null,
    employer_id: order?.employee_id ?? payment?.employer_id ?? null,
    employer_name: employer?.name ?? null,
    employer_email: employer?.email ?? null,
    employer_mobile: employer?.mobile ?? payment?.employer_mobile ?? null,
    order_package_id: order?.order_package_id ?? null,
    order_package_name: order?.order_package_name ?? null,
    order_package_price: order?.order_package_price ?? null,
    order_package_gst: order?.order_package_gst ?? null,
    coupon_used: order?.coupon_used ?? null,
    refferal_point: order?.refferal_point ?? null,
    value_of_id: order?.value_of_id ?? null,
    payment_status: payment?.payment_status ?? null,
    original_payment_price: payment?.original_payment_price ?? null,
    package_id: payment?.package_id ?? null,
    payment_type: payment?.payment_type ?? null,
    payment_gst: payment?.payment_gst ?? null,
    payment_total_ammount: payment?.payment_total_ammount ?? null,
    payment_ammount_without_gst: payment?.payment_ammount_without_gst ?? null,
    payment_ammount_with_offer: payment?.payment_ammount_with_offer ?? null,
    offer_taken: payment?.offer_taken ?? null,
    payment_ammount: payment?.payment_ammount ?? null,
    is_replacement_activate: payment?.is_replacement_activate ?? null,
    contact_take: payment?.contact_take ?? null,
    payment_initated_date: payment?.payment_initated_date ?? null,
    payment_expiry_date: payment?.payment_expiry_date ?? null,
    metadata: payment?.metadata ?? null,
    created_at: payment?.created_at ?? order?.order_package_created_at ?? null,
    updated_at: payment?.updated_at ?? null,
    rzp_payment_id: payment?.rzp_payment_id ?? null,
    rzp_order_id: payment?.rzp_order_id ?? null,
    rzp_signature: payment?.rzp_signature ?? null,
    rzp_status: payment?.rzp_status ?? null,
    rzp_method: payment?.rzp_method ?? null,
  });
}

export function calculateOrderAmounts(basePrice: number, gstPercentage: number, discountAmount: number) {
  const payment_gst = roundMoney((basePrice * gstPercentage) / 100);
  const payment_total_ammount = roundMoney(basePrice + payment_gst);
  const payment_ammount_with_offer = roundMoney(Math.max(payment_total_ammount - discountAmount, 0));

  return {
    payment_gst,
    payment_total_ammount,
    payment_ammount_with_offer,
  };
}

export function parseDate(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toOptionalString(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function toNonNegativeNumber(value: unknown, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toNumber(value: unknown) {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toIso(value: Date | string | null) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
