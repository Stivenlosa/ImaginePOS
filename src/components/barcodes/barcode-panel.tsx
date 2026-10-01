"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import JsBarcode from "jsbarcode";
import { jsPDF } from "jspdf";
import type { Product } from "@/types/product";
import { formatMoney } from "@/lib/money";
import { getSaleUnitSuffix } from "@/types/product";
import { useTranslation } from "@/i18n";

type StickerSizeId = "small" | "medium" | "large" | "custom";
type Orientation = "landscape" | "portrait";
type LayoutMode = "roll" | "sheet";
type PaperId = "a4" | "letter" | "legal" | "custom";

type Size = { widthMm: number; heightMm: number };
type Point = { x: number; y: number };

const STICKER_SIZES: Record<Exclude<StickerSizeId, "custom">, Size> = {
    small: { widthMm: 40, heightMm: 25 },
    medium: { widthMm: 50, heightMm: 30 },
    large: { widthMm: 70, heightMm: 40 },
};

const PAPER_SIZES: Record<Exclude<PaperId, "custom">, Size> = {
    a4: { widthMm: 210, heightMm: 297 },
    letter: { widthMm: 215.9, heightMm: 279.4 },
    legal: { widthMm: 215.9, heightMm: 355.6 },
};

const MAX_LABELS = 1000;
const PRINT_PX_PER_MM = 12;
const PREVIEW_PX_PER_MM = 8;
const SETTINGS_STORAGE_KEY = "imaginepos.barcodePrintSettings";

type PrintSettings = {
    sizeId: StickerSizeId;
    customWidthMm: number;
    customHeightMm: number;
    stickerOrientation: Orientation;
    showName: boolean;
    showPrice: boolean;
    showBarcodeValue: boolean;
    layoutMode: LayoutMode;
    paperId: PaperId;
    paperWidthMm: number;
    paperHeightMm: number;
    paperOrientation: Orientation;
    marginTopMm: number;
    marginRightMm: number;
    marginBottomMm: number;
    marginLeftMm: number;
    gapXMm: number;
    gapYMm: number;
    /** 0 = as many as fit */
    columns: number;
    /** 0 = as many as fit */
    rows: number;
    copies: number;
    fillPages: boolean;
    skipSlots: number;
    showCutLines: boolean;
};

const DEFAULT_SETTINGS: PrintSettings = {
    sizeId: "medium",
    customWidthMm: 50,
    customHeightMm: 30,
    stickerOrientation: "landscape",
    showName: true,
    showPrice: true,
    showBarcodeValue: true,
    layoutMode: "sheet",
    paperId: "a4",
    paperWidthMm: 210,
    paperHeightMm: 297,
    paperOrientation: "portrait",
    marginTopMm: 10,
    marginRightMm: 10,
    marginBottomMm: 10,
    marginLeftMm: 10,
    gapXMm: 2,
    gapYMm: 2,
    columns: 0,
    rows: 0,
    copies: 1,
    fillPages: false,
    skipSlots: 0,
    showCutLines: true,
};

type SheetLayout = {
    page: Size;
    columns: number;
    rows: number;
    slots: Point[];
    fits: boolean;
};

function clamp(value: number, min: number, max: number) {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
}

function orient(size: Size, orientation: Orientation): Size {
    const long = Math.max(size.widthMm, size.heightMm);
    const short = Math.min(size.widthMm, size.heightMm);
    return orientation === "landscape"
        ? { widthMm: long, heightMm: short }
        : { widthMm: short, heightMm: long };
}

function getStickerSize(s: PrintSettings): Size {
    const base =
        s.sizeId === "custom"
            ? {
                  widthMm: clamp(s.customWidthMm, 10, 300),
                  heightMm: clamp(s.customHeightMm, 10, 300),
              }
            : STICKER_SIZES[s.sizeId];
    return orient(base, s.stickerOrientation);
}

