import { z } from "zod";

// SQLite doesn't support Prisma enums, so we define them as string literal unions
const GenderPreference = { BOYS: "BOYS", GIRLS: "GIRLS", COED: "COED" } as const;
const FoodOption = { NONE: "NONE", BREAKFAST_ONLY: "BREAKFAST_ONLY", TWO_MEALS: "TWO_MEALS", THREE_MEALS: "THREE_MEALS" } as const;
const SharingType = { SINGLE: "SINGLE", DOUBLE: "DOUBLE", TRIPLE: "TRIPLE", FOUR_PLUS: "FOUR_PLUS" } as const;
const TicketCategory = { PLUMBING: "PLUMBING", ELECTRICAL: "ELECTRICAL", WIFI_INTERNET: "WIFI_INTERNET", CLEANING: "CLEANING", FOOD_QUALITY: "FOOD_QUALITY", SECURITY: "SECURITY", OTHER: "OTHER" } as const;

// Auth schemas
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(60),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^[0-9+()-\s]{10,15}$/, "Invalid phone number format").optional(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  role: z.enum(["CUSTOMER_TENANT", "PG_OWNER"]).default("CUSTOMER_TENANT"),
  companyName: z.string().optional(),
  
  // Tenant KYC details
  idProofType: z.string().optional(),
  idProofNumber: z.string().optional(),
  emergencyContact: z.string().optional(),
  idProofDocumentUrl: z.string().optional(),
  tcAccepted: z.boolean().optional(),
  tcVersion: z.string().optional(),
  tcAcceptedAt: z.string().optional(),

  // Owner KYC details
  panNumber: z.string().optional(),
  gstNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIfscCode: z.string().optional(),
  kycDocUrl: z.string().optional(),

  // Rent home / PG Property Details (during owner signup)
  propertyName: z.string().optional(),
  propertyDescription: z.string().optional(),
  propertyType: z.enum(["PG", "RENTED_ROOM", "FLAT", "HOSTEL"]).default("PG"),
  genderPreference: z.enum(["BOYS", "GIRLS", "COED"]).default("COED"),
  foodOption: z.enum(["NONE", "BREAKFAST_ONLY", "TWO_MEALS", "THREE_MEALS"]).default("THREE_MEALS"),
  noticePeriodDays: z.number().optional().default(30),
  gateClosingTime: z.string().optional().default("22:30"),
  startingRent: z.number().optional().default(7500),
  securityDeposit: z.number().optional().default(10000),
  maintenanceCharges: z.number().optional().default(0),
  electricityCharges: z.string().optional().default("As per sub-meter consumption"),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  landmark: z.string().optional(),
  locality: z.string().optional(),
  area: z.string().optional(),
  city: z.string().optional().default("Bangalore"),
  state: z.string().optional().default("Karnataka"),
  pincode: z.string().optional(),
  latitude: z.number().optional().default(12.9716),
  longitude: z.number().optional().default(77.5946),
  amenityIds: z.array(z.string()).optional().default([]),
  images: z.array(z.string()).optional().default([]),
  propertyDocUrl: z.string().optional(),
  rooms: z
    .array(
      z.object({
        roomNumber: z.string().min(1, "Room number is required"),
        floorNumber: z.number().int().default(0),
        sharingType: z.enum(["SINGLE", "DOUBLE", "TRIPLE", "FOUR_PLUS"]).default("DOUBLE"),
        bedCount: z.number().int().min(1).max(20).default(2),
        monthlyRent: z.number().positive("Monthly rent must be positive"),
        securityDeposit: z.number().nonnegative().optional().default(0),
        hasAttachedBath: z.boolean().default(false),
        hasBalcony: z.boolean().default(false),
        hasAirCondition: z.boolean().default(false),
      })
    )
    .optional(),
  menuItems: z
    .object({
      breakfast: z.array(z.string()).optional().default([]),
      lunch: z.array(z.string()).optional().default([]),
      dinner: z.array(z.string()).optional().default([]),
      snacks: z.array(z.string()).optional().default([]),
    })
    .optional(),
});

