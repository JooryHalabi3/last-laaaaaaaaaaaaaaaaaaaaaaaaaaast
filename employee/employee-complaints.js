/** ====== Config & Helpers ====== */
const API_BASE_URL = 'http://localhost:3001/api';
const EMP_BASE = `${API_BASE_URL}/employee`;

const state = {
  page: 1,
  limit: 10,
  sortBy: 'newest',
  filters: { status: '', priority: '', q: '' },
  totalPages: 1,
  currentList: []
};

// مطابق لخيارات الواجهة ولكن يراعي الحالات الفعلية في الباك-إند
// Controller يسمح: 'مفتوحة/جديدة', 'قيد المعالجة', 'معلقة', 'مكتملة'  (للتحديث كذلك) 
// سنحوّل اختيارات المستخدم لهذه القيم. :contentReference[oaicite:9]{index=9}
const statusMapUItoAPI = {
  '': '',
  'جديدة': 'مفتوحة/جديدة',
  'قيد المعالجة': 'قيد المعالجة',
  'قيد المراجعة': 'معلقة',
  'تم الحل': 'مكتملة',
  'مغلقة': 'مكتملة' // لا توجد حالة "مغلقة" في الكنترولر، نقرّبها إلى مكتملة.
};

function authHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

function guardEmployee(){
  const userRaw = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  if (!token || !userRaw) {
    window.location.href = '../login/login.html';
    return false;
  }
  const user = JSON.parse(userRaw);
  if (Number(user.RoleID) !== 2 && user.Username?.toLowerCase() !== 'employee'){
    window.location.href = '../login/home.html';
    return false;
  }
  // إظهار اسم المستخدم في الهيدر
  const nameEl = document.getElementById('userName');
  if (nameEl) nameEl.textContent = user.FullName || user.Username || 'الموظف';
  return true;
}

function showLoading() {
  const el = document.getElementById('loadingOverlay');
  if (el) el.style.display = 'flex';
}
function hideLoading() {
  const el = document.getElementById('loadingOverlay');
  if (el) el.style.display = 'none';
}
function openModal(id){ const m = document.getElementById(id); if (m) m.style.display='block'; }
function closeModal(id){ const m = document.getElementById(id); if (m) m.style.display='none'; }

function showError(msg){
  const text = document.getElementById('errorMessage');
  if(text) text.textContent = msg || 'حدث خطأ ما';
  openModal('errorModal');
}

function statusPillClass(status){
  if(!status) return 'status-new';
  if(status.includes('مكتملة')) return 'status-completed';
  if(status.includes('قيد المعالجة')) return 'status-pending';
  if(status.includes('مراجعة')||status.includes('معلقة')) return 'status-review';
  if(status.includes('مفتوحة')||status.includes('جديدة')) return 'status-new';
  return 'status-pending';
}

/** ====== Load list & stats ====== */
function applySort(items){
  const arr = [...items];
  if (state.sortBy === 'oldest') {
    arr.sort((a,b)=> new Date(a.CreatedAt) - new Date(b.CreatedAt));
  } else if (state.sortBy === 'priority') {
    const rank = { 'عالية': 0, 'متوسطة': 1, 'منخفضة': 2 };
    arr.sort((a,b)=> (rank[a.Priority] ?? 9) - (rank[b.Priority] ?? 9));
  } else if (state.sortBy === 'status') {
    arr.sort((a,b)=> String(a.Status).localeCompare(String(b.Status), 'ar'));
  } else {
    arr.sort((a,b)=> new Date(b.CreatedAt) - new Date(a.CreatedAt)); // newest
  }
  return arr;
}

function renderStats(items){
  const total = items.length;
  const pending = items.filter(c => (c.Status||'').includes('قيد المعالجة')).length;
  const completed = items.filter(c => (c.Status||'').includes('مكتملة')).length;
  const urgent = items.filter(c => (c.Priority||'') === 'عالية').length;

  document.getElementById('totalCount')?.innerText = total;
  document.getElementById('pendingCount')?.innerText = pending;
  document.getElementById('completedCount')?.innerText = completed;
  document.getElementById('urgentCount')?.innerText = urgent;
  document.getElementById('resultsCount')?.innerText = `${total} شكوى`;
}

