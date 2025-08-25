// =====================
// Globals & constants
// =====================
let currentPage = 1;
let totalPages = 1;
let isLoading = false;
let currentFilters = {};
let currentLang = 'ar';
let allUsers = [];         // cache for current page data
let allDepartments = [];   // for department filter

const API_BASE_URL = 'http://localhost:3001/api';

// =====================
// Boot
// =====================
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthentication();
  setupEventListeners();
  await loadInitialData();
  applyLanguage(currentLang);
});

// =====================
// Auth & role checks
// =====================
async function checkAuthentication() {
  try {
    const token = localStorage.getItem('token');
    const user  = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !user) {
      location.href = '/login/login.html';
      return;
    }

    // Only Super Admin (1) or Admin (3) can enter this page
    if (![1,3].includes(user.RoleID)) {
      alert('ليس لديك صلاحية للوصول لهذه الصفحة');
      location.href = '/login/home.html';
      return;
    }

    // Show "End Impersonation" button to Super Admin; backend may return 400 if not impersonating
    const endBtn = document.getElementById('endImpersonationBtn');
    if (endBtn && user.RoleID === 1) endBtn.style.display = 'inline-flex';

  } catch (err) {
    console.error('Auth check error:', err);
    location.href = '/login/login.html';
  }
}

// =====================
// Initial data load
// =====================
async function loadInitialData() {
  showLoading();
  try {
    await Promise.all([
      loadDepartments(),
      loadUsers(),
      loadStats()
    ]);
  } catch (e) {
    console.error('Initial load error:', e);
    showError('حدث خطأ في تحميل البيانات');
  } finally {
    hideLoading();
  }
}

async function loadDepartments() {
  // Optional: adapt to your real endpoint if different
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/complaints/departments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data?.success) {
      allDepartments = data.data || [];
      const sel = document.getElementById('departmentFilter');
      if (sel) {
        // Build options
        const options = allDepartments.map(d =>
          `<option value="${d.DepartmentID}">${escapeHtml(d.DepartmentName || d.DepartmentID)}</option>`
        ).join('');
        sel.insertAdjacentHTML('beforeend', options);
      }
    }
  } catch (e) {
    console.warn('Failed to load departments (non-critical).');
  }
}

// =====================
// Event listeners
// =====================
function setupEventListeners() {
  // Language toggle
  const langToggle = document.getElementById('langToggle');
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'ar' ? 'en' : 'ar';
      applyLanguage(currentLang);
    });
  }

  // Debounced search
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    let t;
    searchInput.addEventListener('input', e => {
      clearTimeout(t);
      t = setTimeout(() => {
        currentFilters.search = e.target.value;
        currentPage = 1;
        loadUsers();
      }, 400);
    });
  }

  // Quick search (header bar)
  const quickSearch = document.getElementById('quickSearch');
  if (quickSearch) {
    let t;
    quickSearch.addEventListener('input', e => {
      clearTimeout(t);
      t = setTimeout(() => {
        currentFilters.quick = e.target.value;
        currentPage = 1;
        loadUsers();
      }, 400);
    });
  }

  // Create user button => open modal empty (Super Admin only)
  const createBtn = document.getElementById('createUserBtn');
  if (createBtn) {
    createBtn.addEventListener('click', () => openEdit(null));
  }

  // End impersonation
  const endBtn = document.getElementById('endImpersonationBtn');
  if (endBtn) {
    endBtn.addEventListener('click', endImpersonation);
  }

  // Form submit
  const form = document.getElementById('editForm');
  if (form) {
    form.addEventListener('submit', submitEditForm);
  }
}

