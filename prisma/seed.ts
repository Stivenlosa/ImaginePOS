import "dotenv/config";
import { hashPassword } from "../src/lib/password";
import { nowTimestamp } from "../src/prisma/dates";
import { closeDb, db } from "../src/prisma/db";
import type { SaleUnit } from "../src/types/product";
import type { UserRole } from "../src/types/user";

// Spanish product data for POS system
const spanishProducts: { name: string; price: number; saleUnit: SaleUnit }[] = [
    { name: "Café Americano", price: 2.50, saleUnit: "unit" },
    { name: "Café con Leche", price: 3.00, saleUnit: "unit" },
    { name: "Cappuccino", price: 3.50, saleUnit: "unit" },
    { name: "Sándwich de Jamón y Queso", price: 5.00, saleUnit: "unit" },
    { name: "Sándwich de Pollo", price: 6.00, saleUnit: "unit" },
    { name: "Manzanas Rojas", price: 3.00, saleUnit: "kg" },
    { name: "Plátanos", price: 2.50, saleUnit: "kg" },
    { name: "Naranjas", price: 2.80, saleUnit: "kg" },
    { name: "Pastel de Chocolate", price: 4.50, saleUnit: "unit" },
    { name: "Pastel de Fresa", price: 4.00, saleUnit: "unit" },
    { name: "Croissant", price: 2.00, saleUnit: "unit" },
    { name: "Pan Integral", price: 3.50, saleUnit: "unit" },
    { name: "Pechuga de Pollo", price: 8.99, saleUnit: "lb" },
    { name: "Carne de Res", price: 12.50, saleUnit: "lb" },
    { name: "Jamón Serrano", price: 18.00, saleUnit: "lb" },
    { name: "Queso Manchego", price: 15.00, saleUnit: "kg" },
    { name: "Jugo de Naranja Natural", price: 6.50, saleUnit: "liter" },
    { name: "Leche Entera", price: 3.20, saleUnit: "liter" },
    { name: "Agua Mineral", price: 1.50, saleUnit: "liter" },
    { name: "Yogur Natural", price: 2.80, saleUnit: "unit" },
    { name: "Empanadas de Carne", price: 3.50, saleUnit: "unit" },
    { name: "Empanadas de Pollo", price: 3.50, saleUnit: "unit" },
    { name: "Tortilla Española", price: 8.00, saleUnit: "unit" },
    { name: "Aceitunas", price: 5.00, saleUnit: "kg" },
];

const seedUsers: { name: string; username: string; password: string; role: UserRole }[] = [
    { name: "Administrador", username: "admin", password: "admin123", role: "administrador" },
    { name: "Ana Caja", username: "ana", password: "caja123", role: "cajero" },
];

async function main() {
    console.log("🌱 Starting database seed...");

    await db.orm.public.Product.where((product) => product.id.gte(0)).deleteAll();
    console.log("🗑️  Cleared existing products");

    const updatedAt = nowTimestamp();
    await db.orm.public.Product.createAll(
        spanishProducts.map((product) => ({ ...product, updatedAt })),
    );

    console.log(`✅ Seeded ${spanishProducts.length} Spanish products`);

    for (const user of seedUsers) {
        const existing = await db.orm.public.User.where({ username: user.username }).first();
        if (existing) {
            console.log(`✅ User already exists: ${user.username} (${user.role})`);
            continue;
        }

        await db.orm.public.User.create({
            name: user.name,
            username: user.username,
            passwordHash: await hashPassword(user.password),
            role: user.role,
            active: true,
            updatedAt,
        });
        console.log(`✅ Seeded user: ${user.username} (${user.role})`);
    }
}

main()
    .catch((e) => {
        console.error("❌ Seed error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await closeDb();
    });
