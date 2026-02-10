// API client for frontend data fetching

const API_BASE_URL = "/api";

type ApiResponse<T> = {
    data?: T;
    error?: string;
};

// Generic fetch wrapper with error handling
async function fetchApi<T>(
    endpoint: string,
    options?: RequestInit
): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                "Content-Type": "application/json",
            },
            ...options,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { error: errorData.error || `HTTP error: ${response.status}` };
        }

        const data = await response.json();
        return { data };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Unknown error" };
    }
}

// Product API types (matching Prisma schema)
export type ApiProduct = {
    id: number;
    name: string;
    price: number;
    image: string | null;
    saleUnit: "unit" | "kg" | "lb" | "oz" | "g" | "liter" | "ml";
    createdAt: string;
    updatedAt: string;
};

export type CreateProductInput = {
    name: string;
    price: number;
    image?: string | null;
    saleUnit?: ApiProduct["saleUnit"];
};

export type UpdateProductInput = Partial<CreateProductInput>;

// Product API functions
export const productsApi = {
    // Get all products
    getAll: () => fetchApi<ApiProduct[]>("/products"),

    // Get single product
    getById: (id: number) => fetchApi<ApiProduct>(`/products/${id}`),

    // Create new product
    create: (product: CreateProductInput) =>
        fetchApi<ApiProduct>("/products", {
            method: "POST",
            body: JSON.stringify(product),
        }),

    // Update product
    update: (id: number, product: UpdateProductInput) =>
        fetchApi<ApiProduct>(`/products/${id}`, {
            method: "PUT",
            body: JSON.stringify(product),
        }),

    // Delete product
    delete: (id: number) =>
        fetchApi<{ message: string }>(`/products/${id}`, {
            method: "DELETE",
        }),
};
