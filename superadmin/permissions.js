function getCurrentLanguage() {
  return document.documentElement.lang || 'ar';
}


async function showEditPanel(role) {
    const panelToShow = document.getElementById(`${role}-panel`);

    if (panelToShow) {
        // If the panel is currently visible, hide it.
        if (panelToShow.style.display === 'block') {
            panelToShow.style.display = 'none';
            // Hide success message if visible when closing the panel
            const successMsg = document.getElementById(`${role}-success-message`);
            if (successMsg) {
                successMsg.style.display = 'none';
            }
            return; // Exit the function after hiding
        }

        // If the panel is hidden, proceed to show it.
        // Hide any already open panels
        document.querySelectorAll('.edit-panel').forEach(panel => {
            panel.style.display = 'none';
        });

        panelToShow.style.display = 'block';

        try {
            // Load permissions from backend
            const permissions = await loadRolePermissionsFromBackend(role);
            
            // Update checkbox states based on backend permissions
            permissions.forEach(permission => {
                const checkbox = document.getElementById(permission.name);
                if (checkbox) {
                    checkbox.checked = permission.has_permission === 1;
                }
            });

            // Update local state
            permissions.forEach(permission => {
                if (permissionsState[role]) {
                    permissionsState[role][permission.name] = permission.has_permission === 1;
                }
            });

            console.log(`✅ تم تحميل صلاحيات دور ${role} من الباك اند`);

        } catch (error) {
            console.error('Error loading permissions from backend:', error);
            console.log('🔄 استخدام البيانات المحلية كنسخة احتياطية');
            
            // Fallback to local storage
            for (const permId in permissionsState[role]) {
                const checkbox = document.getElementById(permId);
                if (checkbox) {
                    checkbox.checked = permissionsState[role][permId];
                }
            }
        }

        // Hide success message if visible when opening the panel
        const successMsg = document.getElementById(`${role}-success-message`);
        if (successMsg) {
            successMsg.style.display = 'none';
        }

        // Scroll to the panel
        panelToShow.scrollIntoView({
            behavior: 'smooth'
        });
    }
}

function hideEditPanel(role) {
    const panelToHide = document.getElementById(`${role}-panel`);
    if (panelToHide) {
        const lang = getCurrentLanguage();
        const confirmMsg = lang === 'ar'
            ? 'هل أنت متأكد أنك تريد إلغاء التغييرات؟'
            : 'Are you sure you want to cancel changes?';

        if (confirm(confirmMsg)) {
            panelToHide.style.display = 'none';
            const successMsg = document.getElementById(`${role}-success-message`);
            if (successMsg) {
                successMsg.style.display = 'none';
            }
        }
    }
}



const permissionsState = {
    employee: {
        'submit_complaint': false,
        'follow_own_complaint': true,
        'view_public_complaints': true,
        'reply_complaints': true,
        'change_complaint_status': true,
        'export_reports': true,
        'access_dashboard': true
    },
    manager: {
        'full_system_access': false,
        'user_management': false,
        'roles_management': false,
        'performance_reports': false,
        'export_data': false,
        'audit_logs': false,
        'system_config': false,
        'backup_restore': false
    }
};

// API Base URL
const API_BASE_URL = 'http://localhost:3001/api';

// الحصول على token من localStorage
function getAuthToken() {
    return localStorage.getItem('token');
}

// دالة لجلب الأدوار من الباك اند
async function loadRolesFromBackend() {
    try {
        const token = getAuthToken();
        if (!token) {
            console.warn('⚠️ لا يوجد token مصادقة');
            return [];
        }

        const response = await fetch(`${API_BASE_URL}/permissions/roles`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.error('❌ خطأ في المصادقة - يرجى تسجيل الدخول مرة أخرى');
                return [];
            } else if (response.status === 403) {
                console.error('❌ ليس لديك صلاحية الوصول لإدارة الصلاحيات');
                return [];
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        }

        const data = await response.json();
        console.log('✅ تم تحميل الأدوار بنجاح:', data.data);
        return data.data;
    } catch (error) {
        console.error('❌ خطأ في تحميل الأدوار:', error);
        return [];
    }
}

