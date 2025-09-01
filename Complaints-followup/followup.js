
function goBack() {
  window.history.back();
}

// إعدادات API
const API_BASE_URL = 'http://127.0.0.1:3001/api';

async function handleSubmit(e) {
  e.preventDefault();

  const name = document.querySelector('input[data-ar-placeholder="ادخل اسم المريض الكامل"]').value;
  const id = document.querySelector('input[data-ar-placeholder="رقم الهوية / الإقامة"]').value;

  if (!name || !id) {
    alert("يرجى تعبئة جميع الحقول المطلوبة");
    return;
  }

  // إظهار رسالة تحميل
  const submitBtn = document.querySelector('.submit-btn');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "جاري التحقق...";
  submitBtn.disabled = true;

  try {
    // البحث عن المريض والشكاوى في النظام الجديد
    const searchResponse = await fetch(`${API_BASE_URL}/complaints/search?query=${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    const searchData = await searchResponse.json();

    if (searchData.success && searchData.data && searchData.data.length > 0) {
      // البحث عن مريض يطابق الاسم والهوية
      const matchingComplaints = searchData.data.filter(complaint => {
        const patientName = (complaint.PatientFullName || '').toLowerCase().trim();
        const patientNationalID = complaint.PatientNationalID || '';
        const enteredName = name.toLowerCase().trim();
        
        return patientNationalID === id && 
               (patientName === enteredName || 
                patientName.includes(enteredName) || 
                enteredName.includes(patientName));
      });
      
      if (matchingComplaints.length > 0) {
        // تخزين البيانات في localStorage
        localStorage.setItem('patientName', matchingComplaints[0].PatientFullName);
        localStorage.setItem('patientId', id);
        localStorage.setItem('patientNationalId', id);
        
        // الانتقال إلى صفحة الشكاوى
        window.location.href = "/Complaints-followup/all-complaints.html";
      } else {
        alert("الاسم المدخل لا يتطابق مع البيانات المسجلة. يرجى التأكد من صحة الاسم ورقم الهوية.");
      }
    } else {
      alert("لا توجد شكاوى مسجلة لهذا المريض أو البيانات غير صحيحة");
    }
  } catch (error) {
    console.error('خطأ في التحقق من هوية المريض:', error);
    alert("حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.");
  } finally {
    // إعادة تفعيل الزر
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
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

