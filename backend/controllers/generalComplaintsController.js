const pool = require('../config/database');
const { logActivity } = require('./logsController');

// جلب إحصائيات الشكاوى العامة
const getGeneralComplaintsStats = async (req, res) => {
    try {
        const { dateFilter, status, department, complaintType, search } = req.query;
        
        console.log('📊 جلب إحصائيات الشكاوى العامة:', { dateFilter, status, department, complaintType, search });
        
        let whereClause = '';
        let params = [];
        
        // بناء شروط البحث
        const conditions = [];
        
        // معالجة dateFilter
        if (dateFilter && dateFilter !== 'all') {
            const days = parseInt(dateFilter);
            if (!isNaN(days)) {
                const fromDate = new Date();
                fromDate.setDate(fromDate.getDate() - days);
                const toDate = new Date();
                
                conditions.push('c.CreatedAt BETWEEN ? AND ?');
                params.push(fromDate.toISOString().split('T')[0], toDate.toISOString().split('T')[0]);
            }
        }
        
        if (status && status !== 'الحالة') {
            conditions.push('c.Status = ?');
            params.push(status);
        }
        
        if (department && department !== 'القسم') {
            conditions.push('d.DepartmentName = ?');
            params.push(department);
        }
        
        if (complaintType && complaintType !== 'نوع الشكوى') {
            conditions.push('cr.ReasonName = ?');
            params.push(complaintType);
        }
        
        if (search && search.trim() !== '') {
            conditions.push('(c.Title LIKE ? OR c.Description LIKE ? OR p.FullName LIKE ? OR p.NationalID LIKE ?)');
            const searchTerm = `%${search.trim()}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }
        
        if (conditions.length > 0) {
            whereClause = 'WHERE ' + conditions.join(' AND ');
        }
        
        // الاستعلام الرئيسي للإحصائيات
        const statsQuery = `
            SELECT 
                COUNT(*) as totalComplaints,
                SUM(CASE WHEN c.Status = 'open' THEN 1 ELSE 0 END) as newComplaints,
                SUM(CASE WHEN c.Status = 'in_progress' THEN 1 ELSE 0 END) as inProgressComplaints,
                SUM(CASE WHEN c.Status = 'responded' THEN 1 ELSE 0 END) as respondedComplaints,
                SUM(CASE WHEN c.Status = 'closed' THEN 1 ELSE 0 END) as closedComplaints,
                SUM(CASE WHEN c.Priority = 'urgent' THEN 1 ELSE 0 END) as urgentComplaints,
                SUM(CASE WHEN c.Priority = 'high' THEN 1 ELSE 0 END) as highPriorityComplaints,
                SUM(CASE WHEN c.Source = 'in_person' THEN 1 ELSE 0 END) as inPersonComplaints,
                SUM(CASE WHEN c.Source = 'call_center' THEN 1 ELSE 0 END) as callCenterComplaints
            FROM complaints c
            LEFT JOIN departments d ON c.DepartmentID = d.DepartmentID
            LEFT JOIN complaint_subtypes st ON c.SubtypeID = st.SubtypeID
            LEFT JOIN complaint_reasons cr ON st.ReasonID = cr.ReasonID
            LEFT JOIN patients p ON c.PatientID = p.PatientID
            ${whereClause}
        `;
        
        const [statsResult] = await pool.execute(statsQuery, params);
        const stats = statsResult[0];
        
        // إحصائيات حسب القسم
        const departmentStatsQuery = `
            SELECT 
                d.DepartmentName,
                COUNT(c.ComplaintID) as count,
                SUM(CASE WHEN c.Status = 'closed' THEN 1 ELSE 0 END) as closed
            FROM departments d
            LEFT JOIN complaints c ON d.DepartmentID = c.DepartmentID
            ${whereClause.replace(/^WHERE/, whereClause ? 'AND' : 'WHERE')}
            GROUP BY d.DepartmentID, d.DepartmentName
            HAVING count > 0
            ORDER BY count DESC
            LIMIT 10
        `;
        
        const [departmentStats] = await pool.execute(departmentStatsQuery, params);
        
        // إحصائيات حسب نوع الشكوى
        const typeStatsQuery = `
            SELECT 
                COALESCE(cr.ReasonName, 'غير محدد') as type,
                COUNT(c.ComplaintID) as count
            FROM complaints c
            LEFT JOIN departments d ON c.DepartmentID = d.DepartmentID
            LEFT JOIN complaint_subtypes st ON c.SubtypeID = st.SubtypeID
            LEFT JOIN complaint_reasons cr ON st.ReasonID = cr.ReasonID
            LEFT JOIN patients p ON c.PatientID = p.PatientID
            ${whereClause}
            GROUP BY cr.ReasonName
            ORDER BY count DESC
            LIMIT 10
        `;
        
        const [typeStats] = await pool.execute(typeStatsQuery, params);
        
        // إحصائيات شهرية (آخر 6 أشهر)
        const monthlyStatsQuery = `
            SELECT 
                DATE_FORMAT(c.CreatedAt, '%Y-%m') as month,
                COUNT(*) as count,
                SUM(CASE WHEN c.Status = 'closed' THEN 1 ELSE 0 END) as closed
            FROM complaints c
            LEFT JOIN departments d ON c.DepartmentID = d.DepartmentID
            LEFT JOIN complaint_subtypes st ON c.SubtypeID = st.SubtypeID
            LEFT JOIN complaint_reasons cr ON st.ReasonID = cr.ReasonID
            LEFT JOIN patients p ON c.PatientID = p.PatientID
            WHERE c.CreatedAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            ${whereClause ? 'AND ' + whereClause.substring(6) : ''}
            GROUP BY DATE_FORMAT(c.CreatedAt, '%Y-%m')
            ORDER BY month DESC
        `;
        
        const [monthlyStats] = await pool.execute(monthlyStatsQuery, params);
        
        console.log('✅ تم جلب إحصائيات الشكاوى العامة بنجاح');
        
        res.json({
            success: true,
            data: {
                overview: stats,
                departmentBreakdown: departmentStats,
                typeBreakdown: typeStats,
                monthlyTrend: monthlyStats
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب إحصائيات الشكاوى العامة:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// جلب بيانات الشكاوى للتصدير
const getGeneralComplaintsForExport = async (req, res) => {
    try {
        const { fromDate, toDate, status, department, complaintType, format } = req.query;
        
        console.log('📤 تصدير بيانات الشكاوى العامة:', { fromDate, toDate, status, department, complaintType, format });
        
        let whereClause = '';
        let params = [];
        const conditions = [];
        
        // فلترة التواريخ
        if (fromDate && toDate) {
            conditions.push('DATE(c.CreatedAt) BETWEEN ? AND ?');
            params.push(fromDate, toDate);
        }
        
        if (status && status !== 'all') {
            conditions.push('c.Status = ?');
            params.push(status);
        }
        
        if (department && department !== 'all') {
            conditions.push('d.DepartmentName = ?');
            params.push(department);
        }
        
        if (complaintType && complaintType !== 'all') {
            conditions.push('cr.ReasonName = ?');
            params.push(complaintType);
        }
        
        if (conditions.length > 0) {
            whereClause = 'WHERE ' + conditions.join(' AND ');
        }
        
        const exportQuery = `
            SELECT 
                c.ComplaintNumber as 'رقم الشكوى',
                c.Title as 'العنوان',
                c.Description as 'الوصف',
                CASE 
                    WHEN c.Status = 'open' THEN 'مفتوحة'
                    WHEN c.Status = 'in_progress' THEN 'قيد المعالجة'
                    WHEN c.Status = 'responded' THEN 'تم الرد'
                    WHEN c.Status = 'closed' THEN 'مغلقة'
                    ELSE c.Status
                END as 'الحالة',
                CASE 
                    WHEN c.Priority = 'low' THEN 'منخفضة'
                    WHEN c.Priority = 'normal' THEN 'عادية'
                    WHEN c.Priority = 'high' THEN 'عالية'
                    WHEN c.Priority = 'urgent' THEN 'عاجلة'
                    ELSE c.Priority
                END as 'الأولوية',
                CASE 
                    WHEN c.Source = 'in_person' THEN 'شخصياً'
                    WHEN c.Source = 'call_center' THEN 'مركز الاتصال'
                    ELSE c.Source
                END as 'المصدر',
                d.DepartmentName as 'القسم',
                cr.ReasonName as 'نوع الشكوى',
                st.SubtypeName as 'النوع الفرعي',
                p.FullName as 'اسم المريض',
                p.NationalID as 'الهوية الوطنية',
                p.Phone as 'رقم الهاتف',
                creator.FullName as 'منشئ الشكوى',
                assignee.FullName as 'المكلف بالمعالجة',
                DATE_FORMAT(c.CreatedAt, '%Y-%m-%d %H:%i:%s') as 'تاريخ الإنشاء',
                DATE_FORMAT(c.UpdatedAt, '%Y-%m-%d %H:%i:%s') as 'تاريخ التحديث',
                DATE_FORMAT(c.ClosedAt, '%Y-%m-%d %H:%i:%s') as 'تاريخ الإغلاق',
                CASE 
                    WHEN c.ClosedAt IS NOT NULL THEN 
                        CONCAT(TIMESTAMPDIFF(DAY, c.CreatedAt, c.ClosedAt), ' يوم')
                    ELSE 'لم تُغلق بعد'
                END as 'مدة المعالجة'
            FROM complaints c
            LEFT JOIN departments d ON c.DepartmentID = d.DepartmentID
            LEFT JOIN complaint_subtypes st ON c.SubtypeID = st.SubtypeID
            LEFT JOIN complaint_reasons cr ON st.ReasonID = cr.ReasonID
            LEFT JOIN patients p ON c.PatientID = p.PatientID
            LEFT JOIN users creator ON c.CreatedBy = creator.UserID
            LEFT JOIN (
                SELECT ca.ComplaintID, ca.AssignedToUserID,
                       ROW_NUMBER() OVER (PARTITION BY ca.ComplaintID ORDER BY ca.CreatedAt DESC) as rn
                FROM complaint_assignments ca
            ) latest_assignment ON c.ComplaintID = latest_assignment.ComplaintID AND latest_assignment.rn = 1
            LEFT JOIN users assignee ON latest_assignment.AssignedToUserID = assignee.UserID
            ${whereClause}
            ORDER BY c.CreatedAt DESC
            LIMIT 10000
        `;
        
        const [exportData] = await pool.execute(exportQuery, params);
        
        // تسجيل عملية التصدير
        const userID = req.user?.UserID || req.user?.EmployeeID;
        if (userID) {
            await logActivity(userID, null, 'COMPLAINTS_EXPORTED', {
                recordCount: exportData.length,
                filters: { fromDate, toDate, status, department, complaintType },
                format: format || 'json'
            });
        }
        
        console.log(`✅ تم تصدير ${exportData.length} شكوى`);
        
        res.json({
            success: true,
            data: exportData,
            totalRecords: exportData.length,
            exportedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ خطأ في تصدير بيانات الشكاوى:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// جلب تفاصيل شكوى محددة
const getComplaintDetails = async (req, res) => {
    try {
        const { complaintId } = req.params;
        
        console.log('🔍 جلب تفاصيل الشكوى:', complaintId);
        
        // جلب تفاصيل الشكوى الأساسية
        const [complaints] = await pool.execute(`
            SELECT 
                c.*,
                d.DepartmentName,
                cr.ReasonName,
                st.SubtypeName,
                p.FullName as PatientFullName,
                p.NationalID as PatientNationalID,
                p.Phone as PatientPhone,
                p.Email as PatientEmail,
                p.Gender as PatientGender,
                p.DateOfBirth as PatientDateOfBirth,
                creator.FullName as CreatedByName,
                creator.Email as CreatedByEmail
            FROM complaints c
            LEFT JOIN departments d ON c.DepartmentID = d.DepartmentID
            LEFT JOIN complaint_subtypes st ON c.SubtypeID = st.SubtypeID
            LEFT JOIN complaint_reasons cr ON st.ReasonID = cr.ReasonID
            LEFT JOIN patients p ON c.PatientID = p.PatientID
            LEFT JOIN users creator ON c.CreatedBy = creator.UserID
            WHERE c.ComplaintID = ?
        `, [complaintId]);
        
        if (complaints.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الشكوى غير موجودة'
            });
        }
        
        const complaint = complaints[0];
        
        // جلب المرفقات
        const [attachments] = await pool.execute(`
            SELECT AttachmentID, FileURL, FileName, MimeType, SizeBytes, CreatedAt
            FROM complaint_attachments 
            WHERE ComplaintID = ?
            ORDER BY CreatedAt ASC
        `, [complaintId]);
        
        // جلب الردود
        const [replies] = await pool.execute(`
            SELECT 
                cr.ReplyID,
                cr.Body,
                cr.AttachmentURL,
                cr.CreatedAt,
                u.FullName as AuthorName,
                u.Email as AuthorEmail
            FROM complaint_replies cr
            LEFT JOIN users u ON cr.AuthorUserID = u.UserID
            WHERE cr.ComplaintID = ?
            ORDER BY cr.CreatedAt ASC
        `, [complaintId]);
        
        // جلب تاريخ التغييرات
        const [history] = await pool.execute(`
            SELECT 
                ch.HistoryID,
                ch.PrevStatus,
                ch.NewStatus,
                ch.FieldChanged,
                ch.OldValue,
                ch.NewValue,
                ch.CreatedAt,
                u.FullName as ActorName
            FROM complaint_history ch
            LEFT JOIN users u ON ch.ActorUserID = u.UserID
            WHERE ch.ComplaintID = ?
            ORDER BY ch.CreatedAt DESC
        `, [complaintId]);
        
        // جلب التكليفات
        const [assignments] = await pool.execute(`
            SELECT 
                ca.AssignmentID,
                ca.Notes,
                ca.CreatedAt,
                assigned_to.FullName as AssignedToName,
                assigned_to.Email as AssignedToEmail,
                assigned_by.FullName as AssignedByName
            FROM complaint_assignments ca
            LEFT JOIN users assigned_to ON ca.AssignedToUserID = assigned_to.UserID
            LEFT JOIN users assigned_by ON ca.AssignedByUserID = assigned_by.UserID
            WHERE ca.ComplaintID = ?
            ORDER BY ca.CreatedAt DESC
        `, [complaintId]);
        
        console.log('✅ تم جلب تفاصيل الشكوى بنجاح');
        
        res.json({
            success: true,
            data: {
                complaint,
                attachments,
                replies,
                history,
                assignments
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب تفاصيل الشكوى:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// جلب قوائم الفلاتر (الأقسام، أنواع الشكاوى، إلخ)
const getFilterOptions = async (req, res) => {
    try {
        console.log('📋 جلب خيارات الفلاتر');
        
        // جلب الأقسام
        const [departments] = await pool.execute(`
            SELECT DISTINCT d.DepartmentID, d.DepartmentName
            FROM departments d
            INNER JOIN complaints c ON d.DepartmentID = c.DepartmentID
            ORDER BY d.DepartmentName
        `);
        
        // جلب أنواع الشكاوى
        const [complaintTypes] = await pool.execute(`
            SELECT DISTINCT cr.ReasonID, cr.ReasonName
            FROM complaint_reasons cr
            INNER JOIN complaint_subtypes st ON cr.ReasonID = st.ReasonID
            INNER JOIN complaints c ON st.SubtypeID = c.SubtypeID
            ORDER BY cr.ReasonName
        `);
        
        // جلب حالات الشكاوى المستخدمة
        const [statuses] = await pool.execute(`
            SELECT DISTINCT Status
            FROM complaints
            ORDER BY Status
        `);
        
        const statusOptions = statuses.map(s => ({
            value: s.Status,
            label: {
                'open': 'مفتوحة',
                'in_progress': 'قيد المعالجة', 
                'responded': 'تم الرد',
                'closed': 'مغلقة'
            }[s.Status] || s.Status
        }));
        
        console.log('✅ تم جلب خيارات الفلاتر بنجاح');
        
        res.json({
            success: true,
            data: {
                departments,
                complaintTypes,
                statuses: statusOptions
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب خيارات الفلاتر:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

module.exports = {
    getGeneralComplaintsStats,
    getGeneralComplaintsForExport,
    getComplaintDetails,
    getFilterOptions
};