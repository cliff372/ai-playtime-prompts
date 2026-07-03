/* =============================================================================
   AI PLAYTIME PROMPT LIBRARY — PUBLIC APP
   Reads prompts from Supabase, renders cards, handles category filter, keyword
   search, newest-first sort, "New" badge, and copy-to-clipboard. Copies bump a
   counter in the database via a safe RPC (public can only increment, not edit).
   ========================================================================== */

(function () {
  "use strict";

  var prompts = [];
  var newestDate = null;
  var state = { category: "All", query: "" };

  var els = {
    grid: document.getElementById("grid"),
    filters: document.getElementById("filters"),
    search: document.getElementById("search"),
    count: document.getElementById("count")
  };

  /* ---------------------------------- ICONS -------------------------------- */
  var COPY_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  var CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  var SEARCH_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';

  /* --------------------------------- ESCAPING ------------------------------ */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ------------------------------ CATEGORY LIST ---------------------------- */
  function categoryList() {
    var order = (window.AIP_CONFIG && window.AIP_CONFIG.CATEGORY_ORDER) || [];
    var seen = {};
    var out = [];
    // preferred order first (only those actually in use OR always show them)
    order.forEach(function (c) { if (!seen[c]) { seen[c] = 1; out.push(c); } });
    // then any categories present in data that weren't listed
    prompts.forEach(function (p) {
      if (p.category && !seen[p.category]) { seen[p.category] = 1; out.push(p.category); }
    });
    return out;
  }

  /* ------------------------------ FILTER CHIPS ----------------------------- */
  function buildFilters() {
    var all = ["All"].concat(categoryList());
    els.filters.innerHTML = "";
    all.forEach(function (cat) {
      var btn = document.createElement("button");
      btn.className = "chip" + (state.category === cat ? " active" : "");
      btn.textContent = cat;
      btn.setAttribute("aria-pressed", state.category === cat ? "true" : "false");
      btn.addEventListener("click", function () {
        state.category = cat;
        buildFilters();
        render();
      });
      els.filters.appendChild(btn);
    });
  }

  /* -------------------------------- FILTERING ------------------------------ */
  function visiblePrompts() {
    var q = state.query.trim().toLowerCase();
    return prompts.filter(function (p) {
      if (state.category !== "All" && p.category !== state.category) return false;
      if (q) {
        var hay = (p.title + " " + p.body + " " + p.category).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  /* --------------------------------- RENDER -------------------------------- */
  function render() {
    var list = visiblePrompts();
    els.count.textContent = list.length + (list.length === 1 ? " prompt" : " prompts");

    if (!list.length) {
      els.grid.innerHTML =
        '<div class="empty"><strong>No prompts found</strong>' +
        'Try a different category or clear your search.</div>';
      return;
    }

    els.grid.innerHTML = "";
    list.forEach(function (p) {
      var card = document.createElement("article");
      card.className = "card";
      var isNew = p.date && p.date === newestDate;

      card.innerHTML =
        '<div class="card-top">' +
          '<h3>' + esc(p.title) + '</h3>' +
          (isNew ? '<span class="badge-new">New</span>' : '') +
        '</div>' +
        '<p class="prompt-text">' + esc(p.body) + '</p>' +
        '<div class="card-foot">' +
          '<span class="tag">' + esc(p.category) + '</span>' +
          '<button class="copy-btn" type="button">' + COPY_ICON + '<span>Copy</span></button>' +
        '</div>';

      var btn = card.querySelector(".copy-btn");
      btn.addEventListener("click", function (e) { e.stopPropagation(); doCopy(p, btn); });
      card.addEventListener("click", function () { openModal(p); });
      els.grid.appendChild(card);
    });
  }

  /* ---------------------------------- COPY --------------------------------- */
  function doCopy(p, btn, label) {
    label = label || "Copy";
    function success() {
      trackCopy(p);
      btn.classList.add("copied");
      btn.innerHTML = CHECK_ICON + '<span>Copied!</span>';
      setTimeout(function () {
        btn.classList.remove("copied");
        btn.innerHTML = COPY_ICON + '<span>' + label + '</span>';
      }, 1600);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(p.body).then(success).catch(function () {
        legacyCopy(p.body, success);
      });
    } else {
      legacyCopy(p.body, success);
    }
  }

  function legacyCopy(text, done) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta); done();
  }

  // Bump the copy counter in the database. Fire-and-forget; never blocks copy.
  function trackCopy(p) {
    try {
      if (window.AIP && window.AIP.client && p.id != null) {
        window.AIP.client.rpc("increment_copy_count", { prompt_id: p.id });
      }
    } catch (e) { /* ignore */ }
  }

  /* ---------------------------------- MODAL -------------------------------- */
  var modal = {
    back: document.getElementById("modal"),
    title: document.getElementById("modal-title"),
    tag: document.getElementById("modal-tag"),
    text: document.getElementById("modal-text"),
    badge: document.getElementById("modal-new"),
    copy: document.getElementById("modal-copy"),
    close: document.getElementById("modal-close")
  };

  function openModal(p) {
    modal.title.textContent = p.title;
    modal.tag.textContent = p.category;
    modal.text.textContent = p.body;
    modal.badge.style.display = (p.date && p.date === newestDate) ? "" : "none";
    modal.copy.className = "copy-btn big";
    modal.copy.innerHTML = COPY_ICON + '<span>Copy prompt</span>';
    modal.copy.onclick = function () { doCopy(p, modal.copy, "Copy prompt"); };
    modal.back.classList.add("open");
    modal.back.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.back.classList.remove("open");
    modal.back.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  /* --------------------------------- LOADING ------------------------------- */
  function showMessage(strongText, subText) {
    els.grid.innerHTML =
      '<div class="empty"><strong>' + esc(strongText) + '</strong>' + esc(subText) + '</div>';
  }

  function loadPrompts() {
    if (!window.AIP || !window.AIP.configured || !window.AIP.client) {
      showMessage("Almost there", "Add your Supabase keys in config.js to load the library. (See SETUP.md)");
      els.count.textContent = "";
      return;
    }
    showMessage("Loading prompts…", "");
    window.AIP.client
      .from("prompts")
      .select("id,title,body,category,date,copy_count")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .then(function (res) {
        if (res.error) {
          showMessage("Couldn't load prompts", res.error.message);
          return;
        }
        prompts = res.data || [];
        newestDate = prompts.length ? prompts[0].date : null;
        buildFilters();
        render();
      });
  }

  /* ---------------------------------- INIT --------------------------------- */
  function init() {
    document.getElementById("search-icon").innerHTML = SEARCH_ICON;

    // Modal close: X button, click on backdrop, or Escape key
    modal.close.addEventListener("click", closeModal);
    modal.back.addEventListener("click", function (e) {
      if (e.target === modal.back) closeModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.back.classList.contains("open")) closeModal();
    });

    // Power toggle: gates the library, remembers state per visitor
    var power = document.getElementById("power-toggle");
    if (power) {
      var root = document.documentElement;
      power.setAttribute("aria-checked", root.classList.contains("lib-on") ? "true" : "false");
      power.addEventListener("click", function () {
        var on = !root.classList.contains("lib-on");
        root.classList.toggle("lib-on", on);
        root.classList.toggle("lib-off", !on);
        power.setAttribute("aria-checked", on ? "true" : "false");
        try { localStorage.setItem("aip_power", on ? "on" : "off"); } catch (e) {}
        if (on) {
          var lib = document.getElementById("library");
          if (lib && lib.scrollIntoView) lib.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }

    var t;
    els.search.addEventListener("input", function (e) {
      clearTimeout(t);
      var val = e.target.value;
      t = setTimeout(function () { state.query = val; render(); }, 90);
    });
    loadPrompts();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
