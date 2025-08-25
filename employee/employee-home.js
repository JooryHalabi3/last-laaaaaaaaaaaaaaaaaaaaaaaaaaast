// Employee Home Page JavaScript (متوافق مع /api/employee/*)

// =================== Configuration ===================
const API_BASE_URL = 'http://127.0.0.1:3001/api';
let currentUser = null;
document.addEventListener('DOMContentLoaded', () => {
  try {
    const rootToken = localStorage.getItem('rootToken');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // يظهر الزر فقط إذا كان فيه rootToken (يعني السوبر أدمن متقمص حساب)
    // وأيضًا فقط إذا الدور الحالي مو SUPER_ADMIN
    if (rootToken && user?.RoleID !== 1) {
      showReturnToSuperAdminButton();
      showImpersonationBanner();
    }
  } catch (err) {
    console.error('Error checking impersonation state:', err);
  }
});

function showReturnToSuperAdminButton() {
  const btn = document.createElement('button');
  btn.textContent = '🔙 العودة لحساب السوبر';
  btn.style.position = 'fixed';
  btn.style.top = '10px';
  btn.style.left = '10px';
  btn.style.padding = '8px 12px';
  btn.style.background = '#dc2626';
  btn.style.color = '#fff';
  btn.style.border = 'none';
  btn.style.borderRadius = '6px';
  btn.style.cursor = 'pointer';
  btn.style.zIndex = '9999';

  btn.onclick = () => {
    const rootToken = localStorage.getItem('rootToken');
    const rootUser = localStorage.getItem('rootUser');
    if (rootToken && rootUser) {
      // رجّع بيانات السوبر
      localStorage.setItem('token', rootToken);
      localStorage.setItem('user', rootUser);
      localStorage.removeItem('rootToken');
      localStorage.removeItem('rootUser');

      window.location.href = '/superadmin/superadmin-home.html';
    }
  };

  document.body.appendChild(btn);
}

function showImpersonationBanner(){
  try {
    const banner = document.getElementById('impersonation-banner');
    const endBtn = document.getElementById('end-impersonation-btn');
    const rootToken = localStorage.getItem('rootToken');
    if (!banner || !rootToken) return;
    banner.style.display = 'block';
    if (endBtn) {
      endBtn.onclick = () => {
        const rootToken = localStorage.getItem('rootToken');
        const rootUser = localStorage.getItem('rootUser');
        if (rootToken && rootUser) {
          localStorage.setItem('token', rootToken);
          localStorage.setItem('user', rootUser);
          localStorage.removeItem('rootToken');
          localStorage.removeItem('rootUser');
          window.location.href = '/superadmin/superadmin-home.html';
        }
      };
    }
  } catch {}
}


// =================== DOM Elements ===================
const elements = {
  loadingOverlay: document.getElementById('loadingOverlay'),
  errorModal: document.getElementById('errorModal'),
  errorMessage: document.getElementById('errorMessage'),
  closeErrorModal: document.getElementById('closeErrorModal'),
  closeErrorBtn: document.getElementById('closeErrorBtn'),

  // بطاقات الأرقام
  newComplaintsCount: document.getElementById('newComplaintsCount'),
  myComplaintsCount: document.getElementById('myComplaintsCount'),
  assignedComplaintsCount: document.getElementById('assignedComplaintsCount'),

  totalComplaints: document.getElementById('totalComplaints'),
  pendingComplaints: document.getElementById('pendingComplaints'),
  completedComplaints: document.getElementById('completedComplaints'),
  urgentComplaints: document.getElementById('urgentComplaints'),

  // سجلات النشاط
  activitySection: document.getElementById('activitySection'),
  activityLogsList: document.getElementById('activityLogsList'),

  // اللغة
  langToggle: document.getElementById('langToggle'),
  langText: document.getElementById('langText'),
};

// =================== Utils ===================
const showLoading = () => elements.loadingOverlay?.classList.add('show');
const hideLoading = () => elements.loadingOverlay?.classList.remove('show');

const showError = (message) => {
  if (elements.errorMessage) elements.errorMessage.textContent = message || 'حدث خطأ ما';
  elements.errorModal?.classList.add('show');
};
const hideError = () => elements.errorModal?.classList.remove('show');

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

// =================== API Helper ===================
const authHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const makeRequest = async (url, options = {}) => {
  const res = await fetch(`${API_BASE_URL}${url}`, {
    headers: { ...authHeaders(), ...(options.headers || {}) },
    ...options
  });
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '../login/login.html';
      return;
    }
    const text = await res.text().catch(()=> '');
    throw new Error(`HTTP ${res.status}${text ? `: ${text}` : ''}`);
  }
  return res.json();
};

// =================== Loaders ===================