function computeLayout(s: PrintSettings, sticker: Size): SheetLayout {
    if (s.layoutMode === "roll") {
        return { page: sticker, columns: 1, rows: 1, slots: [{ x: 0, y: 0 }], fits: true };
    }

    const basePaper =
        s.paperId === "custom"
            ? {
                  widthMm: clamp(s.paperWidthMm, 20, 1000),
                  heightMm: clamp(s.paperHeightMm, 20, 1000),
              }
            : PAPER_SIZES[s.paperId];
    const page = orient(basePaper, s.paperOrientation);

    const mt = clamp(s.marginTopMm, 0, page.heightMm);
    const mb = clamp(s.marginBottomMm, 0, page.heightMm);
    const ml = clamp(s.marginLeftMm, 0, page.widthMm);
    const mr = clamp(s.marginRightMm, 0, page.widthMm);
    const gx = clamp(s.gapXMm, 0, 100);
    const gy = clamp(s.gapYMm, 0, 100);

    const usableW = page.widthMm - ml - mr;
    const usableH = page.heightMm - mt - mb;
    const autoColumns = Math.max(1, Math.floor((usableW + gx) / (sticker.widthMm + gx)));
    const autoRows = Math.max(1, Math.floor((usableH + gy) / (sticker.heightMm + gy)));
    const columns = s.columns > 0 ? clamp(Math.floor(s.columns), 1, 50) : autoColumns;
    const rows = s.rows > 0 ? clamp(Math.floor(s.rows), 1, 100) : autoRows;

    const usedW = columns * sticker.widthMm + (columns - 1) * gx;
    const usedH = rows * sticker.heightMm + (rows - 1) * gy;
    const fits = usedW <= usableW + 0.01 && usedH <= usableH + 0.01;

    const slots: Point[] = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            slots.push({
                x: ml + c * (sticker.widthMm + gx),
                y: mt + r * (sticker.heightMm + gy),
            });
        }
    }

    return { page, columns, rows, slots, fits };
}

function getSkip(s: PrintSettings, layout: SheetLayout) {
    if (s.layoutMode !== "sheet") return 0;
    return clamp(Math.floor(s.skipSlots), 0, layout.slots.length - 1);
}

/** Splits labels into pages, continuing from the first free position. */
function planPages(s: PrintSettings, layout: SheetLayout): Point[][] {
    const perPage = layout.slots.length;
    const skip = getSkip(s, layout);
    let count = clamp(Math.floor(s.copies), 1, MAX_LABELS);
    if (s.layoutMode === "sheet" && s.fillPages) {
        count = Math.min(MAX_LABELS, Math.ceil((skip + count) / perPage) * perPage - skip);
    }

    const pages: Point[][] = [];
    for (let i = 0; i < count; i++) {
        const slot = skip + i;
        const pageIndex = Math.floor(slot / perPage);
        (pages[pageIndex] ??= []).push(layout.slots[slot % perPage]);
    }
    return pages;
}

function buildBarcodeSvg(
    value: string,
    options: { height: number; displayValue: boolean },
) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    JsBarcode(svg, value, {
        format: "CODE128",
        displayValue: options.displayValue,
        fontSize: 14,
        textMargin: 2,
        height: options.height,
        width: 2,
        margin: 8,
        marginTop: 0,
        marginBottom: 0,
        background: "#ffffff",
        lineColor: "#000000",
    });
    return svg;
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = src;
    });
}