export const loginSchema = z.object({
  email: z.string().min(3, "Email or Mobile number is required"),
  password: z.string().min(1, "Password is required"),
});

// Property schemas
export const createPropertySchema = z.object({
  name: z.string().min(3, "Property name must be at least 3 characters").max(100),
  description: z.string().min(20, "Please provide a detailed description (min 20 characters)"),
  propertyType: z.enum(["PG", "RENTED_ROOM", "FLAT", "HOSTEL"]).default("PG"),
  genderPreference: z.nativeEnum(GenderPreference),
  foodOption: z.nativeEnum(FoodOption).default(FoodOption.NONE),
  noticePeriodDays: z.number().int().min(0).max(90).default(30),
  gateClosingTime: z.string().optional(),
  rules: z.array(z.string()).default([]),
  startingRent: z.number().positive("Starting rent must be greater than 0"),
  securityDeposit: z.number().nonnegative(),
  maintenanceCharges: z.number().nonnegative().default(0),
  electricityCharges: z.string().default("As per sub-meter consumption"),
  address: z.object({
    addressLine1: z.string().min(5),
    addressLine2: z.string().optional(),
    landmark: z.string().optional(),
    locality: z.string().min(2),
    area: z.string().optional(),
    city: z.string().min(2),
    state: z.string().min(2),
    pincode: z.string().regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit Indian PIN code"),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    googlePlaceId: z.string().optional(),
  }),
  amenityIds: z.array(z.string()).default([]),
  images: z.array(z.string().url()).min(1, "At least 1 property photo is required"),
});

// Room and Bed schema
export const createRoomSchema = z.object({
  propertyId: z.string(),
  roomNumber: z.string().min(1),
  floorNumber: z.number().int().default(0),
  sharingType: z.nativeEnum(SharingType),
  monthlyRent: z.number().positive(),
  securityDeposit: z.number().nonnegative(),
  hasAttachedBath: z.boolean().default(false),
  hasBalcony: z.boolean().default(false),
  hasAirCondition: z.boolean().default(false),
  bedCount: z.number().int().min(1).max(8),
});

// Virtual Tour schema
export const createVirtualTourSchema = z.object({
  propertyId: z.string(),
  roomId: z.string().optional(),
  title: z.string().min(2),
  assetType: z.enum(["PANORAMA_360", "GLTF_3D"]),
  assetUrl: z.string().url(),
  hotspotsJson: z.any().optional(),
});

// Booking schema
export const createBookingSchema = z.object({
  propertyId: z.string(),
  roomId: z.string(),
  bedId: z.string().optional(),
  checkInDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Valid ISO check-in date is required",
  }),
});

// Payment order & verify schemas
export const createPaymentOrderSchema = z.object({
  bookingId: z.string().optional(),
  invoiceId: z.string().optional(),
  amount: z.number().positive(),
  customerMobile: z.string().optional(),
  paymentType: z.enum([
    "BOOKING_ADVANCE",
    "SECURITY_DEPOSIT",
    "MONTHLY_RENT",
    "MAINTENANCE_FEE",
    "PENALTY",
  ]),
});

export const verifyPaymentSchema = z.object({
  upiOrderReference: z.string(),
  bookingId: z.string().optional(),
  invoiceId: z.string().optional(),
});

// Distance calculation schema
export const calculateDistanceSchema = z.object({
  originLat: z.number().min(-90).max(90),
  originLng: z.number().min(-180).max(180),
  destLat: z.number().min(-90).max(90),
  destLng: z.number().min(-180).max(180),
  mode: z.enum(["driving", "walking", "transit", "bicycling"]).default("driving"),
});

// Maintenance Request schema
export const createMaintenanceRequestSchema = z.object({
  propertyId: z.string().optional(),
  category: z.nativeEnum(TicketCategory).or(z.string()),
  title: z.string().min(2),
  description: z.string().min(2),
  photos: z.array(z.string()).default([]),
});

// Review schema
export const createReviewSchema = z.object({
  propertyId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10),
  photos: z.array(z.string().url()).default([]),
});
