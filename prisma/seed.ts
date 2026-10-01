import "dotenv/config";
import { hashPassword } from "../src/lib/password";
import { createProductWithCode } from "../src/lib/product-create";
import { nowTimestamp } from "../src/prisma/dates";
import { closeDb, db } from "../src/prisma/db";
import type { SaleUnit } from "../src/types/product";
import type { UserRole } from "../src/types/user";

// Spanish product data for POS system
const spanishProducts: { name: string; price: number; saleUnit: SaleUnit; code?: string }[] = [
    { name: "Café Americano", price: 3500, saleUnit: "unit", code: "CAFE-001" },
    { name: "Café con Leche", price: 4000, saleUnit: "unit", code: "CAFE-002" },
    { name: "Cappuccino", price: 5500, saleUnit: "unit", code: "CAFE-003" },
    { name: "Sándwich de Jamón y Queso", price: 12000, saleUnit: "unit" },
    { name: "Sándwich de Pollo", price: 14000, saleUnit: "unit" },
    { name: "Manzanas Rojas", price: 4500, saleUnit: "kg", code: "FRUTA-MANZANA" },
    { name: "Plátanos", price: 2500, saleUnit: "kg" },
    { name: "Naranjas", price: 3000, saleUnit: "kg" },
    { name: "Pastel de Chocolate", price: 8000, saleUnit: "unit" },
    { name: "Pastel de Fresa", price: 7500, saleUnit: "unit" },
    { name: "Croissant", price: 4500, saleUnit: "unit" },
    { name: "Pan Integral", price: 6000, saleUnit: "unit" },
    { name: "Pechuga de Pollo", price: 18000, saleUnit: "lb" },
    { name: "Carne de Res", price: 28000, saleUnit: "lb" },
    { name: "Jamón Serrano", price: 45000, saleUnit: "lb" },
    { name: "Queso Manchego", price: 42000, saleUnit: "kg" },
    { name: "Jugo de Naranja Natural", price: 7000, saleUnit: "liter" },
    { name: "Leche Entera", price: 4500, saleUnit: "liter" },
    { name: "Agua Mineral", price: 2500, saleUnit: "liter" },
    { name: "Yogur Natural", price: 3500, saleUnit: "unit" },
    { name: "Empanadas de Carne", price: 3000, saleUnit: "unit" },
    { name: "Empanadas de Pollo", price: 3000, saleUnit: "unit" },
    { name: "Tortilla Española", price: 15000, saleUnit: "unit" },
    { name: "Aceitunas", price: 18000, saleUnit: "kg" },
];

const seedUsers: { name: string; username: string; password: string; role: UserRole }[] = [
    { name: "Administrador", username: "admin", password: "admin123", role: "administrador" },
    { name: "Ana Caja", username: "ana", password: "caja123", role: "cajero" },
];

async function main() {
    console.log("🌱 Starting database seed...");

    const updatedAt = nowTimestamp();
    for (const product of spanishProducts) {
        const existing = await db.orm.public.Product.where({ name: product.name }).first();
        if (existing) {
            await db.orm.public.Product.where({ id: existing.id }).update({
                price: product.price,
                saleUnit: product.saleUnit,
                ...(product.code ? { code: product.code } : {}),
                updatedAt,
            });
            console.log(`✅ Updated ${product.name} → ${product.price} COP`);
            continue;
        }

        const result = await createProductWithCode({
            name: product.name,
            price: product.price,
            saleUnit: product.saleUnit,
            code: product.code ?? null,
        });
        if (!result.ok) {
            console.error(`❌ Failed ${product.name}: ${result.error}`);
            continue;
        }
        console.log(`✅ Seeded ${product.name} → ${product.price} COP [${result.product.code}]`);
    }

    console.log(`✅ Seeded ${spanishProducts.length} products in Colombian pesos`);

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

    const defaultRegisters = [
        { number: 1, name: "Caja principal" },
        { number: 2, name: "Caja secundaria" },
    ];

    for (const register of defaultRegisters) {
        const existing = await db.orm.public.Register.where({ number: register.number }).first();
        if (existing) {
            console.log(`✅ Register already exists: #${register.number}`);
            continue;
        }

        await db.orm.public.Register.create({
            number: register.number,
            name: register.name,
            active: true,
            updatedAt,
        });
        console.log(`✅ Seeded register #${register.number}`);
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