function svgToImage(svg: SVGSVGElement) {
    const markup = new XMLSerializer().serializeToString(svg);
    return loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`);
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
    let result = text;
    while (ctx.measureText(result).width > maxWidth && result.length > 1) {
        result = `${result.slice(0, -2)}…`;
    }
    return result;
}

async function renderStickerCanvas(params: {
    productName: string;
    productCode: string;
    priceLabel: string;
    sticker: Size;
    showName: boolean;
    showPrice: boolean;
    showBarcodeValue: boolean;
    pxPerMm: number;
}) {
    const { sticker, pxPerMm } = params;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(sticker.widthMm * pxPerMm));
    canvas.height = Math.max(1, Math.round(sticker.heightMm * pxPerMm));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#111111";
    ctx.textAlign = "center";

    const pad = 1.5 * pxPerMm;
    const innerWidth = canvas.width - pad * 2;
    let top = pad;
    let bottom = canvas.height - pad;

    if (params.showName) {
        const fontPx = clamp(sticker.heightMm * 0.1, 2, 6) * pxPerMm;
        ctx.font = `700 ${fontPx}px Arial, Helvetica, sans-serif`;
        ctx.textBaseline = "top";
        ctx.fillText(fitText(ctx, params.productName, innerWidth), canvas.width / 2, top);
        top += fontPx + 0.8 * pxPerMm;
    }

    if (params.showPrice) {
        const fontPx = clamp(sticker.heightMm * 0.09, 1.8, 5) * pxPerMm;
        ctx.font = `600 ${fontPx}px Arial, Helvetica, sans-serif`;
        ctx.textBaseline = "bottom";
        ctx.fillText(fitText(ctx, params.priceLabel, innerWidth), canvas.width / 2, bottom);
        bottom -= fontPx + 0.6 * pxPerMm;
    }

    const areaHeight = Math.max(pxPerMm * 4, bottom - top);
    const textPx = params.showBarcodeValue ? 16 : 0;

    // Size the bars so the barcode fills the width without overflowing the height
    const probe = buildBarcodeSvg(params.productCode, {
        height: 50,
        displayValue: params.showBarcodeValue,
    });
    const naturalWidth = parseFloat(probe.getAttribute("width") ?? "") || 1;
    const scaleToWidth = innerWidth / naturalWidth;
    const barHeight = Math.max(10, areaHeight / scaleToWidth - textPx);

    const svg = buildBarcodeSvg(params.productCode, {
        height: barHeight,
        displayValue: params.showBarcodeValue,
    });
    const svgWidth = parseFloat(svg.getAttribute("width") ?? "") || naturalWidth;
    const svgHeight = parseFloat(svg.getAttribute("height") ?? "") || barHeight + textPx;
    const img = await svgToImage(svg);

    const fit = Math.min(innerWidth / svgWidth, areaHeight / svgHeight);
    const drawW = svgWidth * fit;
    const drawH = svgHeight * fit;
    ctx.drawImage(
        img,
        (canvas.width - drawW) / 2,
        top + (areaHeight - drawH) / 2,
        drawW,
        drawH,
    );

    return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/png");
    });
}

function downloadDataUrl(dataUrl: string, filename: string) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.click();
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function buildPrintHtml(params: {
    pages: Point[][];
    page: Size;
    sticker: Size;
    stickerUrl: string;
    showCutLines: boolean;
    autoPrint: boolean;
    title: string;
    printLabel: string;
}) {
    const { pages, page, sticker, stickerUrl, showCutLines, autoPrint, title, printLabel } =
        params;

    const pagesHtml = pages
        .map((slots) => {
            const stickers = slots
                .map(
                    (p) =>
                        `<div class="sticker" style="left:${p.x}mm;top:${p.y}mm"><img src="${stickerUrl}" alt="" /></div>`,
                )
                .join("");
            return `<div class="page">${stickers}</div>`;
        })
        .join("\n");

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: ${page.widthMm}mm ${page.heightMm}mm; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #e5e7eb; font-family: Arial, Helvetica, sans-serif; }
    .toolbar {
      position: sticky; top: 0; z-index: 1;
      display: flex; gap: 12px; align-items: center;
      padding: 10px 14px; background: #111827; color: #fff; font-size: 14px;
    }
    .toolbar button {
      border: 0; border-radius: 6px; padding: 8px 14px;
      background: #22c55e; color: #fff; font-weight: 600; cursor: pointer;
    }
    .pages { padding: 16px 0; }
    .page {
      position: relative;
      width: ${page.widthMm}mm; height: ${page.heightMm}mm;
      margin: 0 auto 16px; background: #fff; overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,.2);
    }
    .sticker {
      position: absolute;
      width: ${sticker.widthMm}mm; height: ${sticker.heightMm}mm;
      ${showCutLines ? "outline: 0.2mm dashed #9ca3af; outline-offset: 0;" : ""}
    }
    .sticker img { display: block; width: 100%; height: 100%; }
    @media print {
      html, body { background: #fff; }
      .toolbar { display: none !important; }
      .pages { padding: 0; }
      .page { margin: 0; box-shadow: none; break-after: page; page-break-after: always; }
      .page:last-child { break-after: auto; page-break-after: auto; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <span>${escapeHtml(title)}</span>
    <button type="button" onclick="window.print()">${escapeHtml(printLabel)}</button>
  </div>
  <div class="pages">${pagesHtml}</div>
  <script>
    ${
        autoPrint
            ? "window.addEventListener('load', function () { setTimeout(function () { window.focus(); window.print(); }, 300); });"
            : ""
    }
  </script>
</body>
</html>`;
}

