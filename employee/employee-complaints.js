// Global variables
let currentUser = null;
let assignedComplaints = [];
let currentPage = 1;
let totalPages = 1;
let currentFilters = {
    status: '',
    priority: '',
    search: ''
};
let currentSort = 'newest';
let selectedComplaint = null;

// API Base URL
const API_BASE_URL = 'http://localhost:3000/api';

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

async function initializePage() {
    try {
        showLoading();
        
        // Check authentication
        await checkAuthentication();
        
        // Load user data
        await loadUserData();
        
        // Load assigned complaints
        await loadAssignedComplaints();
        
        // Load statistics
        await loadStatistics();
        
        // Setup event listeners
        setupEventListeners();
        
        hideLoading();
    } catch (error) {
        console.error('Error initializing page:', error);
        showError('حدث خطأ أثناء تحميل الصفحة');
        hideLoading();
    }
}

async function checkAuthentication() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) {
        window.location.href = '../login/login.html';
        return;
    }
    
    // Check if user is employee (roleId = 2)
    if (user.RoleID !== 2 && user.roleId !== 2) {
        showError('غير مصرح لك بالوصول لهذه الصفحة');
        setTimeout(() => {
            window.location.href = '../login/login.html';
        }, 2000);
        return;
    }
    
    currentUser = user;
}

async function loadUserData() {
    try {
        const response = await fetch(`${API_BASE_URL}/employee/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load user data');
        }

        const userData = await response.json();
        
        // Update UI with user data
        document.getElementById('userName').textContent = userData.FullName || currentUser.Username;
        document.getElementById('userAvatar').src = '../icon/person.png';
        
    } catch (error) {
        console.error('Error loading user data:', error);
        // Use fallback data
        document.getElementById('userName').textContent = currentUser.Username;
        document.getElementById('userAvatar').src = '../icon/person.png';
    }
}

async function loadAssignedComplaints() {
    try {
        const params = new URLSearchParams({
            page: currentPage,
            status: currentFilters.status,
            priority: currentFilters.priority,
            search: currentFilters.search,
            sort: currentSort
        });

        const response = await fetch(`${API_BASE_URL}/employee/assigned-complaints?${params}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load assigned complaints');
        }

        const data = await response.json();
        assignedComplaints = data.complaints || [];
        totalPages = data.totalPages || 1;
        
        displayComplaints(assignedComplaints);
        updatePagination();
        updateResultsCount();
        
    } catch (error) {
        console.error('Error loading assigned complaints:', error);
        showError('حدث خطأ أثناء تحميل الشكاوى');
        displayComplaints([]);
    }
}

