// Employee Follow-up Page JavaScript

// Configuration
const API_BASE_URL = 'http://127.0.0.1:3001/api';
let currentUser = null;
let complaints = [];
let filteredComplaints = [];
let currentPage = 1;
const itemsPerPage = 10;

// DOM Elements
const elements = {
    // Header
    userName: document.getElementById('userName'),
    notificationIcon: document.getElementById('notificationIcon'),
    notificationBadge: document.getElementById('notificationBadge'),
    profileLink: document.getElementById('profileLink'),
    logoutBtn: document.getElementById('logoutBtn'),
    
    // Buttons
    newComplaintBtn: document.getElementById('newComplaintBtn'),
    clearFilters: document.getElementById('clearFilters'),
    
    // Filters
    statusFilter: document.getElementById('statusFilter'),
    categoryFilter: document.getElementById('categoryFilter'),
    typeFilter: document.getElementById('typeFilter'),
    searchInput: document.getElementById('searchInput'),
    sortBy: document.getElementById('sortBy'),
    
    // Stats
    totalCount: document.getElementById('totalCount'),
    myCount: document.getElementById('myCount'),
    assignedCount: document.getElementById('assignedCount'),
    pendingCount: document.getElementById('pendingCount'),
    
    // Results
    resultsCount: document.getElementById('resultsCount'),
    complaintsList: document.getElementById('complaintsList'),
    pagination: document.getElementById('pagination'),
    
    // Modals
    loadingOverlay: document.getElementById('loadingOverlay'),
    errorModal: document.getElementById('errorModal'),
    errorMessage: document.getElementById('errorMessage'),
    closeErrorModal: document.getElementById('closeErrorModal'),
    closeErrorBtn: document.getElementById('closeErrorBtn'),
    detailsModal: document.getElementById('detailsModal'),
    complaintDetails: document.getElementById('complaintDetails'),
    closeDetailsModal: document.getElementById('closeDetailsModal'),
    closeDetailsBtn: document.getElementById('closeDetailsBtn'),
    openComplaintBtn: document.getElementById('openComplaintBtn')
};

// Utility Functions
const showLoading = () => {
    elements.loadingOverlay.classList.add('show');
};

const hideLoading = () => {
    elements.loadingOverlay.classList.remove('show');
};

const showError = (message) => {
    elements.errorMessage.textContent = message;
    elements.errorModal.classList.add('show');
};

const hideError = () => {
    elements.errorModal.classList.remove('show');
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getStatusClass = (status) => {
    const statusClasses = {
        'مفتوحة/جديدة': 'status-open',
        'قيد المعالجة': 'status-pending',
        'معلقة': 'status-pending',
        'مكتملة': 'status-completed',
        'مغلقة': 'status-completed'
    };
    return statusClasses[status] || 'status-open';
};

const getCategoryIcon = (category) => {
    const icons = {
        'خدمة طبية': 'fas fa-stethoscope',
        'خدمة إدارية': 'fas fa-clipboard-list',
        'نظافة': 'fas fa-broom',
        'أمن وسلامة': 'fas fa-shield-alt',
        'تجهيزات طبية': 'fas fa-medical-kit',
        'موظفين': 'fas fa-users',
        'أخرى': 'fas fa-file-alt'
    };
    return icons[category] || 'fas fa-file-alt';
};

// API Functions
const makeRequest = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        }
    };

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, mergedOptions);
        
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '../login/login.html';
                return;
            }
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
};

