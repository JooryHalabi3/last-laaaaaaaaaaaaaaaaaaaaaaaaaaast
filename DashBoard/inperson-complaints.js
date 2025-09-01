// Ensure Chart.js and ChartDataLabels are loaded before this script runs
// They are loaded in the HTML file via CDN

let currentLang = localStorage.getItem('lang') || 'ar';
let dailyCommunicationChart;
let dateFromPicker;
let dateToPicker;
let percentageMode = 'global'; // 'global' or 'column'

// لوحة ألوان افتراضية عند غياب ألوان من الباك إند
const DEFAULT_COLORS = [
    '#2563eb','#10b981','#f59e0b','#ef4444','#8b5cf6','#14b8a6','#f97316','#22c55e',
    '#e11d48','#0ea5e9','#a855f7','#84cc16','#06b6d4','#f43f5e','#facc15'
];

// تعيين لون ثابت لكل نوع شكوى (مفتاح بالعربي)
const TYPE_COLOR_MAP = {
    'الخدمات الطبية والعلاجية': '#2563eb',
    'الكوادر الصحية وسلوكهم': '#ef4444',
    'الصيدلية والدواء': '#10b981',
    'المواعيد والتحويلات': '#f59e0b',
    'الإجراءات الإدارية': '#8b5cf6',
    'الخدمات الإلكترونية والتطبيقات': '#14b8a6',
    'الاستقبال وخدمة العملاء': '#f97316',
    'خدمات المرضى العامة': '#22c55e',
    'الدعم المنزلي والرعاية المستمرة': '#0ea5e9',
    'تجربة الزوار والمرافقين': '#a855f7',
    'خدمات الطوارئ والإسعاف': '#e11d48',
    'خدمات التأهيل والعلاج الطبيعي': '#84cc16',
    'الخصوصية وسرية المعلومات': '#06b6d4',
    'التثقيف والتوعية الصحية': '#f43f5e',
    'بيئة المستشفى والبنية التحتية': '#facc15',
    'السلامة ومكافحة العدوى': '#1f2937',
    'خدمات الدعم الفني والأنظمة': '#0e7490',
    'القبول والتحويل الداخلي بين الأقسام': '#7c3aed',
    'التقييم بعد المعالجة': '#059669',
    'ملاحظات المرضى الدوليين': '#b91c1c'
};

