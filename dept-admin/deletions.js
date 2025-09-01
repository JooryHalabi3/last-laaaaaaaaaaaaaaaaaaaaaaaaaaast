/* =========================================================================
 * AOUNAK — deletions.js
 * صفحة: deletions.html (مرحلة الأدمن لتأكيد طلبات الحذف)
 * يعتمد على بنية الجدول والمودالات الموجودة في الصفحة،
 * وعلى جدول delete_requests وحقوله كما في قاعدة البيانات.
 * -------------------------------------------------------------------------
 * HTML targets used:
 *   - Stats:  #statPending, #statConfirmed, #statApproved, #statRejected
 *   - Filters: #fromDate, #toDate, #entity, #status, #q
 *   - Table:   #deletionsTable > tbody, #checkAll, #bulkConfirmBtn
 *   - Modals:  #snapshotModal (#snapshotBox), #confirmModal
 *              #adminConfirmAcknowledge, #confirmSendBtn
 *   - Lang:    #langToggle
 * -------------------------------------------------------------------------
 * DB (delete_requests) key fields used:
 *   RequestID, TableName, RecordPK, RequestedBy, ConfirmedByAdminAt,
 *   ApprovedBySuperAt, Status (pending|admin_confirmed|approved|rejected),
 *   Snapshot(JSON), CreatedAt, RejectedReason (optional)
 * ========================================================================= */

