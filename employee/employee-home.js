/** ====== Config & Helpers ====== */
const API_BASE_URL = 'http://localhost:3001/api';
const EMP_BASE = `${API_BASE_URL}/employee`;

function authHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

function showLoading() {
  const el = document.getElementById('loadingOverlay');
  if (el) el.style.display = 'flex';
}
function hideLoading() {
  const el = document.getElementById('loadingOverlay');
  if (el) el.style.display = 'none';
}

function showError(msg) {
  const modal = document.getElementById('errorModal');
  const text = document.getElementById('errorMessage');
  if (text) text.textContent = msg || 'حدث خطأ ما';
  if (modal) modal.style.display = 'block';
}

function applyLanguage(lang){
  // صفحة الهوم تحتوي عناصر data-ar/data-en في العنوان
  const root = document.body;
  root.classList.remove('lang-ar','lang-en');
  root.classList.add(lang === 'ar' ? 'lang-ar' : 'lang-en');

  document.querySelectorAll('[data-ar]').forEach(el=>{
    const t = el.getAttribute(`data-${lang}`);
    if (t) el.textContent = t;
  });
  const langText = document.getElementById('langText');
  if (langText) langText.textContent = lang === 'ar' ? 'العربية | English' : 'English | العربية';
  localStorage.setItem('lang', lang);
}

function guardEmployee(){
  const userRaw = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  if (!token || !userRaw) {
    window.location.href = '../login/login.html';
    return false;
  }
  const user = JSON.parse(userRaw);
  // RoleID: 1 SuperAdmin, 2 Employee, 3 Admin
  if (Number(user.RoleID) !== 2 && user.Username?.toLowerCase() !== 'employee'){
    // إن لم يكن موظفًا أعده للهوم العامة أو صفحة صلاحياته
    window.location.href = '../login/home.html';
    return false;
  }
  return true;
}

/** ====== Notifications ====== */
async function loadNotifications(){
  try{
    const res = await fetch(`${EMP_BASE}/notifications?page=1&limit=10`, { headers: authHeaders() });
    if(!res.ok) throw new Error('فشل جلب الإشعارات');
    const json = await res.json();
    const list = document.getElementById('notifList');
    const countEl = document.getElementById('notifCount');
    if (countEl){
      const unread = json?.data?.unreadCount ?? 0;
      countEl.textContent = unread;
      countEl.style.display = unread > 0 ? 'inline-block' : 'none';
    }
    if (list){
      list.innerHTML = '';
      (json?.data?.notifications || []).forEach(n=>{
        const row = document.createElement('div');
        row.className = 'notif-item';
        row.innerHTML = `
          <div class="meta">${new Date(n.CreatedAt).toLocaleString('ar-SA')}</div>
          <div><strong>${n.Title || 'إشعار'}</strong> — ${n.Message || ''}</div>
          <div class="notif-actions">
            <button class="notif-detail-btn" data-id="${n.ComplaintID || ''}">تفاصيل</button>
            ${n.IsRead ? '' : '<button class="notif-remove-btn" title="وضع كمقروء" data-read="'+(n.NotificationID)+'">✓</button>'}
          </div>`;
        list.appendChild(row);
      });

      list.addEventListener('click', async (e)=>{
        const btn = e.target.closest('button');
        if(!btn) return;
        if (btn.classList.contains('notif-detail-btn') && btn.dataset.id){
          window.location.href = `employee-complaints.html?open=${btn.dataset.id}`;
        } else if (btn.classList.contains('notif-remove-btn') && btn.dataset.read){
          try{
            await fetch(`${EMP_BASE}/notifications/${btn.dataset.read}/read`, {
              method: 'PUT',
              headers: authHeaders(),
              body: JSON.stringify({ isRead: 1 })
            });
            await loadNotifications(); // refresh
          }catch(e){}
        }
      });
    }
  }catch(err){
    console.error(err);
  }
}

/** ====== KPIs & Table ====== */
function computeKpis(complaints){
  const total = complaints.length;
  const byStatus = s => complaints.filter(c => (c.Status||'').includes(s)).length;
  const highPriority = complaints.filter(c => (c.Priority||'') === 'عالية').length;

  // مواعيد وديدلاين غير موجودة في الـ schema المرسل، نعرض شرطة فقط
  document.getElementById('kpiTotal')?.innerText = total;
  document.getElementById('kpiOpen')?.innerText = byStatus('مفتوحة') + byStatus('جديدة');
  document.getElementById('kpiResponded')?.innerText = byStatus('قيد المعالجة');
  document.getElementById('kpiDueSoon')?.innerText = byStatus('مكتملة');
  document.getElementById('kpiLate')?.innerText = highPriority;
}

function statusBadgeClass(status){
  if(!status) return 'status-new';
  if(status.includes('مكتملة')) return 'status-completed';
  if(status.includes('قيد المعالجة')) return 'status-pending';
  if(status.includes('مفتوحة')||status.includes('جديدة')) return 'status-new';
  return 'status-pending';
}

function fillTable(complaints){
  const tbody = document.getElementById('compBody');
  if(!tbody) return;
  tbody.innerHTML = '';
  if(!complaints.length){
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#666;">—</td></tr>`;
    return;
  }
  complaints.slice(0,10).forEach(c=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.ComplaintID}</td>
      <td>${c.DepartmentName || '—'}</td>
      <td><span class="complaint-status ${statusBadgeClass(c.Status)}">${c.Status || '—'}</span></td>
      <td>${c.Category || '—'}</td>
      <td>${c.CreatedAt ? new Date(c.CreatedAt).toLocaleDateString('ar-SA') : '—'}</td>
      <td>—</td>
      <td>—</td>`;
    tr.style.cursor='pointer';
    tr.addEventListener('click', ()=> {
      window.location.href = `employee-complaints.html?open=${c.ComplaintID}`;
    });
    tbody.appendChild(tr);
  });
}

async function loadOverviewData(){
  try{
    showLoading();
    // نستخدم اندبوينت شكاوى الموظف ونجمّع إحصائيات محلياً
    const res = await fetch(`${EMP_BASE}/complaints?page=1&limit=200`, { headers: authHeaders() });
    if(!res.ok) throw new Error('HTTP error');
    const json = await res.json();
    const complaints = json?.data?.complaints || [];
    computeKpis(complaints);
    fillTable(complaints);
  }catch(err){
    console.error(err);
    showError('فشل في معالجة البيانات من الخادم');
  }finally{
    hideLoading();
  }
}

/** ====== Boot ====== */
document.addEventListener('DOMContentLoaded', async ()=>{
  if(!guardEmployee()) return;

  const lang = localStorage.getItem('lang') || 'ar';
  applyLanguage(lang);

  document.getElementById('langToggle')?.addEventListener('click', ()=>{
    applyLanguage((localStorage.getItem('lang')||'ar') === 'ar' ? 'en' : 'ar');
  });

  // إشعارات
  document.getElementById('notifBtn')?.addEventListener('click', ()=>{
    const m = document.getElementById('notifModal');
    if (m) m.style.display = 'flex';
  });
  document.getElementById('closeNotif')?.addEventListener('click', ()=>{
    const m = document.getElementById('notifModal');
    if (m) m.style.display = 'none';
  });

  // إغلاق خطأ
  document.getElementById('closeErrorModal')?.addEventListener('click', ()=> {
    const m = document.getElementById('errorModal'); if(m) m.style.display='none';
  });
  document.getElementById('closeErrorBtn')?.addEventListener('click', ()=> {
    const m = document.getElementById('errorModal'); if(m) m.style.display='none';
  });

  await loadOverviewData();
  await loadNotifications();
});