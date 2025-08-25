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

function homePathForRole(roleId) {
  if (roleId === 1) return '/superadmin/superadmin-home.html'; // سوبر أدمن
  if (roleId === 2) return '/employee/employee-home.html';     // موظف
  if (roleId === 3) return '/dept-admin/dept-admin.html';      // أدمن القسم
  // افتراضي (لو صار شيء غير متوقع)
  return '/login/login.html';
}

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

    if (!token || !user || !user.RoleID) {
      location.href = '/login/login.html';
      return;
    }

    // Only Super Admin (1) can enter this page
    if (Number(user.RoleID) !== 1) {
      alert('ليس لديك صلاحية للوصول لهذه الصفحة');
      location.href = homePathForRole(Number(user.RoleID));
      return;
    }

    // Show "End Impersonation" button to Super Admin; backend may return 400 if not impersonating
    const endBtn = document.getElementById('endImpersonationBtn');
    if (endBtn && Number(user.RoleID) === 1) endBtn.style.display = 'inline-flex';

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
    const data = await safeJson(res);
    if (res.ok && data?.success) {
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
        currentFilters.search = e.target.value.trim();
        if (!currentFilters.search) delete currentFilters.search;
        currentPage = 1;
        loadUsers();
      }, 400);
    });
  }

  // Filter change listeners
  const roleFilter = document.getElementById('roleFilter');
  if (roleFilter) {
    roleFilter.addEventListener('change', applyFilters);
  }
  
  const deptFilter = document.getElementById('departmentFilter');
  if (deptFilter) {
    deptFilter.addEventListener('change', applyFilters);
  }

  // (تم إلغاء إنشاء مستخدم جديد بناء على طلبك) — الزر إن وُجد لن يعمل
  const createBtn = document.getElementById('createUserBtn');
  if (createBtn) createBtn.style.display = 'none';

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

    // Build query params including paging & filters (لا ترسل قيم فارغة)
    const params = new URLSearchParams();
    params.set('page', String(currentPage));
    params.set('limit', '10');

    if (currentFilters.search) params.set('search', currentFilters.search);
    if (currentFilters.roleId) params.set('roleId', currentFilters.roleId);
    if (currentFilters.deptId) params.set('deptId', currentFilters.deptId);

    // Backend: /api/users
    const res = await fetch(`${API_BASE_URL}/users?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await safeJson(res);
    if (!res.ok || !data?.success) throw new Error(data?.message || 'Load users failed');

    const users = data.data || [];
    allUsers = users;

    // Pagination (server meta إن وُجد، وإلا تقدير بسيط)
    totalPages = data.pagination?.totalPages
      || Math.max(1, Math.ceil((data.pagination?.total || users.length) / (data.pagination?.limit || 10)));
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
    
    console.log('Users loaded successfully:', users.length, 'users');

  } catch (e) {
    console.error('loadUsers error:', e);
    displayEmptyState();
    showError('حدث خطأ في تحميل المستخدمين: ' + (e.message || ''));
  } finally {
    isLoading = false;
  }
}

async function loadStats() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await safeJson(res);
    if (res.ok && data?.success) {
      const list = data.data || [];
      const total = list.length;
      const admins = list.filter(u => Number(u.RoleID) === 3).length;
      const supers = list.filter(u => Number(u.RoleID) === 1).length;
      setText('totalUsers', formatNumber(total));
      setText('adminsCount', formatNumber(admins));
      setText('superAdminsCount', formatNumber(supers));
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
          ${u.EmployeeID ? `<br><small>#${u.EmployeeID}</small>` : ''}
        </div>
      </td>
      <td>${u.EmployeeID || ''}</td>
      <td>${escapeHtml(u.Email || '')}</td>
      <td>${roleLabel(u.RoleID)}</td>
      <td>${escapeHtml(u.DepartmentName || String(u.DepartmentID || '-'))}</td>
      <td class="actions-cell">
        <button class="table-btn" title="تعديل" onclick="openEdit(${Number(u.EmployeeID)})">
          <i class="fa-solid fa-pen-to-square"></i>
          <span>تعديل</span>
        </button>
        ${Number(me.RoleID) === 1 ? `
          <button class="table-btn" title="تبديل مستخدم" onclick="impersonate(${Number(u.EmployeeID)})">
            <i class="fa-solid fa-person-arrow-right"></i>
            <span>تبديل مستخدم</span>
          </button>
          <button class="table-btn danger" title="حذف المستخدم" onclick="deleteUser(${Number(u.EmployeeID)})">
            <i class="fa-solid fa-trash"></i>
            <span>حذف</span>
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
  setText('usersCount', infoText);
  setText('paginationInfo', infoText);
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
  const roleFilter = document.getElementById('roleFilter')?.value?.trim();
  const deptFilter = document.getElementById('departmentFilter')?.value?.trim();
  const searchInput = document.getElementById('searchInput')?.value?.trim();

  currentFilters = {};
  
  if (roleFilter && roleFilter !== '') {
    currentFilters.roleId = roleFilter;
  }
  
  if (deptFilter && deptFilter !== '') {
    currentFilters.deptId = deptFilter;
  }
  
  if (searchInput && searchInput !== '') {
    currentFilters.search = searchInput;
  }

  console.log('تطبيق الفلاتر:', currentFilters);
  currentPage = 1;
  loadUsers();
}

function clearFilters() {
  ['roleFilter','departmentFilter','searchInput']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value=''; });
  currentFilters = {};
  currentPage = 1;
  console.log('تم مسح الفلاتر');
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
  const modal = document.getElementById('editModal');
  const title = document.getElementById('modalTitle');

  // تعديل فقط (لا يوجد إنشاء مستخدم جديد)
  if (!id) {
    showError(currentLang==='ar' ? 'إنشاء مستخدم جديد غير مفعّل' : 'Create user is disabled');
    return;
  }

  title.setAttribute('data-ar','تعديل المستخدم');
  title.setAttribute('data-en','Edit User');
  title.textContent = currentLang==='ar' ? 'تعديل المستخدم' : 'Edit User';

  const u = allUsers.find(x => Number(x.EmployeeID) === Number(id));
  if (!u) return;

  setValue('editId', u.EmployeeID);
  setValue('editFullName', u.FullName || '');
  setValue('editEmployeeID', u.EmployeeID || ''); // للعرض فقط
  setValue('editEmail', u.Email || '');
  setValue('editRole', String(u.RoleID));
  setValue('editDepartmentId', u.DepartmentID || '');


  modal.style.display = 'block';
}

function closeModal() {
  const modal = document.getElementById('editModal');
  if (modal) modal.style.display = 'none';
}

async function submitEditForm(e) {
  e.preventDefault();
  const token = localStorage.getItem('token');

  const id = (document.getElementById('editId').value || '').trim();
  if (!id) { showError(currentLang==='ar' ? 'المعرف مفقود' : 'Missing ID'); return; }

  const payload = {
    FullName: (document.getElementById('editFullName').value || '').trim(),
    Email:    (document.getElementById('editEmail').value || '').trim(),
    RoleID:   Number(document.getElementById('editRole').value),
    DepartmentID: Number(document.getElementById('editDepartmentId').value) || null
  };

  try {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await safeJson(res);
    if (!res.ok || !data?.success) throw new Error(data?.message || 'Update failed');

    showSuccess(currentLang==='ar' ? 'تم تحديث البيانات' : 'Updated successfully');
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
// Impersonate (Super Admin only): switch into target user's account, then redirect to their home page
async function impersonate(id) {
  // Confirm action
  if (!confirm(currentLang === 'ar' ? 'الدخول على الحساب كـ سويتش؟' : 'Impersonate this user?')) return;

  try {
    // Save current (super admin) identity so we can return later
    const superToken = localStorage.getItem('token');
    const superUser  = localStorage.getItem('user'); // keep as string
    if (superToken) localStorage.setItem('rootToken', superToken);
    if (superUser)  localStorage.setItem('rootUser',  superUser);

    // Call backend to impersonate target user
    const res = await fetch(`${API_BASE_URL}/users/${id}/impersonate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superToken}` }
    });

    const data = await res.json();
    if (!res.ok || !data?.success || !data?.token) {
      throw new Error(data?.message || 'Impersonation failed');
    }

    // Replace identity with target's token + user
    localStorage.setItem('token', data.token);
    if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

    // Decide destination based on role
    const roleId = data.user ? Number(data.user.RoleID) : parseJwtRoleId(data.token);
    window.location.href = homePathForRole(roleId);
  } catch (e) {
    alert(e.message || 'Impersonation failed');
  }
}




async function endImpersonation() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/users/impersonate/end`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await safeJson(res);
    if (!res.ok || !data?.success) throw new Error(data?.message || 'No active impersonation');
    localStorage.setItem('user', JSON.stringify(data.user));
    showSuccess(currentLang==='ar' ? 'تمت العودة لحساب السوبر أدمن' : 'Returned to Super Admin');
    location.href = '/superadmin/superadmin-home.html';
  } catch (e) {
    showError(e.message || 'End impersonation failed');
  }
}

async function deleteUser(id) {
  if (!confirm(currentLang==='ar' ? 'هل أنت متأكد من حذف هذا المستخدم؟ هذا الإجراء لا يمكن التراجع عنه.' : 'Are you sure you want to delete this user? This action cannot be undone.')) return;
  
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await safeJson(res);
    if (!res.ok || !data?.success) throw new Error(data?.message || 'Delete failed');
    
    await loadUsers();
    await loadStats();
    showSuccess(currentLang==='ar' ? 'تم حذف المستخدم بنجاح' : 'User deleted successfully');
  } catch (e) {
    console.error('deleteUser error:', e);
    showError(e.message || 'Delete failed');
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

function setText(id, v) {
  const el = document.getElementById(id);
  if (el) el.textContent = v;
}
function setValue(id, v) {
  const el = document.getElementById(id);
  if (el) el.value = v;
}

async function safeJson(res) {
  try { return await res.json(); } catch { return {}; }
}

function showLoading() { /* Spinner placeholder */ }
function hideLoading() { /* Hide spinner */ }

function showError(msg) { alert((currentLang==='ar' ? 'خطأ: ' : 'Error: ') + (msg || '')); }
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
