/* =============================================================================
   AI PLAYTIME PROMPT LIBRARY — ADMIN EDITOR
   Login-gated CRUD over the Supabase `prompts` table. Only an authenticated
   session can insert/update/delete (enforced by RLS in the database).
   ========================================================================== */

(function () {
  "use strict";

  var AIP = window.AIP || {};
  var sb = AIP.client;

  var view = {
    notconfigured: document.getElementById("notconfigured"),
    login: document.getElementById("login-view"),
    editor: document.getElementById("editor-view")
  };

  var el = {
    loginForm: document.getElementById("login-form"),
    email: document.getElementById("email"),
    password: document.getElementById("password"),
    loginError: document.getElementById("login-error"),
    loginBtn: document.getElementById("login-btn"),

    signedAs: document.getElementById("signed-as"),
    signout: document.getElementById("signout-btn"),

    form: document.getElementById("prompt-form"),
    formHeading: document.getElementById("form-heading"),
    editId: document.getElementById("edit-id"),
    fTitle: document.getElementById("f-title"),
    fCategory: document.getElementById("f-category"),
    fDate: document.getElementById("f-date"),
    fBody: document.getElementById("f-body"),
    formError: document.getElementById("form-error"),
    saveBtn: document.getElementById("save-btn"),
    cancelBtn: document.getElementById("cancel-btn"),
    catList: document.getElementById("cat-list"),

    list: document.getElementById("admin-list"),
    listCount: document.getElementById("list-count")
  };

  var prompts = [];

  /* --------------------------------- HELPERS ------------------------------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function todayISO() { return new Date().toISOString().slice(0, 10); }
  function show(node) { if (node) node.style.display = ""; }
  function hide(node) { if (node) node.style.display = "none"; }

  /* -------------------------------- AUTH GATE ------------------------------ */
  function boot() {
    if (!AIP.configured || !sb) {
      show(view.notconfigured);
      return;
    }
    sb.auth.getSession().then(function (res) {
      var session = res && res.data ? res.data.session : null;
      if (session) enterEditor(session);
      else showLogin();
    });

    sb.auth.onAuthStateChange(function (_event, session) {
      if (session) enterEditor(session);
      else showLogin();
    });
  }

  function showLogin() {
    hide(view.editor);
    show(view.login);
  }

  function enterEditor(session) {
    hide(view.login);
    show(view.editor);
    var email = session && session.user ? session.user.email : "";
    el.signedAs.textContent = email ? "Signed in as " + email : "";
    el.fDate.value = el.fDate.value || todayISO();
    loadPrompts();
  }

  /* --------------------------------- LOGIN --------------------------------- */
  el.loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    el.loginError.textContent = "";
    el.loginBtn.disabled = true;
    el.loginBtn.textContent = "Signing in…";
    sb.auth.signInWithPassword({
      email: el.email.value.trim(),
      password: el.password.value
    }).then(function (res) {
      el.loginBtn.disabled = false;
      el.loginBtn.textContent = "Sign in";
      if (res.error) {
        el.loginError.textContent = res.error.message || "Sign in failed.";
      }
      // success handled by onAuthStateChange
    });
  });

  el.signout.addEventListener("click", function () {
    sb.auth.signOut();
  });

  /* -------------------------------- LOAD LIST ------------------------------ */
  function loadPrompts() {
    el.list.innerHTML = '<p class="muted-line">Loading…</p>';
    sb.from("prompts")
      .select("id,title,body,category,date,copy_count")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .then(function (res) {
        if (res.error) {
          el.list.innerHTML = '<p class="form-error">' + esc(res.error.message) + '</p>';
          return;
        }
        prompts = res.data || [];
        refreshCategoryDatalist();
        renderList();
      });
  }

  function refreshCategoryDatalist() {
    var order = (window.AIP_CONFIG && window.AIP_CONFIG.CATEGORY_ORDER) || [];
    var seen = {}, cats = [];
    order.concat(prompts.map(function (p) { return p.category; })).forEach(function (c) {
      if (c && !seen[c]) { seen[c] = 1; cats.push(c); }
    });
    el.catList.innerHTML = cats.map(function (c) {
      return '<option value="' + esc(c) + '"></option>';
    }).join("");
  }

  function renderList() {
    var newest = prompts.length ? prompts[0].date : null;
    el.listCount.textContent = "(" + prompts.length + ")";
    if (!prompts.length) {
      el.list.innerHTML = '<p class="muted-line">No prompts yet. Add your first one above.</p>';
      return;
    }
    el.list.innerHTML = "";
    prompts.forEach(function (p) {
      var row = document.createElement("div");
      row.className = "admin-row";
      var isNew = p.date === newest;
      row.innerHTML =
        '<div class="admin-row-main">' +
          '<div class="admin-row-top">' +
            '<span class="tag">' + esc(p.category) + '</span>' +
            (isNew ? '<span class="badge-new">New</span>' : '') +
            '<span class="admin-meta">' + esc(p.date) + ' · ' + (p.copy_count || 0) + ' copies</span>' +
          '</div>' +
          '<strong class="admin-row-title">' + esc(p.title) + '</strong>' +
          '<p class="admin-row-body">' + esc(p.body) + '</p>' +
        '</div>' +
        '<div class="admin-row-actions">' +
          '<button class="btn-ghost sm" type="button" data-act="edit">Edit</button>' +
          '<button class="btn-ghost sm danger" type="button" data-act="delete">Delete</button>' +
        '</div>';

      row.querySelector('[data-act="edit"]').addEventListener("click", function () { startEdit(p); });
      row.querySelector('[data-act="delete"]').addEventListener("click", function () { doDelete(p); });
      el.list.appendChild(row);
    });
  }

  /* ------------------------------ ADD / EDIT ------------------------------- */
  function resetForm() {
    el.editId.value = "";
    el.form.reset();
    el.fDate.value = todayISO();
    el.formHeading.textContent = "Add a new prompt";
    el.saveBtn.textContent = "Add prompt";
    hide(el.cancelBtn);
    el.formError.textContent = "";
  }

  function startEdit(p) {
    el.editId.value = p.id;
    el.fTitle.value = p.title;
    el.fCategory.value = p.category;
    el.fDate.value = p.date;
    el.fBody.value = p.body;
    el.formHeading.textContent = "Edit prompt";
    el.saveBtn.textContent = "Save changes";
    show(el.cancelBtn);
    el.formError.textContent = "";
    el.fTitle.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  el.cancelBtn.addEventListener("click", resetForm);

  el.form.addEventListener("submit", function (e) {
    e.preventDefault();
    el.formError.textContent = "";
    var record = {
      title: el.fTitle.value.trim(),
      category: el.fCategory.value.trim(),
      date: el.fDate.value,
      body: el.fBody.value.trim()
    };
    if (!record.title || !record.category || !record.date || !record.body) {
      el.formError.textContent = "All fields are required.";
      return;
    }
    el.saveBtn.disabled = true;
    var original = el.saveBtn.textContent;
    el.saveBtn.textContent = "Saving…";

    var editingId = el.editId.value;
    var op = editingId
      ? sb.from("prompts").update(record).eq("id", editingId)
      : sb.from("prompts").insert(record);

    op.then(function (res) {
      el.saveBtn.disabled = false;
      el.saveBtn.textContent = original;
      if (res.error) {
        el.formError.textContent = res.error.message || "Could not save.";
        return;
      }
      resetForm();
      loadPrompts();
    });
  });

  /* -------------------------------- DELETE --------------------------------- */
  function doDelete(p) {
    if (!window.confirm('Delete "' + p.title + '"? This cannot be undone.')) return;
    sb.from("prompts").delete().eq("id", p.id).then(function (res) {
      if (res.error) { window.alert("Delete failed: " + res.error.message); return; }
      loadPrompts();
    });
  }

  /* ---------------------------------- START -------------------------------- */
  boot();
})();
