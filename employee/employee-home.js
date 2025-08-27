// Global variables
let currentUser = null;
let assignedComplaints = [];
let notifications = [];
let currentLang = localStorage.getItem('lang') || 'ar';

// API Base URL
const API_BASE_URL = 'http://localhost:3001/api';

// الحصول على token من storage
function getAuthToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// دالة عامة للنداء على الباك-إند
async function fetchFromAPI(endpoint, options = {}) {
    try {
        const token = getAuthToken();
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error(`خطأ في جلب البيانات من ${endpoint}:`, error);
        throw error;
    }
}

// حساب الوقت المتبقي + SLA
function calculateTimeRemaining(deadline) {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const timeRemaining = deadlineDate.getTime() - now.getTime();
    if (timeRemaining <= 0) return { expired: true, text: 'انتهت المهلة', days: 0, hours: 0, minutes: 0 };
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    let text = days > 0 ? `${days} يوم` : hours > 0 ? `${hours} ساعة` : `${minutes} دقيقة`;
    return { expired: false, text: `باقي ${text}`, days, hours, minutes };
}

function getSLAStatus(deadline) {
    if (!deadline) return 'غير محدد';
    const t = calculateTimeRemaining(deadline);
    if (!t) return 'غير محدد';
    if (t.expired) return 'متأخرة';
    if (t.days === 0 && t.hours < 24) return 'قريب الانتهاء';
    return 'ضمن المهلة';
}

// التنقل إلى تفاصيل الشكوى
function goToComplaintDetails(id) {
    try {
        console.log('جاري الانتقال إلى تفاصيل الشكوى رقم:', id);
        const url = new URL('../general complaints/details.html', window.location.origin);
        url.searchParams.set('id', id);
        url.searchParams.set('t', Date.now());
        console.log('الانتقال إلى:', url.toString());
        window.location.assign(url.toString());
    } catch (err) {
        console.error('خطأ في الانتقال إلى التفاصيل:', err);
        alert('خطأ في الانتقال إلى التفاصيل: ' + err.message);
    }
}

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
        
        // Load assigned complaints statistics
        await loadAssignedComplaintsStats();
        
        // Load recent assigned complaints
        await loadRecentAssignedComplaints();
        
        // Load notifications
        await loadNotifications();
        
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
    
    // For testing purposes, create mock user if no user data exists
    if (!user) {
        console.warn('No user data found, creating mock user for testing');
        currentUser = {
            Username: 'ahmed.ali',
            FullName: 'أحمد محمد علي',
            RoleID: 2,
            roleId: 2,
            token: 'mock-token-for-testing',
            Department: 'قسم الشكاوى',
            Position: 'موظف معالجة شكاوى'
        };
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
        // For testing purposes, add mock data if server is not available
        if (!currentUser || !currentUser.token) {
            console.warn('No user token available, using mock user data');
            const mockUserData = {
                FullName: 'أحمد محمد علي',
                Username: 'ahmed.ali',
                Department: 'قسم الشكاوى',
                Position: 'موظف معالجة شكاوى'
            };
            updateUserDisplay(mockUserData);
            return;
        }

        const response = await fetch(`${API_BASE_URL}/employee/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to load user data: ${response.status}`);
        }

        const userData = await response.json();
        updateUserDisplay(userData);
        
    } catch (error) {
        console.error('Error loading user data:', error);
        
        // If it's a network error or server is down, use mock data for testing
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            console.warn('Server not available, using mock user data for testing');
            const mockUserData = {
                FullName: 'أحمد محمد علي',
                Username: 'ahmed.ali',
                Department: 'قسم الشكاوى',
                Position: 'موظف معالجة شكاوى'
            };
            updateUserDisplay(mockUserData);
        } else {
            // Use fallback data
            updateUserDisplay({ FullName: currentUser?.Username || 'موظف' });
        }
    }
}

function updateUserDisplay(userData) {
    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');
    
    if (userNameElement) {
        userNameElement.textContent = userData.FullName || userData.Username || 'موظف';
    }
    if (userAvatarElement) {
        userAvatarElement.src = '../icon/person.png';
    }
}