function displayComplaints(complaints) {
    const container = document.getElementById('complaintsList');
    
    if (complaints.length === 0) {
        container.innerHTML = `
            <div class="complaint-card">
                <div class="complaint-header">
                    <div>
                        <div class="complaint-title">لا توجد شكاوى مسندة إليك</div>
                        <div class="complaint-meta">ستظهر هنا الشكاوى التي يتم إسنادها إليك من قبل الإدارة</div>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    const complaintsHTML = complaints.map(complaint => `
        <div class="complaint-card" onclick="viewComplaintDetails(${complaint.ComplaintID})">
            <div class="complaint-header">
                <div>
                    <div class="complaint-title">شكوى رقم ${complaint.ComplaintID}</div>
                    <div class="complaint-meta">
                        <span>تاريخ الإسناد: ${formatDate(complaint.AssignedAt)}</span>
                        <span>الأولوية: ${complaint.Priority}</span>
                    </div>
                </div>
                <div class="complaint-status status-${getStatusClass(complaint.CurrentStatus)}">
                    ${complaint.CurrentStatus}
                </div>
            </div>
            <div class="complaint-details">
                ${complaint.ComplaintDetails.substring(0, 200)}${complaint.ComplaintDetails.length > 200 ? '...' : ''}
            </div>
            <div class="complaint-footer">
                <div class="complaint-meta">
                    <span>القسم: ${complaint.DepartmentName || 'غير محدد'}</span>
                    <span>النوع: ${complaint.ComplaintTypeName || 'غير محدد'}</span>
                </div>
                <div class="complaint-actions">
                    <button class="action-btn action-btn-primary" onclick="event.stopPropagation(); viewComplaintDetails(${complaint.ComplaintID})">
                        <i class="fas fa-eye"></i>
                        عرض التفاصيل
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = complaintsHTML;
}

function getStatusClass(status) {
    switch (status) {
        case 'جديدة':
            return 'new';
        case 'قيد المعالجة':
            return 'pending';
        case 'قيد المراجعة':
            return 'review';
        case 'تم الحل':
            return 'completed';
        case 'مغلقة':
            return 'closed';
        default:
            return 'pending';
    }
}

async function loadStatistics() {
    try {
        const response = await fetch(`${API_BASE_URL}/employee/assigned-complaints/stats`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load statistics');
        }

        const stats = await response.json();
        
        // Update statistics
        document.getElementById('totalCount').textContent = stats.total || 0;
        document.getElementById('pendingCount').textContent = stats.pending || 0;
        document.getElementById('completedCount').textContent = stats.completed || 0;
        document.getElementById('urgentCount').textContent = stats.urgent || 0;
        
    } catch (error) {
        console.error('Error loading statistics:', error);
        // Set default values
        document.getElementById('totalCount').textContent = '0';
        document.getElementById('pendingCount').textContent = '0';
        document.getElementById('completedCount').textContent = '0';
        document.getElementById('urgentCount').textContent = '0';
    }
}

function setupEventListeners() {
    // Profile link
    document.getElementById('profileLink').addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '../login/profile.html';
    });
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });
    
    // New complaint button
    document.getElementById('newComplaintBtn').addEventListener('click', function() {
        window.location.href = '../New complaint/Newcomplaint.html';
    });
    
    // Filter events
    document.getElementById('statusFilter').addEventListener('change', function() {
        currentFilters.status = this.value;
        currentPage = 1;
        loadAssignedComplaints();
    });
    
    document.getElementById('priorityFilter').addEventListener('change', function() {
        currentFilters.priority = this.value;
        currentPage = 1;
        loadAssignedComplaints();
    });
    
    document.getElementById('searchInput').addEventListener('input', debounce(function() {
        currentFilters.search = this.value;
        currentPage = 1;
        loadAssignedComplaints();
    }, 500));
    
    // Sort events
    document.getElementById('sortBy').addEventListener('change', function() {
        currentSort = this.value;
        currentPage = 1;
        loadAssignedComplaints();
    });
    
    // Clear filters
    document.getElementById('clearFilters').addEventListener('click', function() {
        document.getElementById('statusFilter').value = '';
        document.getElementById('priorityFilter').value = '';
        document.getElementById('searchInput').value = '';
        currentFilters = { status: '', priority: '', search: '' };
        currentPage = 1;
        loadAssignedComplaints();
    });
    
    // Modal close buttons
    document.getElementById('closeErrorModal').addEventListener('click', hideError);
    document.getElementById('closeErrorBtn').addEventListener('click', hideError);
    document.getElementById('closeDetailsModal').addEventListener('click', hideDetailsModal);
    document.getElementById('closeDetailsBtn').addEventListener('click', hideDetailsModal);
    document.getElementById('closeResponseModal').addEventListener('click', hideResponseModal);
    document.getElementById('closeStatusModal').addEventListener('click', hideStatusModal);
    
    // Modal backdrop clicks
    document.getElementById('errorModal').addEventListener('click', function(e) {
        if (e.target === this) hideError();
    });
    
    document.getElementById('detailsModal').addEventListener('click', function(e) {
        if (e.target === this) hideDetailsModal();
    });
    
    document.getElementById('responseModal').addEventListener('click', function(e) {
        if (e.target === this) hideResponseModal();
    });
    
    document.getElementById('statusModal').addEventListener('click', function(e) {
        if (e.target === this) hideStatusModal();
    });
    
    // Response modal buttons
    document.getElementById('submitResponseBtn').addEventListener('click', submitResponse);
    document.getElementById('cancelResponseBtn').addEventListener('click', hideResponseModal);
    
    // Status modal buttons
    document.getElementById('submitStatusBtn').addEventListener('click', updateStatus);
    document.getElementById('cancelStatusBtn').addEventListener('click', hideStatusModal);
    
    // Details modal buttons
    document.getElementById('respondBtn').addEventListener('click', showResponseModal);
    document.getElementById('updateStatusBtn').addEventListener('click', showStatusModal);
}

function viewComplaintDetails(complaintId) {
    const complaint = assignedComplaints.find(c => c.ComplaintID === complaintId);
    if (!complaint) {
        showError('لم يتم العثور على الشكوى');
        return;
    }
    
    selectedComplaint = complaint;
    displayComplaintDetails(complaint);
    showDetailsModal();
}

