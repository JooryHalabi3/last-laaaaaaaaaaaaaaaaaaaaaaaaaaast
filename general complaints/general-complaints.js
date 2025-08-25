// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// التحقق من تسجيل الدخول
function checkAuthentication() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (!token || !user) {
    alert('يجب تسجيل الدخول أولاً');
    window.location.href = '/login/login.html';
    return false;
  }
  
  return true;
}

// التحقق من صلاحيات الوصول للشكاوى العامة
function checkGeneralComplaintsAccess() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const roleId = Number(user?.RoleID || user?.roleId);
  
  // فقط السوبر أدمن يمكنه الوصول للشكاوى العامة
  if (roleId !== 1) {
    alert('ليس لديك صلاحية للوصول للشكاوى العامة');
    window.location.href = '/login/login.html';
    return false;
  }
  
  return true;
}

// متغيرات عامة
let complaintsData = [];
let currentComplaintIdForTransfer = null;

// وظيفة لحساب الوقت النسبي
function getRelativeTime(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'الآن';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `قبل ${minutes} دقيقة${minutes > 1 ? '' : ''}`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `قبل ${hours} ساعة${hours > 1 ? '' : ''}`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `قبل ${days} يوم${days > 1 ? '' : ''}`;
  } else if (diffInSeconds < 2419200) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `قبل ${weeks} أسبوع${weeks > 1 ? '' : ''}`;
  } else {
    const months = Math.floor(diffInSeconds / 2419200);
    return `قبل ${months} شهر${months > 1 ? '' : ''}`;
  }
}

// تحديث جميع الأوقات النسبية في الصفحة
function updateRelativeTimes() {
  const timeElements = document.querySelectorAll('.relative-time');
  timeElements.forEach(element => {
    const originalDate = element.getAttribute('data-original-date');
    if (originalDate) {
      element.textContent = getRelativeTime(originalDate);
    }
  });
}

// تم إزالة الدوال غير المستخدمة للسوبر أدمن

// جلب جميع الشكاوى
async function loadComplaints() {
  try {
    console.log('بدء جلب الشكاوى...'); // إضافة رسالة تصحيح
    
    const dateFilter = document.getElementById('dateFilter').value;
    const searchTerm = document.querySelector('.search-box').value;

    // إنشاء معاملات البحث
    const params = new URLSearchParams();
    
    if (dateFilter && dateFilter !== 'all') {
      params.append('dateFilter', dateFilter);
    }
    
    if (searchTerm && searchTerm.trim() !== '') {
      params.append('search', searchTerm.trim());
    }

    console.log('معاملات البحث:', params.toString());

    // الحصول على التوكن من localStorage
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // السوبر أدمن يرى جميع الشكاوى
    const endpoint = '/complaints/all';

    const response = await fetch(`${API_BASE_URL}${endpoint}?${params}`, {
      method: 'GET',
      headers: headers
    });
    const data = await response.json();
    
    console.log('استجابة الخادم:', data); // إضافة رسالة تصحيح
    
    if (data.success) {
      // البيانات تأتي في data.data مباشرة
      if (data.data && Array.isArray(data.data)) {
        complaintsData = data.data;
        console.log('عدد الشكاوى المحملة:', complaintsData.length);
        
        // التحقق من صحة البيانات
        complaintsData = complaintsData.filter(complaint => {
          const isValid = complaint.ComplaintID && complaint.ComplaintDetails;
          if (!isValid) {
            console.warn('شكوى غير صحيحة:', complaint);
          }
          return isValid;
        });
        
        console.log('عدد الشكاوى الصحيحة:', complaintsData.length);
      } else {
        console.warn('البيانات ليست مصفوفة، تعيين مصفوفة فارغة');
        complaintsData = [];
      }
      updateComplaintsDisplay();
    } else {
      console.error('خطأ في جلب الشكاوى:', data.message);
      complaintsData = [];
      updateComplaintsDisplay();
    }
  } catch (error) {
    console.error('خطأ في الاتصال بالخادم:', error);
    complaintsData = [];
    updateComplaintsDisplay();
  }
}

// تم إزالة دالة loadFilters للسوبر أدمن

// تم إزالة دوال الفلاتر غير المستخدمة للسوبر أدمن