// دالة لجلب صلاحيات دور معين من الباك اند
async function loadRolePermissionsFromBackend(roleName) {
    try {
        const token = getAuthToken();
        if (!token) {
            console.warn('⚠️ لا يوجد token مصادقة');
            return [];
        }

        console.log(`🔄 جاري تحميل صلاحيات دور ${roleName}...`);

        const response = await fetch(`${API_BASE_URL}/permissions/roles/${roleName}/permissions`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.error('❌ خطأ في المصادقة - يرجى تسجيل الدخول مرة أخرى');
                return [];
            } else if (response.status === 403) {
                console.error('❌ ليس لديك صلاحية الوصول لصلاحيات هذا الدور');
                return [];
            } else if (response.status === 404) {
                console.error('❌ الدور غير موجود');
                return [];
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        }

        const data = await response.json();
        console.log(`✅ تم تحميل صلاحيات دور ${roleName}:`, data.data);
        return data.data;
    } catch (error) {
        console.error('❌ خطأ في تحميل صلاحيات الدور:', error);
        return [];
    }
}

// دالة لحفظ الصلاحيات في الباك اند
async function savePermissionsToBackend(roleName, permissions) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('لا يوجد token مصادقة');
        }

        console.log(`🔄 جاري حفظ صلاحيات دور ${roleName}:`, permissions);

        const response = await fetch(`${API_BASE_URL}/permissions/roles/${roleName}/permissions`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ permissions })
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('خطأ في المصادقة - يرجى تسجيل الدخول مرة أخرى');
            } else if (response.status === 403) {
                throw new Error('ليس لديك صلاحية تحديث الصلاحيات');
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `خطأ في الخادم: ${response.status}`);
            }
        }

        const data = await response.json();
        console.log('✅ تم حفظ الصلاحيات بنجاح:', data);
        return data;
    } catch (error) {
        console.error('❌ خطأ في حفظ الصلاحيات:', error);
        throw error;
    }
}

function loadAllPermissions() {
    // تحميل من localStorage كنسخة احتياطية
    for (const role in permissionsState) {
        const storedPerms = localStorage.getItem(`permissions-${role}`);
        if (storedPerms) {
            permissionsState[role] = JSON.parse(storedPerms);
        }
    }
}
async function savePermissions(role) {
    try {
        // Collect all checked permissions
        const checkedPermissions = [];
        const checkboxes = document.querySelectorAll(`#${role}-panel input[type="checkbox"]:checked`);
        
        checkboxes.forEach(checkbox => {
            checkedPermissions.push({
                id: checkbox.id,
                name: checkbox.id
            });
        });

        console.log(`🔄 جاري حفظ صلاحيات دور ${role}:`, checkedPermissions);

        // Try to save to backend, but don't fail if backend is not available
        try {
            await savePermissionsToBackend(role, checkedPermissions);
            console.log('✅ تم الحفظ في الباك اند بنجاح');
        } catch (backendError) {
            console.log('⚠️ فشل في الحفظ في الباك اند، جاري الحفظ محلياً فقط:', backendError.message);
        }

        // Update local state
        for (const permId in permissionsState[role]) {
            const checkbox = document.getElementById(permId);
            if (checkbox) {
                permissionsState[role][permId] = checkbox.checked;
            }
        }

        // Save to localStorage as backup
        localStorage.setItem(`permissions-${role}`, JSON.stringify(permissionsState[role]));
        console.log('✅ تم الحفظ محلياً بنجاح');

        // Hide the panel
        const panel = document.getElementById(`${role}-panel`);
        if (panel) {
            panel.style.display = 'none';
        }

        // Show success message
        const lang = getCurrentLanguage();
        const successMsg = lang === 'ar' ? 'تم حفظ التغييرات بنجاح!' : 'Changes saved successfully!';
        
        // Show message in a floating notification
        showFloatingNotification(successMsg, 'success');

    } catch (error) {
        console.error('❌ خطأ في حفظ الصلاحيات:', error);
        
        // Show error message
        const lang = getCurrentLanguage();
        let errorMsg;
        
        if (error.message.includes('المصادقة')) {
            errorMsg = lang === 'ar' ? 'خطأ في المصادقة - يرجى تسجيل الدخول مرة أخرى' : 'Authentication error - Please login again';
        } else if (error.message.includes('صلاحية')) {
            errorMsg = lang === 'ar' ? 'ليس لديك صلاحية تحديث الصلاحيات' : 'You do not have permission to update permissions';
        } else if (error.message.includes('الخادم')) {
            errorMsg = lang === 'ar' ? 'خطأ في الخادم - يرجى المحاولة مرة أخرى' : 'Server error - Please try again';
        } else {
            errorMsg = lang === 'ar' ? 'خطأ في حفظ التغييرات' : 'Error saving changes';
        }
        
        // Show error in floating notification
        showFloatingNotification(errorMsg, 'error');
    }
}

