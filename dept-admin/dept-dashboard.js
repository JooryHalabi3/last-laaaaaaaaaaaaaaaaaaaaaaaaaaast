// Department Dashboard JavaScript
const API_BASE_URL = 'http://127.0.0.1:3001/api';

let currentLang = localStorage.getItem('lang') || 'ar';
let currentUser = null;
let userDepartmentId = null;
let currentComplaintId = null;
let currentStatus = null;



// Check if user is Department Admin (RoleID = 3)
function checkDepartmentAdminAccess() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user || Number(user.RoleID) !== 3) {
    alert('Access denied. Only Department Admins can access this page.');
    window.location.replace('/login/login.html');
    return false;
  }
  
  currentUser = user;
  userDepartmentId = user.DepartmentID;
  return true;
}

// Language management
function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);

  document.documentElement.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.style.textAlign = lang === 'ar' ? 'right' : 'left';

  document.querySelectorAll('[data-ar]').forEach(el => {
    el.textContent = el.getAttribute(`data-${lang}`);
  });

  document.querySelectorAll('[data-ar-placeholder]').forEach(el => {
    el.placeholder = el.getAttribute(`data-${lang}-placeholder`);
  });

  const langText = document.getElementById('langText');
  if (langText) {
    langText.textContent = lang === 'ar' ? 'العربية | English' : 'English | العربية';
  }

  document.body.style.fontFamily = lang === 'ar' ? "'Tajawal', sans-serif" : "serif";
}

// Navigation
function goBack() {
  window.location.href = '/dept-admin/dept-admin.html';
}

// Modal functions
function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
}

// KPI Functions
async function loadKPIs() {
  try {
    const response = await fetch(`${API_BASE_URL}/dept-admin/dashboard/kpis/${userDepartmentId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      updateKPIDisplay(data);
    } else {
      console.error('Failed to load KPIs');
    }
  } catch (error) {
    console.error('Error loading KPIs:', error);
  }
}

function updateKPIDisplay(kpiData) {
  const kpis = kpiData.data || kpiData || {};
  
  document.getElementById('kpiTodayNew').textContent = kpis.today_new || '0';
  document.getElementById('kpiOpen').textContent = kpis.open || '0';
  document.getElementById('kpiProgress').textContent = kpis.in_progress || '0';
  document.getElementById('kpiOverdue').textContent = kpis.overdue || '0';

  // Update change indicators
  updateChangeIndicator('kpiTodayNewChange', kpis.today_new_change || 0);
  updateChangeIndicator('kpiOpenChange', kpis.open_change || 0);
  updateChangeIndicator('kpiProgressChange', kpis.progress_change || 0);
  updateChangeIndicator('kpiOverdueChange', kpis.overdue_change || 0);
}

function updateChangeIndicator(elementId, change) {
  const element = document.getElementById(elementId);
  if (element) {
    const isPositive = change >= 0;
    element.textContent = `${isPositive ? '+' : ''}${change}%`;
    element.className = `kpi-change ${isPositive ? '' : 'negative'}`;
  }
}



// Worklist Functions
async function loadWorklist() {
  try {
    const filters = getWorklistFilters();
    const queryParams = new URLSearchParams(filters).toString();
    
    const response = await fetch(`${API_BASE_URL}/dept-admin/dashboard/worklist/${userDepartmentId}?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      renderWorklist(data.data || data || []);
    } else {
      console.error('Failed to load worklist');
    }
  } catch (error) {
    console.error('Error loading worklist:', error);
  }
}

function getWorklistFilters() {
  return {
    dateRange: document.getElementById('dateRange').value,
    status: document.getElementById('statusFilter').value,
    priority: document.getElementById('priorityFilter').value,
    assignment: document.getElementById('assignmentFilter').value,
    search: document.getElementById('searchInput').value
  };
}

