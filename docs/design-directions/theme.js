/* Shared light/dark control for all design directions.
   Three states, matching how a real viewer behaves:
     - no stored choice  -> follow the OS (prefers-color-scheme)
     - stored "light"    -> force light, even on a dark OS
     - stored "dark"     -> force dark,  even on a light OS
   Every direction defines its palette on bare :root (light) and overrides it in
   both @media (prefers-color-scheme: dark) and :root[data-theme="dark"], so the
   toggle wins in either direction. */
(function () {
  var KEY = "wapsi-design-theme";
  var root = document.documentElement;

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function apply(mode) {
    if (mode === "light" || mode === "dark") root.setAttribute("data-theme", mode);
    else root.removeAttribute("data-theme");   /* fall back to the OS */
  }
  function resolved() {
    var s = stored();
    if (s) return s;
    return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  apply(stored());   /* run before paint to avoid a flash */

  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-toggle";
    btn.setAttribute("aria-live", "polite");

    var css = document.createElement("style");
    css.textContent =
      ".theme-toggle{position:fixed;right:12px;bottom:12px;z-index:9999;" +
      "font:500 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;" +
      "text-transform:uppercase;padding:9px 13px;border-radius:6px;cursor:pointer;" +
      "background:rgba(128,128,128,.16);color:inherit;" +
      "border:1px solid rgba(128,128,128,.42);backdrop-filter:blur(8px);" +
      "transition:background .18s,border-color .18s,transform .1s}" +
      ".theme-toggle:hover{background:rgba(128,128,128,.3)}" +
      ".theme-toggle:active{transform:translateY(1px)}" +
      ".theme-toggle:focus-visible{outline:2px solid currentColor;outline-offset:3px}" +
      "@media(prefers-reduced-motion:reduce){.theme-toggle{transition:none}}" +
      /* Scrollbars: standard property + WebKit fallback. Translucent grey, not a
         token — the 13 directions have 13 palettes, and rgba(128,128,128) reads
         correctly over every one of them in both light and dark. */
      "*{scrollbar-width:thin;scrollbar-color:rgba(128,128,128,.55) transparent}" +
      "::-webkit-scrollbar{width:10px;height:10px}" +
      "::-webkit-scrollbar-track{background:transparent}" +
      "::-webkit-scrollbar-thumb{background:rgba(128,128,128,.45);border-radius:6px}" +
      "::-webkit-scrollbar-thumb:hover{background:rgba(128,128,128,.7)}" +
      "::-webkit-scrollbar-corner{background:transparent}";
    document.head.appendChild(css);

    function label() {
      var s = stored();
      var now = resolved();
      var next = now === "dark" ? "light" : "dark";
      btn.textContent = (now === "dark" ? "◑ dark" : "◐ light") + (s ? "" : " · auto");
      btn.title = "Switch to " + next + " (currently " + now + (s ? ", locked" : ", following your system") + ")";
      btn.setAttribute("aria-label", btn.title);
    }

    btn.addEventListener("click", function () {
      var next = resolved() === "dark" ? "light" : "dark";
      try { localStorage.setItem(KEY, next); } catch (e) {}
      apply(next); label();
    });

    /* long-press / right-click returns to following the OS */
    btn.addEventListener("contextmenu", function (e) {
      e.preventDefault();
      try { localStorage.removeItem(KEY); } catch (e2) {}
      apply(null); label();
    });

    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
      if (!stored()) label();
    });

    document.body.appendChild(btn);
    label();
  });
})();
