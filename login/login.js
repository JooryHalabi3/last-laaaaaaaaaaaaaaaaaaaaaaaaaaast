// ============================
// إعدادات عامة
// ============================
const API_BASE_URL = 'http://127.0.0.1:3001/api/auth';
// توجيه حسب الدور
function redirectByRole(user){
  const roleId = Number(user?.RoleID || user?.roleId || 0);
  // عدّلي المسارات أدناه حسب أسماء ملفات الهوم عندك
  const roleHome = {
    1: "/superadmin/superadmin-home.html", // سوبر أدمن
    2: "/employee/employee-home.html",   // موظف
    3: "/dept-admin/dept-admin.html"       // أدمن
  };
  const target = roleHome[roleId] || "/login/login.html"; // احتياطي
  window.location.replace(target);
}

// رسائل مساعدة
function showError(message) { alert(message); }
function showSuccess(message) { alert(message); }

// تحقق من صحّة المدخلات
function validateEmail(email){ const re=/^[^\s@]+@[^\s@]+\.[^\s@]+$/; return re.test(email); }
function validatePhone(phone){ const re=/^[0-9]{10,15}$/; return re.test(phone); }

// ============================
// تحميل الأقسام لقائمة التسجيل
// ============================
async function loadDepartments() {
  const select = document.getElementById('regDepartment');
  if (!select) return;

  select.disabled = true;
  select.innerHTML = `<option value="" disabled selected>
    ${currentLang === 'ar' ? '...جاري تحميل الأقسام' : 'Loading departments...'}
  </option>`;

  try {
    const res = await fetch(`${API_BASE_URL}/departments`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    select.innerHTML = `<option value="" disabled selected>
      ${currentLang === 'ar' ? 'اختر القسم' : 'Select Department'}
    </option>`;

    (data.data || []).forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.DepartmentID;
      opt.textContent = d.DepartmentName;
      opt.setAttribute('data-ar', d.DepartmentName);
      opt.setAttribute('data-en', d.DepartmentName);
      select.appendChild(opt);
    });
  } catch (err) {
    console.error('Departments load error:', err);
    select.innerHTML = `<option value="" disabled selected>
      ${currentLang === 'ar' ? 'تعذّر تحميل الأقسام' : 'Failed to load departments'}
    </option>`;
  } finally {
    select.disabled = false;
    applyLanguage(currentLang);
  }
}

// ============================
// التحكم بعرض تبويبات الدخول/التسجيل
// ============================
function showTab(tab) {
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (tab === 'login') {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.style.display = 'flex';
    registerForm.style.display = 'none';
  } else {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    loginForm.style.display = 'none';
    registerForm.style.display = 'flex';
    loadDepartments(); // تحميل الأقسام عند فتح تبويب التسجيل
  }
}

// ============================
// تسجيل الدخول
// ============================
async function login() {
  const username = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  if (!username || !password) return showError("يرجى إدخال اسم المستخدم وكلمة المرور.");

  try {
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.employee));
      localStorage.setItem("userEmail", data.data.employee.Email || username);
      showSuccess("تم تسجيل الدخول بنجاح!");
setTimeout(()=>{ redirectByRole(data.data.employee); }, 600);
    } else {
      showError(data.message || "حدث خطأ في تسجيل الدخول");
    }
  } catch (e) {
    console.error(e);
    showError("حدث خطأ في الاتصال بالخادم");
  }
}

// ============================
// التسجيل (المستخدم الجديد = موظف فقط)
// ============================
async function register() {
  const fullName = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPass").value;
  const confirmPassword = document.getElementById("regConfirmPass").value;
  const username = document.getElementById("regID").value.trim();
  const phoneNumber = document.getElementById("regPhone").value.trim();
  const departmentID = document.getElementById("regDepartment").value;

  if (!fullName || !username || !email || !password || !confirmPassword || !phoneNumber || !departmentID)
    return showError("يرجى تعبئة جميع الحقول.");
  if (!validateEmail(email)) return showError("يرجى إدخال بريد إلكتروني صحيح.");
  if (!validatePhone(phoneNumber)) return showError("يرجى إدخال رقم هاتف صحيح.");
  if (password.length < 6) return showError("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
  if (password !== confirmPassword) return showError("كلمتا المرور غير متطابقتين.");

  try {
    const res = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({
        fullName, username, password, email, phoneNumber,
        specialty: '', departmentID: Number(departmentID)
      })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.employee));
      localStorage.setItem("userEmail", data.data.employee.Email || email);
      showSuccess("تم التسجيل بنجاح!");
setTimeout(()=>{ redirectByRole(data.data.employee); }, 600);
    } else {
      showError(data.message || "حدث خطأ في التسجيل");
    }
  } catch (e) {
    console.error(e);
    showError("حدث خطأ في الاتصال بالخادم");
  }
}

// ============================
// التحقق من حالة المصادقة
// ============================
function checkAuthStatus() {
  const token = localStorage.getItem('token');
  if (!token) return;
  fetch(`${API_BASE_URL}/me`, { headers:{ 'Authorization': `Bearer ${token}` } })
    .then(r=>r.json())
    .then(data=>{ if(!data.success){ localStorage.removeItem('token'); localStorage.removeItem('user'); } })
    .catch(()=>{ localStorage.removeItem('token'); localStorage.removeItem('user'); });
}

// ============================
// لغة الواجهة
// ============================
let currentLang = localStorage.getItem('lang') || 'ar';
function applyLanguage(lang){
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.style.textAlign = lang === 'ar' ? 'right' : 'left';
  document.querySelectorAll('[data-ar]').forEach(el=>{
    el.textContent = el.getAttribute(`data-${lang}`);
  });
  document.querySelectorAll('[data-ar-placeholder]').forEach(el=>{
    el.placeholder = el.getAttribute(`data-${lang}-placeholder`);
  });
  const departmentSelect = document.getElementById('regDepartment');
  if (departmentSelect) {
    departmentSelect.querySelectorAll('option').forEach(option=>{
      if (option.hasAttribute(`data-${lang}`)) option.textContent = option.getAttribute(`data-${lang}`);
    });
  }
  const langText = document.getElementById('langText');
  if (langText) langText.textContent = lang === 'ar' ? 'العربية | English' : 'English | العربية';
  document.body.style.fontFamily = lang === 'ar' ? "'Tajawal', sans-serif" : "serif";
}

// ============================
// تهيئة الصفحة
// ============================
document.addEventListener('DOMContentLoaded', () => {
  applyLanguage(currentLang);
  checkAuthStatus();

  const toggleBtn = document.getElementById('langToggle');
  if (toggleBtn) toggleBtn.addEventListener('click', () => {
    applyLanguage(currentLang === 'ar' ? 'en' : 'ar');
  });
});