function renderWorklist(complaints) {
  const tbody = document.getElementById('worklistTableBody');
  tbody.innerHTML = '';

  if (complaints.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-text">لا توجد شكاوى</div>
          <div class="empty-state-subtext">لا توجد شكاوى تطابق المعايير المحددة</div>
        </td>
      </tr>
    `;
    return;
  }

  complaints.forEach(complaint => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${complaint.ComplaintID}</td>
      <td>${complaint.PatientName || complaint.RequesterName || '-'}</td>
      <td>${complaint.ComplaintTypeName || complaint.TypeName || '-'}</td>
      <td>${formatDate(complaint.CreatedAt || complaint.ComplaintDate)}</td>
      <td><span class="status-badge status-${getStatusClass(complaint.CurrentStatus)}">${complaint.CurrentStatus}</span></td>
      <td><span class="priority-badge priority-${getPriorityClass(complaint.Priority)}">${complaint.Priority}</span></td>
      <td>${complaint.AssignedEmployeeName || 'غير مخصص'}</td>
      <td class="action-buttons">
        <button class="btn-small btn-assign" onclick="openAssignmentModal(${complaint.ComplaintID})" data-ar="توزيع" data-en="Assign">توزيع</button>
        <button class="btn-small btn-status" onclick="openStatusModal(${complaint.ComplaintID}, '${complaint.CurrentStatus}')" data-ar="تغيير الحالة" data-en="Change Status">تغيير الحالة</button>
        <button class="btn-small btn-view" onclick="viewComplaintDetails(${complaint.ComplaintID})" data-ar="عرض التفاصيل" data-en="View Details">عرض التفاصيل</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function getStatusClass(status) {
  const statusMap = {
    'جديدة': 'new',
    'مفتوحة/جديدة': 'new',
    'قيد المعالجة': 'progress',
    'تم الحل': 'resolved',
    'مغلقة': 'closed'
  };
  return statusMap[status] || 'new';
}

function getPriorityClass(priority) {
  const priorityMap = {
    'عالية': 'high',
    'متوسطة': 'medium',
    'منخفضة': 'low'
  };
  return priorityMap[priority] || 'medium';
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString(currentLang === 'ar' ? 'ar-SA' : 'en-US');
}

// Filter functions
function filterByStatus(status) {
  document.getElementById('statusFilter').value = status;
  loadWorklist();
}

function filterBySLA(slaType) {
  // Apply specific SLA filters
  const filters = {
    unanswered: { status: 'new', days: 3 },
    'due-today': { dueDate: new Date().toISOString().split('T')[0] },
    reminders: { reminder: true }
  };
  
  // Apply the filter and reload worklist
  loadWorklist();
}

function searchComplaints() {
  loadWorklist();
}

// Team Functions
async function loadTeam() {
  try {
    const response = await fetch(`${API_BASE_URL}/dept-admin/dashboard/team/${userDepartmentId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      renderTeam(data.data || data || []);
    } else {
      console.error('Failed to load team');
    }
  } catch (error) {
    console.error('Error loading team:', error);
  }
}

function renderTeam(employees) {
  const tbody = document.getElementById('teamTableBody');
  tbody.innerHTML = '';

  if (employees.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">
          <div class="empty-state-icon">👥</div>
          <div class="empty-state-text">لا يوجد فريق</div>
          <div class="empty-state-subtext">لا يوجد موظفين في هذا القسم</div>
        </td>
      </tr>
    `;
    return;
  }

  employees.forEach(employee => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${employee.FullName}</td>
      <td>${employee.Email || '-'}</td>
      <td>${employee.RoleName}</td>
      <td><span class="workload-badge workload-${getWorkloadClass(employee.Workload)}">${employee.Workload || 0}</span></td>
    `;
    tbody.appendChild(row);
  });
}

function getWorkloadClass(workload) {
  if (workload <= 3) return 'low';
  if (workload <= 7) return 'medium';
  return 'high';
}

function searchTeam() {
  const searchTerm = document.getElementById('teamSearch').value;
  // Implement team search functionality
  loadTeam();
}