/** 1) بيانات المستخدم: /api/employee/profile */
const loadUserProfile = async () => {
  const response = await makeRequest('/employee/profile');
  if (!response?.success) throw new Error('profile_failed');
  currentUser = response.data;

  const nameEl = document.getElementById('userName');
  if (nameEl) nameEl.textContent = currentUser.FullName || 'المستخدم';

  localStorage.setItem('employeeDepartmentID', currentUser.DepartmentID || '');
  localStorage.setItem('employeeNationalID', currentUser.NationalID || '');

  return currentUser;
};

/** 2) إحصائيات الشكاوى: /api/employee/complaints */
const loadStatistics = async () => {
  const resp = await makeRequest('/employee/complaints?limit=100');
  const complaints = resp?.data?.complaints || [];

  const totalCount = complaints.length;
  const pendingCount = complaints.filter(c =>
    ['قيد المعالجة','معلقة','In Progress','Pending'].includes(c.Status)
  ).length;
  const completedCount = complaints.filter(c =>
    ['مكتملة','مغلقة','Done','Closed','Resolved','تم الحل'].includes(c.Status)
  ).length;
  const urgentCount = complaints.filter(c =>
    ['عاجل','عالية','High','Urgent'].includes(c.Priority)
  ).length;

  const myComplaintsCount = complaints.filter(c => c.CreatedBy === currentUser.EmployeeID).length;
  const assignedComplaintsCount = complaints.filter(c => c.AssignedTo === currentUser.EmployeeID).length;

  const today = new Date().toISOString().split('T')[0];
  const newComplaintsCount = complaints.filter(c => String(c.CreatedAt || '').startsWith(today)).length;

  if (elements.totalComplaints) elements.totalComplaints.textContent = totalCount;
  if (elements.pendingComplaints) elements.pendingComplaints.textContent = pendingCount;
  if (elements.completedComplaints) elements.completedComplaints.textContent = completedCount;
  if (elements.urgentComplaints) elements.urgentComplaints.textContent = urgentCount;

  if (elements.newComplaintsCount) elements.newComplaintsCount.textContent = newComplaintsCount;
  if (elements.myComplaintsCount) elements.myComplaintsCount.textContent = myComplaintsCount;
  if (elements.assignedComplaintsCount) elements.assignedComplaintsCount.textContent = assignedComplaintsCount;
};

/** 3) سجلات النشاط: /api/employee/activity-logs */
const loadActivityLogs = async () => {
  if (!elements.activityLogsList) return;
  try {
    const resp = await makeRequest('/employee/activity-logs?limit=10');
    const logs = (resp?.data?.logs) || [];

    const list = elements.activityLogsList;
    list.innerHTML = '';

    if (!logs.length) {
      list.innerHTML = `
        <div class="activity-item">
          <div class="activity-cell" style="grid-column:1 / -1; text-align:center; color:#666;">
            لا توجد سجلات نشاط
          </div>
        </div>`;
      return;
    }

    logs.forEach(log => {
      const item = document.createElement('div');
      item.className = 'activity-item';
      item.innerHTML = `
        <div class="activity-cell">${formatDate(log.CreatedAt || new Date())}</div>
        <div class="activity-cell">${log.Username || '-'}</div>
        <div class="activity-cell">${log.ActivityType || log.ActionType || '-'}</div>
        <div class="activity-cell">${log.Description || log.ActionDescription || '-'}</div>
      `;
      list.appendChild(item);
    });
  } catch (e) {
    if (String(e.message).includes('HTTP 403') && elements.activitySection) {
      elements.activitySection.style.display = 'none';
      return;
    }
    throw e;
  }
};

// =================== Language ===================
const initLanguageSwitcher = () => {
  elements.langToggle?.addEventListener('click', () => {
    const currentLang = localStorage.getItem('lang') || 'ar';
    const newLang = currentLang === 'ar' ? 'en' : 'ar';
    localStorage.setItem('lang', newLang);
    if (elements.langText) {
      elements.langText.textContent = newLang === 'ar' ? 'English | العربية' : 'العربية | English';
    }
    document.documentElement.lang = newLang;
    document.body.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.body.className = `lang-${newLang}`;
  });
};

// =================== Init ===================
const initPage = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '../login/login.html';
    return;
  }

  elements.closeErrorModal?.addEventListener('click', hideError);
  elements.closeErrorBtn?.addEventListener('click', hideError);

  showLoading();
  try {
    await loadUserProfile();
    await Promise.all([loadStatistics(), loadActivityLogs()]);
    initLanguageSwitcher();
  } catch (err) {
    console.error('Error initializing page:', err);
    if (String(err.message).includes('HTTP 404')) {
      showError('المسار المطلوب غير موجود (404).');
    } else if (String(err.message).includes('HTTP 401')) {
      showError('انتهت الجلسة. يرجى تسجيل الدخول من جديد.');
    } else if (String(err.message).includes('HTTP 403')) {
      showError('لا تملك صلاحية الوصول (403).');
    } else {
      showError('حدث خطأ في تحميل الصفحة.');
    }
  } finally {
    hideLoading();
  }
};

document.addEventListener('DOMContentLoaded', initPage);
