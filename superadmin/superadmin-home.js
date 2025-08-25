// ===== إعدادات عامة =====
const API_BASE_URL = 'http://localhost:3001/api';   // عدّليها لو لزم
// ===== إشعارات السوبر أدمن (توافق مع HTML: notifBtn / notifCount) =====
const NOTIF_POLL_MS = 30000;

function ensureNotifMenu(anchorBtn) {
  // نبني القائمة على الطاير إذا ما كانت موجودة
  let menu = document.getElementById('notifMenu');
  if (!menu) {
    menu = document.createElement('div');
    menu.id = 'notifMenu';
    menu.style.cssText = `
      display:none; position:absolute; width:360px; max-height:420px; overflow:auto;
      background:#fff; border:1px solid #eee; border-radius:10px; box-shadow:0 10px 20px rgba(0,0,0,.08); z-index:9999;
    `;
    
    // إضافة CSS للأزرار
    const style = document.createElement('style');
    style.textContent = `
      .text-btn { background:none; border:none; color:#0066cc; cursor:pointer; font-size:12px; padding:4px 8px; border-radius:4px; }
      .text-btn:hover { background:#f0f9ff; }
      .text-btn:disabled { color:#999; cursor:not-allowed; }
      .text-danger { color:#dc2626 !important; }
      .text-danger:hover { background:#fef2f2 !important; }
    `;
    document.head.appendChild(style);
    // هيدر
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid #f1f1f1;';
    const title = document.createElement('strong');
    title.textContent = 'الإشعارات';
    const markAll = document.createElement('button');
    markAll.textContent = 'تحديد الكل كمقروء';
    markAll.className = 'text-btn';
    markAll.onclick = markAllAsRead;
    header.append(title, markAll);

    // قائمة
    const list = document.createElement('ul');
    list.id = 'notifList';
    list.style.cssText = 'list-style:none;margin:0;padding:0;';

    menu.append(header, list);
    document.body.appendChild(menu);

    // إغلاق عند الضغط خارج القائمة
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !anchorBtn.contains(e.target)) {
        menu.style.display = 'none';
      }
    });
  }
  // تموضع بجانب زر الجرس
  const rect = anchorBtn.getBoundingClientRect();
  menu.style.top = `${rect.bottom + window.scrollY + 8}px`;
  menu.style.left = `${rect.right - 360 + window.scrollX}px`; // يحاذي اليمين
  return menu;
}

async function refreshNotifBadge() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/notifications/count?status=unread`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const count = Number(data?.count || 0);
    const badge = document.getElementById('notifCount');
    if (!badge) return;
    if (count > 0) {
      badge.textContent = String(count);
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }
  } catch (e) {
    // تجاهل بس لا تكسر الصفحة
  }
}

async function loadNotificationsList() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/notifications?status=all&limit=20`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  const list = document.getElementById('notifList');
  if (!list) return;

  list.innerHTML = '';
  const items = Array.isArray(data?.data) ? data.data : [];
  if (!items.length) {
    const li = document.createElement('li');
    li.style.padding = '12px';
    li.textContent = 'لا توجد إشعارات';
    list.appendChild(li);
    return;
  }

  items.forEach(n => {
    const li = document.createElement('li');
    li.style.cssText = 'padding:10px 12px;border-bottom:1px solid #f7f7f7;';
    li.style.background = n.IsRead ? '#fff' : '#f9fafb';

    const title = document.createElement('div');
    title.style.fontWeight = '600';
    title.textContent = n.Title || 'إشعار';

    const body = document.createElement('div');
    body.style.cssText = 'font-size:12px;opacity:.9;margin-top:2px;';
    body.textContent = n.Body || '';

    const meta = document.createElement('div');
    meta.style.cssText = 'display:flex;gap:8px;margin-top:8px;';

    // زر فتح - الانتقال لتفاصيل الشكوى
    const openBtn = document.createElement('button');
    openBtn.className = 'text-btn';
    openBtn.textContent = 'فتح';
    openBtn.onclick = async () => {
      if (!n.IsRead) await markAsRead(n.NotificationID, false);
      // الانتقال لصفحة تتبع الشكوى
      if (n.RelatedType === 'complaint' && n.RelatedID) {
        await openComplaintDetails(n.RelatedID);
      }
    };

    const readBtn = document.createElement('button');
    readBtn.className = 'text-btn';
    readBtn.textContent = n.IsRead ? 'مقروء' : 'تحديد كمقروء';
    readBtn.disabled = !!n.IsRead;
    readBtn.onclick = async () => { await markAsRead(n.NotificationID, true); };

    // زر حذف التنبيه
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'text-btn text-danger';
    deleteBtn.textContent = 'حذف';
    deleteBtn.onclick = async () => { await deleteNotification(n.NotificationID, li); };

    meta.append(openBtn, readBtn, deleteBtn);
    li.append(title, body, meta);
    list.appendChild(li);
  });
}