/** Opens HTML via blob URL; noopener + document.write leaves the tab blank. */
function openHtmlWindow(html: string, extraUrls: string[]) {
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    const win = window.open(url, "_blank");
    const revoke = () => [url, ...extraUrls].forEach((u) => URL.revokeObjectURL(u));
    if (!win) {
        revoke();
        return null;
    }
    setTimeout(revoke, 10 * 60_000);
    return win;
}

const inputClass =
    "w-full rounded border px-3 py-2 dark:border-dark-3 dark:bg-dark-2 dark:text-dark-6";

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <label className="flex flex-col gap-1 text-sm text-gray-600 dark:text-dark-5">
            {label}
            {children}
        </label>
    );
}

function NumberField({
    label,
    value,
    onChange,
    min = 0,
    max,
    step = 1,
    placeholder,
}: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
}) {
    return (
        <Field label={label}>
            <input
                type="number"
                min={min}
                max={max}
                step={step}
                placeholder={placeholder}
                value={placeholder && value === 0 ? "" : value}
                onChange={(e) => onChange(Number(e.target.value) || 0)}
                className={inputClass}
            />
        </Field>
    );
}

function CheckboxField({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-dark-5">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            {label}
        </label>
    );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <fieldset className="flex flex-col gap-3 rounded-xl border border-stroke p-3 dark:border-dark-3">
            <legend className="px-1 text-sm font-semibold text-gray-700 dark:text-dark-6">
                {title}
            </legend>
            {children}
        </fieldset>
    );
}

