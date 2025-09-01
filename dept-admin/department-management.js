// Department Management JavaScript
const API_BASE_URL = 'http://127.0.0.1:3001/api';

let currentLang = localStorage.getItem('lang') || 'ar';
let currentUser = null;
let userDepartmentId = null;
let employeesData = [];
let departmentData = null;
let currentDeleteEmployee = null;

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
  
  // Load department data
  await loadDepartmentInfo();
  
  // Load employees
  await loadEmployees();
  
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

// Load department information
async function loadDepartmentInfo() {
  try {
    const response = await fetch(`${API_BASE_URL}/dept-admin/departments/${userDepartmentId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      departmentData = data.data;
      updateDepartmentDisplay();
    }
  } catch (error) {
    console.error('Error loading department info:', error);
  }
}

// Update department display
function updateDepartmentDisplay() {
  if (departmentData) {
    document.getElementById('departmentName').textContent = departmentData.DepartmentName || 'القسم';
    
    // Update department statistics
    document.getElementById('totalEmployees').textContent = departmentData.totalEmployees || 0;
    document.getElementById('newEmployees').textContent = departmentData.newEmployees || 0;
  }
}

// Load employees
async function loadEmployees() {
  try {
    showLoading();
    
    // Build query parameters
    const params = new URLSearchParams();
    
    // Apply filters
    const search = document.getElementById('searchInput')?.value;
    const role = document.getElementById('roleFilter')?.value;
    
    if (search) params.set('search', search);
    if (role) params.set('role', role);
    
    const response = await fetch(`${API_BASE_URL}/dept-admin/department-employees/${userDepartmentId}?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      employeesData = data.data || [];
      
      displayEmployees();
      updateStats();
    } else {
      throw new Error('فشل في تحميل بيانات الموظفين');
    }
  } catch (error) {
    console.error('Error loading employees:', error);
    showError('فشل في تحميل بيانات الموظفين');
  }
}

