// Admin Logs JavaScript
const API_BASE_URL = 'http://localhost:3001/api';

let currentLang = localStorage.getItem('lang') || 'ar';
let currentUser = null;
let userDepartmentId = null;
let logsData = [];
let currentPage = 1;
let totalPages = 1;
let pageSize = 20;

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
  // Check impersonation state
  checkImpersonationState();
  
  // Check access permissions
  if (!checkDepartmentAdminAccess()) {
    return;
  }
  
  // Apply language
  applyLanguage(currentLang);
  
  // Load department employees for filter
  await loadDepartmentEmployees();
  
  // Load logs
  await loadLogs();
  
  // Setup event listeners
  setupEventListeners();
});

// Check if user is Department Admin (RoleID = 3)
function checkDepartmentAdminAccess() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  if (!user || Number(user.RoleID) !== 3) {
    alert('ليس لديك صلاحية للوصول لهذه الصفحة.');
    window.location.replace('/login/login.html');
    return false;
  }
  
  currentUser = user;
  userDepartmentId = user.DepartmentID;
  
  // Validate department ID
  if (!userDepartmentId) {
    alert('لم يتم تحديد القسم الخاص بك. يرجى التواصل مع المدير.');
    return false;
  }
  
  return true;
}

// Check impersonation state
function checkImpersonationState() {
  try {
    const rootToken = localStorage.getItem('rootToken');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (rootToken && user?.RoleID !== 1) {
      showImpersonationBanner(user);
    }
  } catch (err) {
    console.error('Error checking impersonation state:', err);
  }
}

// Show impersonation banner
function showImpersonationBanner(user) {
  const banner = document.getElementById('impersonationBanner');
  const text = document.getElementById('impersonationText');
  
  if (banner && text) {
    text.textContent = `تم التبديل إلى حساب: ${user.FullName || user.Username || 'غير محدد'}`;
    banner.style.display = 'block';
  }
}

// End impersonation
async function endImpersonation() {
  try {
    const rootToken = localStorage.getItem('rootToken');
    if (!rootToken) return;

    // Restore super admin session
    localStorage.setItem('token', rootToken);
    localStorage.removeItem('rootToken');
    
    // Get super admin data
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${rootToken}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    // Redirect to super admin dashboard
    window.location.href = '/superadmin/superadmin-home.html';
  } catch (error) {
    console.error('Error ending impersonation:', error);
    window.location.href = '/login/login.html';
  }
}

// Load department employees for filter
async function loadDepartmentEmployees() {
  try {
    const response = await fetch(`${API_BASE_URL}/dept-admin/department-employees/${userDepartmentId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      populateEmployeeFilter(data.data || []);
    }
  } catch (error) {
    console.error('Error loading department employees:', error);
  }
}

// Populate employee filter
function populateEmployeeFilter(employees) {
  const employeeFilter = document.getElementById('employeeFilter');
  
  // Clear existing options except the first one
  while (employeeFilter.children.length > 1) {
    employeeFilter.removeChild(employeeFilter.lastChild);
  }
  
  employees.forEach(employee => {
    const option = document.createElement('option');
    option.value = employee.Username;
    option.textContent = `${employee.FullName} (${employee.Username})`;
    employeeFilter.appendChild(option);
  });
}

// Load logs with filters
async function loadLogs() {
  try {
    showLoading();
    
    // Build query parameters
    const params = new URLSearchParams();
    params.set('page', currentPage);
    params.set('limit', pageSize);
    
    // Apply filters
    const activityType = document.getElementById('activityTypeFilter')?.value;
    const employee = document.getElementById('employeeFilter')?.value;
    const fromDate = document.getElementById('fromDateFilter')?.value;
    const toDate = document.getElementById('toDateFilter')?.value;
    
    if (activityType) params.set('activityType', activityType);
    if (employee) params.set('employee', employee);
    if (fromDate) params.set('fromDate', fromDate);
    if (toDate) params.set('toDate', toDate);
    
    const response = await fetch(`${API_BASE_URL}/dept-admin/logs/department/${userDepartmentId}?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      logsData = data.data || [];
      totalPages = Math.ceil((data.total || logsData.length) / pageSize);
      
      displayLogs();
      updatePagination();
      updateStats();
    } else {
      throw new Error('فشل في تحميل السجلات');
    }
  } catch (error) {
    console.error('Error loading logs:', error);
    showError('فشل في تحميل السجلات');
  }
}

