// Employee Home Page JavaScript (متوافق مع /api/employee/*)

// =================== Configuration ===================
const API_BASE_URL = 'http://127.0.0.1:3001/api';
let currentUser = null;
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


// =================== DOM Elements ===================
const elements = {
  loadingOverlay: document.getElementById('loadingOverlay'),
  errorModal: document.getElementById('errorModal'),
  errorMessage: document.getElementById('errorMessage'),
  closeErrorModal: document.getElementById('closeErrorModal'),
  closeErrorBtn: document.getElementById('closeErrorBtn'),

  // بطاقات الأرقام
  newComplaintsCount: document.getElementById('newComplaintsCount'),
  myComplaintsCount: document.getElementById('myComplaintsCount'),
  assignedComplaintsCount: document.getElementById('assignedComplaintsCount'),

  totalComplaints: document.getElementById('totalComplaints'),
  pendingComplaints: document.getElementById('pendingComplaints'),
  completedComplaints: document.getElementById('completedComplaints'),
  urgentComplaints: document.getElementById('urgentComplaints'),



  // اللغة
  langToggle: document.getElementById('langToggle'),
  langText: document.getElementById('langText'),
};

// =================== Utils ===================
const showLoading = () => {
  if (elements.loadingOverlay) {
    elements.loadingOverlay.classList.add('show');
    console.log('تم عرض شاشة التحميل');
  } else {
    console.warn('عنصر loadingOverlay غير موجود');
  }
};

const hideLoading = () => {
  if (elements.loadingOverlay) {
    elements.loadingOverlay.classList.remove('show');
    console.log('تم إخفاء شاشة التحميل');
  } else {
    console.warn('عنصر loadingOverlay غير موجود');
  }
};

const showError = (message) => {
  console.log('عرض رسالة خطأ:', message);
  
  if (elements.errorMessage) {
    elements.errorMessage.textContent = message || 'حدث خطأ ما';
    console.log('تم تحديث نص رسالة الخطأ');
  } else {
    console.warn('عنصر errorMessage غير موجود');
  }
  
  if (elements.errorModal) {
    elements.errorModal.classList.add('show');
    console.log('تم عرض نافذة الخطأ');
  } else {
    console.warn('عنصر errorModal غير موجود');
    // عرض رسالة خطأ بسيطة كبديل
    alert(`خطأ: ${message}`);
  }
};
const hideError = () => {
  if (elements.errorModal) {
    elements.errorModal.classList.remove('show');
    console.log('تم إخفاء نافذة الخطأ');
  } else {
    console.warn('عنصر errorModal غير موجود');
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

// =================== API Helper ===================
const authHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  
  console.log('Headers المرسلة:', headers);
  return headers;
};

const makeRequest = async (url, options = {}) => {
  try {
    console.log(`=== إرسال طلب API ===`);
    console.log(`URL: ${API_BASE_URL}${url}`);
    console.log(`Headers:`, authHeaders());
    
    const res = await fetch(`${API_BASE_URL}${url}`, {
      headers: { ...authHeaders(), ...(options.headers || {}) },
      ...options
    });
    
    console.log(`=== استجابة API ===`);
    console.log(`URL: ${url}`);
    console.log(`Status: ${res.status} ${res.statusText}`);
    
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '../login/login.html';
        throw new Error('HTTP 401: انتهت الجلسة');
      }
      const text = await res.text().catch(()=> '');
      throw new Error(`HTTP ${res.status}${text ? `: ${text}` : ''}`);
    }
    
    const data = await res.json();
    console.log(`=== بيانات API ===`);
    console.log(`URL: ${url}`);
    console.log(`Data:`, data);
    console.log(`=== نهاية طلب API ===`);
    return data;
  } catch (error) {
    console.error(`خطأ في الطلب إلى ${url}:`, error);
    
    // إضافة معلومات إضافية عن الخطأ
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('فشل في الاتصال بالخادم. تأكد من تشغيل الباك إند.');
    }
    
    throw error;
  }
};

// =================== Loaders ===================