(function () {
  // ----------------------------- Config -----------------------------------
  // عدّل المسارات حسب الـ backend عندك
  const API = {
    // جلب القائمة مع فلاتر
    list: (params) => `/api/deletions?${toQuery(params)}`,
    // تأكيد مفرد
    confirmOne: (id) => `/api/deletions/${encodeURIComponent(id)}/confirm`,
    // تأكيد جماعي
    confirmBulk: `/api/deletions/confirm`,
    // رفض مفرد
    rejectOne: (id) => `/api/deletions/${encodeURIComponent(id)}/reject`,
    // قد لا تحتاجها إذا كان الـ Snapshot يأتي ضمن القائمة
    snapshot: (id) => `/api/deletions/${encodeURIComponent(id)}/snapshot`,
  };

  // ترجمة اسم الكيان
  const ENTITY_LABELS = {
    ar: {
      complaints: "الشكاوى",
      users: "المستخدمون",
      attachments: "المرفقات",
      featured_people: "المميزون",
      departments: "الأقسام",
      unknown: "غير معروف",
    },
    en: {
      complaints: "Complaints",
      users: "Users",
      attachments: "Attachments",
      featured_people: "Featured People",
      departments: "Departments",
      unknown: "Unknown",
    },
  };

  // -------------------------- State / Refs --------------------------------
  const state = {
    currentLang: document.body.classList.contains("lang-en") ? "en" : "ar",
    rows: [],
    selected: new Set(),
    pendingConfirmIds: [], // ids to confirm when modal OK
  };

  // عناصر الصفحة
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const refs = {
    // إحصائيات
    statPending: $("#statPending"),
    statConfirmed: $("#statConfirmed"),
    statApproved: $("#statApproved"),
    statRejected: $("#statRejected"),

    // فلاتر
    fromDate: $("#fromDate"),
    toDate: $("#toDate"),
    entity: $("#entity"),
    status: $("#status"),
    q: $("#q"),
    applyFiltersBtn: $("#applyFiltersBtn"),
    resetFiltersBtn: $("#resetFiltersBtn"),

    // جدول
    tableBody: $("#deletionsTable tbody"),
    checkAll: $("#checkAll"),
    bulkConfirmBtn: $("#bulkConfirmBtn"),

    // مودال Snapshot
    snapshotModal: $("#snapshotModal"),
    snapshotBox: $("#snapshotBox"),

    // مودال تأكيد الإدمن
    confirmModal: $("#confirmModal"),
    adminConfirmAcknowledge: $("#adminConfirmAcknowledge"),
    confirmSendBtn: $("#confirmSendBtn"),

    // اللغة والعودة
    langToggle: $("#langToggle"),
  };

  // ----------------------------- Init -------------------------------------
  document.addEventListener("DOMContentLoaded", init);

  function init() {
    bindEvents();
    loadList(); // تحميل أولي
  }

  function bindEvents() {
    // فلاتر
    if (refs.applyFiltersBtn) {
      refs.applyFiltersBtn.addEventListener("click", () => loadList());
    }
    if (refs.resetFiltersBtn) {
      refs.resetFiltersBtn.addEventListener("click", () => {
        if (refs.fromDate) refs.fromDate.value = "";
        if (refs.toDate) refs.toDate.value = "";
        if (refs.entity) refs.entity.value = "";
        if (refs.status) refs.status.value = "";
        if (refs.q) refs.q.value = "";
        loadList();
      });
    }

    // تحديد الكل
    if (refs.checkAll) {
      refs.checkAll.addEventListener("change", (e) => {
        const checked = e.target.checked;
        $$("#deletionsTable tbody input[type=checkbox].row-check").forEach(
          (cb) => {
            if (!cb.disabled) cb.checked = checked;
            const id = cb.getAttribute("data-id");
            if (id) {
              if (checked && !cb.disabled) state.selected.add(id);
              else state.selected.delete(id);
            }
          }
        );
      });
    }

    // تأكيد جماعي
    if (refs.bulkConfirmBtn) {
      refs.bulkConfirmBtn.addEventListener("click", onBulkConfirm);
    }

    // إغلاق المودالات عبر [data-close]
    $$("[data-close]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const modal = btn.closest(".modal");
        if (modal) closeModal(modal.id);
      });
    });

    // تمكين زر الإرسال بعد الإقرار
    if (refs.adminConfirmAcknowledge && refs.confirmSendBtn) {
      refs.adminConfirmAcknowledge.addEventListener("change", () => {
        refs.confirmSendBtn.disabled = !refs.adminConfirmAcknowledge.checked;
      });
      refs.confirmSendBtn.addEventListener("click", onConfirmSend);
    }

    // تبديل اللغة (إن وجِد)
    if (refs.langToggle) {
      refs.langToggle.addEventListener("click", toggleLang);
    }

    // زر الرجوع المعرّف في HTML onclick="goBack()" (للدعم هنا أيضًا)
    window.goBack = () => window.history.back();
  }

  // ---------------------------- Data Load ---------------------------------
  async function loadList() {
    setLoading(true);
    try {
      const params = {
        from: refs.fromDate?.value || "",
        to: refs.toDate?.value || "",
        entity: refs.entity?.value || "",
        status: refs.status?.value || "",
        q: refs.q?.value || "",
      };
      const res = await apiGet(API.list(params));
      state.rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      renderTable(state.rows);
      updateStats(state.rows);
      state.selected.clear();
      if (refs.checkAll) refs.checkAll.checked = false;
    } catch (err) {
      console.error(err);
      toast("تعذر تحميل البيانات", "error");
      renderEmpty();
      updateStats([]);
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------- Rendering ---------------------------------
  function renderEmpty() {
    if (!refs.tableBody) return;
    refs.tableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="10" data-ar="لا توجد بيانات للعرض" data-en="No data to display">
          ${state.currentLang === "en" ? "No data to display" : "لا توجد بيانات للعرض"}
        </td>
      </tr>`;
  }

  function renderTable(rows) {
    if (!refs.tableBody) return;
    if (!rows?.length) {
      renderEmpty();
      return;
    }

    const isAr = state.currentLang === "ar";
    const html = rows
      .map((row) => {
        const id = row.RequestID ?? row.requestId ?? row.id;
        const tableName = (row.TableName || row.tableName || "unknown").toString();
        const entityLabel = resolveEntityLabel(tableName);
        const record = (row.RecordPK ?? row.recordPk ?? row.recordId ?? "").toString();
        const createdAt = formatDate(row.CreatedAt || row.createdAt);
        const status = (row.Status || row.status || "pending").toString();
        const adminStage = row.ConfirmedByAdminAt || row.confirmedByAdminAt ? (isAr ? "مؤكَّد" : "Confirmed") : (isAr ? "—" : "—");
        const reason = extractReason(row) || "—";
        const requestedBy =
          row.RequestedByName ||
          row.requestedByName ||
          row.RequestedByFullName ||
          row.requestedByFullName ||
          row.RequestedBy ||
          row.requestedBy ||
          "—";

        const canCheck = status === "pending"; // اختيار فقط المعلقة
        const disabledAttr = canCheck ? "" : "disabled";

        return `
          <tr>
            <td>
              <input type="checkbox" class="row-check" data-id="${id}" ${disabledAttr} />
            </td>
            <td>#${id}</td>
            <td>${entityLabel} <small class="muted">(${escapeHtml(tableName)})</small></td>
            <td>${escapeHtml(record)}</td>
            <td>${escapeHtml(reason)}</td>
            <td>${escapeHtml(requestedBy)}</td>
            <td>${createdAt}</td>
            <td>${adminStage}</td>
            <td>${renderStatusPill(status)}</td>
            <td class="row-actions">
              <button class="btn tiny" data-action="snapshot" data-id="${id}">${isAr ? "المعاينة" : "View"}</button>
              ${status === "pending"
                ? `<button class="btn tiny danger" data-action="confirm" data-id="${id}">${isAr ? "تأكيد" : "Confirm"}</button>
                   <button class="btn tiny ghost" data-action="reject" data-id="${id}">${isAr ? "رفض" : "Reject"}</button>`
                : ""}
            </td>
          </tr>
        `;
      })
      .join("");

    refs.tableBody.innerHTML = html;

    // أربط أحداث الصفوف
    $$("#deletionsTable .row-check").forEach((cb) => {
      cb.addEventListener("change", (e) => {
        const id = cb.getAttribute("data-id");
        if (!id) return;
        if (cb.checked) state.selected.add(id);
        else state.selected.delete(id);
      });
    });

    $$("#deletionsTable [data-action=snapshot]").forEach((btn) => {
      btn.addEventListener("click", () => openSnapshot(btn.getAttribute("data-id")));
    });

    $$("#deletionsTable [data-action=confirm]").forEach((btn) => {
      btn.addEventListener("click", () => openConfirm([btn.getAttribute("data-id")]));
    });

    $$("#deletionsTable [data-action=reject]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        const reason = prompt(state.currentLang === "en" ? "Rejection reason (optional):" : "سبب الرفض (اختياري):");
        await rejectOne(id, reason || "");
      });
    });
  }

  function renderStatusPill(status) {
    const map = {
      pending: { ar: "معلّقة", en: "Pending", cls: "pill pending" },
      admin_confirmed: { ar: "مؤكَّدة (أدمن)", en: "Admin-confirmed", cls: "pill confirmed" },
      approved: { ar: "معتمدة", en: "Approved", cls: "pill approved" },
      rejected: { ar: "مرفوضة", en: "Rejected", cls: "pill rejected" },
    };
    const meta = map[status] || map.pending;
    const txt = state.currentLang === "en" ? meta.en : meta.ar;
    return `<span class="${meta.cls}">${txt}</span>`;
  }

  function updateStats(rows) {
    const counts = { pending: 0, admin_confirmed: 0, approved: 0, rejected: 0 };
    rows.forEach((r) => {
      const s = (r.Status || r.status || "pending").toString();
      if (counts[s] != null) counts[s] += 1;
    });
    if (refs.statPending) refs.statPending.textContent = counts.pending;
    if (refs.statConfirmed) refs.statConfirmed.textContent = counts.admin_confirmed;
    if (refs.statApproved) refs.statApproved.textContent = counts.approved;
    if (refs.statRejected) refs.statRejected.textContent = counts.rejected;
  }

  // ----------------------------- Actions ----------------------------------
  async function openSnapshot(id) {
    try {
      // حاول أولاً العثور على الـ snapshot من الـ rows نفسها
      const row = state.rows.find((r) => (r.RequestID ?? r.requestId ?? r.id) == id);
      let snap = row?.Snapshot ?? row?.snapshot ?? null;

      // إن لم يجدها، اجلبها من API snapshot (اختياري)
      if (!snap) {
        const res = await apiGet(API.snapshot(id));
        snap = res?.snapshot ?? res ?? {};
      }

      showSnapshotModal(snap || {});
    } catch (e) {
      console.error(e);
      toast(state.currentLang === "en" ? "Failed to load snapshot" : "تعذر تحميل المعاينة", "error");
    }
  }

  function showSnapshotModal(snapshotObj) {
    if (!refs.snapshotModal || !refs.snapshotBox) return;
    try {
      refs.snapshotBox.textContent = JSON.stringify(snapshotObj, null, 2);
    } catch {
      refs.snapshotBox.textContent = "{}";
    }
    openModal("snapshotModal");
  }

  function onBulkConfirm() {
    const ids = Array.from(state.selected);
    if (!ids.length) {
      toast(state.currentLang === "en" ? "No rows selected" : "لم يتم اختيار أي طلب", "warn");
      return;
    }
    // لا تؤكد إلا المعلقة
    const pendingIds = ids.filter((id) => {
      const r = state.rows.find((x) => (x.RequestID ?? x.requestId ?? x.id) == id);
      return (r?.Status || r?.status) === "pending";
    });
    if (!pendingIds.length) {
      toast(state.currentLang === "en" ? "Nothing to confirm" : "لا توجد طلبات صالحة للتأكيد", "warn");
      return;
    }
    openConfirm(pendingIds);
  }

  function openConfirm(ids) {
    state.pendingConfirmIds = ids || [];
    // إعادة الضبط
    if (refs.adminConfirmAcknowledge) refs.adminConfirmAcknowledge.checked = false;
    if (refs.confirmSendBtn) refs.confirmSendBtn.disabled = true;
    openModal("confirmModal");
  }

  async function onConfirmSend() {
    if (!state.pendingConfirmIds?.length) return;
    setModalLoading("confirmModal", true);
    try {
      // إذا أكثر من ID، استخدم Endpoint جماعي
      if (state.pendingConfirmIds.length > 1) {
        await apiPost(API.confirmBulk, { ids: state.pendingConfirmIds });
      } else {
        await apiPost(API.confirmOne(state.pendingConfirmIds[0]), {});
      }
      toast(state.currentLang === "en" ? "Confirmation submitted" : "تم تأكيد الطلب", "success");
      closeModal("confirmModal");
      await loadList();
    } catch (e) {
      console.error(e);
      toast(state.currentLang === "en" ? "Failed to confirm" : "تعذر تنفيذ التأكيد", "error");
    } finally {
      setModalLoading("confirmModal", false);
    }
  }

  async function rejectOne(id, reason) {
    if (!id) return;
    const yes = confirm(state.currentLang === "en" ? "Are you sure you want to reject this request?" : "هل أنت متأكد من رفض هذا الطلب؟");
    if (!yes) return;

    try {
      await apiPost(API.rejectOne(id), { reason: reason || "" });
      toast(state.currentLang === "en" ? "Request rejected" : "تم رفض الطلب", "success");
      await loadList();
    } catch (e) {
      console.error(e);
      toast(state.currentLang === "en" ? "Failed to reject" : "تعذر رفض الطلب", "error");
    }
  }

  // ----------------------------- Helpers ----------------------------------
  function toQuery(params) {
    const usp = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") usp.set(k, v);
    });
    return usp.toString();
  }

  async function apiGet(url) {
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
    return res.json();
  }

  async function apiPost(url, body) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body || {}),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`POST ${url} -> ${res.status} ${text}`);
    }
    return res.json().catch(() => ({}));
  }

  function authHeaders() {
    // عدّل أسماء مفاتيح التوكن حسب تطبيقك
    const token = localStorage.getItem("token") || localStorage.getItem("authToken") || "";
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function formatDate(dt) {
    if (!dt) return "—";
    try {
      const d = typeof dt === "string" || typeof dt === "number" ? new Date(dt) : dt;
      return d.toLocaleString(state.currentLang === "en" ? "en-US" : "ar-SA");
    } catch {
      return dt.toString();
    }
  }

  function resolveEntityLabel(tableName) {
    const t = (tableName || "").toString();
    const lang = state.currentLang;
    if (ENTITY_LABELS[lang][t]) return ENTITY_LABELS[lang][t];
    return ENTITY_LABELS[lang].unknown;
  }

  function extractReason(row) {
    // نحاول استنتاج سبب الحذف من الـ Snapshot إذا كان موجوداً
    const snap = row?.Snapshot ?? row?.snapshot ?? null;
    if (!snap) return "";
    try {
      // قد يأتي كـ String JSON
      const obj = typeof snap === "string" ? JSON.parse(snap) : snap;
      return (
        obj.reason ||
        obj.Reason ||
        obj.deletion_reason ||
        obj.DeletionReason ||
        obj.comment ||
        obj.Comment ||
        ""
      );
    } catch {
      return "";
    }
  }

  function escapeHtml(s) {
    return (s ?? "")
      .toString()
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setLoading(isLoading) {
    document.body.classList.toggle("loading", !!isLoading);
  }

  function setModalLoading(modalId, isLoading) {
    const m = document.getElementById(modalId);
    if (!m) return;
    m.classList.toggle("loading", !!isLoading);
  }

  function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.setAttribute("aria-hidden", "false");
    m.style.display = "block";
  }

  function closeModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.setAttribute("aria-hidden", "true");
    m.style.display = "none";
  }

  function toast(message, kind = "info") {
    // تنفيذ بسيط؛ يمكنك استبداله بمكوّن تنبيهاتك
    const el = document.createElement("div");
    el.className = `toast ${kind}`;
    el.textContent = message;
    Object.assign(el.style, {
      position: "fixed",
      bottom: "20px",
      insetInlineEnd: "20px",
      padding: "10px 14px",
      background: kind === "error" ? "#ef4444" : kind === "success" ? "#10b981" : kind === "warn" ? "#f59e0b" : "#3b82f6",
      color: "#fff",
      borderRadius: "8px",
      zIndex: 9999,
      boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
      fontFamily: "Tajawal, Arial, sans-serif",
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }

  // ------------------------------ i18n ------------------------------------
  function toggleLang() {
    state.currentLang = state.currentLang === "ar" ? "en" : "ar";
    document.body.classList.toggle("lang-en", state.currentLang === "en");
    document.body.classList.toggle("lang-ar", state.currentLang === "ar");

    // طبّق النصوص من data-ar/data-en
    $$("[data-ar],[data-en]").forEach((el) => {
      const txt = state.currentLang === "en" ? el.getAttribute("data-en") : el.getAttribute("data-ar");
      if (txt) el.textContent = txt;
    });

    // أعِد رسم الجدول ليتكيّف مع اللغة (التسميات/الحالات)
    renderTable(state.rows);
  }
})();