// Load user profile
const loadUserProfile = async () => {
    try {
        const response = await makeRequest('/api/employee/profile');
        if (response.success) {
            currentUser = response.data;
            elements.userName.textContent = currentUser.FullName;
            return currentUser;
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        showError('حدث خطأ في تحميل معلومات المستخدم');
    }
};

// Load complaints
const loadComplaints = async () => {
    try {
        showLoading();
        
        const response = await makeRequest('/api/employee/complaints?limit=1000');
        if (response.success) {
            complaints = response.data.complaints;
            updateStatistics();
            applyFilters();
            renderComplaints();
        }
    } catch (error) {
        console.error('Error loading complaints:', error);
        showError('حدث خطأ في تحميل الشكاوى');
    } finally {
        hideLoading();
    }
};

// Update statistics
const updateStatistics = () => {
    if (!currentUser) return;
    
    const total = complaints.length;
    const myComplaints = complaints.filter(c => c.EmployeeID === currentUser.EmployeeID).length;
    const assignedToMe = complaints.filter(c => c.AssignedTo === currentUser.EmployeeID).length;
    const pending = complaints.filter(c => 
        c.Status === 'قيد المعالجة' || c.Status === 'معلقة'
    ).length;
    
    elements.totalCount.textContent = total;
    elements.myCount.textContent = myComplaints;
    elements.assignedCount.textContent = assignedToMe;
    elements.pendingCount.textContent = pending;
};

// Apply filters
const applyFilters = () => {
    let filtered = [...complaints];
    
    // Status filter
    const status = elements.statusFilter.value;
    if (status) {
        filtered = filtered.filter(c => c.Status === status);
    }
    
    // Category filter
    const category = elements.categoryFilter.value;
    if (category) {
        filtered = filtered.filter(c => c.Category === category);
    }
    
    // Type filter (my complaints vs assigned to me)
    const type = elements.typeFilter.value;
    if (type === 'my') {
        filtered = filtered.filter(c => c.EmployeeID === currentUser.EmployeeID);
    } else if (type === 'assigned') {
        filtered = filtered.filter(c => c.AssignedTo === currentUser.EmployeeID);
    }
    
    // Search filter
    const search = elements.searchInput.value.toLowerCase().trim();
    if (search) {
        filtered = filtered.filter(c => 
            c.Title.toLowerCase().includes(search) ||
            c.Description.toLowerCase().includes(search)
        );
    }
    
    // Sort
    const sortBy = elements.sortBy.value;
    filtered.sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return new Date(b.CreatedAt) - new Date(a.CreatedAt);
            case 'oldest':
                return new Date(a.CreatedAt) - new Date(b.CreatedAt);
            case 'title':
                return a.Title.localeCompare(b.Title, 'ar');
            case 'status':
                return a.Status.localeCompare(b.Status, 'ar');
            case 'priority':
                const priorityOrder = { 'عاجل': 4, 'عالي': 3, 'متوسط': 2, 'منخفض': 1 };
                return (priorityOrder[b.Priority] || 0) - (priorityOrder[a.Priority] || 0);
            default:
                return new Date(b.CreatedAt) - new Date(a.CreatedAt);
        }
    });
    
    filteredComplaints = filtered;
    currentPage = 1;
    updateResultsCount();
};

// Update results count
const updateResultsCount = () => {
    const count = filteredComplaints.length;
    elements.resultsCount.textContent = count === 1 ? 'شكوى واحدة' : `${count} شكوى`;
};