/** 1) بيانات المستخدم: /api/employee/profile */
const loadUserProfile = async () => {
  try {
    console.log('جاري إرسال طلب لتحميل بيانات المستخدم...');
    const response = await makeRequest('/employee/profile');
    console.log('استجابة API:', response);
    
    if (!response?.success) {
      console.error('استجابة API فاشلة:', response);
      throw new Error(`profile_failed: ${response?.message || 'استجابة غير صحيحة'}`);
    }
    
    if (!response.data || !response.data.EmployeeID) {
      console.error('بيانات المستخدم غير مكتملة:', response.data);
      throw new Error('بيانات المستخدم غير مكتملة');
    }
    
    // التحقق من أن EmployeeID رقم صحيح
    if (isNaN(Number(response.data.EmployeeID))) {
      console.error('EmployeeID غير صحيح:', response.data.EmployeeID);
      throw new Error('EmployeeID غير صحيح');
    }
    
    // التحقق من أن البيانات الأساسية موجودة
    if (!response.data.FullName) {
      console.warn('FullName غير موجود في بيانات المستخدم');
    }
    
    if (!response.data.DepartmentID) {
      console.warn('DepartmentID غير موجود في بيانات المستخدم');
    }
    
    currentUser = response.data;
    console.log('تم تحميل بيانات المستخدم:', currentUser);

    try {
      const nameEl = document.getElementById('userName');
      if (nameEl) {
        nameEl.textContent = currentUser.FullName || 'المستخدم';
        console.log('تم تحديث اسم المستخدم في الواجهة');
      } else {
        console.warn('عنصر userName غير موجود');
      }

      // حفظ البيانات في localStorage مع قيم افتراضية
      const departmentID = currentUser.DepartmentID || '';
      const nationalID = currentUser.NationalID || '';
      
      localStorage.setItem('employeeDepartmentID', departmentID);
      localStorage.setItem('employeeNationalID', nationalID);
      
      console.log('تم حفظ البيانات في localStorage:', { departmentID, nationalID });
    } catch (error) {
      console.error('خطأ في تحديث الواجهة أو حفظ البيانات:', error);
    }

    console.log('تم تحميل بيانات المستخدم بنجاح:', currentUser);
    return currentUser;
  } catch (error) {
    console.error('خطأ في تحميل بيانات المستخدم:', error);
    currentUser = null; // إعادة تعيين currentUser إلى null في حالة الخطأ
    throw error;
  }
};

