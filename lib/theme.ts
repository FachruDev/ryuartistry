export type Theme = "light" | "dark";

export const THEME_KEY = "theme";

/**
 * Runs in <head> before first paint: a saved choice wins, otherwise follow the system.
 * Kept as a plain string so the server can inline it.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
