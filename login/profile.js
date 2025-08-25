let currentLang = localStorage.getItem('lang') || 'ar';
let editing = false;

/* =========================
   اللغة
========================= */
function applyLanguage(lang){
  currentLang = lang;
  localStorage.setItem('lang', lang);

  document.documentElement.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';

  document.querySelectorAll('[data-ar]').forEach(el=>{
    el.textContent = el.getAttribute(`data-${lang}`);
  });

  const langText = document.getElementById('langText');
  if(langText){
    langText.textContent = lang === 'ar' ? 'English | العربية' : 'العربية | English';
  }

  document.body.classList.remove('lang-ar','lang-en');
  document.body.classList.add(lang==='ar' ? 'lang-ar' : 'lang-en');
}

/* =========================
   جلب بيانات البروفايل من الـ API
========================= */
async function loadProfile(){
  try{
    const token = localStorage.getItem("token");
    console.log('التوكن المحفوظ:', token ? 'موجود' : 'غير موجود');
    
    if (!token) {
      console.error('لا يوجد توكن');
      window.location.href = '/login/login.html';
      return;
    }

    console.log('جاري إرسال طلب للـ API...');
    // ✅ استخدم /me (المتوفر في الراوتر)
    const res = await fetch('http://localhost:3001/api/auth/me', {
      headers:{ 
        "Authorization": "Bearer " + token 
      }
    });
    
    console.log('استجابة الـ API:', res.status, res.statusText);
    
    if (!res.ok) {
      if (res.status === 401) {
        // التوكن منتهي الصلاحية
        console.error('التوكن منتهي الصلاحية');
        localStorage.clear();
        window.location.href = '/login/login.html';
        return;
      }
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const result = await res.json();
    console.log('نتيجة الـ API:', result);
    
    if (result.success && result.data) {
      const data = result.data;
      console.log('البيانات المستلمة:', data);
      
      // ✅ يدعم camelCase من الواجهة و PascalCase من الداتابيس
      document.getElementById('empName').textContent   = data.name        ?? data.FullName       ?? '---';
      document.getElementById('empPhone').textContent  = data.phone       ?? data.PhoneNumber    ?? '---';
      document.getElementById('empId').textContent     = data.idNumber    ?? data.NationalID     ?? '---';
      document.getElementById('empNumber').textContent = data.empNumber   ?? data.EmployeeNumber ?? '---';
      document.getElementById('empEmail').textContent  = data.email       ?? data.Email          ?? '---';

    } else {
      console.error('خطأ في البيانات المستلمة:', result.message);
    }
  }catch(err){
    console.error('خطأ في تحميل البيانات', err);
    // في حالة حدوث خطأ، يمكن إعادة توجيه المستخدم لصفحة تسجيل الدخول
    if (err.message.includes('401') || err.message.includes('Unauthorized')) {
      localStorage.clear();
      window.location.href = '/login/login.html';
    }
  }
}

/* =========================
   تفعيل التعديل
========================= */
function enableEdit(){
  if(editing) return;
  editing = true;

  const fields = [
    {id:'empName', type:'text'},
    {id:'empPhone', type:'tel'},
    {id:'empId', type:'text'},
    {id:'empNumber', type:'text'},
    {id:'empEmail', type:'email'}
  ];

  fields.forEach(f=>{
    const el = document.getElementById(f.id);
    const value = el.textContent;
    const input = document.createElement('input');
    input.type = f.type;
    input.value = value;
    input.className = 'info-value';
    input.style.cssText = 'border: 2px solid #1565c0; background: white;';
    el.replaceWith(input);
    input.id = f.id;
  });

  document.getElementById('editBtn').style.display = 'none';

  let saveBtn = document.getElementById('saveBtn');
  if(!saveBtn){
    saveBtn = document.createElement('button');
    saveBtn.id = 'saveBtn';
    saveBtn.className = 'btn btn-primary';
    saveBtn.setAttribute('data-ar','حفظ');
    saveBtn.setAttribute('data-en','Save');
    saveBtn.textContent = currentLang === 'ar' ? 'حفظ' : 'Save';
    document.querySelector('.profile-actions').prepend(saveBtn);
    saveBtn.addEventListener('click', saveEdit);
  }else{
    saveBtn.style.display = 'inline-block';
  }
}

/* =========================
   حفظ التعديلات
========================= */
async function saveEdit(){
  const updated = {
    name:      document.getElementById('empName').value,
    phone:     document.getElementById('empPhone').value,
    idNumber:  document.getElementById('empId').value,
    empNumber: document.getElementById('empNumber').value,
    email:     document.getElementById('empEmail').value
  };

  try{
    const res = await fetch('http://localhost:3001/api/auth/profile', {
      method:'PUT',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer ' + (localStorage.getItem('token') || '')
      },
      body: JSON.stringify(updated)
    });

    if(res.ok){
      alert(currentLang==='ar' ? 'تم حفظ البيانات بنجاح' : 'Data saved successfully');

      // ارجعي العرض للوضع القرائي بدل الحقول (inputs)
      ['empName','empPhone','empId','empNumber','empEmail'].forEach((id)=>{
        const input = document.getElementById(id);
        if (input && input.tagName === 'INPUT') {
          const view = document.createElement('div');
          view.id = id;
          view.className = 'info-value';
          view.textContent = 
              id==='empName'   ? updated.name      :
              id==='empPhone'  ? updated.phone     :
              id==='empId'     ? updated.idNumber  :
              id==='empNumber' ? updated.empNumber :
                                 updated.email;
          input.replaceWith(view);
        } else if (input) {
          // fallback لو كان باقي ديف
          input.textContent = 
              id==='empName'   ? updated.name      :
              id==='empPhone'  ? updated.phone     :
              id==='empId'     ? updated.idNumber  :
              id==='empNumber' ? updated.empNumber :
                                 updated.email;
        }
      });

      document.getElementById('saveBtn').style.display = 'none';
      document.getElementById('editBtn').style.display = 'inline-block';
      editing = false;

      // (اختياري) أعيدي جلب البيانات من السيرفر للتأكد
      await loadProfile();
    }else{
      const errorData = await res.json().catch(()=>({}));
      alert(currentLang==='ar' ? (errorData.message || 'خطأ أثناء حفظ البيانات') 
                               : (errorData.message || 'Error saving data'));
    }
  }catch(err){
    alert(currentLang==='ar' ? 'خطأ في الاتصال بالسيرفر' : 'Server connection error');
  }
}