/** 2) إحصائيات الشكاوى: /api/employee/complaints */
const loadStatistics = async () => {
  try {
    console.log('=== بدء تحميل الإحصائيات ===');
    console.log('currentUser:', currentUser);
    console.log('EmployeeID:', currentUser?.EmployeeID);
    console.log('FullName:', currentUser?.FullName);
    
    // التحقق من وجود currentUser
    if (!currentUser || !currentUser.EmployeeID) {
      console.warn('currentUser غير محدد، يتم تخطي تحميل الإحصائيات');
      // تعيين قيم افتراضية
      console.log('تعيين قيم افتراضية للإحصائيات بسبب عدم وجود currentUser');
      
      if (elements.totalComplaints) {
        elements.totalComplaints.textContent = '0';
        console.log('تم تعيين إجمالي الشكاوى إلى 0');
      }
      
      if (elements.pendingComplaints) {
        elements.pendingComplaints.textContent = '0';
        console.log('تم تعيين الشكاوى المعلقة إلى 0');
      }
      
      if (elements.completedComplaints) {
        elements.completedComplaints.textContent = '0';
        console.log('تم تعيين الشكاوى المكتملة إلى 0');
      }
      
      if (elements.urgentComplaints) {
        elements.urgentComplaints.textContent = '0';
        console.log('تم تعيين الشكاوى العاجلة إلى 0');
      }
      
      if (elements.newComplaintsCount) {
        elements.newComplaintsCount.textContent = '0';
        console.log('تم تعيين الشكاوى الجديدة إلى 0');
      }
      
      if (elements.myComplaintsCount) {
        elements.myComplaintsCount.textContent = '0';
        console.log('تم تعيين شكاوى المستخدم إلى 0');
      }
      
      if (elements.assignedComplaintsCount) {
        elements.assignedComplaintsCount.textContent = '0';
        console.log('تم تعيين الشكاوى المسندة إلى 0');
      }
      
      return;
    }
    
    // التحقق من أن EmployeeID رقم صحيح
    if (isNaN(Number(currentUser.EmployeeID))) {
      console.error('EmployeeID غير صحيح في currentUser:', currentUser.EmployeeID);
      console.log('تعيين قيم افتراضية للإحصائيات بسبب EmployeeID غير صحيح');
      
      if (elements.totalComplaints) {
        elements.totalComplaints.textContent = '0';
        console.log('تم تعيين إجمالي الشكاوى إلى 0');
      }
      
      if (elements.pendingComplaints) {
        elements.pendingComplaints.textContent = '0';
        console.log('تم تعيين الشكاوى المعلقة إلى 0');
      }
      
      if (elements.completedComplaints) {
        elements.completedComplaints.textContent = '0';
        console.log('تم تعيين الشكاوى المكتملة إلى 0');
      }
      
      if (elements.urgentComplaints) {
        elements.urgentComplaints.textContent = '0';
        console.log('تم تعيين الشكاوى العاجلة إلى 0');
      }
      
      if (elements.newComplaintsCount) {
        elements.newComplaintsCount.textContent = '0';
        console.log('تم تعيين الشكاوى الجديدة إلى 0');
      }
      
      if (elements.myComplaintsCount) {
        elements.myComplaintsCount.textContent = '0';
        console.log('تم تعيين شكاوى المستخدم إلى 0');
      }
      
      if (elements.assignedComplaintsCount) {
        elements.assignedComplaintsCount.textContent = '0';
        console.log('تم تعيين الشكاوى المسندة إلى 0');
      }
      
      return;
    }

    console.log('جاري إرسال طلب لتحميل الشكاوى...');
    const resp = await makeRequest('/employee/complaints?limit=100');
    console.log('استجابة API للشكاوى:', resp);
    
    if (!resp?.data?.complaints) {
      console.warn('لا توجد بيانات شكاوى في الاستجابة:', resp);
      // تعيين قيم افتراضية
      console.log('تعيين قيم افتراضية للإحصائيات بسبب عدم وجود بيانات');
      
      if (elements.totalComplaints) {
        elements.totalComplaints.textContent = '0';
        console.log('تم تعيين إجمالي الشكاوى إلى 0');
      }
      
      if (elements.pendingComplaints) {
        elements.pendingComplaints.textContent = '0';
        console.log('تم تعيين الشكاوى المعلقة إلى 0');
      }
      
      if (elements.completedComplaints) {
        elements.completedComplaints.textContent = '0';
        console.log('تم تعيين الشكاوى المكتملة إلى 0');
      }
      
      if (elements.urgentComplaints) {
        elements.urgentComplaints.textContent = '0';
        console.log('تم تعيين الشكاوى العاجلة إلى 0');
      }
      
      if (elements.newComplaintsCount) {
        elements.newComplaintsCount.textContent = '0';
        console.log('تم تعيين الشكاوى الجديدة إلى 0');
      }
      
      if (elements.myComplaintsCount) {
        elements.myComplaintsCount.textContent = '0';
        console.log('تم تعيين شكاوى المستخدم إلى 0');
      }
      
      if (elements.assignedComplaintsCount) {
        elements.assignedComplaintsCount.textContent = '0';
        console.log('تم تعيين الشكاوى المسندة إلى 0');
      }
      
      return;
    }
    
    const complaints = resp.data.complaints;
    console.log('عدد الشكاوى المحملة:', complaints.length);

    // تصفية الشكاوى حسب نوعها
    const myComplaints = complaints.filter(c => c.EmployeeID === currentUser.EmployeeID);
    const assignedComplaints = complaints.filter(c => c.AssignedTo === currentUser.EmployeeID);
    
    console.log('الشكاوى التي أنشأتها:', myComplaints.length);
    console.log('الشكاوى المسندة لي:', assignedComplaints.length);

    // إحصائيات عامة (جميع الشكاوى المتعلقة بالموظف)
    const totalCount = complaints.length;
    console.log('إجمالي عدد الشكاوى المتعلقة بالموظف:', totalCount);
    
    // إحصائيات الحالة
    const pendingCount = complaints.filter(c =>
      ['قيد المعالجة','معلقة','In Progress','Pending'].includes(c.Status)
    ).length;
    console.log('عدد الشكاوى المعلقة:', pendingCount);
    
    const completedCount = complaints.filter(c =>
      ['مكتملة','مغلقة','Done','Closed','Resolved','تم الحل'].includes(c.Status)
    ).length;
    console.log('عدد الشكاوى المكتملة:', completedCount);
    
    // إحصائيات الأولوية
    const urgentCount = complaints.filter(c =>
      ['عاجل','عالية','High','Urgent'].includes(c.Priority)
    ).length;
    console.log('عدد الشكاوى العاجلة:', urgentCount);

    // إحصائيات خاصة
    const myComplaintsCount = myComplaints.length;
    console.log('عدد شكاوى المستخدم:', myComplaintsCount);
    
    const assignedComplaintsCount = assignedComplaints.length;
    console.log('عدد الشكاوى المسندة للمستخدم:', assignedComplaintsCount);

    const today = new Date().toISOString().split('T')[0];
    const newComplaintsCount = complaints.filter(c => String(c.CreatedAt || '').startsWith(today)).length;
    console.log('عدد الشكاوى الجديدة اليوم:', newComplaintsCount);

    // تحديث العناصر في الواجهة
    try {
      // إحصائيات عامة
      if (elements.totalComplaints) {
        elements.totalComplaints.textContent = totalCount;
        console.log(`تم تحديث إجمالي الشكاوى: ${totalCount}`);
      }
      
      if (elements.pendingComplaints) {
        elements.pendingComplaints.textContent = pendingCount;
        console.log(`تم تحديث الشكاوى المعلقة: ${pendingCount}`);
      }
      
      if (elements.completedComplaints) {
        elements.completedComplaints.textContent = completedCount;
        console.log(`تم تحديث الشكاوى المكتملة: ${completedCount}`);
      }
      
      if (elements.urgentComplaints) {
        elements.urgentComplaints.textContent = urgentCount;
        console.log(`تم تحديث الشكاوى العاجلة: ${urgentCount}`);
      }

      // إحصائيات البطاقات
      if (elements.newComplaintsCount) {
        elements.newComplaintsCount.textContent = newComplaintsCount;
        console.log(`تم تحديث الشكاوى الجديدة اليوم: ${newComplaintsCount}`);
      }
      
      if (elements.myComplaintsCount) {
        elements.myComplaintsCount.textContent = myComplaintsCount;
        console.log(`تم تحديث شكاوى المستخدم: ${myComplaintsCount}`);
      }
      
      if (elements.assignedComplaintsCount) {
        elements.assignedComplaintsCount.textContent = assignedComplaintsCount;
        console.log(`تم تحديث الشكاوى المسندة: ${assignedComplaintsCount}`);
      }
    } catch (error) {
      console.error('خطأ في تحديث عناصر الواجهة:', error);
    }
    
    console.log('=== ملخص الإحصائيات ===');
    console.log(`إجمالي الشكاوى: ${totalCount}`);
    console.log(`الشكاوى المعلقة: ${pendingCount}`);
    console.log(`الشكاوى المكتملة: ${completedCount}`);
    console.log(`الشكاوى العاجلة: ${urgentCount}`);
    console.log(`الشكاوى الجديدة اليوم: ${newComplaintsCount}`);
    console.log(`شكاوى المستخدم: ${myComplaintsCount}`);
    console.log(`الشكاوى المسندة: ${assignedComplaintsCount}`);
    console.log('=== تم تحديث الإحصائيات بنجاح ===');
  } catch (error) {
    console.error('خطأ في تحميل الإحصائيات:', error);
    
    // تعيين قيم افتراضية في حالة الخطأ
    console.log('تعيين قيم افتراضية للإحصائيات بسبب الخطأ');
    
    if (elements.totalComplaints) {
      elements.totalComplaints.textContent = '0';
      console.log('تم تعيين إجمالي الشكاوى إلى 0');
    }
    
    if (elements.pendingComplaints) {
      elements.pendingComplaints.textContent = '0';
      console.log('تم تعيين الشكاوى المعلقة إلى 0');
    }
    
    if (elements.completedComplaints) {
      elements.completedComplaints.textContent = '0';
      console.log('تم تعيين الشكاوى المكتملة إلى 0');
    }
    
    if (elements.urgentComplaints) {
      elements.urgentComplaints.textContent = '0';
      console.log('تم تعيين الشكاوى العاجلة إلى 0');
    }
    
    if (elements.newComplaintsCount) {
      elements.newComplaintsCount.textContent = '0';
      console.log('تم تعيين الشكاوى الجديدة إلى 0');
    }
    
    if (elements.myComplaintsCount) {
      elements.myComplaintsCount.textContent = '0';
      console.log('تم تعيين شكاوى المستخدم إلى 0');
    }
    
    if (elements.assignedComplaintsCount) {
      elements.assignedComplaintsCount.textContent = '0';
      console.log('تم تعيين الشكاوى المسندة إلى 0');
    }
  }
};



