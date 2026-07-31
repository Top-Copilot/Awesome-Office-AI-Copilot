(() => {
  "use strict";

  const root = document.documentElement;
  const STORAGE_KEY = "aoac-lang";

  const ui = {
    en: {
      title: "Office AI Copilots: 2026 Directory of AI Assistants for Word, Excel & PowerPoint",
      count: (n, total) => n + " of " + total + " products",
      all: "All"
    },
    zh: {
      title: "全球 Office AI Copilot 精选目录 · 2026",
      count: (n, total) => n + " / " + total + " 个产品",
      all: "全部"
    }
  };

  const t = () => (root.dataset.language === "zh" ? ui.zh : ui.en);

  const esc = (value) => String(value).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));

  function setLanguage(lang) {
    root.dataset.language = lang;
    root.lang = lang === "zh" ? "zh-CN" : "en";
    document.title = t().title;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}
  }

  let saved = "en";
  try {
    saved = localStorage.getItem(STORAGE_KEY)
      || ((navigator.language || "").toLowerCase().startsWith("zh") ? "zh" : "en");
  } catch (_) {}
  setLanguage(saved);

  const languageBtn = document.getElementById("language");
  if (languageBtn) {
    languageBtn.addEventListener("click", () => {
      setLanguage(root.dataset.language === "zh" ? "en" : "zh");
    });
  }

  const groups = Array.from(document.querySelectorAll(".directory-group"));
  const cards = Array.from(document.querySelectorAll(".card"));
  const filtersEl = document.getElementById("filters");
  const countEl = document.getElementById("count");
  const emptyEl = document.getElementById("empty");
  const searchInput = document.getElementById("search");

  let category = "All";
  let query = "";

  function groupLabel(group) {
    const el = group.querySelector(".group-title .en");
    return el ? el.textContent.trim() : group.dataset.category;
  }

  function renderFilters() {
    if (!filtersEl) return;
    const categories = ["All", ...new Set(groups.map((g) => g.dataset.category))];
    filtersEl.innerHTML = categories.map((cat) => {
      const label = cat === "All"
        ? t().all
        : groupLabel(groups.find((g) => g.dataset.category === cat));
      return `<button type="button" class="filter${cat === category ? " active" : ""}" data-category="${esc(cat)}">${esc(label)}</button>`;
    }).join("");
    filtersEl.querySelectorAll(".filter").forEach((btn) => {
      btn.addEventListener("click", () => {
        category = btn.dataset.category;
        renderFilters();
        apply();
      });
    });
  }

  function apply() {
    cards.forEach((card) => {
      const matchesCategory = category === "All" || card.dataset.category === category;
      const haystack = (card.textContent || "").toLowerCase();
      const matchesQuery = !query || haystack.indexOf(query) !== -1;
      card.hidden = !(matchesCategory && matchesQuery);
    });
    let visible = 0;
    groups.forEach((group) => {
      const shown = Array.from(group.querySelectorAll(".card")).filter((c) => !c.hidden);
      group.hidden = shown.length === 0;
      visible += shown.length;
    });
    if (countEl) countEl.textContent = t().count(visible, cards.length);
    if (emptyEl) emptyEl.hidden = visible !== 0;
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      query = searchInput.value.trim().toLowerCase();
      apply();
    });
  }

  renderFilters();
  apply();
})();
