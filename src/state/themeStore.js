import { ref } from "vue";

const STORAGE_KEY = "kue_theme";

// Theme preference: "system" | "light" | "dark"
const storedTheme = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
export const currentTheme = ref(storedTheme || "system");

// The actually applied theme: "light" | "dark"
export const resolvedTheme = ref("light");

let mediaQuery = null;

function getSystemTheme() {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

function applyTheme(theme) {
  const actual = theme === "system" ? getSystemTheme() : theme;
  resolvedTheme.value = actual;
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", actual);
    if (actual === "dark") {
      document.documentElement.classList.add("dark-theme");
    } else {
      document.documentElement.classList.remove("dark-theme");
    }
  }
}

export function setTheme(theme) {
  if (!["light", "dark", "system"].includes(theme)) return;
  currentTheme.value = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore storage errors
  }
  applyTheme(theme);
}

export function initTheme() {
  if (typeof window === "undefined") return;

  mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleSystemChange = () => {
    if (currentTheme.value === "system") {
      applyTheme("system");
    }
  };

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", handleSystemChange);
  } else if (mediaQuery.addListener) {
    mediaQuery.addListener(handleSystemChange);
  }

  applyTheme(currentTheme.value);
}