/* =========================
   تسجيل الخروج
========================= */
function setupLogout(){
  const logoutModal = document.getElementById('logoutModal');
  
  document.getElementById('logoutBtn').addEventListener('click', ()=> {
    logoutModal.style.display='flex';
  });
  
  document.getElementById('cancelLogout').addEventListener('click', ()=> {
    logoutModal.style.display='none';
  });
  
  document.getElementById('closeModal').addEventListener('click', ()=> {
    logoutModal.style.display='none';
  });
  
  document.getElementById('confirmLogout').addEventListener('click', ()=>{
    localStorage.clear();
    // ✅ خليه نفس مسار صفحة اللوجن المستخدمة فوق
    window.location.href = '/login/login.html';
  });
  
  // إغلاق المودال عند النقر خارجه
  logoutModal.addEventListener('click', (e) => {
    if (e.target === logoutModal) {
      logoutModal.style.display = 'none';
    }
  });
}

/* =========================
   بدء التشغيل
========================= */
document.addEventListener('DOMContentLoaded', ()=>{
  applyLanguage(currentLang);
  loadProfile();

  document.getElementById('langToggle').addEventListener('click', ()=>{
    const newLang = currentLang === 'ar' ? 'en' : 'ar';
    applyLanguage(newLang);
  });

  document.getElementById('editBtn').addEventListener('click', enableEdit);

  // زر العودة → صفحة الهوم حسب الدور
  document.getElementById('backBtn').addEventListener('click', ()=>{
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if(!user){
      window.location.href = '/login/login.html'; 
      return;
    }

    const roleId = Number(user.RoleID || user.roleId);
    if(roleId === 1){
      window.location.href = '/superadmin/superadmin-home.html';
    } else if(roleId === 2){
      window.location.href = '/employee/employee-home.html';
    } else if(roleId === 3){
      window.location.href = '/dept-admin/dept-admin.html';
    } else {
      window.location.href = '/login/login.html'; // احتياطي

     
    }
  });

  setupLogout();
});