// SLA Functions
async function loadSLAAlerts() {
  try {
    const response = await fetch(`${API_BASE_URL}/dept-admin/dashboard/sla/${userDepartmentId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      updateSLAAlerts(data.data || data || {});
    } else {
      console.error('Failed to load SLA alerts');
    }
  } catch (error) {
    console.error('Error loading SLA alerts:', error);
  }
}

function updateSLAAlerts(slaData) {
  document.getElementById('slaUnanswered').textContent = slaData.unanswered || 0;
  document.getElementById('slaDueToday').textContent = slaData.due_today || 0;
  document.getElementById('slaReminders').textContent = slaData.reminders || 0;
}

// Activity Functions
async function loadRecentActivity() {
  try {
    const response = await fetch(`${API_BASE_URL}/dept-admin/dashboard/activity/${userDepartmentId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      renderRecentActivity(data.data || data || []);
    } else {
      console.error('Failed to load recent activity');
    }
  } catch (error) {
    console.error('Error loading recent activity:', error);
  }
}

function renderRecentActivity(activities) {
  const list = document.getElementById('activityList');
  list.innerHTML = '';

  if (activities.length === 0) {
    list.innerHTML = `
      <li class="empty-state">
        <div class="empty-state-icon">📝</div>
        <div class="empty-state-text">لا يوجد نشاط حديث</div>
      </li>
    `;
    return;
  }

  activities.forEach(activity => {
    const li = document.createElement('li');
    li.className = 'activity-item';
    li.innerHTML = `
      <div class="activity-content">
        <span class="activity-user">${activity.Username}</span>
        <span class="activity-action">${activity.Description}</span>
      </div>
      <div class="activity-time">${formatDateTime(activity.CreatedAt)}</div>
    `;
    list.appendChild(li);
  });
}

function formatDateTime(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString(currentLang === 'ar' ? 'ar-SA' : 'en-US');
}

// Assignment Modal Functions
function openAssignmentModal(complaintId) {
  currentComplaintId = complaintId;
  loadEmployeesForAssignment();
  document.getElementById('assignmentModal').style.display = 'block';
}

async function loadEmployeesForAssignment() {
  try {
    const response = await fetch(`${API_BASE_URL}/dept-admin/department-employees/${userDepartmentId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      populateEmployeeSelect(data.data || []);
    }
  } catch (error) {
    console.error('Error loading employees for assignment:', error);
  }
}

function populateEmployeeSelect(employees) {
  const select = document.getElementById('employeeSelect');
  select.innerHTML = '<option value="" data-ar="اختر موظف..." data-en="Select employee...">اختر موظف...</option>';
  
  employees.forEach(employee => {
    const option = document.createElement('option');
    option.value = employee.UserID || employee.EmployeeID;
    option.textContent = employee.FullName;
    select.appendChild(option);
  });
}

async function confirmAssignment() {
  const employeeId = document.getElementById('employeeSelect').value;
  if (!employeeId) {
    alert(currentLang === 'ar' ? 'يرجى اختيار موظف' : 'Please select an employee');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/dept-admin/complaints/${currentComplaintId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ employeeId })
    });

    if (response.ok) {
      closeModal('assignmentModal');
      loadWorklist();
      loadKPIs();
      showSuccessMessage(currentLang === 'ar' ? 'تم توزيع الشكوى بنجاح' : 'Complaint assigned successfully');
    } else {
      const error = await response.json();
      showErrorMessage(error.message || 'Failed to assign complaint');
    }
  } catch (error) {
    console.error('Error assigning complaint:', error);
    showErrorMessage('Error assigning complaint');
  }
}

// Status Modal Functions
function openStatusModal(complaintId, currentStatus) {
  currentComplaintId = complaintId;
  currentStatus = currentStatus;
  document.getElementById('statusSelect').value = getStatusValue(currentStatus);
  document.getElementById('statusModal').style.display = 'block';
}

function getStatusValue(status) {
  const statusMap = {
    'جديدة': 'new',
    'مفتوحة/جديدة': 'new',
    'قيد المعالجة': 'progress',
    'تم الحل': 'resolved',
    'مغلقة': 'closed'
  };
  return statusMap[status] || 'new';
}

async function confirmStatusChange() {
  const newStatus = document.getElementById('statusSelect').value;
  const statusText = getStatusText(newStatus);

  try {
    const response = await fetch(`${API_BASE_URL}/dept-admin/complaints/${currentComplaintId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ status: statusText })
    });

    if (response.ok) {
      closeModal('statusModal');
      loadWorklist();
      loadKPIs();
      showSuccessMessage(currentLang === 'ar' ? 'تم تغيير الحالة بنجاح' : 'Status changed successfully');
    } else {
      const error = await response.json();
      showErrorMessage(error.message || 'Failed to change status');
    }
  } catch (error) {
    console.error('Error changing status:', error);
    showErrorMessage('Error changing status');
  }
}

function getStatusText(statusValue) {
  const statusMap = {
    'new': 'جديدة',
    'progress': 'قيد المعالجة',
    'resolved': 'تم الحل',
    'closed': 'مغلقة'
  };
  return statusMap[statusValue] || 'جديدة';
}

// Complaint Details
function viewComplaintDetails(complaintId) {
  // Navigate to complaint details page (department-scoped)
  window.open(`/complaints/details.html?id=${complaintId}&dept=${userDepartmentId}`, '_blank');
}

// Utility Functions
function showSuccessMessage(message) {
  // Implement success message display
  console.log('Success:', message);
}

function showErrorMessage(message) {
  // Implement error message display
  console.error('Error:', message);
}

// Initialize date picker
function initializeDatePicker() {
  flatpickr("#dateRange", {
    mode: "range",
    dateFormat: "Y-m-d",
    locale: currentLang === 'ar' ? 'ar' : 'en',
    onChange: function(selectedDates, dateStr, instance) {
      loadWorklist();
    }
  });
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  if (!checkDepartmentAdminAccess()) return;
  
  applyLanguage(currentLang);

  // Language toggle
  const toggleBtn = document.getElementById('langToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const newLang = currentLang === 'ar' ? 'en' : 'ar';
      applyLanguage(newLang);
    });
  }

  // Initialize date picker
  initializeDatePicker();

  // Load all dashboard data
  loadKPIs();
  loadWorklist();
  loadTeam();
  loadSLAAlerts();
  loadRecentActivity();

  // Add event listeners for filters
  document.getElementById('statusFilter').addEventListener('change', loadWorklist);
  document.getElementById('priorityFilter').addEventListener('change', loadWorklist);
  document.getElementById('assignmentFilter').addEventListener('change', loadWorklist);

  // Add search event listeners
  document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      searchComplaints();
    }
  });

  document.getElementById('teamSearch').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      searchTeam();
    }
  });

  // Notification button functionality
  const notifBtn = document.getElementById('notifBtn');
  const notifCount = document.getElementById('notifCount');
  if (notifBtn && notifCount) {
    notifBtn.addEventListener('click', () => {
      let count = parseInt(notifCount.textContent || '0', 10);
      if (count > 0) {
        count--;
        notifCount.textContent = count;
        if (count === 0) {
          notifCount.style.display = 'none';
        }
      }
    });
  }
});