function renderList(items){
  const listEl = document.getElementById('complaintsList');
  if(!listEl) return;
  listEl.innerHTML = '';

  if(!items.length){
    listEl.innerHTML = `<div style="text-align:center;color:#7f8c8d;">لا توجد نتائج مطابقة</div>`;
    return;
  }

  items.forEach(c=>{
    const card = document.createElement('div');
    card.className = 'complaint-card';
    card.innerHTML = `
      <div class="complaint-header">
        <div>
          <div class="complaint-title">${c.Title || 'بدون عنوان'}</div>
          <div class="complaint-meta">
            <span><i class="far fa-hashtag"></i> ${c.ComplaintID}</span>
            <span><i class="far fa-building"></i> ${c.DepartmentName || '—'}</span>
            <span><i class="far fa-user"></i> ${c.EmployeeName || '—'}</span>
            <span><i class="far fa-calendar"></i> ${c.CreatedAt ? new Date(c.CreatedAt).toLocaleString('ar-SA') : '—'}</span>
          </div>
        </div>
        <div class="complaint-status ${statusPillClass(c.Status)}">${c.Status || '—'}</div>
      </div>
      <div class="complaint-details">${(c.Description||'').slice(0,240)}${(c.Description||'').length>240?'…':''}</div>
      <div class="complaint-footer">
        <div class="complaint-meta">
          <span><i class="far fa-tags"></i> ${c.Category || '—'}</span>
          <span><i class="far fa-flag"></i> ${c.Priority || '—'}</span>
          <span><i class="far fa-reply"></i> ردود: ${c.ResponseCount ?? 0}</span>
        </div>
        <div class="complaint-actions">
          <button class="action-btn action-btn-primary" data-open="${c.ComplaintID}">تفاصيل</button>
        </div>
      </div>`;
    listEl.appendChild(card);
  });

  listEl.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-open]');
    if(!btn) return;
    openComplaintDetails(btn.dataset.open);
  }, { once: true }); // نربط مرة واحدة لتفادي التكرار
}

function renderPagination(pagination){
  state.totalPages = pagination?.totalPages || 1;
  const pagEl = document.getElementById('pagination');
  if(!pagEl) return;
  pagEl.innerHTML = '';

  const addBtn = (txt, page, disabled=false, active=false)=>{
    const b = document.createElement('button');
    b.textContent = txt;
    if (active) b.classList.add('active');
    if (disabled) b.disabled = true;
    b.addEventListener('click', ()=> { state.page = page; loadComplaints(); });
    pagEl.appendChild(b);
  };

  addBtn('السابق', Math.max(1, state.page-1), state.page===1);
  for(let p=1;p<=state.totalPages;p++){
    addBtn(String(p), p, false, p===state.page);
  }
  addBtn('التالي', Math.min(state.totalPages, state.page+1), state.page===state.totalPages);
}

async function loadComplaints(){
  try{
    showLoading();
    const params = new URLSearchParams();
    params.set('page', state.page);
    params.set('limit', state.limit);

    // حالة من واجهة المستخدم -> حالة الكنترولر
    const apiStatus = statusMapUItoAPI[state.filters.status] || '';
    if (apiStatus) params.set('status', apiStatus);
    // لا يوجد فلترة مباشرة بـ priority في الكنترولر، سنرشّح محليًا بعد الجلب
    // category غير موجودة في الواجهة، لكن الكنترولر يدعمها إن أردت مستقبلاً. :contentReference[oaicite:10]{index=10}

    const res = await fetch(`${EMP_BASE}/complaints?${params.toString()}`, { headers: authHeaders() });
    if(!res.ok) throw new Error('فشل جلب الشكاوى');
    const json = await res.json();

    let items = json?.data?.complaints || [];

    // فلترة محلية حسب الأولوية والبحث
    if (state.filters.priority){
      items = items.filter(c => (c.Priority||'') === state.filters.priority);
    }
    if (state.filters.q){
      const q = state.filters.q.trim();
      items = items.filter(c =>
        String(c.Title||'').includes(q) ||
        String(c.Description||'').includes(q) ||
        String(c.Category||'').includes(q) ||
        String(c.ComplaintID||'').includes(q)
      );
    }

    items = applySort(items);
    state.currentList = items;

    renderStats(items);
    renderList(items);
    renderPagination(json?.data?.pagination);
  }catch(err){
    console.error(err);
    showError('تعذر تحميل الشكاوى');
  }finally{
    hideLoading();
  }
}