// =====================
// Fetch users & stats
// =====================
async function loadUsers() {
  if (isLoading) return;
  isLoading = true;

  try {
    const token = localStorage.getItem('token');

    // Build query params including paging & filters
    const params = new URLSearchParams({
      page: currentPage,
      limit: 10,
      ...(currentFilters.search ? { search: currentFilters.search } : {}),
      ...(currentFilters.quick ? { quick: currentFilters.quick } : {}),
      ...(document.getElementById('roleFilter')?.value ? { role: document.getElementById('roleFilter').value } : {}),
      ...(document.getElementById('departmentFilter')?.value ? { departmentId: document.getElementById('departmentFilter').value } : {}),
      ...(document.getElementById('statusFilter')?.value ? { isActive: document.getElementById('statusFilter').value } : {})
    });

    // Backend route from earlier design: /api/admin/users
    const res = await fetch(`${API_BASE_URL}/admin/users?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok || !data?.success) throw new Error(data?.message || 'Load users failed');

    const users = data.data || [];
    allUsers = users;

    // If your backend returns pagination meta, use it; otherwise compute rough paging client-side
    // Here we simulate totalPages if not provided
    totalPages = data.pagination?.totalPages || Math.max(1, Math.ceil((data.pagination?.total || users.length) / (data.pagination?.limit || 10)));
    currentPage = data.pagination?.currentPage || currentPage;

    renderUsers(users);
    updatePagination({
      currentPage,
      totalPages,
      usersPerPage: 10,
      totalUsers: data.pagination?.total || data.total || users.length
    });
    updateUsersInfo({
      currentPage,
      usersPerPage: 10,
      totalUsers: data.pagination?.total || data.total || users.length
    });

  } catch (e) {
    console.error('loadUsers error:', e);
    displayEmptyState();
    showError('حدث خطأ في تحميل المستخدمين: ' + e.message);
  } finally {
    isLoading = false;
  }
}

async function loadStats() {
  try {
    const token = localStorage.getItem('token');
    // You can create a stats endpoint; here we reuse list and count by role
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok && data?.success) {
      const list = data.data || [];
      const total = list.length;
      const admins = list.filter(u => Number(u.RoleID) === 3).length;
      const supers = list.filter(u => Number(u.RoleID) === 1).length;
      document.getElementById('totalUsers').textContent = formatNumber(total);
      document.getElementById('adminsCount').textContent = formatNumber(admins);
      document.getElementById('superAdminsCount').textContent = formatNumber(supers);
    }
  } catch (e) {
    console.warn('Stats load warning:', e.message);
  }
}

// =====================
// Render helpers
// =====================
function renderUsers(users) {
  const tbody = document.getElementById('usersTableBody');
  const me = JSON.parse(localStorage.getItem('user') || '{}');
  if (!tbody) return;

  if (!users || users.length === 0) {
    displayEmptyState();
    return;
  }

  tbody.innerHTML = users.map((u, idx) => `
    <tr>
      <td>${((currentPage - 1) * 10) + idx + 1}</td>
      <td>
        <div class="user-info">
          <strong>${escapeHtml(u.FullName || '')}</strong>
          ${u.Username ? `<br><small>@${escapeHtml(u.Username)}</small>` : ''}
        </div>
      </td>
      <td>${escapeHtml(u.Username || '')}</td>
      <td>${escapeHtml(u.Email || '')}</td>
      <td>${roleLabel(u.RoleID)}</td>
      <td>${escapeHtml(u.DepartmentName || String(u.DepartmentID || '-'))}</td>
      <td>
        <span class="status-badge ${u.IsActive ? 'active' : 'inactive'}">
          ${u.IsActive ? (currentLang==='ar' ? 'مفعّل' : 'Active') : (currentLang==='ar' ? 'مُعطّل' : 'Inactive')}
        </span>
      </td>
      <td class="actions-cell">
        <button class="table-btn" title="Edit" onclick="openEdit(${u.EmployeeID})">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        ${me.RoleID === 1 ? `
          <button class="table-btn" title="Switch User" onclick="impersonate(${u.EmployeeID})">
            <i class="fa-solid fa-person-arrow-right"></i>
          </button>
          <button class="table-btn danger" title="Disable" onclick="disableUser(${u.EmployeeID})">
            <i class="fa-solid fa-user-slash"></i>
          </button>
        ` : ''}
      </td>
    </tr>
  `).join('');
}

function displayEmptyState() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;
  tbody.innerHTML = `
    <tr class="empty-state">
      <td colspan="8">
        <div class="empty-box">
          <i class="fas fa-users-slash"></i>
          <h3>${currentLang === 'ar' ? 'لا توجد نتائج' : 'No results'}</h3>
          <p>${currentLang === 'ar' ? 'لم يتم العثور على مستخدمين حسب معايير البحث' : 'No users found with current filters'}</p>
        </div>
      </td>
    </tr>
  `;
}

function updatePagination(p) {
  const prevBtn = document.querySelector('.pagination-btn[onclick="previousPage()"]');
  const nextBtn = document.querySelector('.pagination-btn[onclick="nextPage()"]');
  if (prevBtn) prevBtn.disabled = p.currentPage <= 1;
  if (nextBtn) nextBtn.disabled = p.currentPage >= p.totalPages;

  // page numbers
  const pageNumbers = document.getElementById('pageNumbers');
  if (pageNumbers) {
    const pages = generatePages(p.currentPage, p.totalPages, 5);
    pageNumbers.innerHTML = pages.map(pg => `
      <button class="page-number ${pg === p.currentPage ? 'active' : ''}" onclick="goToPage(${pg})">${pg}</button>
    `).join('');
  }
}

function updateUsersInfo(p) {
  const start = ((p.currentPage - 1) * p.usersPerPage) + 1;
  const end = Math.min(p.currentPage * p.usersPerPage, p.totalUsers);
  const infoText = `${currentLang==='ar' ? 'عرض' : 'Showing'} ${start}-${end} ${currentLang==='ar' ? 'من' : 'of'} ${p.totalUsers}`;
  document.getElementById('usersCount').textContent = infoText;
  document.getElementById('paginationInfo').textContent = infoText;
}

function generatePages(cur, total, maxVisible = 5) {
  if (total <= maxVisible) return Array.from({length: total}, (_,i)=>i+1);
  if (cur <= 3) return [1,2,3,4,5];
  if (cur >= total-2) return [total-4,total-3,total-2,total-1,total];
  return [cur-2,cur-1,cur,cur+1,cur+2];
}

// =====================
// Filters
// =====================
function applyFilters() {
  const role = document.getElementById('roleFilter')?.value;
  const dep  = document.getElementById('departmentFilter')?.value;
  const st   = document.getElementById('statusFilter')?.value;

  currentFilters = {
    ...(role && { role }),
    ...(dep && { departmentId: dep }),
    ...(st && { isActive: st }),
    ...(currentFilters.search && { search: currentFilters.search }),
    ...(currentFilters.quick && { quick: currentFilters.quick }),
  };

  currentPage = 1;
  loadUsers();
}

function clearFilters() {
  ['roleFilter','departmentFilter','statusFilter','searchInput','quickSearch']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value=''; });
  currentFilters = {};
  currentPage = 1;
  loadUsers();
}

function toggleFilters() {
  const c = document.querySelector('.filters-content');
  const i = document.querySelector('.collapse-btn i');
  const visible = c && c.style.display !== 'none';
  if (c) c.style.display = visible ? 'none' : 'block';
  if (i) i.className = visible ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
}

// =====================
// Pagination controls
// =====================
function goToPage(p) {
  if (p >= 1 && p <= totalPages && p !== currentPage) {
    currentPage = p;
    loadUsers();
  }
}
function previousPage() {
  if (currentPage > 1) { currentPage--; loadUsers(); }
}
function nextPage() {
  if (currentPage < totalPages) { currentPage++; loadUsers(); }
}

// =====================
// Edit modal
// =====================
function openEdit(id) {
  const me = JSON.parse(localStorage.getItem('user') || '{}');
  const modal = document.getElementById('editModal');
  const title = document.getElementById('modalTitle');

  if (!id) {
    // Create user (Super Admin only)
    if (me.RoleID !== 1) {
      alert(currentLang==='ar' ? 'صلاحية السوبر أدمن فقط' : 'Super Admin only');
      return;
    }
    title.setAttribute('data-ar','مستخدم جديد');
    title.setAttribute('data-en','New User');
    title.textContent = currentLang==='ar' ? 'مستخدم جديد' : 'New User';

    document.getElementById('editId').value = '';
    document.getElementById('editFullName').value = '';
    document.getElementById('editUsername').value = '(auto on backend)';
    document.getElementById('editEmail').value = '';
    document.getElementById('editRole').value = '2';
    document.getElementById('editDepartmentId').value = '';
    document.getElementById('editIsActive').value = '1';
  } else {
    // Edit existing
    title.setAttribute('data-ar','تعديل المستخدم');
    title.setAttribute('data-en','Edit User');
    title.textContent = currentLang==='ar' ? 'تعديل المستخدم' : 'Edit User';

    const u = allUsers.find(x => Number(x.EmployeeID) === Number(id));
    if (!u) return;
    document.getElementById('editId').value = u.EmployeeID;
    document.getElementById('editFullName').value = u.FullName || '';
    document.getElementById('editUsername').value = u.Username || '';
    document.getElementById('editEmail').value = u.Email || '';
    document.getElementById('editRole').value = String(u.RoleID);
    document.getElementById('editDepartmentId').value = u.DepartmentID || '';
    document.getElementById('editIsActive').value = u.IsActive ? '1' : '0';
  }

  modal.style.display = 'block';
}

function closeModal() {
  const modal = document.getElementById('editModal');
  if (modal) modal.style.display = 'none';
}

async function submitEditForm(e) {
  e.preventDefault();
  const me = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  const id = document.getElementById('editId').value.trim();
  const payload = {
    FullName: document.getElementById('editFullName').value.trim(),
    Email:    document.getElementById('editEmail').value.trim(),
    RoleID:   Number(document.getElementById('editRole').value),
    DepartmentID: Number(document.getElementById('editDepartmentId').value) || null,
    IsActive: Number(document.getElementById('editIsActive').value)
  };

  try {
    // Create or Update
    if (!id) {
      if (me.RoleID !== 1) throw new Error('Super Admin only');
      const res = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type':'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Create failed');
      showSuccess(currentLang==='ar' ? 'تم إنشاء المستخدم' : 'User created');
    } else {
      const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type':'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Update failed');
      showSuccess(currentLang==='ar' ? 'تم تحديث البيانات' : 'Updated successfully');
    }

    closeModal();
    await loadUsers();
    await loadStats();

  } catch (err) {
    console.error('submitEditForm:', err);
    showError(err.message || 'Operation failed');
  }
}

// =====================
// Impersonation & disable
// =====================
async function impersonate(id) {
  if (!confirm(currentLang==='ar' ? 'الدخول على الحساب كـ سويتش؟' : 'Impersonate this user?')) return;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/admin/users/${id}/impersonate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok || !data?.success) throw new Error(data?.message || 'Impersonation failed');

    localStorage.setItem('user', JSON.stringify(data.user));
    alert(currentLang==='ar' ? 'تم الدخول بالنيابة' : 'Impersonation started');
    location.href = '/login/home.html';
  } catch (e) {
    showError(e.message || 'Impersonation failed');
  }
}

async function endImpersonation() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/admin/users/impersonate/end`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok || !data?.success) throw new Error(data?.message || 'No active impersonation');
    localStorage.setItem('user', JSON.stringify(data.user));
    showSuccess(currentLang==='ar' ? 'تمت العودة لحساب السوبر أدمن' : 'Returned to Super Admin');
    location.href = '/login/home.html';
  } catch (e) {
    showError(e.message || 'End impersonation failed');
  }
}