async function displayComplaintDetails(complaint) {
    try {
        // Load full complaint details including responses
        const response = await fetch(`${API_BASE_URL}/employee/assigned-complaints/${complaint.ComplaintID}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load complaint details');
        }

        const data = await response.json();
        const fullComplaint = data.complaint;
        const responses = data.responses || [];
        
        const detailsHTML = `
            <div class="complaint-detail-item">
                <h4>معلومات الشكوى</h4>
                <p><strong>رقم الشكوى:</strong> ${fullComplaint.ComplaintID}</p>
                <p><strong>التاريخ:</strong> ${formatDate(fullComplaint.ComplaintDate)}</p>
                <p><strong>الحالة:</strong> ${fullComplaint.CurrentStatus}</p>
                <p><strong>الأولوية:</strong> ${fullComplaint.Priority}</p>
                <p><strong>القسم:</strong> ${fullComplaint.DepartmentName || 'غير محدد'}</p>
                <p><strong>النوع:</strong> ${fullComplaint.ComplaintTypeName || 'غير محدد'}</p>
            </div>
            
            <div class="complaint-detail-item">
                <h4>تفاصيل الشكوى</h4>
                <p>${fullComplaint.ComplaintDetails}</p>
            </div>
            
            <div class="complaint-detail-item">
                <h4>معلومات المريض</h4>
                <p><strong>الاسم:</strong> ${fullComplaint.PatientName || 'غير محدد'}</p>
                <p><strong>رقم الهوية:</strong> ${fullComplaint.PatientNationalID || 'غير محدد'}</p>
                <p><strong>رقم الاتصال:</strong> ${fullComplaint.PatientContact || 'غير محدد'}</p>
            </div>
            
            <div class="complaint-responses">
                <h4>الردود والتعليقات</h4>
                ${responses.length > 0 ? responses.map(response => `
                    <div class="response-item">
                        <div class="response-header">
                            <div>
                                <span class="response-author">${response.EmployeeName || 'موظف'}</span>
                                <span class="response-type">${response.ResponseType}</span>
                            </div>
                            <span class="response-date">${formatDate(response.ResponseDate)}</span>
                        </div>
                        <div class="response-text">${response.ResponseText}</div>
                    </div>
                `).join('') : '<p>لا توجد ردود بعد</p>'}
            </div>
        `;
        
        document.getElementById('complaintDetails').innerHTML = detailsHTML;
        
    } catch (error) {
        console.error('Error loading complaint details:', error);
        showError('حدث خطأ أثناء تحميل تفاصيل الشكوى');
    }
}

function showResponseModal() {
    if (!selectedComplaint) {
        showError('لم يتم تحديد شكوى');
        return;
    }
    
    document.getElementById('responseText').value = '';
    document.getElementById('responseType').value = 'رد رسمي';
    document.getElementById('responseModal').style.display = 'flex';
}

function hideResponseModal() {
    document.getElementById('responseModal').style.display = 'none';
}

async function submitResponse() {
    const responseText = document.getElementById('responseText').value.trim();
    const responseType = document.getElementById('responseType').value;
    
    if (!responseText) {
        showError('يرجى كتابة الرد');
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/employee/assigned-complaints/${selectedComplaint.ComplaintID}/respond`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                responseText,
                responseType
            })
        });

        if (!response.ok) {
            throw new Error('Failed to submit response');
        }

        hideResponseModal();
        hideDetailsModal();
        
        // Reload complaints to show updated data
        await loadAssignedComplaints();
        await loadStatistics();
        
        showSuccess('تم إرسال الرد بنجاح');
        
    } catch (error) {
        console.error('Error submitting response:', error);
        showError('حدث خطأ أثناء إرسال الرد');
    } finally {
        hideLoading();
    }
}

function showStatusModal() {
    if (!selectedComplaint) {
        showError('لم يتم تحديد شكوى');
        return;
    }
    
    document.getElementById('newStatus').value = selectedComplaint.CurrentStatus;
    document.getElementById('statusRemarks').value = '';
    document.getElementById('statusModal').style.display = 'flex';
}

function hideStatusModal() {
    document.getElementById('statusModal').style.display = 'none';
}

async function updateStatus() {
    const newStatus = document.getElementById('newStatus').value;
    const remarks = document.getElementById('statusRemarks').value.trim();
    
    if (!newStatus) {
        showError('يرجى اختيار الحالة الجديدة');
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/employee/assigned-complaints/${selectedComplaint.ComplaintID}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                newStatus,
                remarks
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update status');
        }

        hideStatusModal();
        hideDetailsModal();
        
        // Reload complaints to show updated data
        await loadAssignedComplaints();
        await loadStatistics();
        
        showSuccess('تم تحديث الحالة بنجاح');
        
    } catch (error) {
        console.error('Error updating status:', error);
        showError('حدث خطأ أثناء تحديث الحالة');
    } finally {
        hideLoading();
    }
}

function showDetailsModal() {
    document.getElementById('detailsModal').style.display = 'flex';
}

function hideDetailsModal() {
    document.getElementById('detailsModal').style.display = 'none';
    selectedComplaint = null;
}

function updatePagination() {
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
            <i class="fas fa-chevron-right"></i>
            السابق
        </button>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `
                <button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += '<span>...</span>';
        }
    }
    
    // Next button
    paginationHTML += `
        <button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
            التالي
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    pagination.innerHTML = paginationHTML;
}

function changePage(page) {
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    loadAssignedComplaints();
}

function updateResultsCount() {
    const count = assignedComplaints.length;
    document.getElementById('resultsCount').textContent = `${count} شكوى`;
}

function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '../login/login.html';
}

function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorModal').style.display = 'flex';
}

function hideError() {
    document.getElementById('errorModal').style.display = 'none';
}

function showSuccess(message) {
    // Create a temporary success message
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}
