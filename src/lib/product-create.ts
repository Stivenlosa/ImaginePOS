import { roundMoney } from "@/lib/money";
import {
    autoProductCodeFromId,
    createTemporaryProductCode,
    isValidProductCode,
    normalizeProductCode,
} from "@/lib/product-code";
import { nowTimestamp } from "@/prisma/dates";
import { db } from "@/prisma/db";
import type { SaleUnit } from "@/types/product";

export type CreateProductFields = {
    name: string;
    price: number;
    image?: string | null;
    saleUnit?: SaleUnit;
    code?: string | null;
};

export type CreateProductResult =
    | { ok: true; product: Awaited<ReturnType<typeof db.orm.public.Product.create>> }
    | { ok: false; error: string; status: number };

async function finalizeAutoCode(productId: number) {
    const primary = autoProductCodeFromId(productId, false);
    const clash = await db.orm.public.Product.where({ code: primary }).first();
    const code =
        clash && clash.id !== productId
            ? autoProductCodeFromId(productId, true)
            : primary;

    return db.orm.public.Product.where({ id: productId }).update({
        code,
        updatedAt: nowTimestamp(),
    });
}

export async function createProductWithCode(
    input: CreateProductFields,
): Promise<CreateProductResult> {
    const normalized = normalizeProductCode(input.code);
    let code = normalized;
    let autoAssign = false;

    if (!code) {
        code = createTemporaryProductCode();
        autoAssign = true;
    } else if (!isValidProductCode(code)) {
        return {
            ok: false,
            error: "Code must be alphanumeric (letters, numbers, - or _)",
            status: 400,
        };
    } else {
        const existing = await db.orm.public.Product.where({ code }).first();
        if (existing) {
            return { ok: false, error: "Product code already exists", status: 409 };
        }
    }

    let product = await db.orm.public.Product.create({
        name: input.name,
        price: roundMoney(input.price),
        image: input.image ?? null,
        saleUnit: input.saleUnit || "unit",
        code,
        updatedAt: nowTimestamp(),
    });

    if (autoAssign) {
        product = await finalizeAutoCode(product.id);
    }

    return { ok: true, product };
}