async function disableUser(id) {
  if (!confirm(currentLang==='ar' ? 'تعطيل هذا المستخدم؟' : 'Disable this user?')) return;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok || !data?.success) throw new Error(data?.message || 'Disable failed');
    await loadUsers();
    await loadStats();
    showSuccess(currentLang==='ar' ? 'تم التعطيل' : 'User disabled');
  } catch (e) {
    showError(e.message || 'Disable failed');
  }
}

// =====================
// Utilities (UI)
// =====================
function roleLabel(id) {
  if (Number(id) === 1) return 'Super Admin';
  if (Number(id) === 3) return 'Admin';
  return 'Employee';
}

function formatNumber(n) {
  return new Intl.NumberFormat(currentLang==='ar' ? 'ar-SA' : 'en-US').format(n || 0);
}

function escapeHtml(txt = '') {
  const d = document.createElement('div'); d.textContent = txt; return d.innerHTML;
}

function showLoading() { /* You can add spinner if needed */ }
function hideLoading() { /* Hide spinner */ }

function showError(msg) { alert((currentLang==='ar' ? 'خطأ: ' : 'Error: ') + msg); }
function showSuccess(msg) { alert(msg); }

function goBack() { window.history.back(); }

// Language apply (same pattern as logs.js)
function applyLanguage(lang) {
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  const els = document.querySelectorAll('[data-ar][data-en]');
  els.forEach(el => el.textContent = el.getAttribute(`data-${lang}`));
  const inputs = document.querySelectorAll('input[data-ar-placeholder][data-en-placeholder]');
  inputs.forEach(i => i.placeholder = i.getAttribute(`data-${lang}-placeholder`));
  const langText = document.getElementById('langText');
  if (langText) langText.textContent = 'العربية | English';
}