async function loadAssignedComplaintsStats() {
    try {
        // For testing purposes, add mock data if server is not available
        if (!currentUser || !currentUser.token) {
            console.warn('No user token available, using mock statistics');
            const mockStats = {
                total: 3,
                pending: 2,
                completed: 1,
                urgent: 1
            };
            updateStatisticsDisplay(mockStats);
            return;
        }

        const response = await fetch(`${API_BASE_URL}/employee/assigned-complaints/stats`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to load assigned complaints statistics: ${response.status}`);
        }

        const stats = await response.json();
        updateStatisticsDisplay(stats);
        
    } catch (error) {
        console.error('Error loading assigned complaints statistics:', error);
        
        // If it's a network error or server is down, use mock data for testing
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            console.warn('Server not available, using mock statistics for testing');
            const mockStats = {
                total: 3,
                pending: 2,
                completed: 1,
                urgent: 1
            };
            updateStatisticsDisplay(mockStats);
        } else {
            // Set default values
            updateStatisticsDisplay({ total: 0, pending: 0, completed: 0, urgent: 0 });
        }
    }
}

function updateStatisticsDisplay(stats) {
    const elements = {
        'assignedComplaintsCount': stats.total || 0,
        'totalAssigned': stats.total || 0,
        'pendingAssigned': stats.pending || 0,
        'completedAssigned': stats.completed || 0,
        'urgentAssigned': stats.urgent || 0
    };
    
    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = elements[id];
        }
    });
}

async function loadRecentAssignedComplaints() {
    try {
        // For testing purposes, add mock data if server is not available
        if (!currentUser || !currentUser.token) {
            console.warn('No user token available, using mock complaints');
            const mockComplaints = [
                {
                    ComplaintID: 123,
                    ComplaintDetails: 'شكوى حول سوء الخدمة في قسم الطوارئ - المريض ينتظر أكثر من ساعتين دون معالجة',
                    CurrentStatus: 'جديدة',
                    AssignedAt: new Date().toISOString(),
                    Priority: 'عالية',
                    DepartmentName: 'قسم الطوارئ',
                    ComplaintTypeName: 'شكوى خدمة'
                },
                {
                    ComplaintID: 124,
                    ComplaintDetails: 'شكوى حول نظافة الغرفة - الغرفة غير نظيفة والمرضى يشكون من ذلك',
                    CurrentStatus: 'قيد المعالجة',
                    AssignedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                    Priority: 'متوسطة',
                    DepartmentName: 'قسم التنظيف',
                    ComplaintTypeName: 'شكوى نظافة'
                },
                {
                    ComplaintID: 125,
                    ComplaintDetails: 'شكوى حول الطعام - الطعام بارد وغير مستساغ',
                    CurrentStatus: 'تم الحل',
                    AssignedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                    Priority: 'منخفضة',
                    DepartmentName: 'قسم التغذية',
                    ComplaintTypeName: 'شكوى طعام'
                }
            ];
            assignedComplaints = mockComplaints;
            displayRecentComplaints(mockComplaints);
            return;
        }

        const response = await fetch(`${API_BASE_URL}/employee/assigned-complaints/recent`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to load recent assigned complaints: ${response.status}`);
        }

        const complaints = await response.json();
        assignedComplaints = complaints;
        
        displayRecentComplaints(complaints);
        
    } catch (error) {
        console.error('Error loading recent assigned complaints:', error);
        
        // If it's a network error or server is down, use mock data for testing
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            console.warn('Server not available, using mock complaints for testing');
            const mockComplaints = [
                {
                    ComplaintID: 123,
                    ComplaintDetails: 'شكوى حول سوء الخدمة في قسم الطوارئ - المريض ينتظر أكثر من ساعتين دون معالجة',
                    CurrentStatus: 'جديدة',
                    AssignedAt: new Date().toISOString(),
                    Priority: 'عالية',
                    DepartmentName: 'قسم الطوارئ',
                    ComplaintTypeName: 'شكوى خدمة'
                },
                {
                    ComplaintID: 124,
                    ComplaintDetails: 'شكوى حول نظافة الغرفة - الغرفة غير نظيفة والمرضى يشكون من ذلك',
                    CurrentStatus: 'قيد المعالجة',
                    AssignedAt: new Date(Date.now() - 86400000).toISOString(),
                    Priority: 'متوسطة',
                    DepartmentName: 'قسم التنظيف',
                    ComplaintTypeName: 'شكوى نظافة'
                }
            ];
            assignedComplaints = mockComplaints;
            displayRecentComplaints(mockComplaints);
        } else {
            displayRecentComplaints([]);
        }
    }
}