// Display logs in table
function displayLogs() {
  const tbody = document.getElementById('logsTableBody');
  
  if (!logsData || logsData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="no-data">
          لا توجد سجلات متاحة
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = logsData.map(log => `
    <tr>
      <td>${formatDateTime(log.CreatedAt)}</td>
      <td>${escapeHtml(log.Username || '-')}</td>
      <td>
        <span class="activity-badge activity-${getActivityClass(log.ActivityType)}">
          ${escapeHtml(log.ActivityType || '-')}
        </span>
      </td>
      <td>${escapeHtml(log.Description || '-')}</td>
      <td>${escapeHtml(log.IPAddress || '-')}</td>
    </tr>
  `).join('');
}

// Get activity class for styling
function getActivityClass(activityType) {
  const type = (activityType || '').toLowerCase();
  
  if (type.includes('login')) return 'login';
  if (type.includes('complaint')) return 'complaint';
  if (type.includes('assignment') || type.includes('assign')) return 'assignment';
  if (type.includes('status') || type.includes('update')) return 'status_update';
  
  return 'default';
}

// Update pagination
function updatePagination() {
  const pagination = document.getElementById('pagination');
  
  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }
  
  let html = '';
  
  // Previous button
  html += `
    <button onclick="changePage(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>
      <i class="fas fa-chevron-right"></i>
    </button>
  `;
  
  // Page numbers
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  
  if (startPage > 1) {
    html += `<button onclick="changePage(1)">1</button>`;
    if (startPage > 2) {
      html += `<span>...</span>`;
    }
  }
  
  for (let i = startPage; i <= endPage; i++) {
    html += `
      <button onclick="changePage(${i})" ${i === currentPage ? 'class="active"' : ''}>
        ${i}
      </button>
    `;
  }
  
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      html += `<span>...</span>`;
    }
    html += `<button onclick="changePage(${totalPages})">${totalPages}</button>`;
  }
  
  // Next button
  html += `
    <button onclick="changePage(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>
      <i class="fas fa-chevron-left"></i>
    </button>
  `;
  
  pagination.innerHTML = html;
}

// Change page
function changePage(page) {
  if (page < 1 || page > totalPages || page === currentPage) return;
  
  currentPage = page;
  loadLogs();
}

// Update statistics
function updateStats() {
  // Update total logs
  document.getElementById('totalLogs').textContent = logsData.length || 0;
  
  // Calculate today's logs
  const today = new Date().toDateString();
  const todayLogs = logsData.filter(log => 
    new Date(log.CreatedAt).toDateString() === today
  ).length;
  document.getElementById('todayLogs').textContent = todayLogs;
  
  // Calculate unique active users
  const uniqueUsers = new Set(
    logsData.filter(log => log.Username).map(log => log.Username)
  ).size;
  document.getElementById('activeUsers').textContent = uniqueUsers;
  
  // Get last activity time
  if (logsData.length > 0) {
    const lastActivity = new Date(logsData[0].CreatedAt);
    const now = new Date();
    const diffMinutes = Math.floor((now - lastActivity) / (1000 * 60));
    
    let timeText;
    if (diffMinutes < 1) {
      timeText = 'الآن';
    } else if (diffMinutes < 60) {
      timeText = `${diffMinutes} دقيقة`;
    } else {
      const diffHours = Math.floor(diffMinutes / 60);
      timeText = `${diffHours} ساعة`;
    }
    
    document.getElementById('lastActivity').textContent = timeText;
  }
}

// Apply filters
function applyFilters() {
  currentPage = 1;
  loadLogs();
}

// Clear filters
function clearFilters() {
  document.getElementById('activityTypeFilter').value = '';
  document.getElementById('employeeFilter').value = '';
  document.getElementById('fromDateFilter').value = '';
  document.getElementById('toDateFilter').value = '';
  
  currentPage = 1;
  loadLogs();
}

// Export logs
async function exportLogs(format) {
  try {
    // Build query parameters for export
    const params = new URLSearchParams();
    params.set('format', format);
    params.set('departmentId', userDepartmentId);
    
    // Apply current filters
    const activityType = document.getElementById('activityTypeFilter')?.value;
    const employee = document.getElementById('employeeFilter')?.value;
    const fromDate = document.getElementById('fromDateFilter')?.value;
    const toDate = document.getElementById('toDateFilter')?.value;
    
    if (activityType) params.set('activityType', activityType);
    if (employee) params.set('employee', employee);
    if (fromDate) params.set('fromDate', fromDate);
    if (toDate) params.set('toDate', toDate);
    
    const response = await fetch(`${API_BASE_URL}/logs/export?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `department-logs-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } else {
      throw new Error('فشل في تصدير السجلات');
    }
  } catch (error) {
    console.error('Error exporting logs:', error);
    alert('فشل في تصدير السجلات');
  }
}

// Setup event listeners
function setupEventListeners() {
  // Filter change events
  document.getElementById('activityTypeFilter')?.addEventListener('change', applyFilters);
  document.getElementById('employeeFilter')?.addEventListener('change', applyFilters);
  document.getElementById('fromDateFilter')?.addEventListener('change', applyFilters);
  document.getElementById('toDateFilter')?.addEventListener('change', applyFilters);
}

// Utility functions
function showLoading() {
  const tbody = document.getElementById('logsTableBody');
  tbody.innerHTML = `
    <tr>
      <td colspan="5" class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        جاري التحميل...
      </td>
    </tr>
  `;
}

function showError(message) {
  const tbody = document.getElementById('logsTableBody');
  tbody.innerHTML = `
    <tr>
      <td colspan="5" class="no-data">
        <i class="fas fa-exclamation-triangle"></i>
        ${message}
      </td>
    </tr>
  `;
}

function formatDateTime(dateString) {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  return date.toLocaleString('ar-SA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Language management
function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  
  document.querySelectorAll('[data-ar][data-en]').forEach(element => {
    const text = element.getAttribute(`data-${lang}`);
    if (text) {
      element.textContent = text;
    }
  });
  
  document.querySelectorAll('[data-ar-placeholder][data-en-placeholder]').forEach(element => {
    const placeholder = element.getAttribute(`data-${lang}-placeholder`);
    if (placeholder) {
      element.placeholder = placeholder;
    }
  });
}