function getColorForType(arabicType, index) {
    return TYPE_COLOR_MAP[arabicType] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

// تحميل خط عربي وتضمينه داخل jsPDF لتجنب تشويه الحروف
const ARABIC_PDF_FONT = {
    name: 'Amiri',
    fileName: 'Amiri-Regular.ttf',
    url: 'https://cdn.jsdelivr.net/gh/alif-type/amiri@latest/ttf/Amiri-Regular.ttf'
};
let isArabicPdfFontLoaded = false;

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

async function ensureArabicPdfFont(doc) {
    if (isArabicPdfFontLoaded) {
        doc.setFont(ARABIC_PDF_FONT.name, 'normal');
        return;
    }
    const res = await fetch(ARABIC_PDF_FONT.url);
    if (!res.ok) throw new Error('فشل تحميل خط PDF العربي');
    const buf = await res.arrayBuffer();
    const base64 = arrayBufferToBase64(buf);
    doc.addFileToVFS(ARABIC_PDF_FONT.fileName, base64);
    doc.addFont(ARABIC_PDF_FONT.fileName, ARABIC_PDF_FONT.name, 'normal');
    doc.setFont(ARABIC_PDF_FONT.name, 'normal');
    isArabicPdfFontLoaded = true;
}

function waitNextFrame() {
    return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

// تسجيل إضافة ChartDataLabels إذا كانت متاحة من الـ CDN
if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
}

// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// متغيرات عامة للبيانات
let chartData = {
    labels: { ar: [], en: [] },
    datasets: []
};

function getFont() {
    return currentLang === 'ar' ? 'Tajawal' : 'Merriweather';
}

// جلب البيانات من الباك إند
async function loadInPersonComplaintsData() {
    try {
        console.log('🔄 بدء جلب بيانات الشكاوى الحضورية من الباك إند...');
        
        // إظهار مؤشر التحميل في الصفحة
        const chartContainer = document.querySelector('.relative.w-full');
        if (chartContainer) {
            chartContainer.innerHTML = '<div class="flex items-center justify-center h-full"><div class="text-center"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div><p class="mt-4 text-gray-600">جاري تحميل البيانات...</p></div></div>';
        }
        
        // بناء URL مع فلاتر التاريخ فقط إذا تم تحديدها
        let url = `${API_BASE_URL}/inperson-complaints/stats`;
        const params = new URLSearchParams();
        
        // إضافة فلاتر التاريخ فقط إذا تم تحديدها من المستخدم
        if (dateFromPicker && dateFromPicker.selectedDates[0]) {
            const fromDate = dateFromPicker.selectedDates[0].toLocaleDateString('sv-SE'); // YYYY-MM-DD
            params.append('fromDate', fromDate);
            console.log('📅 تاريخ البداية المحدد:', fromDate);
        }
        if (dateToPicker && dateToPicker.selectedDates[0]) {
            const toDate = dateToPicker.selectedDates[0].toLocaleDateString('sv-SE'); // YYYY-MM-DD
            params.append('toDate', toDate);
            console.log('📅 تاريخ النهاية المحدد:', toDate);
        }
        
        // إضافة المعاملات للرابط إذا وجدت
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        console.log('📅 فلاتر التاريخ:', params.toString() || 'بدون فلاتر - جلب جميع البيانات');
        console.log('🌐 إرسال طلب إلى:', url);

        const response = await fetch(url);
        
        console.log('📡 استجابة الخادم:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }
        
        const result = await response.json();

        console.log('📊 استجابة الباك إند:', result);

        if (result.success) {
            console.log('✅ تم جلب البيانات بنجاح!');
            console.log('📈 البيانات المستلمة:', result.data);
            
            // معالجة البيانات من الباك إند
            processChartData(result.data);
            
            // إنشاء الـ Legend ديناميكياً
            createDynamicLegend(result.data);
            
            // إعادة إنشاء الرسم البياني
            if (dailyCommunicationChart) {
                dailyCommunicationChart.destroy();
            }
            
            const chartContainer = document.querySelector('.relative.w-full');
            if (chartContainer) {
                chartContainer.innerHTML = '<canvas id="dailyCommunicationChart"></canvas>';
                const ctx = document.getElementById('dailyCommunicationChart');
                if (ctx) {
                    dailyCommunicationChart = createDailyCommunicationBarChart(ctx, chartData);
                }
            }
            
            // إظهار إشعار نجاح
            showNotification('تم جلب بيانات الشكاوى الحضورية بنجاح!', 'success');
            
        } else {
            console.error('❌ خطأ في جلب البيانات:', result.message);
            showError('فشل في تحميل البيانات من الخادم: ' + result.message);
        }
    } catch (error) {
        console.error('💥 خطأ في الاتصال بالخادم:', error);
        
        // إظهار رسالة خطأ مفصلة
        const chartContainer = document.querySelector('.relative.w-full');
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div class="flex items-center justify-center h-full">
                    <div class="text-center">
                        <div class="text-red-500 text-xl mb-4">⚠️</div>
                        <p class="text-red-600 text-lg">فشل في تحميل البيانات</p>
                        <p class="text-gray-500 text-sm mt-2">${error.message}</p>
                        <div class="mt-4 space-y-2">
                            <p class="text-xs text-gray-400">تأكد من:</p>
                            <ul class="text-xs text-gray-400 text-right">
                                <li>• تشغيل الباك إند على المنفذ 3001</li>
                                <li>• وجود بيانات في قاعدة البيانات</li>
                                <li>• صحة إعدادات قاعدة البيانات</li>
                            </ul>
                        </div>
                        <button onclick="loadInPersonComplaintsData()" class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                            إعادة المحاولة
                        </button>
                    </div>
                </div>
            `;
        }
        
        showError('خطأ في الاتصال بالخادم: ' + error.message);
    }
}

// إنشاء الـ Legend ديناميكياً من قاعدة البيانات
function createDynamicLegend(data) {
    const legendContainer = document.getElementById('legendContainer');
    if (!legendContainer || !data || !data.chartData || !data.chartData.datasets) {
        return;
    }
    
    // مسح المحتوى السابق
    legendContainer.innerHTML = '';
    
    // إنشاء عناصر الـ Legend لكل نوع شكوى
    data.chartData.datasets.forEach(dataset => {
        const legendItem = document.createElement('div');
        legendItem.className = 'flex items-center gap-2 text-sm text-gray-700';
        
        const colorSpan = document.createElement('span');
        colorSpan.className = 'w-3 h-3 rounded-full';
        colorSpan.style.backgroundColor = dataset.backgroundColor;
        
        const textSpan = document.createElement('span');
        textSpan.textContent = dataset.label;
        textSpan.setAttribute('data-ar', dataset.label);
        textSpan.setAttribute('data-en', getEnglishComplaintType(dataset.label));
        
        legendItem.appendChild(colorSpan);
        legendItem.appendChild(textSpan);
        legendContainer.appendChild(legendItem);
    });
    
    console.log('✅ تم إنشاء الـ Legend ديناميكياً');
}

// معالجة البيانات من الباك إند
function processChartData(data) {
    console.log('🔧 معالجة البيانات المستلمة:', data);
    
    if (!data || !data.chartData) {
        console.log('📝 لا توجد بيانات من الباك إند');
        showNoDataMessage();
        return;
    }
    
    const backendChartData = data.chartData;
    
    // تحديث التصنيفات (الأقسام)
    chartData.labels.ar = backendChartData.labels || [];
    chartData.labels.en = backendChartData.labels.map(label => getEnglishDepartmentName(label)) || [];
    
    // تحديث مجموعات البيانات (أنواع الشكاوى) مع ترتيب ثابت حسب الاسم لضمان تنظيم العرض
    chartData.datasets = backendChartData.datasets.map(dataset => ({
        label: { ar: dataset.label, en: getEnglishComplaintType(dataset.label) },
        data: dataset.data || [],
        backgroundColor: dataset.backgroundColor,
        borderColor: dataset.borderColor,
        borderWidth: dataset.borderWidth || 1,
        borderRadius: dataset.borderRadius || 3,
    })).sort((a, b) => {
        const aLabel = (a.label?.ar || '').toString();
        const bLabel = (b.label?.ar || '').toString();
        return aLabel.localeCompare(bLabel, 'ar');
    });
    
    console.log('📈 البيانات النهائية للرسم البياني:', chartData);
    
    // إذا لم توجد بيانات، عرض رسالة
    if (chartData.labels.ar.length === 0 || chartData.datasets.length === 0) {
        showNoDataMessage();
    }
}

// إظهار رسالة عدم وجود بيانات
function showNoDataMessage() {
    const chartContainer = document.querySelector('.relative.w-full');
    if (chartContainer) {
        chartContainer.innerHTML = `
            <div class="flex items-center justify-center h-full">
                <div class="text-center">
                    <div class="text-gray-500 text-xl mb-4">📊</div>
                    <p class="text-gray-600 text-lg">لا توجد بيانات شكاوى حضورية في الفترة المحددة</p>
                    <p class="text-gray-500 text-sm mt-2">جرب تغيير الفترة الزمنية أو إضافة شكاوى جديدة</p>
                    <div class="mt-4 space-y-2">
                        <p class="text-xs text-gray-400">تأكد من:</p>
                        <ul class="text-xs text-gray-400 text-right">
                            <li>• وجود شكاوى في قاعدة البيانات</li>
                            <li>• صحة الفترة الزمنية المحددة</li>
                            <li>• ربط الشكاوى بالأقسام وأنواع الشكاوى</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }
}

// الحصول على اسم القسم بالإنجليزية
function getEnglishDepartmentName(arabicName) {
    const departmentMap = {
        'قسم الطوارئ': 'Emergency Department',
        'قسم الجراحة العامة': 'General Surgery Department',
        'قسم الصيدلية': 'Pharmacy Department',
        'قسم العناية المركزة': 'Intensive Care Unit',
        'قسم الجراحة نساء': 'Women\'s Surgery Department',
        'قسم الباطنية': 'Internal Medicine Department',
        'قسم الأطفال': 'Pediatrics Department',
        'قسم العظام': 'Orthopedics Department',
        'قسم القلب': 'Cardiology Department',
        'قسم المخ والأعصاب': 'Neurology Department',
        'قسم الأشعة': 'Radiology Department',
        'قسم المختبر': 'Laboratory Department',
        'قسم التمريض': 'Nursing Department',
        'قسم الإدارة': 'Administration Department'
    };
    
    return departmentMap[arabicName] || arabicName;
}

// الحصول على نوع الشكوى بالإنجليزية
function getEnglishComplaintType(arabicType) {
    const typeMap = {
        'الخدمات الطبية والعلاجية': 'Medical and Therapeutic Services',
        'الكوادر الصحية وسلوكهم': 'Health Staff and Their Behavior',
        'الصيدلية والدواء': 'Pharmacy and Medicine',
        'المواعيد والتحويلات': 'Appointments and Transfers',
        'الإجراءات الإدارية': 'Administrative Procedures',
        'الخدمات الإلكترونية والتطبيقات': 'Electronic Services and Applications',
        'الاستقبال وخدمة العملاء': 'Reception and Customer Service',
        'خدمات المرضى العامة': 'General Patient Services',
        'الدعم المنزلي والرعاية المستمرة': 'Home Support and Continuous Care',
        'تجربة الزوار والمرافقين': 'Visitor and Companion Experience',
        'خدمات الطوارئ والإسعاف': 'Emergency and Ambulance Services',
        'خدمات التأهيل والعلاج الطبيعي': 'Rehabilitation and Physical Therapy Services',
        'الخصوصية وسرية المعلومات': 'Privacy and Information Confidentiality',
        'التثقيف والتوعية الصحية': 'Health Education and Awareness',
        'بيئة المستشفى والبنية التحتية': 'Hospital Environment and Infrastructure',
        'السلامة ومكافحة العدوى': 'Safety and Infection Control',
        'خدمات الدعم الفني والأنظمة': 'Technical Support and Systems Services',
        'القبول والتحويل الداخلي بين الأقسام': 'Admission and Internal Transfer Between Departments',
        'التقييم بعد المعالجة': 'Post-Treatment Evaluation',
        'ملاحظات المرضى الدوليين': 'International Patient Notes'
    };
    
    return typeMap[arabicType] || arabicType;
}

// دالة لعرض الإشعارات
function showNotification(message, type = 'info') {
    // إنشاء عنصر الإشعار
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
    
    // تحديد لون الإشعار حسب النوع
    if (type === 'success') {
        notification.className += ' bg-green-500 text-white';
    } else if (type === 'error') {
        notification.className += ' bg-red-500 text-white';
    } else {
        notification.className += ' bg-blue-500 text-white';
    }
    
    notification.innerHTML = `
        <div class="flex items-center">
            <span class="mr-2">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // إظهار الإشعار
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // إخفاء الإشعار بعد 5 ثواني
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 5000);
}

// إظهار رسالة خطأ
function showError(message) {
    console.error('❌ خطأ:', message);
    alert(message);
}

function createDailyCommunicationBarChart(ctx, chartData) {
    console.log('🎨 إنشاء الرسم البياني مع البيانات:', chartData);
    
    // إجمالي جميع القيم (لكل الأعمدة) لحساب النِّسب العالمية
    const grandTotal = (chartData.datasets || []).reduce((sum, ds) => {
        return sum + (ds.data || []).reduce((s, v) => s + (Number(v) || 0), 0);
    }, 0);

    const labelsForLang = chartData.labels[currentLang] || [];

    // حساب سماكة الأعمدة ديناميكياً بحسب عدد الأنواع وعدد الأقسام وعرض الكانفاس
    const numDatasets = (chartData.datasets || []).length || 1;
    const numCategories = (chartData.labels[currentLang] || []).length || 1;
    const canvasEl = ctx && ctx.clientWidth ? ctx : (ctx && ctx.canvas ? ctx.canvas : null);
    const canvasWidth = canvasEl && canvasEl.clientWidth ? canvasEl.clientWidth : 800;
    const groupWidthPx = canvasWidth / Math.max(1, numCategories);
    const barThicknessValue = Math.max(25, Math.min(80, Math.floor((groupWidthPx * 0.8) / Math.max(1, numDatasets))));

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels[currentLang],
            datasets: chartData.datasets.map((dataset, idx) => {
                const rawCounts = (dataset.data || []).map(v => Number(v) || 0);
                return {
                    label: dataset.label[currentLang],
                    data: rawCounts,
                    backgroundColor: dataset.backgroundColor || getColorForType(dataset.label.ar || dataset.label[currentLang], idx),
                    borderColor: dataset.borderColor || getColorForType(dataset.label.ar || dataset.label[currentLang], idx),
                    borderWidth: 1,
                    borderRadius: 4,
                    barPercentage: 0.8,
                    categoryPercentage: 0.9,
                    datalabels: {
                        display: true,
                        anchor: 'center',
                        align: 'center',
                        clamp: true,
                        offset: 0,
                        color: '#ffffff',
                        backgroundColor: 'transparent',
                        borderRadius: 0,
                        padding: { top: 1, bottom: 1, left: 1, right: 1 },
                        font: { family: getFont(), weight: '700', size: 11 },
                        formatter: function(value, context) {
                            const v = Number(value) || 0;
                            if (v <= 0) return '';
                            return v.toString();
                        }
                    }
                };
            })
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 1.5,
            layout: {
                padding: {
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20
                }
            },
            scales: {
                x: {
                    stacked: false,
                    ticks: {
                        font: { family: getFont(), size: 12 },
                        maxRotation: 45,
                        minRotation: 0
                    }
                },
                y: {
                    stacked: false,
                    beginAtZero: true,
                    min: 0,
                    max: 10,
                    ticks: {
                        font: { family: getFont(), size: 12 },
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false, // إخفاء رموز الألوان
                },
                tooltip: {
                    rtl: currentLang === 'ar',
                    bodyFont: { family: getFont(), size: 13 },
                    titleFont: { family: getFont(), size: 13 },
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y || context.parsed;
                            return `${label}: ${value}`;
                        }
                    }
                }
            },
            onClick: function(event, elements) {
                if (elements.length > 0) {
                    const element = elements[0];
                    const datasetIndex = element.datasetIndex;
                    const dataIndex = element.index;
                    const value = element.raw;
                    const label = this.data.labels[dataIndex];
                    const datasetLabel = this.data.datasets[datasetIndex].label;
                    
                    const message = currentLang === 'ar' 
                        ? `القسم: ${label}\nنوع الشكوى: ${datasetLabel}\nعدد الشكاوى: ${value}`
                        : `Department: ${label}\nComplaint Type: ${datasetLabel}\nCount: ${value}`;
                    
                    alert(message);
                }
            }
        }
    });
}

function updateAllContent() {
    const font = getFont();

    // Update page title
    const pageTitleElement = document.querySelector('title');
    if (pageTitleElement) {
        pageTitleElement.textContent = pageTitleElement.getAttribute(`data-${currentLang}`);
    }

    // Update Daily Communication Chart
    if (dailyCommunicationChart) {
        dailyCommunicationChart.data.labels = chartData.labels[currentLang];
        dailyCommunicationChart.data.datasets.forEach((dataset, index) => {
            dataset.label = chartData.datasets[index].label[currentLang];
        });
        dailyCommunicationChart.options.plugins.tooltip.rtl = currentLang === 'ar';
        dailyCommunicationChart.options.plugins.tooltip.bodyFont.family = font;
        dailyCommunicationChart.options.plugins.tooltip.titleFont.family = font;
        if (dailyCommunicationChart.options.plugins && dailyCommunicationChart.options.plugins.datalabels && dailyCommunicationChart.options.plugins.datalabels.font) {
            dailyCommunicationChart.options.plugins.datalabels.font.family = font;
        }
        dailyCommunicationChart.options.scales.x.ticks.font.family = font;
        dailyCommunicationChart.options.scales.y.ticks.font.family = font;
        dailyCommunicationChart.update();
    }

    // Update Flatpickr locale
    if (dateFromPicker) {
        dateFromPicker.set('locale', currentLang === 'ar' ? 'ar' : 'default');
        dateFromPicker.set('enableRtl', currentLang === 'ar');
        document.getElementById('dateFrom').placeholder = currentLang === 'ar' ? 'اختر التاريخ' : 'Select Date';
        document.getElementById('dateFrom').setAttribute('data-ar', 'اختر التاريخ');
        document.getElementById('dateFrom').setAttribute('data-en', 'Select Date');
    }
    if (dateToPicker) {
        dateToPicker.set('locale', currentLang === 'ar' ? 'ar' : 'default');
        dateToPicker.set('enableRtl', currentLang === 'ar');
        document.getElementById('dateTo').placeholder = currentLang === 'ar' ? 'اختر التاريخ' : 'Select Date';
        document.getElementById('dateTo').setAttribute('data-ar', 'اختر التاريخ');
        document.getElementById('dateTo').setAttribute('data-en', 'Select Date');
    }
    
    // Update Legend language
    updateLegendLanguage();
}

// تحديث لغة الـ Legend
function updateLegendLanguage() {
    const legendItems = document.querySelectorAll('#legendContainer span[data-ar]');
    legendItems.forEach(item => {
        const text = item.getAttribute(`data-${currentLang}`);
        if (text) {
            item.textContent = text;
        }
    });
}

function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.body.classList.remove('lang-ar', 'lang-en');
    document.body.classList.add(lang === 'ar' ? 'lang-ar' : 'lang-en');

    document.querySelectorAll('[data-ar], [data-en]').forEach(el => {
        const textContent = el.getAttribute(`data-${lang}`);
        if (textContent) {
            el.textContent = textContent;
        }
    });

    // Update language toggle text
    const langTextSpan = document.getElementById('langText');
    if (langTextSpan) {
        langTextSpan.textContent = lang === 'ar' ? 'العربية | English' : 'English | العربية';
    }

    updateAllContent(); // Update all content including charts
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 بدء تحميل صفحة الشكاوى الحضورية...');
    
    const langToggleBtn = document.getElementById('langToggle');
    const exportReportBtn = document.getElementById('exportReportBtn');
    const applyFilterBtn = document.getElementById('applyFilterBtn');
    // لا يوجد رفع إكسل من هذه الصفحة بناءً على طلبك

    // Initialize Flatpickr
    dateFromPicker = flatpickr("#dateFrom", {
        dateFormat: "Y-m-d",
        locale: currentLang === 'ar' ? 'ar' : 'default',
        enableRtl: currentLang === 'ar',
        maxDate: 'today'
    });
    dateToPicker = flatpickr("#dateTo", {
        dateFormat: "Y-m-d",
        locale: currentLang === 'ar' ? 'ar' : 'default',
        enableRtl: currentLang === 'ar',
        maxDate: 'today'
    });

    // تحميل البيانات الأولية
    loadInPersonComplaintsData();

    // Now, call applyLanguage to set initial language and update all content
    applyLanguage(currentLang);

    // Set active sidebar link based on current page
    const sidebarLinks = document.querySelectorAll('.sidebar-menu .menu-link');
    sidebarLinks.forEach(link => {
        link.parentElement.classList.remove('active'); // Remove active from all
        // Check if the href matches the current page's intended active link
        if (link.getAttribute('href') === 'inperson-complaints.html') {
            link.parentElement.classList.add('active'); // Add active to the correct one
        }
    });

    // Apply Filter button functionality
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', () => {
            console.log('🔍 تطبيق الفلترة...');
            loadInPersonComplaintsData(); // إعادة تحميل البيانات مع الفلترة الجديدة
        });
    }

    // Functionality for Export Report button
    if (exportReportBtn) {
        exportReportBtn.addEventListener('click', () => {
            exportInPersonComplaintsReport();
        });
    }

    // Language toggle button event listener
    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', () => {
            const newLang = currentLang === 'ar' ? 'en' : 'ar';
            applyLanguage(newLang);
        });
    }
    
    // لا يوجد رفع إكسل من هذه الصفحة
    
    console.log('✅ تم تحميل صفحة الشكاوى الحضورية بنجاح');
});

// تصدير تقرير الشكاوى الحضورية
async function exportInPersonComplaintsReport() {
    try {
        console.log('📄 إنشاء PDF باستخدام jsPDF (عنوان وصفي كنُسخ صور لتفادي مشاكل الخطوط)...');
        if (!window.jspdf || !window.jspdf.jsPDF) {
            throw new Error('jsPDF غير محمل');
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape', 'pt', 'a4');

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 40;
        let cursorY = margin;

        // إنشاء صورة عنوان ونطاق التاريخ باستخدام Canvas للمتصفح (حل آمن للعربية)
        const dpr = 2;
        const titleCanvas = document.createElement('canvas');
        const titleWidth = pageWidth - margin * 2;
        const titleHeight = 90; // px
        titleCanvas.width = titleWidth * dpr;
        titleCanvas.height = titleHeight * dpr;
        const tctx = titleCanvas.getContext('2d');
        tctx.scale(dpr, dpr);
        tctx.fillStyle = '#000';
        tctx.textAlign = 'center';
        tctx.textBaseline = 'top';
        // العنوان
        const title = currentLang === 'ar' ? 'مؤشر الشكاوى الحضورية' : 'In-person Complaints Index';
        tctx.direction = currentLang === 'ar' ? 'rtl' : 'ltr';
        tctx.font = '700 20px Tajawal, Arial, sans-serif';
        tctx.fillText(title, titleWidth / 2, 8);
        // الفترة الزمنية
        const fromText = (dateFromPicker && dateFromPicker.selectedDates[0])
            ? dateFromPicker.selectedDates[0].toLocaleDateString('sv-SE')
            : (currentLang === 'ar' ? 'الكل' : 'All');
        const toText = (dateToPicker && dateToPicker.selectedDates[0])
            ? dateToPicker.selectedDates[0].toLocaleDateString('sv-SE')
            : (currentLang === 'ar' ? 'الكل' : 'All');
        const range = currentLang === 'ar' ? `الفترة: من ${fromText} إلى ${toText}` : `Range: From ${fromText} to ${toText}`;
        tctx.font = '400 13px Tajawal, Arial, sans-serif';
        tctx.fillText(range, titleWidth / 2, 40);
        const titleImg = titleCanvas.toDataURL('image/png', 1.0);
        doc.addImage(titleImg, 'PNG', margin, cursorY, titleWidth, titleHeight);
        cursorY += titleHeight + 6;

        // صورة الرسم
        const canvas = document.getElementById('dailyCommunicationChart');
        if (!canvas) throw new Error('لا يوجد رسم جاهز للتصدير');
        // انتظر استقرار الرسم إطارين
        await waitNextFrame();
        await waitNextFrame();
        const imgData = canvas.toDataURL('image/png', 1.0);
        const imgMaxWidth = pageWidth - margin * 2;
        const imgHeight = canvas.height * (imgMaxWidth / canvas.width);
        doc.addImage(imgData, 'PNG', margin, cursorY, imgMaxWidth, Math.min(imgHeight, pageHeight - cursorY - margin));

        // تذييل (كنسخة صورة لضمان العربية)
        const footerCanvas = document.createElement('canvas');
        const footerWidth = pageWidth - margin * 2;
        const footerHeight = 24;
        const fdpr = 2;
        footerCanvas.width = footerWidth * fdpr;
        footerCanvas.height = footerHeight * fdpr;
        const fctx = footerCanvas.getContext('2d');
        fctx.scale(fdpr, fdpr);
        fctx.fillStyle = '#000';
        fctx.textAlign = currentLang === 'ar' ? 'right' : 'left';
        fctx.textBaseline = 'bottom';
        fctx.direction = currentLang === 'ar' ? 'rtl' : 'ltr';
        fctx.font = '400 10px Tajawal, Arial, sans-serif';
        const footerBase = currentLang === 'ar' ? 'تاريخ التوليد: ' : 'Generated on: ';
        const footerText = `${footerBase}${new Date().toLocaleString()}`;
        const footerX = currentLang === 'ar' ? footerWidth : 0;
        fctx.fillText(footerText, footerX, footerHeight);
        const footerImg = footerCanvas.toDataURL('image/png', 1.0);
        doc.addImage(footerImg, 'PNG', margin, pageHeight - margin - footerHeight, footerWidth, footerHeight);

        const filename = `inperson-complaints-report-${new Date().toLocaleDateString('sv-SE')}.pdf`;
        doc.save(filename);
        showNotification(currentLang === 'ar' ? 'تم إنشاء ملف PDF بنجاح' : 'PDF created successfully', 'success');
    } catch (error) {
        console.error('💥 خطأ في تصدير التقرير:', error);
        showNotification('خطأ في تصدير التقرير: ' + error.message, 'error');
    }
}