// دالة لعرض إشعار عائم
function showFloatingNotification(message, type = 'success') {
    // إزالة الإشعارات السابقة
    const existingNotifications = document.querySelectorAll('.floating-notification');
    existingNotifications.forEach(notification => notification.remove());

    // إنشاء الإشعار الجديد
    const notification = document.createElement('div');
    notification.className = `floating-notification ${type}`;
    notification.textContent = message;
    
    // إضافة الإشعار للصفحة
    document.body.appendChild(notification);
    
    // إظهار الإشعار
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // إخفاء الإشعار بعد 3 ثواني
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}


document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 بدء تحميل صفحة إدارة الصلاحيات...');
    
    loadAllPermissions();

    // تحميل الأدوار من الباك اند
    try {
        console.log('🔄 جاري تحميل الأدوار من الباك اند...');
        const roles = await loadRolesFromBackend();
        
        if (roles.length > 0) {
            updateRolesTable(roles);
            console.log(`✅ تم تحميل ${roles.length} دور بنجاح`);
        } else {
            console.log('⚠️ لم يتم العثور على أدوار أو لا توجد صلاحيات للوصول');
        }
    } catch (error) {
        console.error('❌ خطأ في تحميل الأدوار:', error);
    }

    // Toggle All Checkbox functionality for Manager panel
    document.querySelectorAll('.toggle-all-checkbox').forEach(toggleCheckbox => {
        toggleCheckbox.addEventListener('change', (event) => {
            const group = event.target.dataset.group;
            const isChecked = event.target.checked;
            document.querySelectorAll(`#manager-panel .permission-item input[data-group="${group}"]`).forEach(checkbox => {
                checkbox.checked = isChecked;
            });
        });
    });

    console.log('✅ تم تحميل صفحة إدارة الصلاحيات بنجاح');
});

// دالة لتحديث جدول الأدوار
function updateRolesTable(roles) {
    const tbody = document.querySelector('.permissions-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    roles.forEach(role => {
        const row = document.createElement('tr');
        const roleDisplayName = role.name === 'employee' ? 'Employee' : 'admin';
        const roleDisplayNameAr = role.name === 'employee' ? 'موظف' : 'مدير';
        
        row.innerHTML = `
            <td data-ar="${roleDisplayNameAr}" data-en="${roleDisplayName}">${roleDisplayName}</td>
            <td data-ar="${role.description}" data-en="${role.description}">${role.description}</td>
            <td>${role.user_count || 0}</td>
            <td>
                <button class="edit-btn" onclick="showEditPanel('${role.name}')" data-ar="تعديل" data-en="Edit">Edit</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}


let currentLang = localStorage.getItem('lang') || 'ar';

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);

  // الاتجاه واللغة
  document.documentElement.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.style.textAlign = lang === 'ar' ? 'right' : 'left';

  // تغيير النصوص بناءً على اللغة
  document.querySelectorAll('[data-ar]').forEach(el => {
    el.textContent = el.getAttribute(`data-${lang}`);
  });

  // تغيير placeholder بناءً على اللغة
  document.querySelectorAll('[data-ar-placeholder]').forEach(el => {
    el.placeholder = el.getAttribute(`data-${lang}-placeholder`);
  });

  // زر اللغة نفسه
  const langText = document.getElementById('langText');
  if (langText) {
    langText.textContent = lang === 'ar' ? 'العربية | English' : 'English | العربية';
  }

  // تغيير الخط
  document.body.style.fontFamily = lang === 'ar' ? "'Tajawal', sans-serif" : "serif";
}

document.addEventListener('DOMContentLoaded', () => {
  applyLanguage(currentLang);

  const toggleBtn = document.getElementById('langToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const newLang = currentLang === 'ar' ? 'en' : 'ar';
      applyLanguage(newLang);
    });
  }
});

function goBack() {
  window.history.back();
}

