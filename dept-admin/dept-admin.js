// Department Admin JavaScript
const API_BASE_URL = 'http://localhost:3001/api';

let currentLang = localStorage.getItem('lang') || 'ar';
let currentUser = null;
let userDepartmentId = null;
document.addEventListener('DOMContentLoaded', () => {
  try {
    const rootToken = localStorage.getItem('rootToken');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // يظهر الزر فقط إذا كان فيه rootToken (يعني السوبر أدمن متقمص حساب)
    // وأيضًا فقط إذا الدور الحالي مو SUPER_ADMIN
    if (rootToken && user?.RoleID !== 1) {
      showReturnToSuperAdminButton();
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

// Check if user is Department Admin (RoleID = 3)
function checkDepartmentAdminAccess() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  console.log('Current user data:', user); // Debug log
  
  if (!user || Number(user.RoleID) !== 3) {
    alert('Access denied. Only Department Admins can access this page.');
    window.location.replace('/login/login.html');
    return false;
  }
  
  currentUser = user;
  userDepartmentId = user.DepartmentID;
  
  // Debug log to see what DepartmentID value we have
  console.log('User DepartmentID:', userDepartmentId);
  console.log('User DepartmentID type:', typeof userDepartmentId);
  
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

  // Update select options
  document.querySelectorAll('select option[data-ar]').forEach(option => {
    option.textContent = option.getAttribute(`data-${lang}`);
  });

  const langText = document.getElementById('langText');
  if (langText) {
    langText.textContent = lang === 'ar' ? 'العربية | English' : 'English | العربية';
  }

  // Update department status button text
  const deptStatusBtn = document.getElementById('deptStatusBtn');
  if (deptStatusBtn) {
    const statusSpan = deptStatusBtn.querySelector('span');
    if (statusSpan) {
      statusSpan.textContent = statusSpan.getAttribute(`data-${lang}`);
    }
  }

  // Update assignment modal elements
  const assignmentModal = document.getElementById('assignmentModal');
  const individualAssignmentModal = document.getElementById('individualAssignmentModal');
  const editPermissionsModal = document.getElementById('editPermissionsModal');
  
  if (assignmentModal) {
    const modalTitle = assignmentModal.querySelector('h2');
    if (modalTitle) {
      modalTitle.textContent = modalTitle.getAttribute(`data-${lang}`);
    }
  }
  
  if (individualAssignmentModal) {
    const modalTitle = individualAssignmentModal.querySelector('h2');
    if (modalTitle) {
      modalTitle.textContent = modalTitle.getAttribute(`data-${lang}`);
    }
    
    const modalLabel = individualAssignmentModal.querySelector('label');
    if (modalLabel) {
      modalLabel.textContent = modalLabel.getAttribute(`data-${lang}`);
    }
    
    const cancelBtn = individualAssignmentModal.querySelector('.btn-cancel');
    if (cancelBtn) {
      cancelBtn.textContent = cancelBtn.getAttribute(`data-${lang}`);
    }
    
    const confirmBtn = individualAssignmentModal.querySelector('.btn-confirm');
    if (confirmBtn) {
      confirmBtn.textContent = confirmBtn.getAttribute(`data-${lang}`);
    }
  }

  // Update edit permissions modal elements
  if (editPermissionsModal) {
    const modalTitle = editPermissionsModal.querySelector('h2');
    if (modalTitle) {
      modalTitle.textContent = modalTitle.getAttribute(`data-${lang}`);
    }
    
    const employeeNameEl = editPermissionsModal.querySelector('#employeeName');
    if (employeeNameEl) {
      employeeNameEl.textContent = employeeNameEl.getAttribute(`data-${lang}`);
    }
    
    const employeeDetailsEl = editPermissionsModal.querySelector('#employeeDetails');
    if (employeeDetailsEl) {
      employeeDetailsEl.textContent = employeeDetailsEl.getAttribute(`data-${lang}`);
    }
    
    const permissionsTitle = editPermissionsModal.querySelector('h4');
    if (permissionsTitle) {
      permissionsTitle.textContent = permissionsTitle.getAttribute(`data-${lang}`);
    }
    
    const cancelBtn = editPermissionsModal.querySelector('.btn-cancel');
    if (cancelBtn) {
      cancelBtn.textContent = cancelBtn.getAttribute(`data-${lang}`);
    }
    
    const saveBtn = editPermissionsModal.querySelector('.btn-confirm');
    if (saveBtn) {
      saveBtn.textContent = saveBtn.getAttribute(`data-${lang}`);
    }

    // Update permissions grid if it exists
    if (currentEmployeeId && availablePermissions.length > 0) {
      displayPermissionsGrid();
    }
  }

  document.body.style.fontFamily = lang === 'ar' ? "'Tajawal', sans-serif" : "serif";
}

// Modal functions
// Department Dashboard is now a separate page at /dept-admin/dept-dashboard.html

function openDepartmentEmployees() {
  console.log('Opening Department Employees modal...');
  console.log('userDepartmentId:', userDepartmentId);
  
  if (!userDepartmentId) {
    // Instead of blocking access, let's show a warning but still allow the modal to open
    // This way users can see the interface even if their department isn't set
    alert('Warning: Your department is not set. You may not see any employees. Please contact the administrator to set your department.');
  }
  
  document.getElementById('employeesModal').style.display = 'block';
  loadDepartmentEmployees();
}

function openDepartmentComplaints() {
  if (!userDepartmentId) {
    alert('Your department is not set. Please contact the administrator.');
    return;
  }
  
  document.getElementById('complaintsModal').style.display = 'block';
  
  // Show loading state
  const tbody = document.getElementById('departmentComplaintsTableBody');
  tbody.innerHTML = '<tr><td colspan="5">جاري التحميل...</td></tr>';
  
  loadDepartmentComplaints();
}

function openComplaintAssignment() {
  if (!userDepartmentId) {
    alert('Your department is not set. Please contact the administrator.');
    return;
  }
  
  document.getElementById('assignmentModal').style.display = 'block';
  
  // Show loading state
  const tbody = document.getElementById('assignmentTableBody');
  tbody.innerHTML = '<tr><td colspan="5">جاري التحميل...</td></tr>';
  
  loadComplaintsForAssignment();
}

function openDepartmentLogs() {
  document.getElementById('logsModal').style.display = 'block';
  loadDepartmentLogs();
}

function openDepartmentPermissions() {
  document.getElementById('permissionsModal').style.display = 'block';
  loadDepartmentEmployeesForPermissions();
}

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

// Department Employees Functions
let allEmployees = [];
let currentPage = 1;
let itemsPerPage = 10;
let currentSort = { field: 'FullName', direction: 'asc' };

async function loadDepartmentEmployees() {
  const loadingEl = document.getElementById('employeesLoading');
  const emptyEl = document.getElementById('employeesEmptyState');
  const errorEl = document.getElementById('employeesErrorState');
  const tableEl = document.getElementById('employeesTable');
  const paginationEl = document.getElementById('employeesPagination');

  // Show loading state
  loadingEl.style.display = 'flex';
  emptyEl.style.display = 'none';
  errorEl.style.display = 'none';
  tableEl.style.display = 'none';
  paginationEl.style.display = 'none';

  // Check if userDepartmentId is available
  if (!userDepartmentId) {
    loadingEl.style.display = 'none';
    errorEl.style.display = 'block';
    // Update error message to be more specific
    const errorMessage = errorEl.querySelector('p');
    if (errorMessage) {
      errorMessage.textContent = 'Your department is not set. Please contact the administrator to assign you to a department.';
    }
    return;
  }

  try {
    // Build query parameters
    const searchTerm = document.getElementById('employeeSearch').value;
    const roleFilter = document.getElementById('roleFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (roleFilter) params.append('role', roleFilter);
    if (statusFilter) params.append('status', statusFilter);
    params.append('sortBy', currentSort.field);
    params.append('sortOrder', currentSort.direction.toUpperCase());

    console.log('Making API request to:', `${API_BASE_URL}/dept-admin/department-employees/${userDepartmentId}?${params}`);
    
    const response = await fetch(`${API_BASE_URL}/dept-admin/department-employees/${userDepartmentId}?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      allEmployees = data.data || [];
      
      if (allEmployees.length === 0) {
        // Show empty state
        loadingEl.style.display = 'none';
        emptyEl.style.display = 'block';
        return;
      }

      // Display results directly since backend handles filtering
      displayDepartmentEmployees();
    } else {
      throw new Error('Failed to load department employees');
    }
  } catch (error) {
    console.error('Error loading department employees:', error);
    loadingEl.style.display = 'none';
    errorEl.style.display = 'block';
  }
}

function applyEmployeeFilters() {
  // Reset to first page when filtering
  currentPage = 1;
  // Reload data from backend with new filters
  loadDepartmentEmployees();
}



function displayDepartmentEmployees() {
  const tbody = document.getElementById('employeesTableBody');
  const loadingEl = document.getElementById('employeesLoading');
  const emptyEl = document.getElementById('employeesEmptyState');
  const tableEl = document.getElementById('employeesTable');
  const paginationEl = document.getElementById('employeesPagination');

  loadingEl.style.display = 'none';

  if (allEmployees.length === 0) {
    emptyEl.style.display = 'block';
    tableEl.style.display = 'none';
    paginationEl.style.display = 'none';
    return;
  }

  emptyEl.style.display = 'none';
  tableEl.style.display = 'table';
  paginationEl.style.display = 'flex';

  // Calculate pagination
  const totalPages = Math.ceil(allEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageEmployees = allEmployees.slice(startIndex, endIndex);

  tbody.innerHTML = '';

  pageEmployees.forEach(employee => {
    const row = document.createElement('tr');
    
    // Determine status and role classes
    const isActive = employee.Status !== 'inactive'; // Adjust based on your actual status field
    const statusClass = isActive ? 'status-active' : 'status-inactive';
    const statusText = isActive ? 'Active' : 'Inactive';
    
    const roleClass = employee.RoleName === 'EMPLOYEE' ? 'role-employee' : 'role-admin';

    row.innerHTML = `
      <td>${employee.EmployeeID}</td>
      <td>${employee.FullName || '-'}</td>
      <td>${employee.Email || '-'}</td>
      <td>${employee.DepartmentName || '-'}</td>
      <td><span class="role-badge ${roleClass}">${employee.RoleName}</span></td>
      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      <td>${employee.PhoneNumber || '-'}</td>
      <td>${employee.Username || '-'}</td>
      <td class="table-actions">
        <button class="btn-edit" onclick="editEmployee(${employee.EmployeeID})" data-ar="تعديل" data-en="Edit">Edit</button>
        <button class="btn-assign" onclick="manageEmployeePermissions(${employee.EmployeeID})" data-ar="الصلاحيات" data-en="Permissions">Permissions</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  // Update pagination info
  updatePaginationInfo(totalPages);
}

function updatePaginationInfo(totalPages) {
  const pageInfo = document.getElementById('pageInfo');
  const prevBtn = document.querySelector('.pagination button:first-child');
  const nextBtn = document.querySelector('.pagination button:last-child');

  pageInfo.textContent = `Page ${currentPage} of ${totalPages} (${allEmployees.length} employees)`;
  
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === totalPages;
}

function previousPage() {
  if (currentPage > 1) {
    currentPage--;
    displayDepartmentEmployees();
  }
}

function nextPage() {
  const totalPages = Math.ceil(allEmployees.length / itemsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    displayDepartmentEmployees();
  }
}

function sortEmployees(field) {
  const header = document.querySelector(`th[onclick="sortEmployees('${field}')"]`);
  
  // Remove sort classes from all headers
  document.querySelectorAll('.sortable').forEach(th => {
    th.classList.remove('asc', 'desc');
  });

  // Update sort direction
  if (currentSort.field === field) {
    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
  } else {
    currentSort.field = field;
    currentSort.direction = 'asc';
  }

  // Add sort class to current header
  header.classList.add(currentSort.direction);

  // Reload data with new sorting
  loadDepartmentEmployees();
}

function filterEmployees() {
  currentPage = 1; // Reset to first page when filtering
  loadDepartmentEmployees();
}

async function searchEmployees() {
  currentPage = 1; // Reset to first page when searching
  loadDepartmentEmployees();
}

function clearEmployeeFilters() {
  document.getElementById('employeeSearch').value = '';
  document.getElementById('roleFilter').value = '';
  document.getElementById('statusFilter').value = '';
  currentPage = 1;
  loadDepartmentEmployees();
}

// Helper function to show department status
function showDepartmentStatus() {
  const status = {
    user: currentUser?.FullName || 'Unknown',
    role: currentUser?.RoleID === 3 ? 'Department Admin' : 'Unknown Role',
    departmentId: userDepartmentId || 'Not Set',
    departmentName: currentUser?.DepartmentName || 'Not Set'
  };
  
  console.log('=== Department Status ===');
  console.log('User:', status.user);
  console.log('Role:', status.role);
  console.log('Department ID:', status.departmentId);
  console.log('Department Name:', status.departmentName);
  console.log('=======================');
  
  if (!userDepartmentId) {
    alert(`Department Status:\n\nUser: ${status.user}\nRole: ${status.role}\nDepartment: ${status.departmentName}\n\nYour department is not set. Please contact the administrator to assign you to a department.`);
  } else {
    alert(`Department Status:\n\nUser: ${status.user}\nRole: ${status.role}\nDepartment: ${status.departmentName}\n\nYour department is properly configured.`);
  }
}

async function editEmployee(employeeId) {
  // Implementation for editing employee within department
  alert(`Edit employee ${employeeId} functionality will be implemented`);
}

async function manageEmployeePermissions(employeeId) {
  // Implementation for managing employee permissions within department
  alert(`Manage permissions for employee ${employeeId} functionality will be implemented`);
}

// Department Complaints Functions
async function loadDepartmentComplaints() {
  if (!userDepartmentId) {
    alert('Your department is not set. Please contact the administrator.');
    return;
  }
  
  try {
    console.log('Loading complaints for department:', userDepartmentId);
    
    const response = await fetch(`${API_BASE_URL}/dept-admin/complaints/department/${userDepartmentId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Complaints data received:', data);
      displayDepartmentComplaints(data.data || []);
    } else {
      console.error('Failed to load department complaints:', response.status, response.statusText);
      const tbody = document.getElementById('departmentComplaintsTableBody');
      tbody.innerHTML = '<tr><td colspan="5" class="error">حدث خطأ في تحميل البيانات</td></tr>';
    }
  } catch (error) {
    console.error('Error loading department complaints:', error);
    const tbody = document.getElementById('departmentComplaintsTableBody');
    tbody.innerHTML = '<tr><td colspan="5" class="error">حدث خطأ في الاتصال بالخادم</td></tr>';
  }
}

function displayDepartmentComplaints(complaints) {
  const tbody = document.getElementById('departmentComplaintsTableBody');
  tbody.innerHTML = '';

  console.log('Displaying complaints:', complaints);

  if (!complaints || complaints.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">لا توجد شكاوى في هذا القسم</td></tr>';
    return;
  }

  complaints.forEach(complaint => {
    console.log('Processing complaint:', complaint);
    
    // Format the complaint date properly
    const complaintDate = complaint.ComplaintDate ? new Date(complaint.ComplaintDate).toLocaleDateString() : 'غير محدد';
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${complaint.ComplaintID || '-'}</td>
      <td>${complaint.AssignedEmployeeName || 'غير مخصص'}</td>
      <td>${complaint.CurrentStatus || 'غير محدد'}</td>
      <td>${complaintDate}</td>
      <td class="table-actions">
        <button class="btn-edit" onclick="viewComplaint(${complaint.ComplaintID})" data-ar="عرض" data-en="View">View</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

async function searchComplaints() {
  const searchTerm = document.getElementById('complaintSearch').value;
  // Implementation for searching complaints within department
  console.log('Searching for complaints:', searchTerm);
  loadDepartmentComplaints(); // Reload with search filter
}

async function viewComplaint(complaintId) {
  // Navigate to the complaint details page for the specific complaint
  if (!complaintId) {
    alert('Invalid complaint ID');
    return;
  }
  
  console.log('Opening complaint details for ID:', complaintId);
  
  try {
    // First, get the complaint details from the API
    const response = await fetch(`${API_BASE_URL}/complaints/details/${complaintId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data.complaint) {
        // Save complaint data to localStorage for the details page
        const complaintToSave = {
          ...data.data.complaint,
          _dataSource: 'dept-admin',
          _timestamp: Date.now()
        };
        localStorage.setItem('selectedComplaint', JSON.stringify(complaintToSave));
        
        // Navigate to the general complaints details page with the complaint ID
        window.location.href = `/general complaints/details.html?id=${complaintId}`;
      } else {
        throw new Error('Failed to load complaint details');
      }
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.error('Error loading complaint details:', error);
    alert('Error opening complaint details. Please try again.');
  }
}

// Removed assignComplaint function - assignment functionality is not available for Department Admin

// Complaint Assignment Functions
async function loadComplaintsForAssignment() {
  if (!userDepartmentId) {
    alert('Your department is not set. Please contact the administrator.');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/dept-admin/complaints/department/${userDepartmentId}/assignment`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Complaints for assignment data received:', data);
      displayComplaintsForAssignment(data.data || []);
    } else {
      console.error('Failed to load complaints for assignment:', response.status, response.statusText);
      const tbody = document.getElementById('assignmentTableBody');
      tbody.innerHTML = '<tr><td colspan="5" class="error">حدث خطأ في تحميل البيانات</td></tr>';
    }
  } catch (error) {
    console.error('Error loading complaints for assignment:', error);
    const tbody = document.getElementById('assignmentTableBody');
    tbody.innerHTML = '<tr><td colspan="5" class="error">حدث خطأ في الاتصال بالخادم</td></tr>';
  }
}

function displayComplaintsForAssignment(complaints) {
  const tbody = document.getElementById('assignmentTableBody');
  tbody.innerHTML = '';

  console.log('Displaying complaints for assignment:', complaints);

  if (!complaints || complaints.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">لا توجد شكاوى في هذا القسم</td></tr>';
    return;
  }

  complaints.forEach(complaint => {
    console.log('Processing complaint for assignment:', complaint);
    
    // Format the complaint date properly
    const complaintDate = complaint.ComplaintDate ? new Date(complaint.ComplaintDate).toLocaleDateString() : 'غير محدد';
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${complaint.ComplaintID || '-'}</td>
      <td>${complaint.AssignedEmployeeName || 'غير مخصص'}</td>
      <td>${complaint.CurrentStatus || 'غير محدد'}</td>
      <td>${complaintDate}</td>
      <td class="table-actions">
        <button class="btn-edit" onclick="viewComplaint(${complaint.ComplaintID})" data-ar="عرض" data-en="View">View</button>
        <button class="btn-assign" onclick="openAssignmentModal(${complaint.ComplaintID})" data-ar="توزيع" data-en="Assign">Assign</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

async function filterComplaintsForAssignment() {
  const filterType = document.getElementById('complaintFilter').value;
  // Implementation for filtering complaints for assignment
  console.log('Filtering complaints by:', filterType);
  loadComplaintsForAssignment(); // Reload with filter
}

// Assignment Modal Functions
let currentComplaintId = null;

async function openAssignmentModal(complaintId) {
  if (!complaintId) {
    alert('Invalid complaint ID');
    return;
  }
  
  currentComplaintId = complaintId;
  console.log('Opening assignment modal for complaint:', complaintId);
  
  // Show the individual assignment modal
  const modal = document.getElementById('individualAssignmentModal');
  modal.style.display = 'block';
  
  // Show loading state
  const loadingEl = document.getElementById('assignmentLoading');
  if (loadingEl) {
    loadingEl.style.display = 'flex';
  }
  
  // Load department employees for assignment
  await loadEmployeesForAssignment();
  
  // Hide loading state
  if (loadingEl) {
    loadingEl.style.display = 'none';
  }
}

async function loadEmployeesForAssignment() {
  if (!userDepartmentId) {
    alert('Your department is not set. Please contact the administrator.');
    return;
  }
  
  try {
    console.log('Loading employees for assignment in department:', userDepartmentId);
    
    const response = await fetch(`${API_BASE_URL}/dept-admin/department-employees/${userDepartmentId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Employees data for assignment:', data);
      
      if (data.data && data.data.length > 0) {
        populateEmployeeSelect(data.data);
      } else {
        console.warn('No employees found in department');
        alert('No employees found in your department. Please contact the administrator.');
      }
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to load employees for assignment:', response.status, errorData);
      alert(`Failed to load employees: ${errorData.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error loading employees for assignment:', error);
    alert('Error loading employees. Please check your connection and try again.');
  }
}

function populateEmployeeSelect(employees) {
  const select = document.getElementById('employeeSelect');
  if (!select) {
    console.error('Employee select element not found');
    return;
  }
  
  select.innerHTML = '<option value="">اختر موظف...</option>';
  
  console.log('Populating employee select with:', employees);
  
  employees.forEach(employee => {
    const option = document.createElement('option');
    option.value = employee.EmployeeID;
    option.textContent = `${employee.FullName} (${employee.RoleName})`;
    select.appendChild(option);
  });
  
  console.log('Employee select populated with', employees.length, 'employees');
}

async function confirmAssignment() {
  const employeeSelect = document.getElementById('employeeSelect');
  if (!employeeSelect) {
    console.error('Employee select element not found');
    alert('Error: Employee selection not available');
    return;
  }
  
  const employeeId = employeeSelect.value;
  
  if (!employeeId) {
    alert('يرجى اختيار موظف');
    return;
  }
  
  if (!currentComplaintId) {
    alert('خطأ في معرف الشكوى');
    return;
  }
  
  try {
    console.log('Assigning complaint', currentComplaintId, 'to employee', employeeId);
    
    const requestBody = { employeeId: parseInt(employeeId) };
    console.log('Request body:', requestBody);
    
    const response = await fetch(`${API_BASE_URL}/dept-admin/complaints/${currentComplaintId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('Assignment response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Assignment successful:', data);
      alert('تم توزيع الشكوى بنجاح');
      
      // Close modal
      closeIndividualAssignmentModal();
      
      // Refresh the complaints table
      loadComplaintsForAssignment();
      
      // Refresh dashboard data (KPIs and latest complaints)
      refreshDashboardData();
    } else {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('Assignment failed:', response.status, errorData);
      alert(`فشل في توزيع الشكوى: ${errorData.message || 'خطأ غير معروف'}`);
    }
  } catch (error) {
    console.error('Error assigning complaint:', error);
    alert('خطأ في توزيع الشكوى. يرجى المحاولة مرة أخرى.');
  }
}

function closeIndividualAssignmentModal() {
  document.getElementById('individualAssignmentModal').style.display = 'none';
  currentComplaintId = null;
  const employeeSelect = document.getElementById('employeeSelect');
  if (employeeSelect) {
    employeeSelect.value = '';
  }
  
  // Hide loading state if visible
  const loadingEl = document.getElementById('assignmentLoading');
  if (loadingEl) {
    loadingEl.style.display = 'none';
  }
}

// Test function to verify assignment functionality
function testAssignmentFunctionality() {
  console.log('=== Testing Assignment Functionality ===');
  console.log('Current user:', currentUser);
  console.log('User DepartmentID:', userDepartmentId);
  console.log('Current complaint ID:', currentComplaintId);
  console.log('Employee select element:', document.getElementById('employeeSelect'));
  console.log('Individual assignment modal:', document.getElementById('individualAssignmentModal'));
  console.log('========================================');
}

// Department Logs Functions - REMOVED
// سجلات القسم محذوفة حسب الطلب

// Department Permissions Functions
async function loadDepartmentEmployeesForPermissions() {
  if (!userDepartmentId) {
    alert('Your department is not set. Please contact the administrator.');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/dept-admin/department-employees/${userDepartmentId}/permissions`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      displayDepartmentEmployeesForPermissions(data.data || []);
    } else {
      console.error('Failed to load department employees for permissions');
    }
  } catch (error) {
    console.error('Error loading department employees for permissions:', error);
  }
}

function displayDepartmentEmployeesForPermissions(employees) {
  const tbody = document.getElementById('permissionsTableBody');
  tbody.innerHTML = '';

  employees.forEach(employee => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${employee.FullName}</td>
      <td>${employee.EmployeeID}</td>
      <td>${employee.RoleName}</td>
      <td>${employee.Permissions || 'أساسية'}</td>
      <td class="table-actions">
        <button class="btn-edit" onclick="editEmployeePermissions(${employee.EmployeeID})" data-ar="تعديل الصلاحيات" data-en="Edit Permissions">Edit Permissions</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

async function searchEmployeesForPermissions() {
  const searchTerm = document.getElementById('permissionSearch').value;
  // Implementation for searching employees for permissions
  console.log('Searching for employees for permissions:', searchTerm);
  loadDepartmentEmployeesForPermissions(); // Reload with search filter
}

// Edit Permissions Variables
let currentEmployeeId = null;
let currentEmployeeData = null;
let availablePermissions = [];
let currentEmployeePermissions = [];

// Department-scoped permissions (no Super Admin permissions)
const departmentPermissions = [
  {
    id: 'view_complaints',
    name: 'View Complaints',
    description: 'Can view department complaints',
    ar_name: 'عرض الشكاوى',
    ar_description: 'يمكنه عرض شكاوى القسم'
  },
  {
    id: 'assign_complaints',
    name: 'Assign Complaints',
    description: 'Can assign complaints to employees',
    ar_name: 'توزيع الشكاوى',
    ar_description: 'يمكنه توزيع الشكاوى على الموظفين'
  },
  {
    id: 'update_complaint_status',
    name: 'Update Complaint Status',
    description: 'Can change complaint status',
    ar_name: 'تحديث حالة الشكوى',
    ar_description: 'يمكنه تغيير حالة الشكوى'
  },
  {
    id: 'view_reports',
    name: 'View Reports',
    description: 'Can view department reports',
    ar_name: 'عرض التقارير',
    ar_description: 'يمكنه عرض تقارير القسم'
  },
  {
    id: 'manage_employees',
    name: 'Manage Employees',
    description: 'Can manage department employees',
    ar_name: 'إدارة الموظفين',
    ar_description: 'يمكنه إدارة موظفي القسم'
  },
  {
    id: 'view_logs',
    name: 'View Logs',
    description: 'Can view department activity logs',
    ar_name: 'عرض السجلات',
    ar_description: 'يمكنه عرض سجلات نشاط القسم'
  }
];

async function editEmployeePermissions(employeeId) {
  if (!employeeId) {
    alert('Invalid employee ID');
    return;
  }

  currentEmployeeId = employeeId;
  console.log('Opening edit permissions modal for employee:', employeeId);

  // Show the edit permissions modal
  const modal = document.getElementById('editPermissionsModal');
  modal.style.display = 'block';

  // Show loading state
  const loadingEl = document.getElementById('permissionsLoading');
  if (loadingEl) {
    loadingEl.style.display = 'flex';
  }

  // Load employee data and permissions
  await loadEmployeeDataAndPermissions(employeeId);

  // Hide loading state
  if (loadingEl) {
    loadingEl.style.display = 'none';
  }
}

async function loadEmployeeDataAndPermissions(employeeId) {
  if (!userDepartmentId) {
    alert('Your department is not set. Please contact the administrator.');
    return;
  }

  try {
    console.log('Loading employee data and permissions for employee:', employeeId);

    // Load employee data
    const employeeResponse = await fetch(`${API_BASE_URL}/dept-admin/department-employees/${userDepartmentId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (employeeResponse.ok) {
      const employeeData = await employeeResponse.json();
      const employee = employeeData.data?.find(emp => emp.EmployeeID == employeeId);
      
      if (employee) {
        currentEmployeeData = employee;
        displayEmployeeInfo(employee);
      } else {
        console.error('Employee not found in department');
        alert('Employee not found in your department.');
        closeEditPermissionsModal();
        return;
      }
    } else {
      throw new Error('Failed to load employee data');
    }

    // Load current permissions (this would be from your backend)
    await loadCurrentEmployeePermissions(employeeId);

    // Display permissions
    displayPermissionsGrid();

  } catch (error) {
    console.error('Error loading employee data and permissions:', error);
    alert('Error loading employee data. Please try again.');
    closeEditPermissionsModal();
  }
}

function displayEmployeeInfo(employee) {
  const employeeNameEl = document.getElementById('employeeName');
  const employeeDetailsEl = document.getElementById('employeeDetails');

  if (employeeNameEl) {
    employeeNameEl.textContent = employee.FullName || 'Unknown Employee';
  }

  if (employeeDetailsEl) {
    const details = [
      `Employee ID: ${employee.EmployeeID}`,
      `Role: ${employee.RoleName}`,
      `Department: ${employee.DepartmentName}`,
      `Email: ${employee.Email || 'Not provided'}`
    ].join(' | ');
    employeeDetailsEl.textContent = details;
  }
}

async function loadCurrentEmployeePermissions(employeeId) {
  try {
    console.log('Loading current permissions for employee:', employeeId);
    
    // Fetch available permissions from backend
    const permissionsResponse = await fetch(`${API_BASE_URL}/dept-admin/permissions/available`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (permissionsResponse.ok) {
      const permissionsData = await permissionsResponse.json();
      availablePermissions = permissionsData.data || departmentPermissions;
    } else {
      console.warn('Failed to load available permissions, using default');
      availablePermissions = departmentPermissions;
    }

    // Fetch current employee permissions from backend
    const response = await fetch(`${API_BASE_URL}/dept-admin/employees/${employeeId}/permissions`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      // Extract permission IDs from the response
      currentEmployeePermissions = data.data?.permissions?.map(p => p.PermissionID) || [];
      console.log('Current permissions loaded:', currentEmployeePermissions);
    } else {
      console.warn('Failed to load current permissions, starting with empty');
      currentEmployeePermissions = [];
    }

  } catch (error) {
    console.error('Error loading current permissions:', error);
    currentEmployeePermissions = [];
    availablePermissions = departmentPermissions;
  }
}

function displayPermissionsGrid() {
  const permissionsGrid = document.getElementById('permissionsGrid');
  if (!permissionsGrid) return;

  permissionsGrid.innerHTML = '';

  availablePermissions.forEach(permission => {
    // Check if this permission is in the current employee's permissions
    const isChecked = currentEmployeePermissions.includes(permission.id);
    
    const permissionItem = document.createElement('div');
    permissionItem.className = 'permission-item';
    
    const permissionName = currentLang === 'ar' ? permission.ar_name : permission.name;
    const permissionDesc = currentLang === 'ar' ? permission.ar_description : permission.description;
    
    permissionItem.innerHTML = `
      <input type="checkbox" id="perm_${permission.id}" ${isChecked ? 'checked' : ''}>
      <label for="perm_${permission.id}">
        ${permissionName}
        <div class="permission-description">${permissionDesc}</div>
      </label>
    `;
    
    permissionsGrid.appendChild(permissionItem);
  });
}

async function saveEmployeePermissions() {
  if (!currentEmployeeId) {
    alert('No employee selected');
    return;
  }

  try {
    // Collect selected permissions
    const selectedPermissions = [];
    availablePermissions.forEach(permission => {
      const checkbox = document.getElementById(`perm_${permission.id}`);
      if (checkbox && checkbox.checked) {
        selectedPermissions.push(permission.id);
      }
    });

    console.log('Saving permissions for employee:', currentEmployeeId);
    console.log('Selected permissions:', selectedPermissions);

    const requestBody = {
      permissions: selectedPermissions
    };

    const response = await fetch(`${API_BASE_URL}/dept-admin/employees/${currentEmployeeId}/permissions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(requestBody)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Permissions saved successfully:', data);
      alert('تم حفظ الصلاحيات بنجاح');
      closeEditPermissionsModal();
      // Refresh the permissions table
      loadDepartmentEmployeesForPermissions();
      
      // Refresh dashboard data (KPIs and latest complaints)
      refreshDashboardData();
    } else {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('Failed to save permissions:', errorData);
      alert(`فشل في حفظ الصلاحيات: ${errorData.message || 'خطأ غير معروف'}`);
    }

  } catch (error) {
    console.error('Error saving permissions:', error);
    alert('خطأ في حفظ الصلاحيات. يرجى المحاولة مرة أخرى.');
  }
}

function closeEditPermissionsModal() {
  document.getElementById('editPermissionsModal').style.display = 'none';
  currentEmployeeId = null;
  currentEmployeeData = null;
  currentEmployeePermissions = [];
  
  // Hide loading state if visible
  const loadingEl = document.getElementById('permissionsLoading');
  if (loadingEl) {
    loadingEl.style.display = 'none';
  }
}

// Dashboard Functions
async function fetchDepartmentSummary() {
  if (!userDepartmentId) {
    console.warn('Cannot fetch department summary - DepartmentID not set');
    return;
  }
  
  try {
    console.log('Fetching department summary for DepartmentID:', userDepartmentId);
    const response = await fetch(`${API_BASE_URL}/dept-admin/overview/department/${userDepartmentId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Department summary response:', result);
      
      if (result.success && result.data) {
        const totals = result.data.totals || {};
        const latestComplaints = result.data.latest_complaints || [];
        
        // Update KPI values
        document.getElementById('kpiTotal').textContent = totals.total || '0';
        document.getElementById('kpiOpen').textContent = totals.open || '0';
        document.getElementById('kpiWip').textContent = totals.in_progress || '0';
        document.getElementById('kpiClosed').textContent = totals.closed || '0';

        // Render latest complaints
        renderLatestComplaints(latestComplaints);
      } else {
        console.error('Invalid response structure:', result);
        // Set default values
        document.getElementById('kpiTotal').textContent = '0';
        document.getElementById('kpiOpen').textContent = '0';
        document.getElementById('kpiWip').textContent = '0';
        document.getElementById('kpiClosed').textContent = '0';
      }
    } else {
      console.error('Failed to load department summary:', response.status, response.statusText);
      // Set default values on error
      document.getElementById('kpiTotal').textContent = '0';
      document.getElementById('kpiOpen').textContent = '0';
      document.getElementById('kpiWip').textContent = '0';
      document.getElementById('kpiClosed').textContent = '0';
    }
  } catch (error) {
    console.error('Error loading department summary:', error);
    // Set default values on error
    document.getElementById('kpiTotal').textContent = '0';
    document.getElementById('kpiOpen').textContent = '0';
    document.getElementById('kpiWip').textContent = '0';
    document.getElementById('kpiClosed').textContent = '0';
  }
}

async function fetchLatestDepartmentComplaints() {
  if (!userDepartmentId) {
    console.warn('Cannot fetch latest complaints - DepartmentID not set');
    return;
  }
  
  try {
    console.log('Fetching latest complaints for DepartmentID:', userDepartmentId);
    const response = await fetch(`${API_BASE_URL}/dept-admin/complaints/department/${userDepartmentId}/latest?limit=10`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Latest complaints response:', result);
      
      if (result.success && result.data) {
        const complaints = result.data || [];
        if (complaints.length > 0) {
          renderLatestComplaints(complaints);
        } else {
          renderLatestComplaints([]);
        }
      } else {
        console.error('Invalid response structure for latest complaints:', result);
        renderLatestComplaints([]);
      }
    } else {
      console.error('Failed to load latest complaints:', response.status, response.statusText);
      renderLatestComplaints([]);
    }
  } catch (error) {
    console.error('Error loading latest department complaints:', error);
    renderLatestComplaints([]);
  }
}

function renderLatestComplaints(complaints) {
  const tbody = document.querySelector('#complaintsTable tbody');
  if (!tbody) {
    console.error('Complaints table tbody not found');
    return;
  }
  
  tbody.innerHTML = '';
  
  if (!complaints || complaints.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td colspan="4" style="text-align: center; color: #6b7280; padding: 20px;">
        ${currentLang === 'ar' ? 'لا توجد شكاوى في قسمك' : 'No complaints in your department'}
      </td>
    `;
    tbody.appendChild(tr);
    return;
  }
  
  complaints.slice(0, 10).forEach(complaint => {
    const tr = document.createElement('tr');
    
    // Format the date properly
    let formattedDate = 'غير محدد';
    if (complaint.ComplaintDate) {
      try {
        formattedDate = new Date(complaint.ComplaintDate).toLocaleDateString(
          currentLang === 'ar' ? 'ar-SA' : 'en-US'
        );
      } catch (e) {
        console.warn('Invalid date format:', complaint.ComplaintDate);
        formattedDate = 'غير محدد';
      }
    }
    
    tr.innerHTML = `
      <td>${complaint.ComplaintID || 'غير محدد'}</td>
      <td>${complaint.AssignedEmployeeName || (currentLang === 'ar' ? 'غير مخصص' : 'Unassigned')}</td>
      <td>${complaint.CurrentStatus || (currentLang === 'ar' ? 'غير محدد' : 'Unknown')}</td>
      <td>${formattedDate}</td>
    `;
    tbody.appendChild(tr);
  });
  
  console.log(`Rendered ${complaints.length} complaints in the table`);
}

// Function to refresh dashboard data (KPIs and latest complaints)
async function refreshDashboardData() {
  console.log('Refreshing dashboard data...');
  
  // Show loading state on refresh button
  const refreshBtn = document.querySelector('.refresh-btn');
  if (refreshBtn) {
    const originalContent = refreshBtn.innerHTML;
    refreshBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin">
        <path d="M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
      </svg>
      ${currentLang === 'ar' ? 'جاري التحديث...' : 'Updating...'}
    `;
    refreshBtn.disabled = true;
  }
  
  try {
    if (userDepartmentId) {
      await fetchDepartmentSummary();
    } else {
      console.warn('Cannot refresh dashboard data - DepartmentID not set');
    }
  } finally {
    // Restore refresh button
    if (refreshBtn) {
      refreshBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
        </svg>
        ${currentLang === 'ar' ? 'تحديث البيانات' : 'Refresh Data'}
      `;
      refreshBtn.disabled = false;
    }
  }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  if (!checkDepartmentAdminAccess()) return;
  
  applyLanguage(currentLang);

  const toggleBtn = document.getElementById('langToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const newLang = currentLang === 'ar' ? 'en' : 'ar';
      applyLanguage(newLang);
    });
  }

  // Show department status in console for debugging
  console.log('=== Department Admin Status ===');
  console.log('User:', currentUser?.FullName || 'Unknown');
  console.log('RoleID:', currentUser?.RoleID);
  console.log('DepartmentID:', userDepartmentId);
  console.log('Department Name:', currentUser?.DepartmentName || 'Not set');
  console.log('==============================');
  
  // Test assignment functionality
  testAssignmentFunctionality();

  // Load department data only if department is set
  if (userDepartmentId) {
    fetchDepartmentSummary();
  } else {
    console.warn('Department not set - some features may not work properly');
    // Set default values for KPIs
    document.getElementById('kpiTotal').textContent = '0';
    document.getElementById('kpiOpen').textContent = '0';
    document.getElementById('kpiWip').textContent = '0';
    document.getElementById('kpiClosed').textContent = '0';
    // Show empty state for complaints table
    renderLatestComplaints([]);
  }

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