/** ====== Complaint details & actions ====== */
function fillDetailsView(data){
  const box = document.getElementById('complaintDetails');
  if(!box) return;

  const c = data.complaint;
  const responses = data.responses || [];
  box.innerHTML = `
    <div class="complaint-detail-item">
      <h4>العنوان</h4><p>${c.Title || '—'}</p>
    </div>
    <div class="complaint-detail-item">
      <h4>الوصف</h4><p>${c.Description || '—'}</p>
    </div>
    <div class="complaint-detail-item">
      <h4>البيانات</h4>
      <p><strong>رقم الشكوى:</strong> ${c.ComplaintID} — <strong>القسم:</strong> ${c.DepartmentName || '—'}</p>
      <p><strong>الحالة:</strong> ${c.Status || '—'} — <strong>الأولوية:</strong> ${c.Priority || '—'}</p>
      <p><strong>صاحب الشكوى:</strong> ${c.EmployeeName || '—'} — <strong>مسندة إلى:</strong> ${c.AssignedToName || '—'}</p>
      <p><strong>تاريخ الإنشاء:</strong> ${c.CreatedAt ? new Date(c.CreatedAt).toLocaleString('ar-SA'): '—'}</p>
    </div>
    <div class="complaint-responses">
      <h4>الردود</h4>
      ${responses.map(r=>`
        <div class="response-item">
          <div class="response-header">
            <span class="response-author">${r.EmployeeName || '—'}</span>
            <span class="response-date">${r.CreatedAt ? new Date(r.CreatedAt).toLocaleString('ar-SA'): '—'}</span>
          </div>
          <div>${r.Content || ''}</div>
        </div>
      `).join('') || '<div style="color:#7f8c8d;">لا توجد ردود بعد</div>'}
    </div>
  `;
}

async function openComplaintDetails(id){
  try{
    showLoading();
    const res = await fetch(`${EMP_BASE}/complaints/${id}`, { headers: authHeaders() });
    if (!res.ok) throw new Error('لا يمكن جلب تفاصيل الشكوى');
    const json = await res.json();
    fillDetailsView(json.data);
    openModal('detailsModal');

    // اربط أزرار التفاصيل
    document.getElementById('respondBtn')?.addEventListener('click', ()=>{
      document.getElementById('responseText').value = '';
      openModal('responseModal');
    });
    document.getElementById('updateStatusBtn')?.addEventListener('click', ()=>{
      openModal('statusModal');
    });
    document.getElementById('closeDetailsBtn')?.addEventListener('click', ()=> closeModal('detailsModal'));

    // إرسال الرد
    document.getElementById('submitResponseBtn')?.addEventListener('click', async ()=>{
      const txt = document.getElementById('responseText').value.trim();
      if (!txt) { alert('الرد مطلوب'); return; }
      try{
        const r = await fetch(`${EMP_BASE}/complaints/${id}/responses`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ content: txt })
        });
        if(!r.ok) throw new Error();
        closeModal('responseModal');
        // حدّث التفاصيل والقائمة
        await openComplaintDetails(id);
        await loadComplaints();
      }catch(e){ showError('فشل إرسال الرد'); }
    });
    document.getElementById('cancelResponseBtn')?.addEventListener('click', ()=> closeModal('responseModal'));
    document.getElementById('closeResponseModal')?.addEventListener('click', ()=> closeModal('responseModal'));

    // تحديث الحالة
    document.getElementById('closeStatusModal')?.addEventListener('click', ()=> closeModal('statusModal'));
    document.getElementById('updateStatusBtn')?.addEventListener('click', ()=> openModal('statusModal'));
    document.getElementById('newStatus')?.addEventListener('change', ()=>{}); // اختياري
    document.getElementById('statusModal')?.querySelector('.btn.btn-primary')?.addEventListener('click', async ()=>{
      const uiVal = (document.getElementById('newStatus')?.value)||'';
      // خريطة عكسية نحو قيم الكنترولر المدعومة للتحديث. :contentReference[oaicite:11]{index=11}
      const map = {
        'جديدة':'مفتوحة/جديدة',
        'قيد المعالجة':'قيد المعالجة',
        'قيد المراجعة':'معلقة',
        'تم الحل':'مكتملة',
        'مغلقة':'مكتملة'
      };
      const apiStatus = map[uiVal] || uiVal || 'قيد المعالجة';
      try{
        const r = await fetch(`${EMP_BASE}/complaints/${id}/status`, {
          method:'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ status: apiStatus })
        });
        if(!r.ok) throw new Error();
        closeModal('statusModal');
        await openComplaintDetails(id);
        await loadComplaints();
      }catch(e){ showError('تعذر تحديث الحالة'); }
    });

  }catch(err){
    console.error(err);
    showError('فشل فتح تفاصيل الشكوى');
  }finally{
    hideLoading();
  }
}

