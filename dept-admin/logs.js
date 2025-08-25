// Department Logs JavaScript
const API_BASE_URL = 'http://localhost:3001/api';

let currentLang = localStorage.getItem('lang') || 'ar';
let currentUser = null;
let userDepartmentId = null;
let logsData = [];
let currentPage = 1;
let totalPages = 1;
let itemsPerPage = 20;

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
  
  // Load employees for filter
  await loadEmployeesFilter();
  
  // Load logs
  await loadLogs();
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

// Load employees for filter dropdown
async function loadEmployeesFilter() {
  try {
    const response = await fetch(`${API_BASE_URL}/dept-admin/department-employees/${userDepartmentId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const employees = data.data || [];
      
      const employeeFilter = document.getElementById('employeeFilter');
      employeeFilter.innerHTML = `<option value="">جميع الموظفين</option>`;
      
      employees.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.Username;
        option.textContent = `${employee.FullName} (@${employee.Username})`;
        employeeFilter.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading employees filter:', error);
  }
}

// Load logs
async function loadLogs() {
  try {
    showLoading();
    
    // Build query parameters
    const params = new URLSearchParams();
    params.set('page', currentPage);
    params.set('limit', itemsPerPage);
    
    // Apply filters
    const activityType = document.getElementById('activityTypeFilter')?.value;
    const employee = document.getElementById('employeeFilter')?.value;
    const fromDate = document.getElementById('fromDateFilter')?.value;
    const toDate = document.getElementById('toDateFilter')?.value;
    
    if (activityType) params.set('activityType', activityType);
    if (employee) params.set('employee', employee);
    if (fromDate) params.set('fromDate', fromDate);
    if (toDate) params.set('toDate', toDate);
    
    const response = await fetch(`${API_BASE_URL}/dept-admin/logs/${userDepartmentId}?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      logsData = data.data || [];
      totalPages = data.pagination?.totalPages || 1;
      
      displayLogs();
      updatePagination();
      updateStats(data.stats);
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
      <td>${escapeHtml(log.FullName || log.Username || '-')}</td>
      <td>
        <span class="activity-badge activity-${getActivityClass(log.ActivityType)}">
          ${getActivityLabel(log.ActivityType)}
        </span>
      </td>
      <td>${escapeHtml(log.Description || '-')}</td>
      <td>${escapeHtml(log.IPAddress || '-')}</td>
    </tr>
  `).join('');
}

// Get activity class for styling
function getActivityClass(activityType) {
  switch (activityType) {
    case 'login': return 'login';
    case 'complaint': return 'complaint';
    case 'assignment': return 'assignment';
    case 'status_update': return 'status_update';
    default: return 'default';
  }
}

// Get activity label in Arabic
function getActivityLabel(activityType) {
  switch (activityType) {
    case 'login': return 'تسجيل دخول';
    case 'logout': return 'تسجيل خروج';
    case 'complaint': return 'شكوى';
    case 'assignment': return 'توزيع';
    case 'status_update': return 'تحديث حالة';
    case 'response': return 'رد';
    case 'export_logs': return 'تصدير سجلات';
    case 'delete_logs': return 'حذف سجلات';
    case 'delete_request': return 'طلب حذف';
    default: return activityType || 'غير محدد';
  }
}

// Update statistics
function updateStats(stats) {
  if (stats) {
    document.getElementById('totalLogs').textContent = stats.total || 0;
    document.getElementById('todayLogs').textContent = stats.today || 0;
    document.getElementById('activeUsers').textContent = stats.activeUsers || 0;
    document.getElementById('lastActivity').textContent = stats.lastActivity || '-';
  }
}

// Update pagination
function updatePagination() {
  const pagination = document.getElementById('pagination');
  let paginationHTML = '';
  
  // Previous button
  paginationHTML += `
    <button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
      السابق
    </button>
  `;
  
  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage || i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      paginationHTML += `
        <button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
          ${i}
        </button>
      `;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      paginationHTML += '<span>...</span>';
    }
  }
  
  // Next button
  paginationHTML += `
    <button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
      التالي
    </button>
  `;
  
  pagination.innerHTML = paginationHTML;
}

// Change page
function changePage(page) {
  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    loadLogs();
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
    // Build query parameters (same as current filters)
    const params = new URLSearchParams();
    
    const activityType = document.getElementById('activityTypeFilter')?.value;
    const employee = document.getElementById('employeeFilter')?.value;
    const fromDate = document.getElementById('fromDateFilter')?.value;
    const toDate = document.getElementById('toDateFilter')?.value;
    
    if (activityType) params.set('activityType', activityType);
    if (employee) params.set('employee', employee);
    if (fromDate) params.set('fromDate', fromDate);
    if (toDate) params.set('toDate', toDate);
    params.set('format', format);
    
    const response = await fetch(`${API_BASE_URL}/dept-admin/logs/export/${userDepartmentId}?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `department-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else if (format === 'pdf') {
        const data = await response.json();
        if (data.success) {
          generatePDF(data.data);
        } else {
          throw new Error(data.message || 'فشل في تصدير PDF');
        }
      }
    } else {
      throw new Error('فشل في تصدير السجلات');
    }
  } catch (error) {
    console.error('Error exporting logs:', error);
    alert('فشل في تصدير السجلات: ' + error.message);
  }
}

// Generate PDF from logs data
function generatePDF(logs) {
  try {
    // Create a simple HTML table for PDF generation
    const htmlContent = `
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>سجلات نشاط القسم</title>
          <style>
            body { font-family: Arial, sans-serif; direction: rtl; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { color: #333; }
            .header p { color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>سجلات نشاط القسم</h1>
            <p>تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}</p>
            <p>عدد السجلات: ${logs.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>الوقت</th>
                <th>الموظف</th>
                <th>نوع النشاط</th>
                <th>الوصف</th>
                <th>عنوان IP</th>
              </tr>
            </thead>
            <tbody>
              ${logs.map(log => `
                <tr>
                  <td>${formatDateTime(log.CreatedAt)}</td>
                  <td>${escapeHtml(log.FullName || log.Username || '-')}</td>
                  <td>${getActivityLabel(log.ActivityType)}</td>
                  <td>${escapeHtml(log.Description || '-')}</td>
                  <td>${escapeHtml(log.IPAddress || '-')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    // Open in new window for printing/saving as PDF
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('فشل في إنشاء ملف PDF');
  }
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
    minute: '2-digit',
    second: '2-digit'
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