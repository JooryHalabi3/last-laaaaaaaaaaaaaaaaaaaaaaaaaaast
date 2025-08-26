// ===== Language =====
let currentLang = localStorage.getItem('lang') || 'ar';

function applyLanguage(lang){
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  document.body.classList.remove('lang-ar','lang-en');
  document.body.classList.add(lang === 'ar' ? 'lang-ar' : 'lang-en');
  document.body.dir = (lang === 'ar') ? 'rtl' : 'ltr';

  // Switch text for data-ar / data-en
  document.querySelectorAll('[data-ar]').forEach(el=>{
    const text = el.getAttribute(`data-${lang}`);
    if (text) el.textContent = text;
  });

  const langText = document.getElementById('langText');
  if (langText){
    langText.textContent = (lang === 'ar') ? 'العربية | English' : 'English | العربية';
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  applyLanguage(currentLang);
  const langToggle = document.getElementById('langToggle');
  if (langToggle){
    langToggle.addEventListener('click', ()=>{
      applyLanguage(currentLang === 'ar' ? 'en' : 'ar');
    });
  }

  // Load local permissions into checkboxes (if any)
  loadAllPermissionsToUI();
});

// ===== Back button =====
function goBack(){
  window.history.length > 1 ? window.history.back() : window.location.href = '/login/home.html';
}

// ===== Local-only Permissions State =====
const permissionsState = {
  employee: {
    submit_complaint: false,
    follow_own_complaint: true,
    view_public_complaints: true,
    reply_complaints: true,
    change_complaint_status: true,
    export_reports: true,
    access_dashboard: true
  },
  manager: {
    full_system_access: false,
    user_management: false,
    roles_management: false,
    performance_reports: false,
    export_data: false,
    audit_logs: false,
    system_config: false,
    backup_restore: false
  }
};

// ===== Panels Show/Hide =====
function showEditPanel(role){
  // Hide others
  document.querySelectorAll('.edit-panel').forEach(p=>p.style.display='none');

  const panel = document.getElementById(`${role}-panel`);
  if (!panel) return;

  // Load from localStorage into state first time
  loadRoleFromStorage(role);

  // Reflect state to UI
  Object.keys(permissionsState[role]).forEach(key=>{
    const cb = document.getElementById(key);
    if (cb) cb.checked = !!permissionsState[role][key];
  });

  // Hide success message
  const success = document.getElementById(`${role}-success-message`);
  if (success) success.classList.remove('show');

  panel.style.display = 'block';
  panel.scrollIntoView({behavior:'smooth', block:'start'});
}

function hideEditPanel(role){
  const panel = document.getElementById(`${role}-panel`);
  if (!panel) return;

  const msg = (currentLang === 'ar')
    ? 'هل أنت متأكد من إلغاء التغييرات؟'
    : 'Are you sure you want to cancel changes?';

  if (confirm(msg)){
    panel.style.display = 'none';
    const success = document.getElementById(`${role}-success-message`);
    if (success) success.classList.remove('show');
  }
}

// ===== Save / Load (LocalStorage only) =====
function savePermissions(role){
  // Collect from UI
  Object.keys(permissionsState[role]).forEach(key=>{
    const cb = document.getElementById(key);
    if (cb) permissionsState[role][key] = !!cb.checked;
  });

  // Persist
  localStorage.setItem(`permissions-${role}`, JSON.stringify(permissionsState[role]));

  // UI feedback
  const success = document.getElementById(`${role}-success-message`);
  if (success){
    success.textContent = (currentLang === 'ar')
      ? 'تم حفظ التغييرات بنجاح!'
      : 'Changes saved successfully!';
    success.classList.add('show');
  }

  // Optional: auto-hide panel after a short delay
  setTimeout(()=>{
    const panel = document.getElementById(`${role}-panel`);
    if (panel) panel.style.display = 'none';
  }, 600);
}

function loadRoleFromStorage(role){
  const stored = localStorage.getItem(`permissions-${role}`);
  if (!stored) return;
  try{
    const parsed = JSON.parse(stored);
    Object.keys(permissionsState[role]).forEach(key=>{
      if (key in parsed) permissionsState[role][key] = !!parsed[key];
    });
  }catch(_e){}
}

function loadAllPermissionsToUI(){
  ['employee','manager'].forEach(role=>{
    loadRoleFromStorage(role);
  });
}
