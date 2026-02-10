import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, SaleUnit } from "../src/generated/prisma";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
}

// Create PostgreSQL connection pool
const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);

// Create Prisma client with adapter
const prisma = new PrismaClient({ adapter });

// Spanish product data for POS system
const spanishProducts = [
    { name: "Café Americano", price: 2.50, saleUnit: "unit" as SaleUnit },
    { name: "Café con Leche", price: 3.00, saleUnit: "unit" as SaleUnit },
    { name: "Cappuccino", price: 3.50, saleUnit: "unit" as SaleUnit },
    { name: "Sándwich de Jamón y Queso", price: 5.00, saleUnit: "unit" as SaleUnit },
    { name: "Sándwich de Pollo", price: 6.00, saleUnit: "unit" as SaleUnit },
    { name: "Manzanas Rojas", price: 3.00, saleUnit: "kg" as SaleUnit },
    { name: "Plátanos", price: 2.50, saleUnit: "kg" as SaleUnit },
    { name: "Naranjas", price: 2.80, saleUnit: "kg" as SaleUnit },
    { name: "Pastel de Chocolate", price: 4.50, saleUnit: "unit" as SaleUnit },
    { name: "Pastel de Fresa", price: 4.00, saleUnit: "unit" as SaleUnit },
    { name: "Croissant", price: 2.00, saleUnit: "unit" as SaleUnit },
    { name: "Pan Integral", price: 3.50, saleUnit: "unit" as SaleUnit },
    { name: "Pechuga de Pollo", price: 8.99, saleUnit: "lb" as SaleUnit },
    { name: "Carne de Res", price: 12.50, saleUnit: "lb" as SaleUnit },
    { name: "Jamón Serrano", price: 18.00, saleUnit: "lb" as SaleUnit },
    { name: "Queso Manchego", price: 15.00, saleUnit: "kg" as SaleUnit },
    { name: "Jugo de Naranja Natural", price: 6.50, saleUnit: "liter" as SaleUnit },
    { name: "Leche Entera", price: 3.20, saleUnit: "liter" as SaleUnit },
    { name: "Agua Mineral", price: 1.50, saleUnit: "liter" as SaleUnit },
    { name: "Yogur Natural", price: 2.80, saleUnit: "unit" as SaleUnit },
    { name: "Empanadas de Carne", price: 3.50, saleUnit: "unit" as SaleUnit },
    { name: "Empanadas de Pollo", price: 3.50, saleUnit: "unit" as SaleUnit },
    { name: "Tortilla Española", price: 8.00, saleUnit: "unit" as SaleUnit },
    { name: "Aceitunas", price: 5.00, saleUnit: "kg" as SaleUnit },
];

async function main() {
    console.log("🌱 Starting database seed...");

    // Clear existing products
    await prisma.product.deleteMany();
    console.log("🗑️  Cleared existing products");

    // Insert Spanish products
    for (const product of spanishProducts) {
        await prisma.product.create({
            data: product,
        });
    }

    console.log(`✅ Seeded ${spanishProducts.length} Spanish products`);
}

main()
    .catch((e) => {
        console.error("❌ Seed error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