async function markAsRead(id, refreshList = true) {
  try {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    await refreshNotifBadge();
    if (refreshList) await loadNotificationsList();
  } catch (e) {}
}

async function markAllAsRead() {
  try {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    await refreshNotifBadge();
    await loadNotificationsList();
  } catch (e) {}
}

async function deleteNotification(notificationId, listItem) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    if (data.success) {
      // إزالة التنبيه من الواجهة فورًا
      listItem.remove();
      // تحديث العدّاد
      await refreshNotifBadge();
      
      // إذا لم تعد هناك تنبيهات، اعرض رسالة
      const list = document.getElementById('notifList');
      if (list && list.children.length === 0) {
        const li = document.createElement('li');
        li.style.padding = '12px';
        li.textContent = 'لا توجد إشعارات';
        list.appendChild(li);
      }
    }
  } catch (e) {
    console.error('خطأ في حذف التنبيه:', e);
  }
}

async function openComplaintDetails(complaintId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/complaints/details/${complaintId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    if (data.success && data.data.complaint) {
      // إضافة معلومات المصدر للبيانات
      const complaintToSave = {
        ...data.data.complaint,
        _dataSource: 'notification',
        _timestamp: Date.now()
      };
      
      // حفظ بيانات الشكوى في localStorage
      localStorage.setItem('selectedComplaint', JSON.stringify(complaintToSave));
      console.log('تم حفظ بيانات الشكوى من الإشعار:', complaintToSave);
      
      // الانتقال لصفحة التفاصيل
      window.location.href = `/general complaints/details.html`;
    } else {
      // في حالة فشل الحصول على البيانات، إنشاء بيانات أساسية
      const basicComplaint = {
        ComplaintID: complaintId,
        ComplaintDetails: 'جاري تحميل التفاصيل...',
        CurrentStatus: 'غير محدد',
        _dataSource: 'notification-basic',
        _timestamp: Date.now()
      };
      localStorage.setItem('selectedComplaint', JSON.stringify(basicComplaint));
      window.location.href = `/general complaints/details.html`;
    }
  } catch (error) {
    console.error('خطأ في فتح تفاصيل الشكوى:', error);
    // في حالة الخطأ، إنشاء بيانات أساسية
    const basicComplaint = {
      ComplaintID: complaintId,
      ComplaintDetails: 'خطأ في تحميل التفاصيل',
      CurrentStatus: 'غير محدد',
      _dataSource: 'notification-error',
      _timestamp: Date.now()
    };
    localStorage.setItem('selectedComplaint', JSON.stringify(basicComplaint));
    window.location.href = `/general complaints/details.html`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // حماية الصفحة حسب RoleID=1
  if (!requireSuperAdmin()) return;

  const notifBtn = document.getElementById('notifBtn');
  if (notifBtn) {
    notifBtn.addEventListener('click', async () => {
      const menu = ensureNotifMenu(notifBtn);
      // تبديل الظهور
      const open = menu.style.display === 'block';
      menu.style.display = open ? 'none' : 'block';
      if (!open) await loadNotificationsList();
    });
  }

  // حمّل عدّاد الإشعارات واشتغل Polling أسرع للحصول على إشعارات فورية
  refreshNotifBadge();
  setInterval(() => {
    refreshNotifBadge();
    // إذا كانت قائمة الإشعارات مفتوحة، حدّثها أيضاً
    const notifMenu = document.querySelector('.notification-menu');
    if (notifMenu && notifMenu.style.display === 'block') {
      loadNotificationsList();
    }
  }, 10000); // كل 10 ثواني للحصول على إشعارات أسرع
});

let currentLang = localStorage.getItem('lang') || 'ar';
function guard(){
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user || Number(user.RoleID) !== 1){
    window.location.replace('/login/home.html'); // أو صفحة "غير مصرّح"
  }
};


function applyLanguage(lang){
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-ar]').forEach(el=>{
    el.textContent = el.getAttribute(`data-${lang}`);
  });
  const langText = document.getElementById('langText');
  if (langText) langText.textContent = lang === 'ar' ? 'العربية | English' : 'English | العربية';
}