// Render complaints
const renderComplaints = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageComplaints = filteredComplaints.slice(startIndex, endIndex);
    
    elements.complaintsList.innerHTML = '';
    
    if (pageComplaints.length === 0) {
        renderEmptyState();
        renderPagination();
        return;
    }
    
    pageComplaints.forEach(complaint => {
        const complaintElement = document.createElement('div');
        complaintElement.className = 'complaint-item';
        
        const isMyComplaint = complaint.EmployeeID === currentUser.EmployeeID;
        const isAssignedToMe = complaint.AssignedTo === currentUser.EmployeeID;
        
        complaintElement.innerHTML = `
            <div class="complaint-icon">
                <i class="${getCategoryIcon(complaint.Category)}"></i>
            </div>
            <div class="complaint-content">
                <div class="complaint-header">
                    <div>
                        <div class="complaint-title">${complaint.Title}</div>
                        <div class="complaint-meta">
                            <span><i class="fas fa-tag"></i> ${complaint.Category}</span>
                            <span><i class="fas fa-calendar"></i> ${formatDate(complaint.CreatedAt)}</span>
                            ${complaint.Priority ? `<span><i class="fas fa-exclamation"></i> ${complaint.Priority}</span>` : ''}
                            ${isMyComplaint ? '<span><i class="fas fa-user"></i> شكواي</span>' : ''}
                            ${isAssignedToMe ? '<span><i class="fas fa-tasks"></i> مسندة لي</span>' : ''}
                        </div>
                    </div>
                    <span class="complaint-status ${getStatusClass(complaint.Status)}">
                        ${complaint.Status}
                    </span>
                </div>
                <div class="complaint-description">
                    ${complaint.Description}
                </div>
                <div class="complaint-footer">
                    <div class="complaint-info">
                        <span><i class="fas fa-comments"></i> ${complaint.ResponseCount || 0} رد</span>
                        <span><i class="fas fa-clock"></i> آخر تحديث: ${formatDate(complaint.UpdatedAt)}</span>
                    </div>
                    <div class="complaint-actions">
                        <button class="action-btn primary" onclick="viewComplaint(${complaint.ComplaintID})">
                            <i class="fas fa-eye"></i> عرض
                        </button>
                        <button class="action-btn secondary" onclick="showComplaintDetails(${complaint.ComplaintID})">
                            <i class="fas fa-info-circle"></i> تفاصيل
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add click handler for the whole item
        complaintElement.addEventListener('click', (e) => {
            // Don't trigger if clicking on buttons
            if (!e.target.closest('.complaint-actions')) {
                viewComplaint(complaint.ComplaintID);
            }
        });
        
        elements.complaintsList.appendChild(complaintElement);
    });
    
    renderPagination();
};

// Render empty state
const renderEmptyState = () => {
    elements.complaintsList.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <h3>لا توجد شكاوى</h3>
            <p>لم يتم العثور على شكاوى تطابق المعايير المحددة</p>
            <button class="btn btn-primary" onclick="clearAllFilters()">
                <i class="fas fa-times"></i>
                مسح جميع الفلاتر
            </button>
        </div>
    `;
};

// Render pagination
const renderPagination = () => {
    const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);
    
    if (totalPages <= 1) {
        elements.pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" 
                onclick="changePage(${currentPage - 1})" 
                ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        paginationHTML += `<button class="pagination-btn" onclick="changePage(1)">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="pagination-dots">...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                    onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="pagination-dots">...</span>`;
        }
        paginationHTML += `<button class="pagination-btn" onclick="changePage(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    paginationHTML += `
        <button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" 
                onclick="changePage(${currentPage + 1})" 
                ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Page info
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, filteredComplaints.length);
    paginationHTML += `
        <div class="pagination-info">
            ${startItem} - ${endItem} من ${filteredComplaints.length}
        </div>
    `;
    
    elements.pagination.innerHTML = paginationHTML;
};