function SheetPreview({
    layout,
    sticker,
    skip,
    filledOnFirstPage,
    stickerUrl,
    showCutLines,
}: {
    layout: SheetLayout;
    sticker: Size;
    skip: number;
    filledOnFirstPage: number;
    stickerUrl: string | null;
    showCutLines: boolean;
}) {
    const { page } = layout;
    const pct = (value: number, total: number) => `${(value / total) * 100}%`;

    return (
        <div
            className="relative mx-auto w-full max-w-[260px] overflow-hidden bg-white shadow ring-1 ring-gray-300"
            style={{ aspectRatio: `${page.widthMm} / ${page.heightMm}` }}
        >
            {layout.slots.map((slot, index) => {
                const skipped = index < skip;
                const filled = !skipped && index < skip + filledOnFirstPage;
                return (
                    <div
                        key={index}
                        className={`absolute ${
                            skipped
                                ? "bg-[repeating-linear-gradient(45deg,#e5e7eb_0,#e5e7eb_2px,transparent_2px,transparent_5px)]"
                                : filled
                                  ? showCutLines
                                      ? "outline outline-1 outline-dashed outline-gray-400"
                                      : ""
                                  : "outline outline-1 outline-dashed outline-gray-200"
                        }`}
                        style={{
                            left: pct(slot.x, page.widthMm),
                            top: pct(slot.y, page.heightMm),
                            width: pct(sticker.widthMm, page.widthMm),
                            height: pct(sticker.heightMm, page.heightMm),
                        }}
                    >
                        {filled && stickerUrl && (
                            <img src={stickerUrl} alt="" className="h-full w-full" />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export function BarcodePanel({ product }: { product: Product | null }) {
    const { t } = useTranslation();
    const [settings, setSettings] = useState<PrintSettings>(DEFAULT_SETTINGS);
    const [settingsLoaded, setSettingsLoaded] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const update = (patch: Partial<PrintSettings>) =>
        setSettings((prev) => ({ ...prev, ...patch }));

    useEffect(() => {
        try {
            const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
            if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
        } catch {
            // Corrupt settings fall back to defaults
        }
        setSettingsLoaded(true);
    }, []);

    useEffect(() => {
        if (!settingsLoaded) return;
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    }, [settings, settingsLoaded]);

    const sticker = useMemo(() => getStickerSize(settings), [settings]);
    const layout = useMemo(() => computeLayout(settings, sticker), [settings, sticker]);
    const pages = useMemo(() => planPages(settings, layout), [settings, layout]);
    const skip = getSkip(settings, layout);
    const totalLabels = pages.reduce((sum, p) => sum + p.length, 0);

    const priceLabel = product
        ? `${formatMoney(Number(product.price))}${getSaleUnitSuffix(product.saleUnit)}`
        : "";

    const renderSticker = (pxPerMm: number) => {
        if (!product) throw new Error("No product");
        return renderStickerCanvas({
            productName: product.name,
            productCode: product.code,
            priceLabel,
            sticker,
            showName: settings.showName,
            showPrice: settings.showPrice,
            showBarcodeValue: settings.showBarcodeValue,
            pxPerMm,
        });
    };

    useEffect(() => {
        let cancelled = false;
        setError(null);
        setPreviewUrl(null);
        if (!product?.code) return;

        renderSticker(PREVIEW_PX_PER_MM)
            .then((canvas) => {
                if (!cancelled) setPreviewUrl(canvas.toDataURL("image/png"));
            })
            .catch(() => {
                if (!cancelled) setError(t("barcodes.invalidCode"));
            });

        return () => {
            cancelled = true;
        };
        // renderSticker reads exactly these inputs
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        product?.code,
        product?.name,
        priceLabel,
        sticker.widthMm,
        sticker.heightMm,
        settings.showName,
        settings.showPrice,
        settings.showBarcodeValue,
        t,
    ]);

    const handlePrint = async (autoPrint: boolean) => {
        if (!product) return;
        setBusy(true);
        setActionError(null);
        try {
            const canvas = await renderSticker(PRINT_PX_PER_MM);
            const stickerUrl = URL.createObjectURL(await canvasToBlob(canvas));
            const html = buildPrintHtml({
                pages,
                page: layout.page,
                sticker,
                stickerUrl,
                showCutLines: settings.layoutMode === "sheet" && settings.showCutLines,
                autoPrint,
                title: `${t("barcodes.printTitle")} — ${product.name}`,
                printLabel: t("barcodes.print"),
            });
            if (!openHtmlWindow(html, [stickerUrl])) {
                setActionError(t("barcodes.popupBlocked"));
            }
        } catch {
            setActionError(t("barcodes.downloadFailed"));
        } finally {
            setBusy(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!product) return;
        setBusy(true);
        setActionError(null);
        try {
            const canvas = await renderSticker(PRINT_PX_PER_MM);
            const png = canvas.toDataURL("image/png");
            const { page } = layout;
            const pageOrientation = page.widthMm > page.heightMm ? "landscape" : "portrait";
            const pdf = new jsPDF({
                orientation: pageOrientation,
                unit: "mm",
                format: [page.widthMm, page.heightMm],
            });
            const drawCutLines = settings.layoutMode === "sheet" && settings.showCutLines;

            pages.forEach((slots, pageIndex) => {
                if (pageIndex > 0) pdf.addPage([page.widthMm, page.heightMm], pageOrientation);
                slots.forEach((p) => {
                    pdf.addImage(png, "PNG", p.x, p.y, sticker.widthMm, sticker.heightMm, "sticker");
                    if (drawCutLines) {
                        pdf.setDrawColor(160);
                        pdf.setLineWidth(0.1);
                        pdf.setLineDashPattern([1, 1], 0);
                        pdf.rect(p.x, p.y, sticker.widthMm, sticker.heightMm);
                    }
                });
            });

            pdf.save(`barcode-${product.code}.pdf`);
        } catch {
            setActionError(t("barcodes.downloadFailed"));
        } finally {
            setBusy(false);
        }
    };

    const handleDownloadImage = async () => {
        if (!product) return;
        setBusy(true);
        setActionError(null);
        try {
            const canvas = await renderSticker(PRINT_PX_PER_MM);
            downloadDataUrl(canvas.toDataURL("image/png"), `barcode-${product.code}.png`);
        } catch {
            setActionError(t("barcodes.downloadFailed"));
        } finally {
            setBusy(false);
        }
    };

    if (!product) {
        return (
            <div
                data-barcode-panel
                className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-stroke bg-white p-8 text-center dark:border-dark-3 dark:bg-gray-dark"
            >
                <p className="text-sm text-gray-500 dark:text-dark-5">
                    {t("barcodes.selectProduct")}
                </p>
            </div>
        );
    }

    const isSheet = settings.layoutMode === "sheet";
    const disabled = !!error || busy;
    const secondaryButton =
        "rounded-lg border border-stroke px-4 py-2.5 font-medium text-gray-700 transition hover:bg-gray-2 disabled:opacity-50 dark:border-dark-3 dark:text-dark-6 dark:hover:bg-dark-2";

    return (
        <div
            data-barcode-panel
            className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto rounded-2xl border border-stroke bg-white p-5 dark:border-dark-3 dark:bg-gray-dark"
        >
            <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-dark-6">
                    {t("barcodes.panelTitle")}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-dark-5">{product.name}</p>
                <p className="font-mono text-sm text-gray-700 dark:text-dark-6">{product.code}</p>
            </div>

            <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-stroke bg-gray-2 p-4 dark:border-dark-3 dark:bg-dark-2">
                {error ? (
                    <p className="text-sm text-red-500">{error}</p>
                ) : previewUrl ? (
                    <img
                        src={previewUrl}
                        alt={product.code}
                        className="max-h-48 max-w-full bg-white shadow ring-1 ring-gray-300"
                        style={{ aspectRatio: `${sticker.widthMm} / ${sticker.heightMm}` }}
                    />
                ) : (
                    <p className="text-sm text-gray-400">{t("common.loading")}</p>
                )}
            </div>

            <Section title={t("barcodes.sticker")}>
                <div className="grid grid-cols-2 gap-3">
                    <Field label={t("barcodes.size")}>
                        <select
                            value={settings.sizeId}
                            onChange={(e) => update({ sizeId: e.target.value as StickerSizeId })}
                            className={inputClass}
                        >
                            <option value="small">{t("barcodes.sizes.small")}</option>
                            <option value="medium">{t("barcodes.sizes.medium")}</option>
                            <option value="large">{t("barcodes.sizes.large")}</option>
                            <option value="custom">{t("barcodes.sizes.custom")}</option>
                        </select>
                    </Field>
                    <Field label={t("barcodes.orientation")}>
                        <select
                            value={settings.stickerOrientation}
                            onChange={(e) =>
                                update({ stickerOrientation: e.target.value as Orientation })
                            }
                            className={inputClass}
                        >
                            <option value="landscape">{t("barcodes.orientations.landscape")}</option>
                            <option value="portrait">{t("barcodes.orientations.portrait")}</option>
                        </select>
                    </Field>
                    {settings.sizeId === "custom" && (
                        <>
                            <NumberField
                                label={t("barcodes.widthMm")}
                                value={settings.customWidthMm}
                                min={10}
                                max={300}
                                step={0.5}
                                onChange={(v) => update({ customWidthMm: v })}
                            />
                            <NumberField
                                label={t("barcodes.heightMm")}
                                value={settings.customHeightMm}
                                min={10}
                                max={300}
                                step={0.5}
                                onChange={(v) => update({ customHeightMm: v })}
                            />
                        </>
                    )}
                </div>
                <div className="flex flex-col gap-2">
                    <CheckboxField
                        label={t("barcodes.showName")}
                        checked={settings.showName}
                        onChange={(v) => update({ showName: v })}
                    />
                    <CheckboxField
                        label={t("barcodes.showPrice")}
                        checked={settings.showPrice}
                        onChange={(v) => update({ showPrice: v })}
                    />
                    <CheckboxField
                        label={t("barcodes.showBarcodeValue")}
                        checked={settings.showBarcodeValue}
                        onChange={(v) => update({ showBarcodeValue: v })}
                    />
                </div>
                <p className="text-xs text-gray-400 dark:text-dark-5">
                    {t("barcodes.sizeHint", { width: sticker.widthMm, height: sticker.heightMm })}
                </p>
            </Section>

            <Section title={t("barcodes.pageLayout")}>
                <Field label={t("barcodes.layoutMode")}>
                    <select
                        value={settings.layoutMode}
                        onChange={(e) => update({ layoutMode: e.target.value as LayoutMode })}
                        className={inputClass}
                    >
                        <option value="sheet">{t("barcodes.layoutModes.sheet")}</option>
                        <option value="roll">{t("barcodes.layoutModes.roll")}</option>
                    </select>
                </Field>

                {isSheet && (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label={t("barcodes.paper")}>
                                <select
                                    value={settings.paperId}
                                    onChange={(e) => update({ paperId: e.target.value as PaperId })}
                                    className={inputClass}
                                >
                                    <option value="a4">{t("barcodes.papers.a4")}</option>
                                    <option value="letter">{t("barcodes.papers.letter")}</option>
                                    <option value="legal">{t("barcodes.papers.legal")}</option>
                                    <option value="custom">{t("barcodes.papers.custom")}</option>
                                </select>
                            </Field>
                            <Field label={t("barcodes.paperOrientation")}>
                                <select
                                    value={settings.paperOrientation}
                                    onChange={(e) =>
                                        update({ paperOrientation: e.target.value as Orientation })
                                    }
                                    className={inputClass}
                                >
                                    <option value="portrait">{t("barcodes.orientations.portrait")}</option>
                                    <option value="landscape">{t("barcodes.orientations.landscape")}</option>
                                </select>
                            </Field>
                            {settings.paperId === "custom" && (
                                <>
                                    <NumberField
                                        label={t("barcodes.paperWidthMm")}
                                        value={settings.paperWidthMm}
                                        min={20}
                                        max={1000}
                                        onChange={(v) => update({ paperWidthMm: v })}
                                    />
                                    <NumberField
                                        label={t("barcodes.paperHeightMm")}
                                        value={settings.paperHeightMm}
                                        min={20}
                                        max={1000}
                                        onChange={(v) => update({ paperHeightMm: v })}
                                    />
                                </>
                            )}
                        </div>

                        <p className="text-sm font-medium text-gray-600 dark:text-dark-5">
                            {t("barcodes.margins")}
                        </p>
                        <div className="grid grid-cols-4 gap-2">
                            <NumberField
                                label={t("barcodes.marginTop")}
                                value={settings.marginTopMm}
                                step={0.5}
                                onChange={(v) => update({ marginTopMm: v })}
                            />
                            <NumberField
                                label={t("barcodes.marginRight")}
                                value={settings.marginRightMm}
                                step={0.5}
                                onChange={(v) => update({ marginRightMm: v })}
                            />
                            <NumberField
                                label={t("barcodes.marginBottom")}
                                value={settings.marginBottomMm}
                                step={0.5}
                                onChange={(v) => update({ marginBottomMm: v })}
                            />
                            <NumberField
                                label={t("barcodes.marginLeft")}
                                value={settings.marginLeftMm}
                                step={0.5}
                                onChange={(v) => update({ marginLeftMm: v })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <NumberField
                                label={t("barcodes.gapX")}
                                value={settings.gapXMm}
                                step={0.5}
                                onChange={(v) => update({ gapXMm: v })}
                            />
                            <NumberField
                                label={t("barcodes.gapY")}
                                value={settings.gapYMm}
                                step={0.5}
                                onChange={(v) => update({ gapYMm: v })}
                            />
                            <NumberField
                                label={t("barcodes.columns")}
                                value={settings.columns}
                                placeholder={`${t("barcodes.auto")}`}
                                onChange={(v) => update({ columns: v })}
                            />
                            <NumberField
                                label={t("barcodes.rows")}
                                value={settings.rows}
                                placeholder={`${t("barcodes.auto")}`}
                                onChange={(v) => update({ rows: v })}
                            />
                        </div>

                        <NumberField
                            label={t("barcodes.skipSlots")}
                            value={settings.skipSlots}
                            max={layout.slots.length - 1}
                            onChange={(v) => update({ skipSlots: v })}
                        />
                        <p className="-mt-2 text-xs text-gray-400 dark:text-dark-5">
                            {t("barcodes.skipSlotsHint")}
                        </p>

                        <CheckboxField
                            label={t("barcodes.showCutLines")}
                            checked={settings.showCutLines}
                            onChange={(v) => update({ showCutLines: v })}
                        />
                    </>
                )}
            </Section>

            <Section title={t("barcodes.quantity")}>
                <NumberField
                    label={t("barcodes.copies")}
                    value={settings.copies}
                    min={1}
                    max={MAX_LABELS}
                    onChange={(v) => update({ copies: v })}
                />
                {isSheet && (
                    <CheckboxField
                        label={t("barcodes.fillPages")}
                        checked={settings.fillPages}
                        onChange={(v) => update({ fillPages: v })}
                    />
                )}
            </Section>

            {isSheet && (
                <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-dark-5">
                        {t("barcodes.layoutPreview")}
                    </p>
                    <SheetPreview
                        layout={layout}
                        sticker={sticker}
                        skip={skip}
                        filledOnFirstPage={pages[0]?.length ?? 0}
                        stickerUrl={previewUrl}
                        showCutLines={settings.showCutLines}
                    />
                </div>
            )}

            <p className="text-xs text-gray-500 dark:text-dark-5">
                {t("barcodes.layoutSummary", {
                    perPage: layout.slots.length,
                    columns: layout.columns,
                    rows: layout.rows,
                    pages: pages.length,
                    total: totalLabels,
                })}
            </p>
            {!layout.fits && (
                <p className="text-sm text-amber-600">{t("barcodes.layoutDoesNotFit")}</p>
            )}
            {actionError && <p className="text-sm text-red-500">{actionError}</p>}

            <div className="flex flex-col gap-2">
                <button
                    type="button"
                    onClick={() => void handlePrint(true)}
                    disabled={disabled}
                    className="rounded-lg bg-primary px-4 py-2.5 font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
                >
                    {t("barcodes.print")}
                </button>
                <button
                    type="button"
                    onClick={() => void handlePrint(false)}
                    disabled={disabled}
                    className={secondaryButton}
                >
                    {t("barcodes.previewPrintPage")}
                </button>
                <button
                    type="button"
                    onClick={() => void handleDownloadPdf()}
                    disabled={disabled}
                    className={secondaryButton}
                >
                    {busy ? t("common.loading") : t("barcodes.downloadPdf")}
                </button>
                <button
                    type="button"
                    onClick={() => void handleDownloadImage()}
                    disabled={disabled}
                    className={secondaryButton}
                >
                    {t("barcodes.downloadImage")}
                </button>
                <button
                    type="button"
                    onClick={() => setSettings(DEFAULT_SETTINGS)}
                    className="text-sm text-gray-500 underline hover:text-gray-700 dark:text-dark-5"
                >
                    {t("barcodes.resetSettings")}
                </button>
            </div>
        </div>
    );
}