// Display employees in table
function displayEmployees() {
  const tbody = document.getElementById('employeesTableBody');
  
  if (!employeesData || employeesData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="no-data">
          لا توجد بيانات موظفين متاحة
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = employeesData.map(employee => `
    <tr>
      <td class="employee-info">
        <div class="employee-name">${escapeHtml(employee.FullName || '-')}</div>
        <div class="employee-details">
          @${escapeHtml(employee.Username || '-')}
          ${employee.Specialty ? `• ${escapeHtml(employee.Specialty)}` : ''}
        </div>
      </td>
      <td>${escapeHtml(employee.UserID || employee.EmployeeID || '-')}</td>
      <td>${escapeHtml(employee.Email || '-')}</td>
      <td>
        <span class="role-badge role-${getRoleClass(employee.RoleID)}">
          ${escapeHtml(employee.RoleName || getRoleName(employee.RoleID))}
        </span>
      </td>
      <td>${formatDate(employee.JoinDate)}</td>
      <td>
        <div class="actions-cell">
          ${generateActionButtons(employee)}
        </div>
      </td>
    </tr>
  `).join('');
}

// Generate action buttons for employee
function generateActionButtons(employee) {
  let buttons = '';
  
  // Can't delete self
  if (Number(employee.UserID || employee.EmployeeID) === Number(currentUser.UserID || currentUser.EmployeeID)) {
    buttons += `
      <span class="btn btn-sm btn-secondary" style="opacity: 0.5;">
        <i class="fas fa-user-shield"></i>
        أنت
      </span>
    `;
  } else {
    // Delete request button (only for same department)
    buttons += `
              <button class="btn btn-sm btn-danger" onclick="openDeleteModal(${employee.UserID || employee.EmployeeID}, '${escapeHtml(employee.FullName)}')">
        <i class="fas fa-trash"></i>
        طلب حذف
      </button>
    `;
  }
  
  // Edit permissions button
  buttons += `
    <button class="btn btn-sm btn-primary" onclick="editPermissions(${employee.UserID || employee.EmployeeID})">
      <i class="fas fa-key"></i>
      الصلاحيات
    </button>
  `;
  
  // View activity button
  buttons += `
    <button class="btn btn-sm btn-warning" onclick="viewActivity(${employee.UserID || employee.EmployeeID})">
      <i class="fas fa-chart-line"></i>
      النشاط
    </button>
  `;
  
  return buttons;
}

// Get role class for styling
function getRoleClass(roleId) {
  switch (Number(roleId)) {
    case 1: return 'super';
    case 2: return 'employee';
    case 3: return 'admin';
    default: return 'employee';
  }
}

// Get role name
function getRoleName(roleId) {
  switch (Number(roleId)) {
    case 1: return 'سوبر أدمن';
    case 2: return 'موظف';
    case 3: return 'مدير قسم';
    default: return 'غير محدد';
  }
}

// Update statistics
function updateStats() {
  const totalEmployees = employeesData.length;
  const activeEmployees = employeesData.filter(emp => emp.RoleID && emp.RoleID !== 1).length; // Exclude super admin
  
  // Calculate new employees this month
  const thisMonth = new Date();
  thisMonth.setDate(1);
  const newEmployees = employeesData.filter(emp => 
    emp.JoinDate && new Date(emp.JoinDate) >= thisMonth
  ).length;
  
  // Only update if department data hasn't already set these values
  if (!departmentData || !departmentData.totalEmployees) {
    document.getElementById('totalEmployees').textContent = totalEmployees;
  }
  document.getElementById('activeEmployees').textContent = activeEmployees;
  if (!departmentData || !departmentData.newEmployees) {
    document.getElementById('newEmployees').textContent = newEmployees;
  }
  
  // Load pending deletion requests count
  loadPendingRequests();
}

// Load pending deletion requests
async function loadPendingRequests() {
  try {
    const response = await fetch(`${API_BASE_URL}/dept-admin/deletion-requests/pending`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      document.getElementById('pendingRequests').textContent = data.count || 0;
    }
  } catch (error) {
    console.error('Error loading pending requests:', error);
    document.getElementById('pendingRequests').textContent = 0;
  }
}

// Open delete modal
function openDeleteModal(employeeId, employeeName) {
  currentDeleteEmployee = employeeId;
  document.getElementById('deleteEmployeeName').value = employeeName;
  document.getElementById('deleteReason').value = '';
  document.getElementById('deleteModal').style.display = 'block';
}

// Submit delete request
async function submitDeleteRequest() {
  if (!currentDeleteEmployee) return;
  
  const reason = document.getElementById('deleteReason').value.trim();
  
  if (!reason) {
    showErrorMessage('يرجى كتابة سبب طلب الحذف');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/dept-admin/employees/${currentDeleteEmployee}/delete-request`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reason: reason
      })
    });
    
    if (response.ok) {
      showSuccessMessage('تم إرسال طلب الحذف بنجاح. سيتم مراجعته من قبل السوبر أدمن.');
      closeModal('deleteModal');
      loadEmployees();
    } else {
      const data = await response.json();
      throw new Error(data.message || 'فشل في إرسال طلب الحذف');
    }
  } catch (error) {
    console.error('Error submitting delete request:', error);
    showErrorMessage(error.message);
  }
}

// Edit permissions
function editPermissions(employeeId) {
  // Navigate to permissions page with employee ID
  window.location.href = `/superadmin/permissions.html?employee=${employeeId}`;
}

// View activity
function viewActivity(employeeId) {
  // Navigate to logs page with employee filter
  window.location.href = `logs.html?employee=${employeeId}`;
}

// Apply filters
function applyFilters() {
  loadEmployees();
}

// Clear filters
function clearFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('roleFilter').value = '';
  loadEmployees();
}

// Close modal
function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
  currentDeleteEmployee = null;
}

// Setup event listeners
function setupEventListeners() {
  // Search input
  document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  });
  
  // Role filter
  document.getElementById('roleFilter')?.addEventListener('change', applyFilters);
  
  // Close modals when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
      currentDeleteEmployee = null;
    }
  });
}

// Utility functions
function showLoading() {
  const tbody = document.getElementById('employeesTableBody');
  tbody.innerHTML = `
    <tr>
      <td colspan="6" class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        جاري التحميل...
      </td>
    </tr>
  `;
}

function showError(message) {
  const tbody = document.getElementById('employeesTableBody');
  tbody.innerHTML = `
    <tr>
      <td colspan="6" class="no-data">
        <i class="fas fa-exclamation-triangle"></i>
        ${message}
      </td>
    </tr>
  `;
}

function showSuccessMessage(message) {
  const successMsg = document.getElementById('successMessage');
  successMsg.textContent = message;
  successMsg.style.display = 'block';
  
  // Hide error message
  document.getElementById('errorMessage').style.display = 'none';
  
  // Auto hide after 5 seconds
  setTimeout(() => {
    successMsg.style.display = 'none';
  }, 5000);
}

function showErrorMessage(message) {
  const errorMsg = document.getElementById('errorMessage');
  errorMsg.textContent = message;
  errorMsg.style.display = 'block';
  
  // Hide success message
  document.getElementById('successMessage').style.display = 'none';
  
  // Auto hide after 5 seconds
  setTimeout(() => {
    errorMsg.style.display = 'none';
  }, 5000);
}

function formatDate(dateString) {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
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