// تحديث عرض الشكاوى
function updateComplaintsDisplay() {
  console.log('بدء تحديث عرض الشكاوى...'); // إضافة رسالة تصحيح
  
  const complaintsSection = document.querySelector('.complaints');
  if (!complaintsSection) {
    console.error('لم يتم العثور على قسم الشكاوى'); // إضافة رسالة تصحيح
    return;
  }

  // فحص البيانات قبل استخدامها
  if (!complaintsData || !Array.isArray(complaintsData)) {
    console.error('بيانات الشكاوى غير صحيحة:', complaintsData);
    complaintsSection.innerHTML = `
      <div class="no-complaints">
        <p data-ar="خطأ في تحميل البيانات" data-en="Error loading data">خطأ في تحميل البيانات</p>
      </div>
    `;
    return;
  }

  console.log('عدد الشكاوى للعرض:', complaintsData.length); // إضافة رسالة تصحيح

  if (complaintsData.length === 0) {
    console.log('لا توجد شكاوى للعرض'); // إضافة رسالة تصحيح
    complaintsSection.innerHTML = `
      <div class="no-complaints">
        <p data-ar="لا توجد شكاوى" data-en="No complaints found">لا توجد شكاوى</p>
      </div>
    `;
    return;
  }

      const complaintsHTML = complaintsData.map(complaint => {
      try {
        // تنسيق رقم الشكوى مع padding
        const complaintNumber = String(complaint.ComplaintID).padStart(6, '0');
        
        // تنسيق التاريخ والوقت مع الوقت النسبي
        const complaintDate = new Date(complaint.ComplaintDate);
        const formattedDate = complaintDate.toLocaleDateString('ar-SA', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        const formattedTime = complaintDate.toLocaleTimeString('ar-SA', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        const fullDateTime = `${formattedDate} - الساعة ${formattedTime}`;
        const relativeTime = getRelativeTime(complaint.ComplaintDate);
        
        const statusClass = getStatusClass(complaint.CurrentStatus);
        const statusText = getStatusText(complaint.CurrentStatus);
        
        // تقصير تفاصيل الشكوى
        const shortDetails = complaint.ComplaintDetails && complaint.ComplaintDetails.length > 100 
          ? complaint.ComplaintDetails.substring(0, 100) + '...'
          : complaint.ComplaintDetails || 'لا توجد تفاصيل';

        console.log('إنشاء HTML للشكوى:', complaint.ComplaintID); // إضافة رسالة تصحيح

        return `
          <div class="complaint">
            <div class="complaint-header">
              <span data-ar="شكوى #${complaintNumber}" data-en="Complaint #${complaintNumber}">شكوى #${complaintNumber}</span>
              <span class="badge ${statusClass}" data-ar="${statusText}" data-en="${statusText}">${statusText}</span>
              <div class="date-info">
                <span class="relative-time" data-original-date="${complaint.ComplaintDate}" title="${fullDateTime}">${relativeTime}</span>
                <span class="full-date" style="font-size: 0.8em; color: #666; display: block;">${formattedDate}</span>
              </div>
            </div>
            <div class="complaint-body">
              <div class="details">
                <h3 data-ar="تفاصيل الشكوى" data-en="Complaint Details">تفاصيل الشكوى</h3>
                <p data-ar="القسم: ${complaint.DepartmentName || 'غير محدد'}" data-en="Department: ${complaint.DepartmentName || 'Not specified'}">القسم: ${complaint.DepartmentName || 'غير محدد'}</p>
                <p data-ar="نوع الشكوى: ${complaint.ComplaintTypeName || 'غير محدد'}" data-en="Complaint Type: ${complaint.ComplaintTypeName || 'Not specified'}">نوع الشكوى: ${complaint.ComplaintTypeName || 'غير محدد'}</p>
                ${complaint.SubTypeName ? `<p data-ar="التصنيف الفرعي: ${complaint.SubTypeName}" data-en="Subcategory: ${complaint.SubTypeName}">التصنيف الفرعي: ${complaint.SubTypeName}</p>` : ''}
                <p data-ar="${shortDetails}" data-en="${shortDetails}">${shortDetails}</p>
              </div>
              <div class="info">
                <h3 data-ar="معلومات المريض" data-en="Patient Info">معلومات المريض</h3>
                <p data-ar="اسم المريض: ${complaint.PatientName || 'غير محدد'}" data-en="Patient Name: ${complaint.PatientName || 'Not specified'}">اسم المريض: ${complaint.PatientName || 'غير محدد'}</p>
                <p data-ar="رقم الهوية: ${complaint.NationalID_Iqama || 'غير محدد'}" data-en="ID Number: ${complaint.NationalID_Iqama || 'Not specified'}">رقم الهوية: ${complaint.NationalID_Iqama || 'غير محدد'}</p>
                <p data-ar="رقم الجوال: ${complaint.ContactNumber || 'غير محدد'}" data-en="Phone: ${complaint.ContactNumber || 'Not specified'}">رقم الجوال: ${complaint.ContactNumber || 'غير محدد'}</p>
              </div>
            </div>
            <div class="actions">
              <a href="#" onclick="showTransferModal(${complaint.ComplaintID})" class="btn orange" data-ar="تحويل شكوى" data-en="Transfer Complaint">تحويل شكوى</a>
            </div>
          </div>
        `;
      } catch (error) {
        console.error('خطأ في معالجة الشكوى:', complaint, error);
        return '';
      }
    }).join('');

  console.log('تم إنشاء HTML للشكاوى'); // إضافة رسالة تصحيح
  complaintsSection.innerHTML = complaintsHTML;
  console.log('تم تحديث عرض الشكاوى بنجاح'); // إضافة رسالة تصحيح
}

// الحصول على كلاس CSS للحالة
function getStatusClass(status) {
  switch (status) {
    case 'جديدة':
      return 'blue';
    case 'قيد المراجعة':
    case 'قيد المعالجة':
      return 'yellow';
    case 'مغلقة':
    case 'تم الحل':
      return 'green';
    default:
      return 'blue';
  }
}

// الحصول على نص الحالة
function getStatusText(status) {
  return status || 'جديدة';
}

// تم إزالة دالة viewComplaintDetails للسوبر أدمن

// تم إزالة دالة trackComplaint للسوبر أدمن

// تم إزالة دالة replyToComplaint للسوبر أدمن

// تم إزالة دالة applyFilters للسوبر أدمن

function goBack() {
  window.history.back();
}

// تم إزالة دالة printPage وأحداث التصدير للسوبر أدمن

// تحديث حالة الشكوى في الواجهة
// تم إزالة دالة updateComplaintStatusInUI للسوبر أدمن

// تم إزالة متغير currentLang للسوبر أدمن

// تم إزالة دالة applyLanguage للسوبر أدمن

// تم إزالة الأحداث غير المستخدمة للسوبر أدمن

// دوال تحويل الشكوى

// عرض نافذة تحويل الشكوى
function showTransferModal(complaintId) {
    currentComplaintIdForTransfer = complaintId;
    
    const modal = document.getElementById('transferModal');
    const modalBody = modal.querySelector('.modal-body');
    
    // السوبر أدمن - تحويل على الأقسام فقط
    modalBody.innerHTML = `
        <p data-ar="اختر القسم الذي تريد تحويل الشكوى إليه:" data-en="Select the department to transfer the complaint to:">اختر القسم الذي تريد تحويل الشكوى إليه:</p>
        <select id="transferDepartmentSelect" class="transfer-select">
            <option value="" data-ar="اختر القسم" data-en="Select Department">اختر القسم</option>
        </select>
        <div class="modal-actions">
            <button onclick="transferComplaint()" class="btn blue" data-ar="تحويل" data-en="Transfer">تحويل</button>
            <button onclick="closeTransferModal()" class="btn gray" data-ar="إلغاء" data-en="Cancel">إلغاء</button>
        </div>
    `;
    populateTransferDepartments();
    
    modal.style.display = 'flex';
}

// إغلاق نافذة تحويل الشكوى
function closeTransferModal() {
    const modal = document.getElementById('transferModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentComplaintIdForTransfer = null;
}

// ملء قائمة الأقسام في نافذة التحويل
function populateTransferDepartments() {
    const select = document.getElementById('transferDepartmentSelect');
    if (!select) return;
    
    // مسح الخيارات السابقة
    select.innerHTML = '<option value="" data-ar="اختر القسم" data-en="Select Department">اختر القسم</option>';
    
    // جلب الأقسام من الباك إند
    fetch(`${API_BASE_URL}/complaints/departments`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data) {
                data.data.forEach(dept => {
                    const option = document.createElement('option');
                    option.value = dept.DepartmentID;
                    option.textContent = dept.DepartmentName;
                    select.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('خطأ في جلب الأقسام:', error);
        });
}

// تم إزالة دالة populateTransferEmployees للسوبر أدمن

// تحويل الشكوى إلى قسم آخر
async function transferComplaint() {
    const select = document.getElementById('transferDepartmentSelect');
    const selectedDepartmentId = select.value;
    
    if (!selectedDepartmentId) {
        alert('يرجى اختيار قسم');
        return;
    }
    
    if (!currentComplaintIdForTransfer) {
        alert('خطأ: لم يتم تحديد الشكوى');
        return;
    }
    
    try {
        // إظهار رسالة التحميل
        const transferBtn = document.querySelector('.modal-actions .btn.blue');
        const originalText = transferBtn.textContent;
        transferBtn.textContent = 'جاري التحويل...';
        transferBtn.disabled = true;
        
        // إرسال طلب التحويل إلى الباك إند
        const response = await fetch(`${API_BASE_URL}/complaints/transfer/${currentComplaintIdForTransfer}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                newDepartmentId: selectedDepartmentId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('تم تحويل الشكوى بنجاح');
            closeTransferModal();
            
            // إعادة تحميل الشكاوى لتحديث البيانات
            loadComplaints();
        } else {
            alert('خطأ في تحويل الشكوى: ' + (data.message || 'حدث خطأ غير متوقع'));
        }
        
    } catch (error) {
        console.error('خطأ في تحويل الشكوى:', error);
        alert('خطأ في الاتصال بالخادم');
    } finally {
        // إعادة زر التحويل إلى حالته الأصلية
        const transferBtn = document.querySelector('.modal-actions .btn.blue');
        transferBtn.textContent = 'تحويل';
        transferBtn.disabled = false;
    }
}

// تم إزالة دالة transferComplaintToEmployee للسوبر أدمن

// إغلاق النافذة عند النقر خارجها
document.addEventListener('DOMContentLoaded', function() {
    // التحقق من الصلاحيات أولاً
    if (!checkAuthentication() || !checkGeneralComplaintsAccess()) {
        return;
    }

    const modal = document.getElementById('transferModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeTransferModal();
            }
        });
    }

    // تحميل البيانات
    loadComplaints();
    
    // تحديث الأوقات النسبية كل دقيقة
    setInterval(updateRelativeTimes, 60000);
});






