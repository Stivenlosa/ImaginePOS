const TAB_PREFIX = "imaginepos.tab.";
const TAB_KEY = "imaginepos.tabId";
const STALE_MS = 8000;

function tabKeys() {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(TAB_PREFIX)) keys.push(key);
  }
  return keys;
}

/** Each window writes its own key, so two windows closing at once can't overwrite each other. */
function liveCount(exceptId?: string) {
  const now = Date.now();
  let count = 0;
  for (const key of tabKeys()) {
    const seen = Number(localStorage.getItem(key));
    if (!Number.isFinite(seen) || now - seen >= STALE_MS) {
      localStorage.removeItem(key);
      continue;
    }
    if (key.slice(TAB_PREFIX.length) !== exceptId) count++;
  }
  return count;
}

function touch(id: string) {
  localStorage.setItem(TAB_PREFIX + id, String(Date.now()));
}

function armLogout() {
  const body = JSON.stringify({ t: Date.now() });
  navigator.sendBeacon("/api/auth/arm-logout", new Blob([body], { type: "application/json" }));
}

let decision: { shouldLogout: boolean; tabId: string } | null = null;
let stopListeners: (() => void) | null = null;

/**
 * Tracks open app windows. A brand-new window with no other window still open
 * should sign the user out. A refresh keeps sessionStorage, so it stays signed in.
 * The decision is cached so React strict mode doesn't treat the remount as a refresh.
 */
export function startWindowSession() {
  if (!decision) {
    const existingId = sessionStorage.getItem(TAB_KEY);
    const tabId = existingId ?? crypto.randomUUID();
    const othersOpen = liveCount(tabId) > 0;
    sessionStorage.setItem(TAB_KEY, tabId);
    touch(tabId);
    decision = { shouldLogout: !existingId && !othersOpen, tabId };
  }

  if (!stopListeners) {
    const tabId = decision.tabId;
    const timer = window.setInterval(() => touch(tabId), 3000);
    const onHide = () => {
      localStorage.removeItem(TAB_PREFIX + tabId);
      if (liveCount() === 0) armLogout();
    };
    window.addEventListener("pagehide", onHide);
    stopListeners = () => {
      window.clearInterval(timer);
      window.removeEventListener("pagehide", onHide);
      stopListeners = null;
    };
  }

  return {
    shouldLogout: decision.shouldLogout,
    stop: () => stopListeners?.(),
  };
}
