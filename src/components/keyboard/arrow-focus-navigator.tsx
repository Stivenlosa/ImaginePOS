"use client";

import { useEffect } from "react";

const FOCUSABLE = [
    "button:not([disabled])",
    "a[href]",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "summary",
    "[role='button']:not([aria-disabled='true'])",
    "[tabindex]:not([tabindex='-1'])",
].join(",");

const NEXT_KEYS = new Set(["ArrowDown", "ArrowRight"]);
const PREV_KEYS = new Set(["ArrowUp", "ArrowLeft"]);

function isTextEntry(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return false;
    if (target.isContentEditable) return true;
    const tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/**
 * Inside a field, Left/Right leave it only when the caret is already at that
 * edge, so cashiers can still move through text they typed. Up/Down stay with
 * the field (number steppers, selects).
 */
function canLeaveField(target: HTMLElement, key: string) {
    if (key === "ArrowUp" || key === "ArrowDown") return false;
    if (target.isContentEditable) return false;
    if (target instanceof HTMLSelectElement) return true;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
        return false;
    }

    let start: number | null = null;
    let end: number | null = null;
    try {
        start = target.selectionStart;
        end = target.selectionEnd;
    } catch {
        // number / email inputs don't expose a caret
    }
    if (start === null || end === null) return true;
    if (start !== end) return false;

    return key === "ArrowLeft" ? start === 0 : end === target.value.length;
}

function isVisible(el: HTMLElement) {
    if (el.closest("[inert], [aria-hidden='true']")) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
}

function getScope(): ParentNode {
    const dialogs = document.querySelectorAll<HTMLElement>("[aria-modal='true']");
    return dialogs.length > 0 ? dialogs[dialogs.length - 1] : document;
}

function getFocusable(scope: ParentNode) {
    return Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(isVisible);
}

/**
 * Arrow keys move focus between controls (like Tab / Shift+Tab) instead of
 * scrolling. Components with their own arrow handling call preventDefault and
 * are left alone; text fields release focus with Left/Right at the caret edge.
 */
export function ArrowFocusNavigator() {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.defaultPrevented) return;
            if (event.ctrlKey || event.metaKey || event.altKey) return;
            const forward = NEXT_KEYS.has(event.key);
            if (!forward && !PREV_KEYS.has(event.key)) return;
            if (
                isTextEntry(event.target) &&
                !canLeaveField(event.target as HTMLElement, event.key)
            ) {
                return;
            }

            const scope = getScope();
            const focusable = getFocusable(scope);
            if (focusable.length === 0) return;

            event.preventDefault();

            const active = document.activeElement as HTMLElement | null;
            const index = active ? focusable.indexOf(active) : -1;

            let next: HTMLElement | undefined;
            if (index === -1) {
                next =
                    scope.querySelector<HTMLElement>("[data-product-item]") ??
                    (forward ? focusable[0] : focusable[focusable.length - 1]);
            } else {
                const offset = forward ? 1 : -1;
                next = focusable[(index + offset + focusable.length) % focusable.length];
            }

            next?.focus();
            next?.scrollIntoView({ block: "nearest", inline: "nearest" });
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return null;
}