// ===== حماية الصفحة: سوبر أدمن فقط =====
function requireSuperAdmin(){
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  // نفس منطق home.js لكن نحصر الدخول على RoleID=1 فقط
  // (home.js يقرأ RoleID/RoleName من localStorage). :contentReference[oaicite:5]{index=5}
  if (!user || Number(user.RoleID) !== 1){
    // رجّعيه لواجهة الهوم العامة أو تسجيل الدخول
    window.location.replace('/login/home.html'); 
    return false;
  }
  return true;
}

// ===== جلب الأرقام من الـ API =====
async function fetchSuperAdminSummary(){
  // عندك روتات overview مفعّلة في الخادم. :contentReference[oaicite:6]{index=6}
  // نحاول مسار خاص، وإن ما وُجد نرجع لملخّص عام.
  const tryEndpoints = [
    `${API_BASE_URL}/overview/superadmin`,           // إن أضفتيه
    `${API_BASE_URL}/overview/summary?scope=all`    // بديل عام
  ];

  for (const url of tryEndpoints){
    try{
      const r = await fetch(url);
      if (!r.ok) continue;
      const data = await r.json();
      if (!data) continue;

      // نتوقّع ستاتس مثل:
      // data.totals.total, data.totals.open, data.totals.in_progress, data.totals.closed
      const totals = data.totals || data || {};
      document.getElementById('kpiTotal').textContent  = totals.total ?? '0';
      document.getElementById('kpiOpen').textContent   = totals.open ?? '0';
      document.getElementById('kpiWip').textContent    = (totals.in_progress ?? totals.processing ?? 0);
      document.getElementById('kpiClosed').textContent = totals.closed ?? '0';

      // لو رجّع عدّاد سجلات اليوم
      document.getElementById('kpiLogsToday').textContent = (data.logs_today ?? data.logsToday ?? '0');

      // لو رجّع سجلات
      if (Array.isArray(data.latest_logs)){
        renderLogs(data.latest_logs);
      }else{
        // نجيب السجلات من مسار logs إن وُجد
        fetchLatestLogs();
      }
      return; // وقف بعد أول مسار ناجح
    }catch(e){ /* جرّبي التالي */ }
  }

  // آخر حل: عبّي القيم بصفر ثم جيبي السجلات مباشرة
  document.getElementById('kpiTotal').textContent  = '0';
  document.getElementById('kpiOpen').textContent   = '0';
  document.getElementById('kpiWip').textContent    = '0';
  document.getElementById('kpiClosed').textContent = '0';
  fetchLatestLogs();
}

async function fetchLatestLogs(){
  // نستفيد من وجود جدول activitylogs في الداتابيس. :contentReference[oaicite:7]{index=7}
  // استخدمي المسار الموجود عندك لسرد السجلات (مثلاً /api/logs/latest?limit=10)
  const urls = [
    `${API_BASE_URL}/logs/latest?limit=10`,
    `${API_BASE_URL}/logs?limit=10` // بديل إن الأول غير موجود
  ];
  for(const url of urls){
    try{
      const r = await fetch(url);
      if(!r.ok) continue;
      const data = await r.json();
      const rows = Array.isArray(data) ? data : (data.data || data.logs || []);
      if (rows.length){
        renderLogs(rows);
        return;
      }
    }catch(e){ /* تجاوز */ }
  }
}

function renderLogs(rows){
  const tbody = document.querySelector('#logsTable tbody');
  tbody.innerHTML = '';
  rows.slice(0,10).forEach(log=>{
    const tr = document.createElement('tr');
    const createdAt = log.CreatedAt || log.created_at || log.time || '';
    const user = log.Username || log.user || log.EmployeeName || '';
    const type = log.ActivityType || log.type || '';
    const desc = log.Description || log.description || '';
    tr.innerHTML = `<td>${createdAt}</td><td>${user}</td><td>${type}</td><td>${desc}</td>`;
    tbody.appendChild(tr);
  });
}

// ===== إشعارات وزر اللغة =====
document.addEventListener('DOMContentLoaded', ()=>{
  if (!requireSuperAdmin()) return;
  applyLanguage(currentLang);

  const toggleBtn = document.getElementById('langToggle');
  if (toggleBtn){
    toggleBtn.addEventListener('click', ()=>{
      applyLanguage(currentLang === 'ar' ? 'en' : 'ar');
    });
  }

  // جلب البيانات فورًا
  fetchSuperAdminSummary();

  // تقليل عدّاد الإشعارات مثالياً
  const notifBtn = document.getElementById('notifBtn');
  const notifCount = document.getElementById('notifCount');
  if (notifBtn && notifCount){
    notifBtn.addEventListener('click', ()=>{
      let c = parseInt(notifCount.textContent||'0',10);
      if (c>0) { c--; notifCount.textContent = c; if (c===0) notifCount.style.display='none'; }
    });
  }
});
