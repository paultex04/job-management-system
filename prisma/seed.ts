import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin1234", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@erp.local" },
    update: {},
    create: {
      email: "admin@erp.local",
      name: "Admin User",
      passwordHash,
      role: "admin",
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@erp.local" },
    update: {},
    create: {
      email: "staff@erp.local",
      name: "Staff User",
      passwordHash: await bcrypt.hash("staff1234", 10),
      role: "staff",
    },
  });

  const customerCount = await prisma.customer.count();
  if (customerCount === 0) {
    await prisma.customer.createMany({
      data: [
        {
          name: "Acme Corporation",
          email: "orders@acme.example",
          phone: "+1 555 0101",
          address: "1200 Market St",
          city: "San Francisco",
          country: "USA",
        },
        {
          name: "Globex Industries",
          email: "purchasing@globex.example",
          phone: "+1 555 0102",
          address: "500 Commerce Ave",
          city: "Chicago",
          country: "USA",
        },
        {
          name: "Initech Solutions",
          email: "hello@initech.example",
          phone: "+44 20 7946 0018",
          address: "10 Downing Way",
          city: "London",
          country: "UK",
        },
      ],
    });

    await prisma.product.createMany({
      data: [
        {
          sku: "LAPTOP-14",
          name: "14\" Business Laptop",
          description: "Lightweight notebook for office work",
          price: 999.0,
          cost: 720.0,
          stock: 40,
          reorderLevel: 10,
        },
        {
          sku: "MON-27",
          name: '27" 4K Monitor',
          price: 349.0,
          cost: 240.0,
          stock: 65,
          reorderLevel: 15,
        },
        {
          sku: "KB-MECH",
          name: "Mechanical Keyboard",
          price: 89.0,
          cost: 45.0,
          stock: 120,
          reorderLevel: 25,
        },
        {
          sku: "MSE-ERG",
          name: "Ergonomic Mouse",
          price: 49.0,
          cost: 22.0,
          stock: 8,
          reorderLevel: 20,
        },
        {
          sku: "DOCK-USBC",
          name: "USB-C Docking Station",
          price: 189.0,
          cost: 120.0,
          stock: 55,
          reorderLevel: 12,
        },
        {
          sku: "MON-24",
          name: '24" FHD Monitor',
          price: 179.0,
          cost: 118.0,
          stock: 74,
          reorderLevel: 15,
        },
        {
          sku: "HEADSET-UC",
          name: "USB Conference Headset",
          price: 79.0,
          cost: 42.0,
          stock: 90,
          reorderLevel: 20,
        },
        {
          sku: "WEBCAM-1080",
          name: "1080p Webcam",
          price: 69.0,
          cost: 35.0,
          stock: 110,
          reorderLevel: 25,
        },
        {
          sku: "SSD-1TB",
          name: "1TB NVMe SSD",
          price: 109.0,
          cost: 72.0,
          stock: 130,
          reorderLevel: 30,
        },
        {
          sku: "RAM-16G",
          name: "16GB DDR5 SODIMM",
          price: 59.0,
          cost: 38.0,
          stock: 96,
          reorderLevel: 24,
        },
        {
          sku: "ROUTER-WIFI6",
          name: "Wi-Fi 6 Business Router",
          price: 219.0,
          cost: 145.0,
          stock: 34,
          reorderLevel: 8,
        },
        {
          sku: "SWITCH-8P",
          name: "8-Port Gigabit Switch",
          price: 74.0,
          cost: 41.0,
          stock: 62,
          reorderLevel: 15,
        },
        {
          sku: "NAS-4TB",
          name: "4-Bay NAS (4TB)",
          price: 549.0,
          cost: 399.0,
          stock: 12,
          reorderLevel: 5,
        },
        {
          sku: "PRINTER-LASER",
          name: "Mono Laser Printer",
          price: 299.0,
          cost: 205.0,
          stock: 26,
          reorderLevel: 6,
        },
        {
          sku: "TONER-05A",
          name: "Toner Cartridge (05A)",
          price: 89.0,
          cost: 54.0,
          stock: 48,
          reorderLevel: 12,
        },
        {
          sku: "UPS-1500",
          name: "1500VA UPS",
          price: 249.0,
          cost: 170.0,
          stock: 7,
          reorderLevel: 10,
        },
        {
          sku: "CABLE-HDMI21",
          name: "HDMI 2.1 Cable (2m)",
          price: 19.0,
          cost: 7.0,
          stock: 240,
          reorderLevel: 50,
        },
        {
          sku: "CABLE-CAT6",
          name: "Cat6 Ethernet Cable (3m)",
          price: 12.0,
          cost: 4.0,
          stock: 310,
          reorderLevel: 60,
        },
        {
          sku: "STAND-ADJ",
          name: "Adjustable Laptop Stand",
          price: 45.0,
          cost: 24.0,
          stock: 84,
          reorderLevel: 20,
        },
        {
          sku: "CHAIR-ERG",
          name: "Ergonomic Office Chair",
          price: 399.0,
          cost: 260.0,
          stock: 6,
          reorderLevel: 8,
        },
        {
          sku: "DESK-STAND",
          name: "Standing Desk Converter",
          price: 259.0,
          cost: 175.0,
          stock: 4,
          reorderLevel: 6,
        },
        {
          sku: "TABLET-10",
          name: '10" Android Tablet',
          price: 229.0,
          cost: 160.0,
          stock: 41,
          reorderLevel: 10,
        },
        {
          sku: "PHONE-IP",
          name: "VoIP Desk Phone",
          price: 129.0,
          cost: 84.0,
          stock: 57,
          reorderLevel: 12,
        },
        {
          sku: "SCAN-DOC",
          name: "Document Scanner",
          price: 199.0,
          cost: 132.0,
          stock: 22,
          reorderLevel: 6,
        },
      ],
    });

    const customers = await prisma.customer.findMany();
    const products = await prisma.product.findMany();

    // Every product starts its stock card with the units the seed gave it, so
    // later receipts and issues have an opening balance to sit on top of.
    await prisma.stockMovement.createMany({
      data: products
        .filter((product) => product.stock > 0)
        .map((product) => ({
          productId: product.id,
          type: "opening",
          quantity: product.stock,
          balance: product.stock,
        })),
    });

    for (const [i, customer] of customers.entries()) {
      const items = products.slice(0, i + 1).map((p) => ({
        productId: p.id,
        quantity: i + 2,
        unitPrice: p.price,
      }));
      const total = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);

      await prisma.order.create({
        data: {
          orderNumber: `SO-${String(i + 1).padStart(4, "0")}`,
          status: ["confirmed", "shipped", "completed"][i % 3],
          total,
          customerId: customer.id,
          createdById: admin.id,
          items: { create: items },
        },
      });
    }
  }

  console.log("Seed complete. Logins:");
  console.log("  admin@erp.local / admin1234  (admin)");
  console.log(`  staff@erp.local / staff1234  (staff, user: ${staff.name})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