// Global functions (called from HTML)
window.changePage = (page) => {
    if (page >= 1 && page <= Math.ceil(filteredComplaints.length / itemsPerPage)) {
        currentPage = page;
        renderComplaints();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

window.viewComplaint = (complaintId) => {
    window.location.href = `employee-complaint-details.html?id=${complaintId}`;
};

window.showComplaintDetails = async (complaintId) => {
    try {
        showLoading();
        
        const response = await makeRequest(`/api/employee/complaints/${complaintId}`);
        if (response.success) {
            const complaint = response.data.complaint;
            const responses = response.data.responses;
            
            elements.complaintDetails.innerHTML = `
                <div class="complaint-detail-header">
                    <h4>${complaint.Title}</h4>
                    <span class="complaint-status ${getStatusClass(complaint.Status)}">
                        ${complaint.Status}
                    </span>
                </div>
                
                <div class="complaint-detail-meta">
                    <div class="meta-item">
                        <strong>الفئة:</strong> ${complaint.Category}
                    </div>
                    <div class="meta-item">
                        <strong>الأولوية:</strong> ${complaint.Priority || 'غير محدد'}
                    </div>
                    <div class="meta-item">
                        <strong>تاريخ الإنشاء:</strong> ${formatDate(complaint.CreatedAt)}
                    </div>
                    <div class="meta-item">
                        <strong>آخر تحديث:</strong> ${formatDate(complaint.UpdatedAt)}
                    </div>
                </div>
                
                <div class="complaint-detail-description">
                    <h5>الوصف:</h5>
                    <p>${complaint.Description}</p>
                </div>
                
                ${responses.length > 0 ? `
                    <div class="complaint-responses">
                        <h5>الردود (${responses.length}):</h5>
                        ${responses.map(response => `
                            <div class="response-item">
                                <div class="response-header">
                                    <strong>${response.EmployeeName}</strong>
                                    <span class="response-date">${formatDate(response.CreatedAt)}</span>
                                </div>
                                <div class="response-content">${response.Content}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            `;
            
            // Set up open complaint button
            elements.openComplaintBtn.onclick = () => {
                elements.detailsModal.classList.remove('show');
                viewComplaint(complaintId);
            };
            
            elements.detailsModal.classList.add('show');
        }
    } catch (error) {
        console.error('Error loading complaint details:', error);
        showError('حدث خطأ في تحميل تفاصيل الشكوى');
    } finally {
        hideLoading();
    }
};

window.clearAllFilters = () => {
    elements.statusFilter.value = '';
    elements.categoryFilter.value = '';
    elements.typeFilter.value = '';
    elements.searchInput.value = '';
    elements.sortBy.value = 'newest';
    applyFilters();
    renderComplaints();
};

// Event Listeners
const initEventListeners = () => {
    // Filter changes
    elements.statusFilter.addEventListener('change', () => {
        applyFilters();
        renderComplaints();
    });
    
    elements.categoryFilter.addEventListener('change', () => {
        applyFilters();
        renderComplaints();
    });
    
    elements.typeFilter.addEventListener('change', () => {
        applyFilters();
        renderComplaints();
    });
    
    elements.sortBy.addEventListener('change', () => {
        applyFilters();
        renderComplaints();
    });
    
    // Search with debounce
    let searchTimeout;
    elements.searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            applyFilters();
            renderComplaints();
        }, 300);
    });
    
    // Clear filters
    elements.clearFilters.addEventListener('click', clearAllFilters);
    
    // Buttons
    elements.newComplaintBtn.addEventListener('click', () => {
        window.location.href = 'employee-newcomplaint.html';
    });
    
    // Error modal
    elements.closeErrorModal.addEventListener('click', hideError);
    elements.closeErrorBtn.addEventListener('click', hideError);
    
    // Details modal
    elements.closeDetailsModal.addEventListener('click', () => {
        elements.detailsModal.classList.remove('show');
    });
    
    elements.closeDetailsBtn.addEventListener('click', () => {
        elements.detailsModal.classList.remove('show');
    });
    
    // Profile and logout
    elements.profileLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'employee-profile.html';
    });
    
    elements.logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
            localStorage.removeItem('token');
            window.location.href = '../login/login.html';
        }
    });
};

// Initialize page
const initPage = async () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../login/login.html';
        return;
    }
    
    // Check URL parameters for filters
    const urlParams = new URLSearchParams(window.location.search);
    const filter = urlParams.get('filter');
    if (filter) {
        elements.typeFilter.value = filter;
    }
    
    try {
        // Load user profile and complaints
        await loadUserProfile();
        await loadComplaints();
        
        // Initialize event listeners
        initEventListeners();
        
    } catch (error) {
        console.error('Error initializing page:', error);
        showError('حدث خطأ في تحميل الصفحة');
    }
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initPage);