/** ====== UI Wiring ====== */
function wireUI(){
  document.getElementById('sortBy')?.addEventListener('change', (e)=>{
    state.sortBy = e.target.value;
    renderList(applySort(state.currentList));
  });

  document.getElementById('statusFilter')?.addEventListener('change', (e)=>{
    state.filters.status = e.target.value || '';
    state.page = 1;
    loadComplaints();
  });

  document.getElementById('priorityFilter')?.addEventListener('change', (e)=>{
    state.filters.priority = e.target.value || '';
    state.page = 1;
    loadComplaints();
  });

  document.getElementById('searchInput')?.addEventListener('input', (e)=>{
    state.filters.q = e.target.value || '';
    state.page = 1;
    // فلترة فورية على النتائج الحالية
    const filtered = applySort(
      (state.currentList||[]).filter(c =>
        String(c.Title||'').includes(state.filters.q) ||
        String(c.Description||'').includes(state.filters.q) ||
        String(c.Category||'').includes(state.filters.q) ||
        String(c.ComplaintID||'').includes(state.filters.q)
      )
    );
    renderStats(filtered);
    renderList(filtered);
  });

  document.getElementById('clearFilters')?.addEventListener('click', ()=>{
    state.filters = { status:'', priority:'', q:'' };
    document.getElementById('statusFilter').value = '';
    document.getElementById('priorityFilter').value = '';
    document.getElementById('searchInput').value = '';
    state.page = 1;
    loadComplaints();
  });

  document.getElementById('newComplaintBtn')?.addEventListener('click', ()=>{
    // نفس مسار زر "تقديم شكوى" في الهوم. :contentReference[oaicite:12]{index=12}
    window.location.href = '../New complaint/Newcomplaint.html';
  });

  // روابط الهيدر
  document.getElementById('logoutBtn')?.addEventListener('click', ()=>{
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../login/login.html';
  });

  document.getElementById('closeErrorModal')?.addEventListener('click', ()=> closeModal('errorModal'));
  document.getElementById('closeErrorBtn')?.addEventListener('click', ()=> closeModal('errorModal'));
  document.getElementById('closeDetailsModal')?.addEventListener('click', ()=> closeModal('detailsModal'));
}

/** ====== Notifications badge in header ====== */
async function loadNotifBadge(){
  try{
    const res = await fetch(`${EMP_BASE}/notifications?page=1&limit=1`, { headers: authHeaders() });
    if(!res.ok) return;
    const json = await res.json();
    const badge = document.getElementById('notificationBadge');
    if (badge){
      const unread = json?.data?.unreadCount ?? 0;
      badge.textContent = unread;
      badge.style.display = unread>0 ? 'flex' : 'none';
    }
  }catch(e){}
}

/** ====== Boot ====== */
document.addEventListener('DOMContentLoaded', async ()=>{
  if(!guardEmployee()) return;

  wireUI();
  await loadComplaints();
  await loadNotifBadge();

  // افتح شكوى مباشرة إذا جاء query param ?open=ID
  const url = new URL(window.location.href);
  const openId = url.searchParams.get('open');
  if (openId) openComplaintDetails(openId);
});