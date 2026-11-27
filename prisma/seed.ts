import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Section 2.9 Security Enforcement: Seed script strictly forbidden in production
  if (process.env.NODE_ENV === "production") {
    console.error("🛑 DANGER: Running demo/test seed script is strictly blocked in production (NODE_ENV=production). Aborting.");
    process.exit(1);
  }

  console.log("🌱 Cleaning old records and starting Bhubaneswar master seed...");

  // Clear existing transactional & operational data in safe order
  await prisma.auditLog.deleteMany({});
  await prisma.emailLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.maintenanceRequest.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.rentSchedule.deleteMany({});
  await prisma.tenantAllocation.deleteMany({});
  await prisma.bookingStatusHistory.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.bed.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.virtualTour.deleteMany({});
  await prisma.propertyMedia.deleteMany({});
  await prisma.propertyAmenity.deleteMany({});
  await prisma.propertyAddress.deleteMany({});
  await prisma.staffProfile.deleteMany({});
  await prisma.pGProperty.deleteMany({});
  await prisma.ownerProfile.deleteMany({});
  await prisma.tenantProfile.deleteMany({});
  await prisma.userSession.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("🧹 Cleaned database tables.");

  // 1. Initialize Platform Settings
  await prisma.platformSettings.upsert({
    where: { id: "global" },
    update: {
      platformFeePercent: 2.5,
      gstPercentage: 18.0,
      supportEmail: "support@staysphere.in",
      supportPhone: "+91 674 2568800",
      enableEmailAlerts: true,
    },
    create: {
      id: "global",
      platformFeePercent: 2.5,
      gstPercentage: 18.0,
      supportEmail: "support@staysphere.in",
      supportPhone: "+91 674 2568800",
      enableEmailAlerts: true,
    },
  });
  console.log("✅ Initialized Platform Settings");

  // 2. Standard PG Amenities Catalog
  const amenities = [
    { name: "300 Mbps High-Speed Wi-Fi", code: "WIFI", iconName: "Wifi", category: "UTILITY" },
    { name: "Split Air Conditioning", code: "AC", iconName: "AirVent", category: "COMFORT" },
    { name: "Three Homestyle Odia & North Indian Meals", code: "MEALS", iconName: "Utensils", category: "COMFORT" },
    { name: "100% DG Power Backup 24/7", code: "POWER_BACKUP", iconName: "Zap", category: "UTILITY" },
    { name: "CCTV Surveillance & Security Guard", code: "CCTV", iconName: "ShieldCheck", category: "SAFETY" },
    { name: "Biometric Access Control", code: "BIOMETRIC", iconName: "Fingerprint", category: "SAFETY" },
    { name: "Automatic Washing Machine & Laundry", code: "LAUNDRY", iconName: "Shirt", category: "UTILITY" },
    { name: "Multi-Stage RO Mineral Water", code: "RO_WATER", iconName: "Droplets", category: "UTILITY" },
    { name: "Daily Professional Housekeeping", code: "HOUSEKEEPING", iconName: "Sparkles", category: "UTILITY" },
    { name: "Ergonomic Study Desk & Chair", code: "STUDY_DESK", iconName: "BookOpen", category: "COMFORT" },
    { name: "Refrigerator & Microwave Oven", code: "APPLIANCES", iconName: "Refrigerator", category: "UTILITY" },
    { name: "Covered Two-Wheeler & Car Parking", code: "PARKING", iconName: "Car", category: "UTILITY" },
    { name: "Rooftop Common Lounge & Terrace", code: "LOUNGE", iconName: "Coffee", category: "COMFORT" },
    { name: "Fire Safety & First Aid Station", code: "FIRE_SAFETY", iconName: "Flame", category: "SAFETY" },
  ];

  const amenityMap = new Map<string, string>();
  for (const amenity of amenities) {
    const created = await prisma.amenity.upsert({
      where: { code: amenity.code },
      update: { name: amenity.name, iconName: amenity.iconName, category: amenity.category },
      create: amenity,
    });
    amenityMap.set(amenity.code, created.id);
  }
  console.log(`✅ Seeded ${amenities.length} platform amenities`);

  // Shared Password Hashes
  const salt = await bcrypt.genSalt(12);
  const demoPasswordHash = await bcrypt.hash("StaySphere@2026!", salt);
  const adminPasswordHash = await bcrypt.hash("AdminStaySphere2026!#", salt);

  // 3. Create Super Admin
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@staysphere.in",
      phone: "+919999999999",
      name: "Super Administrator",
      passwordHash: adminPasswordHash,
      role: "SUPER_ADMIN",
      isActive: true,
      emailVerified: new Date(),
    },
  });
  console.log(`✅ Super Admin created: ${adminUser.email}`);

  // 4. Create PG Owners in Bhubaneswar
  // Owner 1: Kalinga Co-Living & Hostels
  const ownerUser1 = await prisma.user.create({
    data: {
      email: "owner1@staysphere.in",
      phone: "+919861000001",
      name: "Debashis Mohanty",
      passwordHash: demoPasswordHash,
      role: "PG_OWNER",
      isActive: true,
      emailVerified: new Date(),
    },
  });

  const ownerProfile1 = await prisma.ownerProfile.create({
    data: {
      userId: ownerUser1.id,
      companyName: "Kalinga Co-Living & Hostels Pvt Ltd",
      bankAccountNumber: "50100492817281",
      bankIfscCode: "HDFC0001288",
      bankAccountName: "Kalinga Co-Living & Hostels Pvt Ltd",
      panNumber: "ALOPM2918K",
      gstNumber: "21ALOPM2918K1Z3",
      isKycVerified: true,
    },
  });

  // Owner 2: Utkal Prime Stays
  const ownerUser2 = await prisma.user.create({
    data: {
      email: "owner2@staysphere.in",
      phone: "+919861000002",
      name: "Manoranjan Pradhan",
      passwordHash: demoPasswordHash,
      role: "PG_OWNER",
      isActive: true,
      emailVerified: new Date(),
    },
  });

  const ownerProfile2 = await prisma.ownerProfile.create({
    data: {
      userId: ownerUser2.id,
      companyName: "Utkal Prime Stays & PG Residences",
      bankAccountNumber: "004901582910",
      bankIfscCode: "ICIC0000049",
      bankAccountName: "Utkal Prime Stays",
      panNumber: "BKJPP8921J",
      gstNumber: "21BKJPP8921J1Z8",
      isKycVerified: true,
    },
  });

  // Owner 3: Temple City Executive Homes
  const ownerUser3 = await prisma.user.create({
    data: {
      email: "owner3@staysphere.in",
      phone: "+919861000003",
      name: "Rashmita Senapati",
      passwordHash: demoPasswordHash,
      role: "PG_OWNER",
      isActive: true,
      emailVerified: new Date(),
    },
  });

  const ownerProfile3 = await prisma.ownerProfile.create({
    data: {
      userId: ownerUser3.id,
      companyName: "Temple City Executive Homes",
      bankAccountNumber: "38291029481",
      bankIfscCode: "SBIN0001023",
      bankAccountName: "Rashmita Senapati",
      panNumber: "CJQPS1920L",
      gstNumber: "21CJQPS1920L1Z2",
      isKycVerified: true,
    },
  });

  console.log("✅ Created 3 PG Owner Organizations in Bhubaneswar");

  // 5. Create 5 Verified PG Properties in Bhubaneswar
  // Property 1: Patia (KIIT / Infocity Hub)
  const propPatia = await prisma.pGProperty.create({
    data: {
      ownerId: ownerProfile1.id,
      slug: "staysphere-royal-palms-patia-bhubaneswar",
      name: "StaySphere Royal Palms - Patia (KIIT & Infocity Hub)",
      description: "Luxury coliving property situated right on Infocity Avenue, 3 minutes from KIIT University and TCS/Infosys offices. Features air-conditioned suites, 3-times homestyle Odia & North Indian meals, high-speed 300 Mbps Wi-Fi, 24/7 power backup, and rooftop cafe lounge.",
      genderPreference: "COED",
      foodOption: "THREE_MEALS",
      noticePeriodDays: 30,
      gateClosingTime: "11:00 PM",
      rules: JSON.stringify([
        "Strictly no smoking or consumption of alcohol inside rooms",
        "Visitors allowed in rooftop common lounge until 8:30 PM",
        "Quiet study hours observed from 10:30 PM to 6:00 AM",
        "Biometric punch required for entry after 10:00 PM",
        "Advance gate pass required via portal for late night check-ins",
      ]),
      startingRent: 8500,
      securityDeposit: 17000,
      maintenanceCharges: 500,
      electricityCharges: "As per individual room sub-meter consumption",
      isPublished: true,
      verificationStatus: "APPROVED",
      address: {
        create: {
          addressLine1: "Plot 108/B, Infocity Avenue",
          addressLine2: "Opposite Silicon West Gate",
          locality: "Patia",
          area: "KIIT Square / Infocity",
          city: "Bhubaneswar",
          state: "Odisha",
          pincode: "751024",
          latitude: 20.3533,
          longitude: 85.8195,
          googlePlaceId: "ChIJ_z_bhumane_Patia_Bhubaneswar",
        },
      },
      media: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80",
            caption: "Cozy Modern Living Room & Study Space",
            isCover: true,
            sortOrder: 0,
          },
          {
            url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80",
            caption: "Single Occupancy Bedroom with AC",
            isCover: false,
            sortOrder: 1,
          },
          {
            url: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80",
            caption: "Spacious Double Sharing Room",
            isCover: false,
            sortOrder: 2,
          },
        ],
      },
      virtualTours: {
        create: [
          {
            title: "360° Panoramic View - Executive Single Suite",
            assetUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=2000&q=80",
            assetType: "PANORAMA_360",
            sortOrder: 0,
          },
        ],
      },
      rooms: {
        create: [
          {
            roomNumber: "101",
            floorNumber: 1,
            sharingType: "SINGLE",
            monthlyRent: 12000,
            securityDeposit: 24000,
            beds: {
              create: [{ bedNumber: "101-A", status: "OCCUPIED" }],
            },
          },
          {
            roomNumber: "102",
            floorNumber: 1,
            sharingType: "DOUBLE",
            monthlyRent: 8500,
            securityDeposit: 17000,
            beds: {
              create: [
                { bedNumber: "102-A", status: "AVAILABLE" },
                { bedNumber: "102-B", status: "AVAILABLE" },
              ],
            },
          },
          {
            roomNumber: "201",
            floorNumber: 2,
            sharingType: "DOUBLE",
            monthlyRent: 8500,
            securityDeposit: 17000,
            beds: {
              create: [
                { bedNumber: "201-A", status: "OCCUPIED" },
                { bedNumber: "201-B", status: "AVAILABLE" },
              ],
            },
          },
          {
            roomNumber: "202",
            floorNumber: 2,
            sharingType: "TRIPLE",
            monthlyRent: 6800,
            securityDeposit: 13600,
            beds: {
              create: [
                { bedNumber: "202-A", status: "AVAILABLE" },
                { bedNumber: "202-B", status: "AVAILABLE" },
                { bedNumber: "202-C", status: "AVAILABLE" },
              ],
            },
          },
        ],
      },
    },
  });

  // Property 2: Chandrasekharpur (near Silicon Institute / TCS)
  const propCSPur = await prisma.pGProperty.create({
    data: {
      ownerId: ownerProfile1.id,
      slug: "staysphere-executive-living-chandrasekharpur",
      name: "StaySphere Executive Living - Chandrasekharpur",
      description: "Dedicated boys coliving residence in the serene residential neighborhood of Sailashree Vihar, Chandrasekharpur. Close to Silicon Institute and corporate IT clusters with high-speed internet and pure vegetarian & non-vegetarian food options.",
      genderPreference: "BOYS",
      foodOption: "TWO_MEALS",
      noticePeriodDays: 30,
      gateClosingTime: "10:30 PM",
      rules: JSON.stringify([
        "Strict adherence to quiet hours after 10:30 PM",
        "Two-wheeler parking strictly in designated basement slots",
        "No outside guests allowed in bedrooms overnight",
      ]),
      startingRent: 7500,
      securityDeposit: 15000,
      maintenanceCharges: 400,
      electricityCharges: "Included up to 50 units/month",
      isPublished: true,
      verificationStatus: "APPROVED",
      address: {
        create: {
          addressLine1: "HIG-45, Phase-VII",
          locality: "Chandrasekharpur",
          area: "Sailashree Vihar",
          city: "Bhubaneswar",
          state: "Odisha",
          pincode: "751021",
          latitude: 20.3242,
          longitude: 85.8164,
        },
      },
      media: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1540518614846-7ede433c4ef8?auto=format&fit=crop&w=1200&q=80",
            caption: "Executive Double Sharing Bedroom",
            isCover: true,
            sortOrder: 0,
          },
          {
            url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
            caption: "Private Study Space & Wardrobe",
            isCover: false,
            sortOrder: 1,
          },
        ],
      },
      virtualTours: {
        create: [
          {
            title: "360° Panoramic View - Double Deluxe Room",
            assetUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=2000&q=80",
            assetType: "PANORAMA_360",
            sortOrder: 0,
          },
        ],
      },
      rooms: {
        create: [
          {
            roomNumber: "201",
            floorNumber: 2,
            sharingType: "SINGLE",
            monthlyRent: 11000,
            securityDeposit: 22000,
            beds: {
              create: [{ bedNumber: "201-A", status: "OCCUPIED" }],
            },
          },
          {
            roomNumber: "202",
            floorNumber: 2,
            sharingType: "DOUBLE",
            monthlyRent: 7500,
            securityDeposit: 15000,
            beds: {
              create: [
                { bedNumber: "202-A", status: "AVAILABLE" },
                { bedNumber: "202-B", status: "AVAILABLE" },
              ],
            },
          },
        ],
      },
    },
  });

  // Property 3: Jayadev Vihar (Near Fortune Tower / Mayfair)
  const propJayadev = await prisma.pGProperty.create({
    data: {
      ownerId: ownerProfile2.id,
      slug: "staysphere-serenity-girls-pg-jayadev-vihar",
      name: "StaySphere Serenity Girls PG - Jayadev Vihar",
      description: "Exclusive premier girls hostel and coliving residence in Jayadev Vihar / IRC Village. 24/7 on-site female warden, biometric gates, CCTV coverage, delicious 3 home meals, power backup, and walking distance to Ekamra Haat, Mayfair and Fortune Tower.",
      genderPreference: "GIRLS",
      foodOption: "THREE_MEALS",
      noticePeriodDays: 30,
      gateClosingTime: "9:30 PM",
      rules: JSON.stringify([
        "24-hour biometric tracking and night curfew at 9:30 PM",
        "Only authorized female visitors and parents permitted in visitor lounge",
        "Zero tolerance policy for noise after 10:00 PM",
      ]),
      startingRent: 9000,
      securityDeposit: 18000,
      maintenanceCharges: 500,
      electricityCharges: "Sub-meter per room",
      isPublished: true,
      verificationStatus: "APPROVED",
      address: {
        create: {
          addressLine1: "N-3/214, IRC Village",
          locality: "Jayadev Vihar",
          area: "Near Ekamra Haat & Fortune Tower",
          city: "Bhubaneswar",
          state: "Odisha",
          pincode: "751015",
          latitude: 20.2981,
          longitude: 85.8239,
        },
      },
      media: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80",
            caption: "Serene Clean Bedroom with Attached Bathroom",
            isCover: true,
            sortOrder: 0,
          },
          {
            url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
            caption: "Dining Hall & Study Hub",
            isCover: false,
            sortOrder: 1,
          },
        ],
      },
      virtualTours: {
        create: [
          {
            title: "360° Panoramic View - Serenity Master Suite",
            assetUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=2000&q=80",
            assetType: "PANORAMA_360",
            sortOrder: 0,
          },
        ],
      },
      rooms: {
        create: [
          {
            roomNumber: "101",
            floorNumber: 1,
            sharingType: "DOUBLE",
            monthlyRent: 9000,
            securityDeposit: 18000,
            beds: {
              create: [
                { bedNumber: "101-A", status: "OCCUPIED" },
                { bedNumber: "101-B", status: "AVAILABLE" },
              ],
            },
          },
          {
            roomNumber: "102",
            floorNumber: 1,
            sharingType: "TRIPLE",
            monthlyRent: 7200,
            securityDeposit: 14400,
            beds: {
              create: [
                { bedNumber: "102-A", status: "AVAILABLE" },
                { bedNumber: "102-B", status: "AVAILABLE" },
                { bedNumber: "102-C", status: "AVAILABLE" },
              ],
            },
          },
        ],
      },
    },
  });

  // Property 4: Khandagiri (Near ITER / Siksha 'O' Anusandhan)
  const propKhandagiri = await prisma.pGProperty.create({
    data: {
      ownerId: ownerProfile2.id,
      slug: "staysphere-scholars-pg-khandagiri",
      name: "StaySphere Scholars PG - Khandagiri (Near ITER SOA)",
      description: "Student-friendly modern paying guest accommodation located right on Jagamara Road, just 400m from ITER Campus-1. High-speed study Wi-Fi, 3 home meals, water purifier, and large motorcycle parking space.",
      genderPreference: "BOYS",
      foodOption: "THREE_MEALS",
      noticePeriodDays: 30,
      gateClosingTime: "10:30 PM",
      rules: JSON.stringify([
        "Study silence mandatory between 9:00 PM and 6:00 AM",
        "Washing machine slots available on alternate days",
        "No electrical appliances (heaters/irons) without permission",
      ]),
      startingRent: 6800,
      securityDeposit: 13600,
      maintenanceCharges: 350,
      electricityCharges: "Included in monthly rent",
      isPublished: true,
      verificationStatus: "APPROVED",
      address: {
        create: {
          addressLine1: "Plot 88, Jagamara Road",
          locality: "Khandagiri",
          area: "Near ITER Campus-1",
          city: "Bhubaneswar",
          state: "Odisha",
          pincode: "751030",
          latitude: 20.2588,
          longitude: 85.7877,
        },
      },
      media: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
            caption: "Spacious Student Room with Dedicated Desks",
            isCover: true,
            sortOrder: 0,
          },
        ],
      },
      virtualTours: {
        create: [
          {
            title: "360° Panoramic View - ITER Scholar Room",
            assetUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=2000&q=80",
            assetType: "PANORAMA_360",
            sortOrder: 0,
          },
        ],
      },
      rooms: {
        create: [
          {
            roomNumber: "102",
            floorNumber: 1,
            sharingType: "DOUBLE",
            monthlyRent: 6800,
            securityDeposit: 13600,
            beds: {
              create: [
                { bedNumber: "102-A", status: "OCCUPIED" },
                { bedNumber: "102-B", status: "AVAILABLE" },
              ],
            },
          },
        ],
      },
    },
  });

  // Property 5: Saheed Nagar (Near Vani Vihar & Utkal University)
  const propSaheedNagar = await prisma.pGProperty.create({
    data: {
      ownerId: ownerProfile3.id,
      slug: "staysphere-urban-nest-saheed-nagar",
      name: "StaySphere Urban Nest - Saheed Nagar (Near Vani Vihar)",
      description: "Cozy co-ed coliving residence in the center of Bhubaneswar. Very near to Vani Vihar, Utkal University, and Janpath shopping avenues. Designed for young working professionals and government civil service aspirants.",
      genderPreference: "COED",
      foodOption: "TWO_MEALS",
      noticePeriodDays: 30,
      gateClosingTime: "11:00 PM",
      rules: JSON.stringify([
        "Quiet library & study lounge available 24/7",
        "Visitors permitted in ground floor lounge",
      ]),
      startingRent: 8000,
      securityDeposit: 16000,
      maintenanceCharges: 400,
      electricityCharges: "Sub-meter per room",
      isPublished: true,
      verificationStatus: "APPROVED",
      address: {
        create: {
          addressLine1: "Plot 24, Maharishi College Road",
          locality: "Saheed Nagar",
          area: "Near Vani Vihar",
          city: "Bhubaneswar",
          state: "Odisha",
          pincode: "751007",
          latitude: 20.2882,
          longitude: 85.8458,
        },
      },
      media: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
            caption: "Modern Urban Living with High Ceilings",
            isCover: true,
            sortOrder: 0,
          },
        ],
      },
      virtualTours: {
        create: [
          {
            title: "360° Panoramic View - Saheed Nagar Deluxe Room",
            assetUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=2000&q=80",
            assetType: "PANORAMA_360",
            sortOrder: 0,
          },
        ],
      },
      rooms: {
        create: [
          {
            roomNumber: "101",
            floorNumber: 1,
            sharingType: "DOUBLE",
            monthlyRent: 8000,
            securityDeposit: 16000,
            beds: {
              create: [
                { bedNumber: "101-A", status: "OCCUPIED" },
                { bedNumber: "101-B", status: "AVAILABLE" },
              ],
            },
          },
        ],
      },
    },
  });

  // Attach amenities to all Bhubaneswar properties
  const allProps = [propPatia, propCSPur, propJayadev, propKhandagiri, propSaheedNagar];
  for (const p of allProps) {
    for (const [code, amenityId] of Array.from(amenityMap.entries())) {
      await prisma.propertyAmenity.create({
        data: {
          propertyId: p.id,
          amenityId,
        },
      });
    }
  }

  console.log("✅ Seeded 5 PG properties in Bhubaneswar with rooms, beds, media and amenities");

  // 6. Create Staff Team for Owner 1 (Kalinga Co-Living)
  const staffPresets = [
    {
      email: "manager@staysphere.in",
      name: "Rajesh Kumar Nayak",
      phone: "+919861111111",
      role: "PROPERTY_MANAGER",
      propertyId: propPatia.id,
      permissions: [
        "property.read",
        "room.read",
        "bed.update",
        "tenant.read",
        "tenant.create",
        "tenant.update",
        "booking.read",
        "booking.approve",
        "booking.reject",
        "booking.checkin",
        "booking.checkout",
        "maintenance.read",
        "maintenance.update",
        "announcement.read",
        "announcement.create",
      ],
    },
    {
      email: "reception@staysphere.in",
      name: "Pooja Priyadarshini",
      phone: "+919861222222",
      role: "RECEPTIONIST",
      propertyId: propPatia.id,
      permissions: [
        "property.read",
        "room.read",
        "tenant.read",
        "tenant.create",
        "tenant.update",
        "booking.read",
        "booking.checkin",
        "booking.checkout",
        "announcement.read",
      ],
    },
    {
      email: "accountant@staysphere.in",
      name: "Amitabh Tripathy",
      phone: "+919861333333",
      role: "ACCOUNTANT",
      propertyId: null, // Scoped to all Owner 1 facilities
      permissions: [
        "rent.read",
        "rent.collect",
        "rent.receipt.download",
        "tenant.read",
        "booking.read",
      ],
    },
    {
      email: "maintenance@staysphere.in",
      name: "Suresh Rao Jena",
      phone: "+919861444444",
      role: "MAINTENANCE_STAFF",
      propertyId: propPatia.id,
      permissions: [
        "maintenance.read",
        "maintenance.update",
        "announcement.read",
      ],
    },
  ];

  for (const s of staffPresets) {
    const sUser = await prisma.user.create({
      data: {
        email: s.email,
        phone: s.phone,
        name: s.name,
        passwordHash: demoPasswordHash,
        role: "PG_STAFF",
        isActive: true,
        emailVerified: new Date(),
      },
    });

    await prisma.staffProfile.create({
      data: {
        userId: sUser.id,
        ownerId: ownerProfile1.id,
        propertyId: s.propertyId,
        staffRole: s.role,
        permissions: JSON.stringify(s.permissions),
        isActive: true,
      },
    });
  }
  console.log("✅ Seeded staff team for Kalinga Co-Living (Patia & Chandrasekharpur)");

  // 7. Seed Tenants in Bhubaneswar
  // Find beds for allocations
  const bedPatia101A = await prisma.bed.findFirst({
    where: { bedNumber: "101-A", room: { propertyId: propPatia.id } },
    include: { room: true },
  });

  const bedCSPur201A = await prisma.bed.findFirst({
    where: { bedNumber: "201-A", room: { propertyId: propCSPur.id } },
    include: { room: true },
  });

  const bedJayadev101A = await prisma.bed.findFirst({
    where: { bedNumber: "101-A", room: { propertyId: propJayadev.id } },
    include: { room: true },
  });

  const bedKhandagiri102A = await prisma.bed.findFirst({
    where: { bedNumber: "102-A", room: { propertyId: propKhandagiri.id } },
    include: { room: true },
  });

  const bedSaheed101A = await prisma.bed.findFirst({
    where: { bedNumber: "101-A", room: { propertyId: propSaheedNagar.id } },
    include: { room: true },
  });

  // Tenant 1: Subhashree Mohanty (Patia)
  const tenantUser1 = await prisma.user.create({
    data: {
      email: "tenant1@staysphere.in",
      phone: "+919777123456",
      name: "Subhashree Mohanty",
      passwordHash: demoPasswordHash,
      role: "CUSTOMER_TENANT",
      isActive: true,
      emailVerified: new Date(),
    },
  });

  const tenantProfile1 = await prisma.tenantProfile.create({
    data: {
      userId: tenantUser1.id,
      emergencyContact: "+919437111222 (Father)",
      idProofType: "AADHAAR",
      idProofNumber: "XXXX-XXXX-8192",
      isKycVerified: true,
      currentBedId: bedPatia101A?.id,
    },
  });

  // Tenant 2: Sourav Dash (Chandrasekharpur)
  const tenantUser2 = await prisma.user.create({
    data: {
      email: "sourav.dash@staysphere.in",
      phone: "+919861234567",
      name: "Sourav Dash",
      passwordHash: demoPasswordHash,
      role: "CUSTOMER_TENANT",
      isActive: true,
      emailVerified: new Date(),
    },
  });

  const tenantProfile2 = await prisma.tenantProfile.create({
    data: {
      userId: tenantUser2.id,
      emergencyContact: "+919437222333",
      idProofType: "PAN",
      isKycVerified: true,
      currentBedId: bedCSPur201A?.id,
    },
  });

  // Tenant 3: Ananya Mishra (Jayadev Vihar)
  const tenantUser3 = await prisma.user.create({
    data: {
      email: "ananya.mishra@staysphere.in",
      phone: "+919937345678",
      name: "Ananya Mishra",
      passwordHash: demoPasswordHash,
      role: "CUSTOMER_TENANT",
      isActive: true,
      emailVerified: new Date(),
    },
  });

  const tenantProfile3 = await prisma.tenantProfile.create({
    data: {
      userId: tenantUser3.id,
      emergencyContact: "+919437333444",
      idProofType: "AADHAAR",
      isKycVerified: true,
      currentBedId: bedJayadev101A?.id,
    },
  });

  // Tenant 4: Rohan Kumar Sahoo (Khandagiri)
  const tenantUser4 = await prisma.user.create({
    data: {
      email: "rohan.sahoo@staysphere.in",
      phone: "+919437456789",
      name: "Rohan Kumar Sahoo",
      passwordHash: demoPasswordHash,
      role: "CUSTOMER_TENANT",
      isActive: true,
      emailVerified: new Date(),
    },
  });

  const tenantProfile4 = await prisma.tenantProfile.create({
    data: {
      userId: tenantUser4.id,
      emergencyContact: "+919437444555",
      idProofType: "COLLEGE_ID",
      isKycVerified: true,
      currentBedId: bedKhandagiri102A?.id,
    },
  });

  // Tenant 5: Ipsita Barik (Saheed Nagar)
  const tenantUser5 = await prisma.user.create({
    data: {
      email: "ipsita.barik@staysphere.in",
      phone: "+917008567890",
      name: "Ipsita Barik",
      passwordHash: demoPasswordHash,
      role: "CUSTOMER_TENANT",
      isActive: true,
      emailVerified: new Date(),
    },
  });

  const tenantProfile5 = await prisma.tenantProfile.create({
    data: {
      userId: tenantUser5.id,
      emergencyContact: "+917008666777",
      idProofType: "PASSPORT",
      isKycVerified: true,
      currentBedId: bedSaheed101A?.id,
    },
  });

  console.log("✅ Seeded 5 Resident Tenants in Bhubaneswar");

  // 8. Tenant Allocations
  if (bedPatia101A) {
    await prisma.tenantAllocation.create({
      data: {
        tenantProfileId: tenantProfile1.id,
        bedId: bedPatia101A.id,
        checkInDate: new Date("2026-08-01"),
        monthlyRent: 12000,
        isActive: true,
      },
    });
  }

  if (bedCSPur201A) {
    await prisma.tenantAllocation.create({
      data: {
        tenantProfileId: tenantProfile2.id,
        bedId: bedCSPur201A.id,
        checkInDate: new Date("2026-09-01"),
        monthlyRent: 11000,
        isActive: true,
      },
    });
  }

  if (bedJayadev101A) {
    await prisma.tenantAllocation.create({
      data: {
        tenantProfileId: tenantProfile3.id,
        bedId: bedJayadev101A.id,
        checkInDate: new Date("2026-09-15"),
        monthlyRent: 9000,
        isActive: true,
      },
    });
  }

  if (bedKhandagiri102A) {
    await prisma.tenantAllocation.create({
      data: {
        tenantProfileId: tenantProfile4.id,
        bedId: bedKhandagiri102A.id,
        checkInDate: new Date("2026-10-01"),
        monthlyRent: 6800,
        isActive: true,
      },
    });
  }

  if (bedSaheed101A) {
    await prisma.tenantAllocation.create({
      data: {
        tenantProfileId: tenantProfile5.id,
        bedId: bedSaheed101A.id,
        checkInDate: new Date("2026-10-15"),
        monthlyRent: 8000,
        isActive: true,
      },
    });
  }

  // 9. Bookings Ledger
  // Booking 1 - Subhashree (Patia) - Confirmed
  const booking1 = await prisma.booking.create({
    data: {
      bookingReference: "BK-BBI-2026-1001",
      propertyId: propPatia.id,
      roomId: bedPatia101A!.roomId,
      bedId: bedPatia101A!.id,
      tenantUserId: tenantUser1.id,
      checkInDate: new Date("2026-08-01"),
      monthlyRent: 12000,
      bookingAmount: 12000,
      securityDeposit: 24000,
      totalPayableNow: 36000,
      status: "CONFIRMED",
    },
  });

  // Booking 2 - Sourav (CSPur) - Confirmed
  await prisma.booking.create({
    data: {
      bookingReference: "BK-BBI-2026-1002",
      propertyId: propCSPur.id,
      roomId: bedCSPur201A!.roomId,
      bedId: bedCSPur201A!.id,
      tenantUserId: tenantUser2.id,
      checkInDate: new Date("2026-09-01"),
      monthlyRent: 11000,
      bookingAmount: 11000,
      securityDeposit: 22000,
      totalPayableNow: 33000,
      status: "CONFIRMED",
    },
  });

  // Booking 3 - Ananya (Jayadev Vihar) - Confirmed
  await prisma.booking.create({
    data: {
      bookingReference: "BK-BBI-2026-1003",
      propertyId: propJayadev.id,
      roomId: bedJayadev101A!.roomId,
      bedId: bedJayadev101A!.id,
      tenantUserId: tenantUser3.id,
      checkInDate: new Date("2026-09-15"),
      monthlyRent: 9000,
      bookingAmount: 9000,
      securityDeposit: 18000,
      totalPayableNow: 27000,
      status: "CONFIRMED",
    },
  });

  // Booking 4 - Pending Booking Request from New Customer
  const prospectUser = await prisma.user.create({
    data: {
      email: "prospect.alok@staysphere.in",
      phone: "+919438999888",
      name: "Alok Kumar Sutar",
      passwordHash: demoPasswordHash,
      role: "CUSTOMER_TENANT",
      isActive: true,
    },
  });

  await prisma.booking.create({
    data: {
      bookingReference: "BK-BBI-2026-1004",
      propertyId: propPatia.id,
      roomId: bedPatia101A!.roomId,
      bedId: null,
      tenantUserId: prospectUser.id,
      checkInDate: new Date("2026-11-15"),
      monthlyRent: 8500,
      bookingAmount: 8500,
      securityDeposit: 17000,
      totalPayableNow: 25500,
      status: "AWAITING_PAYMENT",
    },
  });

  console.log("✅ Seeded bookings in Bhubaneswar");

  // 10. Rent Schedules, Invoices & Payments for Tenants
  // Month 1: October 2026 (Paid via Razorpay for Tenant 1)
  const rentOct = await prisma.rentSchedule.create({
    data: {
      tenantProfileId: tenantProfile1.id,
      billingMonth: new Date("2026-10-01"),
      dueDate: new Date("2026-10-05"),
      amount: 12000,
      lateFee: 0,
      totalPayable: 12000,
      status: "PAID",
      paidAt: new Date("2026-10-04"),
    },
  });

  const invoiceOct = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-BBI-202610-01",
      tenantProfileId: tenantProfile1.id,
      rentScheduleId: rentOct.id,
      amount: 12000,
      totalAmount: 12000,
      isPaid: true,
    },
  });

  await prisma.payment.create({
    data: {
      bookingId: booking1.id,
      invoiceId: invoiceOct.id,
      amount: 12000,
      currency: "INR",
      paymentType: "MONTHLY_RENT",
      paymentMethod: "RAZORPAY",
      razorpayPaymentId: "pay_bbi_oct_rzp12345",
      razorpayOrderId: "order_bbi_oct_rzp98765",
      status: "SUCCESS",
      receiptNumber: "REC-BBI-202610-001",
    },
  });

  // Month 2: November 2026 (Upcoming / Due for Tenant 1)
  const rentNov = await prisma.rentSchedule.create({
    data: {
      tenantProfileId: tenantProfile1.id,
      billingMonth: new Date("2026-11-01"),
      dueDate: new Date("2026-11-05"),
      amount: 12000,
      lateFee: 0,
      totalPayable: 12000,
      status: "UPCOMING",
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-BBI-202611-01",
      tenantProfileId: tenantProfile1.id,
      rentScheduleId: rentNov.id,
      amount: 12000,
      totalAmount: 12000,
      isPaid: false,
    },
  });

  // Tenant 2: Paid via Cash (Recorded by Receptionist)
  const rentTenant2 = await prisma.rentSchedule.create({
    data: {
      tenantProfileId: tenantProfile2.id,
      billingMonth: new Date("2026-11-01"),
      dueDate: new Date("2026-11-05"),
      amount: 11000,
      lateFee: 0,
      totalPayable: 11000,
      status: "PAID",
      paidAt: new Date("2026-11-03"),
    },
  });

  const invoiceTenant2 = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-BBI-202611-02",
      tenantProfileId: tenantProfile2.id,
      rentScheduleId: rentTenant2.id,
      amount: 11000,
      totalAmount: 11000,
      isPaid: true,
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoiceTenant2.id,
      amount: 11000,
      currency: "INR",
      paymentType: "MONTHLY_RENT",
      paymentMethod: "CASH",
      status: "SUCCESS",
      receiptNumber: "REC-CASH-BBI-002",
    },
  });

  // Tenant 3: Paid via UPI
  const rentTenant3 = await prisma.rentSchedule.create({
    data: {
      tenantProfileId: tenantProfile3.id,
      billingMonth: new Date("2026-11-01"),
      dueDate: new Date("2026-11-05"),
      amount: 9000,
      lateFee: 0,
      totalPayable: 9000,
      status: "PAID",
      paidAt: new Date("2026-11-02"),
    },
  });

  const invoiceTenant3 = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-BBI-202611-03",
      tenantProfileId: tenantProfile3.id,
      rentScheduleId: rentTenant3.id,
      amount: 9000,
      totalAmount: 9000,
      isPaid: true,
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoiceTenant3.id,
      amount: 9000,
      currency: "INR",
      paymentType: "MONTHLY_RENT",
      paymentMethod: "UPI_OFFLINE",
      status: "SUCCESS",
      receiptNumber: "REC-UPI-BBI-003",
    },
  });

  console.log("✅ Seeded Rent Schedules, Invoices, and Verified Payments");

  // 11. Maintenance Requests in Bhubaneswar
  await prisma.maintenanceRequest.create({
    data: {
      ticketId: "TKT-BBI-2026-101",
      propertyId: propPatia.id,
      userId: tenantUser1.id,
      category: "PLUMBING",
      title: "Bathroom mixer tap dripping in Room 101",
      description: "Water tap in the attached bathroom has a minor continuous leak. Need washer replaced.",
      photos: JSON.stringify([]),
      status: "OPEN",
    },
  });

  await prisma.maintenanceRequest.create({
    data: {
      ticketId: "TKT-BBI-2026-102",
      propertyId: propPatia.id,
      userId: tenantUser1.id,
      category: "WIFI_INTERNET",
      title: "Wi-Fi 5GHz signal dropping on 2nd Floor Corridor",
      description: "Access point on the corridor occasionally resets during evening peak hours.",
      photos: JSON.stringify([]),
      status: "IN_PROGRESS",
    },
  });

  await prisma.maintenanceRequest.create({
    data: {
      ticketId: "TKT-BBI-2026-103",
      propertyId: propCSPur.id,
      userId: tenantUser2.id,
      category: "ELECTRICAL",
      title: "Split AC filter cleaning & gas check",
      description: "AC cooling was slightly diminished before summer.",
      photos: JSON.stringify([]),
      status: "RESOLVED",
      resolutionNote: "Filters thoroughly cleaned and coolant pressure checked by Suresh Rao (Maintenance Staff). Working optimally.",
      resolvedAt: new Date(),
    },
  });

  // 12. Property Reviews
  await prisma.review.create({
    data: {
      propertyId: propPatia.id,
      userId: tenantUser1.id,
      rating: 5,
      comment: "Superb coliving setup right opposite Infocity in Patia! Homestyle Odia Dalma and North Indian meals are delicious. 300 Mbps Wi-Fi and power backup have made work-from-home effortless. Friendly property management team.",
      isApproved: true,
      ownerReply: "Thank you Subhashree! Delighted to have you as part of our StaySphere Patia community.",
    },
  });

  await prisma.review.create({
    data: {
      propertyId: propCSPur.id,
      userId: tenantUser2.id,
      rating: 4,
      comment: "Very calm and studious environment in Sailashree Vihar, Chandrasekharpur. Daily housekeeping and laundry machines are well maintained.",
      isApproved: true,
    },
  });

  await prisma.review.create({
    data: {
      propertyId: propJayadev.id,
      userId: tenantUser3.id,
      rating: 5,
      comment: "Extremely secure girls PG with 24/7 female security and biometric entrance. Walking distance from Fortune Tower and Ekamra Haat. Highly recommended for working women in Bhubaneswar.",
      isApproved: true,
      ownerReply: "Safety and resident comfort are our topmost priorities. Thank you Ananya!",
    },
  });

  // 13. Announcements
  await prisma.announcement.create({
    data: {
      ownerId: ownerProfile1.id,
      propertyId: propPatia.id,
      title: "Quarterly Water Tank Cleaning & Sanitization",
      content: "Scheduled water tank cleaning on Saturday from 10:00 AM to 1:00 PM. Kindly store drinking water beforehand.",
      priority: "NORMAL",
      targetRole: "ALL",
    },
  });

  await prisma.announcement.create({
    data: {
      ownerId: ownerProfile1.id,
      propertyId: null, // Broadcast to all Owner 1 facilities
      title: "Infocity Fiber Optic Speed Upgrade (300 Mbps) Complete",
      content: "All room Wi-Fi access points have been upgraded with high-capacity dual-band Wi-Fi 6 routers. Enjoy lag-free gaming and video conferencing.",
      priority: "NORMAL",
      targetRole: "TENANTS",
    },
  });

  // 14. Audit Log Entries
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: "PLATFORM_INITIALIZED",
      entityType: "SYSTEM",
      entityId: "BHUBANESWAR_CLUSTER",
      metadata: JSON.stringify({ cluster: "Bhubaneswar", propertiesCount: 5 }),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: ownerUser1.id,
      action: "PROPERTY_CREATED",
      entityType: "PG_PROPERTY",
      entityId: propPatia.id,
      metadata: JSON.stringify({ name: propPatia.name, city: "Bhubaneswar" }),
    },
  });

  console.log("🎉 Master seed for Bhubaneswar, Odisha completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