function displayRecentComplaints(complaints) {
    const container = document.getElementById('recentComplaintsList');
    if (!container) {
        console.error('Container element not found');
        return;
    }
    
    if (complaints.length === 0) {
        container.innerHTML = `
            <div class="complaint-item">
                <div class="complaint-info">
                    <h4>لا توجد شكاوى مسندة إليك حالياً</h4>
                    <p>ستظهر هنا الشكاوى التي يتم إسنادها إليك من قبل الإدارة</p>
                </div>
            </div>
        `;
        return;
    }
    
    const complaintsHTML = complaints.slice(0, 5).map(complaint => `
        <div class="complaint-item" onclick="viewComplaintDetails(${complaint.ComplaintID})">
            <div class="complaint-info">
                <h4>شكوى رقم ${complaint.ComplaintID}</h4>
                <p>${complaint.ComplaintDetails.substring(0, 100)}${complaint.ComplaintDetails.length > 100 ? '...' : ''}</p>
                <small>تاريخ الإسناد: ${formatDate(complaint.AssignedAt)}</small>
            </div>
            <div class="complaint-status status-${getStatusClass(complaint.CurrentStatus)}">
                ${complaint.CurrentStatus}
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
        case 'مكتملة':
        case 'تم الحل':
            return 'completed';
        case 'عاجلة':
            return 'urgent';
        default:
            return 'pending';
    }
}

async function loadNotifications() {
    try {
        // For testing purposes, add some mock notifications if server is not available
        if (!currentUser || !currentUser.token) {
            console.warn('No user token available, using mock data');
            notifications = [
                {
                    ID: 1,
                    Title: 'شكوى جديدة مسندة إليك',
                    Body: 'تم إسناد شكوى جديدة برقم #123 إليك للمعالجة',
                    IsRead: false,
                    CreatedAt: new Date().toISOString()
                }
            ];
            updateNotificationBadge();
            return;
        }

        const response = await fetch(`${API_BASE_URL}/employee/notifications`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to load notifications: ${response.status}`);
        }

        const data = await response.json();
        notifications = data.notifications || [];
        
        updateNotificationBadge();
        
    } catch (error) {
        console.error('Error loading notifications:', error);
        
        // If it's a network error or server is down, use mock data for testing
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            console.warn('Server not available, using mock notifications for testing');
            notifications = [
                {
                    ID: 1,
                    Title: 'شكوى جديدة مسندة إليك',
                    Body: 'تم إسناد شكوى جديدة برقم #123 إليك للمعالجة',
                    IsRead: false,
                    CreatedAt: new Date().toISOString()
                },
                {
                    ID: 2,
                    Title: 'تحديث حالة شكوى',
                    Body: 'تم تحديث حالة الشكوى رقم #456 إلى "قيد المعالجة"',
                    IsRead: true,
                    CreatedAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
                }
            ];
            updateNotificationBadge();
        } else {
            // Set default values and hide badge
            notifications = [];
            updateNotificationBadge();
        }
    }
}

