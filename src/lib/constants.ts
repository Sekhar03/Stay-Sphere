/**
 * Shared string-literal enum constants for StaySphere.
 *
 * SQLite does not support native Prisma enums so the schema uses plain
 * String fields.  These constants keep the rest of the codebase type-safe
 * without relying on generated enum types from @prisma/client.
 */

// ── User Roles ──────────────────────────────────────────────────
export const Role = {
  CUSTOMER_TENANT: "CUSTOMER_TENANT",
  PG_OWNER: "PG_OWNER",
  PG_STAFF: "PG_STAFF",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

// ── Staff Sub-Roles ─────────────────────────────────────────────
export const StaffRole = {
  PROPERTY_MANAGER: "PROPERTY_MANAGER",
  RECEPTIONIST: "RECEPTIONIST",
  ACCOUNTANT: "ACCOUNTANT",
  MAINTENANCE_STAFF: "MAINTENANCE_STAFF",
  CUSTOM: "CUSTOM",
} as const;
export type StaffRole = (typeof StaffRole)[keyof typeof StaffRole];

// ── Granular Permissions ────────────────────────────────────────
export const Permissions = {
  // Properties & Rooms
  PROPERTY_READ: "property.read",
  PROPERTY_UPDATE: "property.update",
  ROOM_READ: "room.read",
  ROOM_UPDATE: "room.update",
  BED_UPDATE: "bed.update",

  // Tenants & Bookings
  TENANT_READ: "tenant.read",
  TENANT_CREATE: "tenant.create",
  TENANT_UPDATE: "tenant.update",
  BOOKING_READ: "booking.read",
  BOOKING_APPROVE: "booking.approve",
  BOOKING_REJECT: "booking.reject",
  BOOKING_CHECKIN: "booking.checkin",
  BOOKING_CHECKOUT: "booking.checkout",

  // Rent & Payments
  RENT_READ: "rent.read",
  RENT_COLLECT: "rent.collect",
  RENT_RECEIPT_DOWNLOAD: "rent.receipt.download",

  // Maintenance & Complaints
  MAINTENANCE_READ: "maintenance.read",
  MAINTENANCE_UPDATE: "maintenance.update",
  MAINTENANCE_ASSIGN: "maintenance.assign",

  // Announcements
  ANNOUNCEMENT_READ: "announcement.read",
  ANNOUNCEMENT_CREATE: "announcement.create",

  // Staff & Admin
  STAFF_MANAGE: "staff.manage",
  ADMIN_FULL: "admin.full",
} as const;
export type Permission = (typeof Permissions)[keyof typeof Permissions];

export const STAFF_ROLE_PERMISSIONS: Record<StaffRole, string[]> = {
  PROPERTY_MANAGER: [
    Permissions.PROPERTY_READ,
    Permissions.ROOM_READ,
    Permissions.BED_UPDATE,
    Permissions.TENANT_READ,
    Permissions.TENANT_CREATE,
    Permissions.TENANT_UPDATE,
    Permissions.BOOKING_READ,
    Permissions.BOOKING_APPROVE,
    Permissions.BOOKING_REJECT,
    Permissions.BOOKING_CHECKIN,
    Permissions.BOOKING_CHECKOUT,
    Permissions.MAINTENANCE_READ,
    Permissions.MAINTENANCE_UPDATE,
    Permissions.ANNOUNCEMENT_READ,
    Permissions.ANNOUNCEMENT_CREATE,
  ],
  RECEPTIONIST: [
    Permissions.PROPERTY_READ,
    Permissions.ROOM_READ,
    Permissions.TENANT_READ,
    Permissions.TENANT_CREATE,
    Permissions.TENANT_UPDATE,
    Permissions.BOOKING_READ,
    Permissions.BOOKING_CHECKIN,
    Permissions.BOOKING_CHECKOUT,
    Permissions.ANNOUNCEMENT_READ,
  ],
  ACCOUNTANT: [
    Permissions.RENT_READ,
    Permissions.RENT_COLLECT,
    Permissions.RENT_RECEIPT_DOWNLOAD,
    Permissions.TENANT_READ,
    Permissions.BOOKING_READ,
  ],
  MAINTENANCE_STAFF: [
    Permissions.MAINTENANCE_READ,
    Permissions.MAINTENANCE_UPDATE,
    Permissions.ANNOUNCEMENT_READ,
  ],
  CUSTOM: [],
};

// ── Property ────────────────────────────────────────────────────
export const GenderPreference = {
  BOYS: "BOYS",
  GIRLS: "GIRLS",
  COED: "COED",
} as const;
export type GenderPreference = (typeof GenderPreference)[keyof typeof GenderPreference];

export const FoodOption = {
  NONE: "NONE",
  BREAKFAST_ONLY: "BREAKFAST_ONLY",
  TWO_MEALS: "TWO_MEALS",
  THREE_MEALS: "THREE_MEALS",
} as const;
export type FoodOption = (typeof FoodOption)[keyof typeof FoodOption];

export const PropertyVerificationStatus = {
  DRAFT: "DRAFT",
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;
export type PropertyVerificationStatus = (typeof PropertyVerificationStatus)[keyof typeof PropertyVerificationStatus];

// ── Room / Bed ──────────────────────────────────────────────────
export const SharingType = {
  SINGLE: "SINGLE",
  DOUBLE: "DOUBLE",
  TRIPLE: "TRIPLE",
  FOUR_PLUS: "FOUR_PLUS",
} as const;
export type SharingType = (typeof SharingType)[keyof typeof SharingType];

export const BedStatus = {
  AVAILABLE: "AVAILABLE",
  RESERVED: "RESERVED",
  OCCUPIED: "OCCUPIED",
  NOTICE: "NOTICE",
  UNDER_MAINTENANCE: "UNDER_MAINTENANCE",
} as const;
export type BedStatus = (typeof BedStatus)[keyof typeof BedStatus];

// ── Booking ─────────────────────────────────────────────────────
export const BookingStatus = {
  PENDING: "PENDING",
  AWAITING_PAYMENT: "AWAITING_PAYMENT",
  CONFIRMED: "CONFIRMED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
  REFUND_PENDING: "REFUND_PENDING",
  REFUNDED: "REFUNDED",
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

// ── Payment ─────────────────────────────────────────────────────
export const PaymentType = {
  BOOKING_ADVANCE: "BOOKING_ADVANCE",
  SECURITY_DEPOSIT: "SECURITY_DEPOSIT",
  MONTHLY_RENT: "MONTHLY_RENT",
  MAINTENANCE_FEE: "MAINTENANCE_FEE",
  PENALTY: "PENALTY",
} as const;
export type PaymentType = (typeof PaymentType)[keyof typeof PaymentType];

export const PaymentMethod = {
  RAZORPAY: "RAZORPAY",
  UPI_OFFLINE: "UPI_OFFLINE",
  CASH: "CASH",
  BANK_TRANSFER: "BANK_TRANSFER",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PaymentStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

// ── Rent ────────────────────────────────────────────────────────
export const RentScheduleStatus = {
  UPCOMING: "UPCOMING",
  DUE: "DUE",
  OVERDUE: "OVERDUE",
  PAID: "PAID",
  WAIVED: "WAIVED",
} as const;
export type RentScheduleStatus = (typeof RentScheduleStatus)[keyof typeof RentScheduleStatus];

// ── Maintenance / Tickets ───────────────────────────────────────
export const TicketCategory = {
  PLUMBING: "PLUMBING",
  ELECTRICAL: "ELECTRICAL",
  WIFI_INTERNET: "WIFI_INTERNET",
  CLEANING: "CLEANING",
  FOOD_QUALITY: "FOOD_QUALITY",
  SECURITY: "SECURITY",
  OTHER: "OTHER",
} as const;
export type TicketCategory = (typeof TicketCategory)[keyof typeof TicketCategory];

export const TicketStatus = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
} as const;
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];