// =================== Language ===================
const initLanguageSwitcher = () => {
  if (elements.langToggle) {
    elements.langToggle.addEventListener('click', () => {
      const currentLang = localStorage.getItem('lang') || 'ar';
      const newLang = currentLang === 'ar' ? 'en' : 'ar';
      localStorage.setItem('lang', newLang);
      
      if (elements.langText) {
        elements.langText.textContent = newLang === 'ar' ? 'English | العربية' : 'العربية | English';
      }
      
      document.documentElement.lang = newLang;
      document.body.dir = newLang === 'ar' ? 'rtl' : 'ltr';
      document.body.className = `lang-${newLang}`;
      
      console.log('تم تغيير اللغة إلى:', newLang);
    });
    console.log('تم إضافة مستمع حدث لزر تغيير اللغة');
  } else {
    console.warn('عنصر langToggle غير موجود');
  }
};

// =================== Init ===================
const initPage = async () => {
  console.log('بدء تهيئة الصفحة...');
  
  const token = localStorage.getItem('token');
  console.log('Token موجود:', !!token);
  
  if (!token) {
    console.log('لا يوجد token، إعادة توجيه لصفحة تسجيل الدخول');
    window.location.href = '../login/login.html';
    return;
  }

      // إضافة مستمعي الأحداث لأزرار إغلاق نافذة الخطأ
    try {
      if (elements.closeErrorModal) {
        elements.closeErrorModal.addEventListener('click', hideError);
        console.log('تم إضافة مستمع حدث لإغلاق نافذة الخطأ');
      } else {
        console.warn('عنصر closeErrorModal غير موجود');
      }
      
      if (elements.closeErrorBtn) {
        elements.closeErrorBtn.addEventListener('click', hideError);
        console.log('تم إضافة مستمع حدث لزر إغلاق الخطأ');
      } else {
        console.warn('عنصر closeErrorBtn غير موجود');
      }
    } catch (error) {
      console.error('خطأ في إضافة مستمعي الأحداث:', error);
    }

      try {
      showLoading();
    } catch (error) {
      console.error('خطأ في عرض شاشة التحميل:', error);
    }
    
    try {
    console.log('بدء تهيئة الصفحة...');
    
    try {
      // تحميل بيانات المستخدم أولاً
      console.log('جاري تحميل بيانات المستخدم...');
      await loadUserProfile();
      console.log('تم تحميل بيانات المستخدم بنجاح');
      
      // ثم تحميل الإحصائيات وسجلات النشاط بشكل متسلسل
      console.log('جاري تحميل الإحصائيات...');
      await loadStatistics();
      console.log('تم تحميل الإحصائيات بنجاح');
      

      
      try {
        initLanguageSwitcher();
        console.log('تم تهيئة مبدل اللغة بنجاح');
      } catch (error) {
        console.error('خطأ في تهيئة مبدل اللغة:', error);
        // لا نوقف العملية بسبب خطأ في مبدل اللغة
      }
      
      console.log('تم تهيئة الصفحة بنجاح');
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      throw error; // إعادة رمي الخطأ للمعالجة في catch الخارجي
    }
  } catch (err) {
    console.error('Error initializing page:', err);
    let errorMessage = 'حدث خطأ في تحميل الصفحة.';
    
    if (String(err.message).includes('HTTP 404')) {
      errorMessage = 'المسار المطلوب غير موجود (404).';
    } else if (String(err.message).includes('HTTP 401')) {
      errorMessage = 'انتهت الجلسة. يرجى تسجيل الدخول من جديد.';
      // إعادة توجيه لصفحة تسجيل الدخول بعد 3 ثوان
      try {
        setTimeout(() => {
          try {
            window.location.href = '../login/login.html';
          } catch (error) {
            console.error('خطأ في إعادة التوجيه:', error);
            // محاولة إعادة التوجيه بطريقة أخرى
            location.href = '../login/login.html';
          }
        }, 3000);
      } catch (error) {
        console.error('خطأ في تعيين مؤقت إعادة التوجيه:', error);
        // إعادة توجيه فورية
        try {
          window.location.href = '../login/login.html';
        } catch (redirectError) {
          console.error('خطأ في إعادة التوجيه الفورية:', redirectError);
        }
      }
    } else if (String(err.message).includes('HTTP 403')) {
      errorMessage = 'لا تملك صلاحية الوصول (403).';
    } else if (String(err.message).includes('Failed to fetch') || String(err.message).includes('فشل في الاتصال بالخادم')) {
      errorMessage = 'لا يمكن الاتصال بالخادم. تأكد من تشغيل الباك إند.';
    } else if (String(err.message).includes('profile_failed')) {
      errorMessage = 'فشل في تحميل بيانات المستخدم. تأكد من صحة الجلسة.';
    } else if (String(err.message).includes('بيانات المستخدم غير مكتملة') || String(err.message).includes('EmployeeID غير صحيح')) {
      errorMessage = 'بيانات المستخدم غير صحيحة. يرجى تسجيل الدخول من جديد.';
    }
    
    console.error('رسالة الخطأ للمستخدم:', errorMessage);
    try {
      showError(errorMessage);
    } catch (error) {
      console.error('خطأ في عرض رسالة الخطأ:', error);
      // عرض رسالة خطأ بسيطة كبديل
      alert(`خطأ: ${errorMessage}`);
    }
      } finally {
      try {
        hideLoading();
      } catch (error) {
        console.error('خطأ في إخفاء شاشة التحميل:', error);
      }
    }
};

document.addEventListener('DOMContentLoaded', initPage);