function updateNotificationBadge() {
    const unreadCount = notifications.filter(n => !n.IsRead).length;
    const badgeElement = document.getElementById('notificationBadge');
    if (badgeElement) {
        badgeElement.textContent = unreadCount;
        badgeElement.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

function setupEventListeners() {
    // Profile link
    const profileLink = document.getElementById('profileLink');
    if (profileLink) {
        profileLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '../login/profile.html';
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Notification icon
    const notificationIcon = document.getElementById('notificationIcon');
    if (notificationIcon) {
        notificationIcon.addEventListener('click', function() {
            showNotifications();
        });
    }
    
    // Error modal close buttons
    const closeErrorModal = document.getElementById('closeErrorModal');
    if (closeErrorModal) {
        closeErrorModal.addEventListener('click', function() {
            hideError();
        });
    }
    
    const closeErrorBtn = document.getElementById('closeErrorBtn');
    if (closeErrorBtn) {
        closeErrorBtn.addEventListener('click', function() {
            hideError();
        });
    }
    
    // Modal backdrop click
    const errorModal = document.getElementById('errorModal');
    if (errorModal) {
        errorModal.addEventListener('click', function(e) {
            if (e.target === this) {
                hideError();
            }
        });
    }
}

function viewComplaintDetails(complaintId) {
    window.location.href = `employee-complaints.html?complaint=${complaintId}`;
}

function showNotifications() {
    if (notifications.length === 0) {
        showError('لا توجد تنبيهات جديدة');
        return;
    }
    
    // Create notifications modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'notificationsModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>التنبيهات</h3>
                <button class="close-modal" onclick="closeNotifications()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div id="notificationsList">
                    ${notifications.map(notification => `
                        <div class="notification-item ${notification.IsRead ? 'read' : 'unread'}">
                            <h4>${notification.Title}</h4>
                            <p>${notification.Body}</p>
                            <small>${formatDate(notification.CreatedAt)}</small>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="markAllAsRead()">تحديد الكل كمقروء</button>
                <button class="btn btn-secondary" onclick="closeNotifications()">إغلاق</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
}

function closeNotifications() {
    const modal = document.getElementById('notificationsModal');
    if (modal) {
        modal.remove();
    }
}

async function markAllAsRead() {
    try {
        const response = await fetch(`${API_BASE_URL}/employee/notifications/mark-read`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            // Update local notifications
            notifications.forEach(n => n.IsRead = true);
            const badgeElement = document.getElementById('notificationBadge');
            if (badgeElement) {
                badgeElement.style.display = 'none';
            }
            closeNotifications();
        }
    } catch (error) {
        console.error('Error marking notifications as read:', error);
    }
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

function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    const errorModal = document.getElementById('errorModal');
    
    if (errorMessage) {
        errorMessage.textContent = message;
    }
    if (errorModal) {
        errorModal.style.display = 'flex';
    }
}

function hideError() {
    const errorModal = document.getElementById('errorModal');
    if (errorModal) {
        errorModal.style.display = 'none';
    }
}

// Add CSS for notifications
const notificationStyles = `
<style>
.notification-item {
    padding: 1rem;
    border-bottom: 1px solid #e1e8ed;
    transition: background-color 0.3s ease;
}

.notification-item:last-child {
    border-bottom: none;
}

.notification-item.unread {
    background-color: #f8f9fa;
    border-left: 4px solid #667eea;
}

.notification-item.read {
    background-color: white;
}

.notification-item h4 {
    color: #2c3e50;
    margin-bottom: 0.5rem;
    font-size: 1rem;
}

.notification-item p {
    color: #7f8c8d;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
}

.notification-item small {
    color: #95a5a6;
    font-size: 0.8rem;
}

#notificationsList {
    max-height: 400px;
    overflow-y: auto;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', notificationStyles);

// ==============================
// وظائف إضافية من home.js
// ==============================

// KPIs
async function loadKPIs() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const roleID = user.RoleID || 2;
        const departmentID = user.DepartmentID;

        let endpoint = '/complaints/all';
        if (roleID === 3 && departmentID) {
            endpoint = `/complaints/department/${departmentID}`;
        }

        const response = await fetchFromAPI(endpoint);
        const complaints = response.data || [];

        const total = complaints.length;
        const open = complaints.filter(c => c.CurrentStatus === 'جديدة' || c.CurrentStatus === 'قيد المعالجة').length;
        const responded = complaints.filter(c => c.CurrentStatus === 'تم الرد' || c.CurrentStatus === 'مغلقة').length;
        const respondedPercentage = total > 0 ? Math.round((responded / total) * 100) : 0;

        let dueSoon = 0, late = 0;
        complaints.forEach(c => {
            if (c.ResponseDeadline) {
                const t = calculateTimeRemaining(c.ResponseDeadline);
                if (t?.expired) late++;
                else if (t && t.days === 0 && t.hours < 24) dueSoon++;
            }
        });

        document.getElementById('kpiTotal').textContent = total;
        document.getElementById('kpiOpen').textContent = open;
        document.getElementById('kpiResponded').textContent = `${respondedPercentage}%`;
        document.getElementById('kpiDueSoon').textContent = dueSoon;
        document.getElementById('kpiLate').textContent = late;
    } catch (error) {
        console.error('خطأ في تحميل KPIs:', error);
        document.getElementById('kpiTotal').textContent = '—';
        document.getElementById('kpiOpen').textContent = '—';
        document.getElementById('kpiResponded').textContent = '—';
        document.getElementById('kpiDueSoon').textContent = '—';
        document.getElementById('kpiLate').textContent = '—';
    }
}

// جدول الشكاوى
async function loadComplaintsTable() {
    try {
        const tbody = document.getElementById('compBody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#666;">جاري التحميل...</td></tr>';

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const roleID = user.RoleID || 2;
        const departmentID = user.DepartmentID;

        let endpoint = '/complaints/all';
        if (roleID === 3 && departmentID) {
            endpoint = `/complaints/department/${departmentID}`;
        }

        const response = await fetchFromAPI(endpoint);
        const complaints = response.data || [];
        
        if (complaints.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#666;">لا توجد شكاوى</td></tr>';
            return;
        }

        const rows = complaints.map(c => {
            const t = calculateTimeRemaining(c.ResponseDeadline);
            const createdDate = c.ComplaintDate ? new Date(c.ComplaintDate).toLocaleDateString('ar-SA') : '—';
            const deadlineDate = c.ResponseDeadline ? new Date(c.ResponseDeadline).toLocaleDateString('ar-SA') : '—';
            const timeRemainingText = t ? t.text : '—';

            let statusBadge = '';
            if (c.CurrentStatus === 'جديدة') statusBadge = '<span class="badge badge-open">جديدة</span>';
            else if (c.CurrentStatus === 'قيد المعالجة') statusBadge = '<span class="badge badge-progress">قيد المعالجة</span>';
            else if (c.CurrentStatus === 'تم الرد') statusBadge = '<span class="badge badge-responded">تم الرد</span>';
            else if (c.CurrentStatus === 'مغلقة') statusBadge = '<span class="badge badge-closed">مغلقة</span>';
            else statusBadge = `<span class="badge badge-neutral">${c.CurrentStatus || '—'}</span>`;

            return `
                <tr data-id="${c.ComplaintID}">
                    <td>#${c.ComplaintID}</td>
                    <td>${c.DepartmentName || `قسم رقم ${c.DepartmentID || 'غير محدد'}`}</td>
                    <td>${statusBadge}</td>
                    <td>${c.ComplaintTypeName || '—'}</td>
                    <td>${createdDate}</td>
                    <td>${deadlineDate}</td>
                    <td>${timeRemainingText}</td>
                </tr>
            `;
        });

        tbody.innerHTML = rows.join('');
    } catch (error) {
        console.error('خطأ في تحميل جدول الشكاوى:', error);
        const tbody = document.getElementById('compBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#b22121;">تعذر جلب البيانات</td></tr>';
        }
    }
}

// تحميل إشعارات جديدة
async function loadNewNotifications() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const roleID = user.RoleID || 2;
        const departmentID = user.DepartmentID;

        let endpoint = '/complaints/all?dateFilter=7';
        if (roleID === 3 && departmentID) {
            endpoint = `/complaints/department/${departmentID}?dateFilter=7`;
        }

        const res = await fetchFromAPI(endpoint);
        const complaints = (res && res.data) || [];

        const badge = document.getElementById('notifCount');
        if (badge) {
            badge.textContent = complaints.length;
            badge.style.display = complaints.length > 0 ? 'inline-block' : 'none';
        }

        const list = document.getElementById('notifList');
        if (!list) return;

        if (complaints.length === 0) {
            list.innerHTML = '<div class="notif-item">لا توجد شكاوى جديدة</div>';
            return;
        }

        list.innerHTML = complaints.slice(0, 20).map(c => `
            <div class="notif-item" data-id="${c.ComplaintID}">
                <div class="notif-main">
                    <div class="notif-title">شكوى جديدة #${c.ComplaintID}</div>
                    <div class="notif-body">
                        ${c.DepartmentName || 'قسم غير محدد'} •
                        ${c.ComplaintTypeName || 'نوع غير محدد'} •
                        ${c.ComplaintDate ? new Date(c.ComplaintDate).toLocaleString('ar-SA') : '—'}
                    </div>
                </div>
                <div class="notif-actions">
                    <button class="btn-details" data-action="details" title="عرض التفاصيل">التفصيل</button>
                    <button class="btn-dismiss" data-action="dismiss" title="إخفاء" aria-label="إخفاء">×</button>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('.notif-item').forEach(row => {
            const id = row.getAttribute('data-id');

            row.addEventListener('click', (e) => {
                const btn = e.target.closest('button[data-action]');
                if (!btn) return;

                const action = btn.getAttribute('data-action');

                if (action === 'details') {
                    goToComplaintDetails(id);
                }

                if (action === 'dismiss') {
                    row.remove();
                    if (badge) {
                        const current = parseInt(badge.textContent || '0', 10) || 0;
                        const next = Math.max(current - 1, 0);
                        badge.textContent = next;
                        badge.style.display = next > 0 ? 'inline-block' : 'none';
                    }
                    if (!list.querySelector('.notif-item')) {
                        list.innerHTML = '<div class="notif-item">لا توجد شكاوى جديدة</div>';
                    }
                }
            });
        });

    } catch (err) {
        console.error('خطأ في تحميل الشكاوى الجديدة:', err);
        const list = document.getElementById('notifList');
        if (list) list.innerHTML = '<div class="notif-item" style="color:#b22121;">تعذر جلب الشكاوى الجديدة</div>';
    }
}

// إعداد اللغة
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
    if (langText) langText.textContent = lang === 'ar' ? 'العربية | English' : 'English | العربية';

    document.body.style.fontFamily = lang === 'ar' ? "'Tajawal', sans-serif" : "serif";
}

// تحديث initializePage لتشمل الوظائف الجديدة
async function initializePageUpdated() {
    try {
        showLoading();
        
        // تطبيق اللغة
        applyLanguage(currentLang);
        
        // Check authentication
        await checkAuthentication();
        
        // Load user data
        await loadUserData();
        
        // Load assigned complaints statistics
        await loadAssignedComplaintsStats();
        
        // تحميل البيانات الجديدة
        await loadKPIs();
        await loadComplaintsTable();
        
        // Load recent assigned complaints
        await loadRecentAssignedComplaints();
        
        // Load notifications
        await loadNotifications();
        await loadNewNotifications();
        
        // Setup event listeners
        setupEventListeners();
        setupNewEventListeners();
        
        hideLoading();
    } catch (error) {
        console.error('Error initializing page:', error);
        showError('حدث خطأ أثناء تحميل الصفحة');
        hideLoading();
    }
}

// إعداد مستمعات الأحداث الجديدة
function setupNewEventListeners() {
    // زر اللغة
    const toggleBtn = document.getElementById('langToggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const newLang = currentLang === 'ar' ? 'en' : 'ar';
            applyLanguage(newLang);
        });
    }

    // زر الإشعارات
    const notifBtn = document.getElementById('notifBtn');
    const notifModal = document.getElementById('notifModal');
    const closeNotif = document.getElementById('closeNotif');

    notifBtn?.addEventListener('click', async () => {
        await loadNewNotifications();
        if (notifModal) notifModal.style.display = 'flex';
    });

    closeNotif?.addEventListener('click', () => {
        if (notifModal) notifModal.style.display = 'none';
    });

    notifModal?.addEventListener('click', (e) => {
        if (e.target === notifModal) notifModal.style.display = 'none';
    });
}

// استبدال استدعاء initializePage الأصلي
document.addEventListener('DOMContentLoaded', function() {
    initializePageUpdated();
    
    // تحديث دوري كل 5 دقائق
    setInterval(() => {
        loadKPIs();
        loadComplaintsTable();
        loadNewNotifications();
        loadAssignedComplaintsStats();
    }, 5 * 60 * 1000);
});
