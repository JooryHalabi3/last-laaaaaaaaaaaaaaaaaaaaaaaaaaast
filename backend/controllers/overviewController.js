const pool = require('../config/database');
const { logActivity } = require('./logsController');

// جلب إحصائيات النظرة العامة
const getOverviewStats = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        
        console.log('📊 جلب إحصائيات النظرة العامة:', { fromDate, toDate });
        console.log('🔍 الطلب وصل إلى الباك إند بنجاح');
        
        // التحقق من صحة التواريخ
        if (fromDate && toDate) {
            const fromDateObj = new Date(fromDate);
            const toDateObj = new Date(toDate);
            
            if (isNaN(fromDateObj.getTime()) || isNaN(toDateObj.getTime())) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'تواريخ غير صحيحة' 
                });
            }
            
            if (fromDateObj > toDateObj) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية' 
                });
            }
        }
        
        let whereClause = '';
        let params = [];
        
        if (fromDate && toDate) {
            whereClause = 'WHERE DATE(c.CreatedAt) BETWEEN ? AND ?';
            params = [fromDate, toDate];
        }
        
        // الإحصائيات العامة
        const [generalStats] = await pool.execute(`
            SELECT 
                COUNT(*) as totalComplaints,
                SUM(CASE WHEN c.Status = 'open' THEN 1 ELSE 0 END) as newComplaints,
                SUM(CASE WHEN c.Status = 'in_progress' THEN 1 ELSE 0 END) as inProgressComplaints,
                SUM(CASE WHEN c.Status = 'responded' THEN 1 ELSE 0 END) as respondedComplaints,
                SUM(CASE WHEN c.Status = 'closed' THEN 1 ELSE 0 END) as closedComplaints,
                SUM(CASE WHEN c.Priority = 'urgent' THEN 1 ELSE 0 END) as urgentComplaints,
                SUM(CASE WHEN c.Priority = 'high' THEN 1 ELSE 0 END) as highPriorityComplaints,
                SUM(CASE WHEN c.Source = 'in_person' THEN 1 ELSE 0 END) as inPersonComplaints,
                SUM(CASE WHEN c.Source = 'call_center' THEN 1 ELSE 0 END) as callCenterComplaints,
                AVG(CASE WHEN c.Status = 'closed' AND c.ClosedAt IS NOT NULL 
                    THEN TIMESTAMPDIFF(HOUR, c.CreatedAt, c.ClosedAt) 
                    ELSE NULL END) as avgResolutionTimeHours
            FROM complaints c
            ${whereClause}
        `, params);
        
        // الشكاوى المتكررة (نفس المريض، نفس النوع الفرعي)
        const [repeatedStats] = await pool.execute(`
            SELECT COUNT(*) as repeatedCount
            FROM (
                SELECT p.NationalID, c.SubtypeID, COUNT(*) as complaintCount
                FROM complaints c
                LEFT JOIN patients p ON c.PatientID = p.PatientID
                ${whereClause}
                GROUP BY p.NationalID, c.SubtypeID
                HAVING COUNT(*) > 1 AND p.NationalID IS NOT NULL
            ) repeated
        `, params);
        
        // إحصائيات حسب القسم
        const [departmentStats] = await pool.execute(`
            SELECT 
                d.DepartmentName,
                COUNT(c.ComplaintID) as complaintCount,
                SUM(CASE WHEN c.Status = 'closed' THEN 1 ELSE 0 END) as closedCount,
                SUM(CASE WHEN c.Priority = 'urgent' THEN 1 ELSE 0 END) as urgentCount,
                AVG(CASE WHEN c.Status = 'closed' AND c.ClosedAt IS NOT NULL 
                    THEN TIMESTAMPDIFF(HOUR, c.CreatedAt, c.ClosedAt) 
                    ELSE NULL END) as avgResolutionHours
            FROM complaints c
            LEFT JOIN departments d ON c.DepartmentID = d.DepartmentID
            ${whereClause}
            GROUP BY d.DepartmentID, d.DepartmentName
            HAVING complaintCount > 0
            ORDER BY complaintCount DESC
        `, params);
        
        // إحصائيات حسب نوع الشكوى
        const [typeStats] = await pool.execute(`
            SELECT 
                COALESCE(cr.ReasonName, 'غير محدد') as TypeName,
                COUNT(c.ComplaintID) as complaintCount,
                SUM(CASE WHEN c.Status = 'closed' THEN 1 ELSE 0 END) as closedCount
            FROM complaints c
            LEFT JOIN complaint_subtypes st ON c.SubtypeID = st.SubtypeID
            LEFT JOIN complaint_reasons cr ON st.ReasonID = cr.ReasonID
            ${whereClause}
            GROUP BY cr.ReasonID, cr.ReasonName
            HAVING complaintCount > 0
            ORDER BY complaintCount DESC
            LIMIT 10
        `, params);
        
        // أكثر الشكاوى تكراراً حسب النوع
        const [topComplaints] = await pool.execute(`
            SELECT 
                COALESCE(cr.ReasonName, 'غير محدد') as complaintType,
                COUNT(*) as count
            FROM complaints c
            LEFT JOIN complaint_subtypes st ON c.SubtypeID = st.SubtypeID
            LEFT JOIN complaint_reasons cr ON st.ReasonID = cr.ReasonID
            ${whereClause}
            GROUP BY cr.ReasonID, cr.ReasonName
            ORDER BY count DESC
            LIMIT 5
        `, params);
        
        // الشكاوى الحساسة (عالية الأولوية أو غير مغلقة)
        let sensitiveWhereClause = whereClause;
        let sensitiveParams = [...params];
        
        if (sensitiveWhereClause) {
            sensitiveWhereClause += ' AND (c.Priority IN (?, ?) OR c.Status != ?)';
            sensitiveParams.push('urgent', 'high', 'closed');
        } else {
            sensitiveWhereClause = 'WHERE (c.Priority IN (?, ?) OR c.Status != ?)';
            sensitiveParams = ['urgent', 'high', 'closed'];
        }
        
        const [sensitiveComplaints] = await pool.execute(`
            SELECT 
                c.ComplaintID,
                c.ComplaintNumber,
                c.Title,
                c.Status,
                c.Priority,
                c.CreatedAt,
                d.DepartmentName,
                COALESCE(cr.ReasonName, 'غير محدد') as ComplaintType,
                p.FullName as PatientName
            FROM complaints c
            LEFT JOIN departments d ON c.DepartmentID = d.DepartmentID
            LEFT JOIN complaint_subtypes st ON c.SubtypeID = st.SubtypeID
            LEFT JOIN complaint_reasons cr ON st.ReasonID = cr.ReasonID
            LEFT JOIN patients p ON c.PatientID = p.PatientID
            ${sensitiveWhereClause}
            ORDER BY 
                CASE c.Priority 
                    WHEN 'urgent' THEN 1 
                    WHEN 'high' THEN 2 
                    ELSE 3 
                END,
                c.CreatedAt DESC
            LIMIT 10
        `, sensitiveParams);
        
        // إحصائيات الأداء
        const [performanceStats] = await pool.execute(`
            SELECT 
                COUNT(CASE WHEN c.Status = 'closed' AND c.ClosedAt IS NOT NULL 
                      AND TIMESTAMPDIFF(HOUR, c.CreatedAt, c.ClosedAt) <= 24 THEN 1 END) as resolvedWithin24Hours,
                COUNT(CASE WHEN c.Status = 'closed' AND c.ClosedAt IS NOT NULL 
                      AND TIMESTAMPDIFF(HOUR, c.CreatedAt, c.ClosedAt) <= 72 THEN 1 END) as resolvedWithin72Hours,
                COUNT(CASE WHEN c.Status = 'closed' AND c.ClosedAt IS NOT NULL 
                      AND TIMESTAMPDIFF(HOUR, c.CreatedAt, c.ClosedAt) > 72 THEN 1 END) as resolvedAfter72Hours,
                ROUND(AVG(CASE WHEN c.Status = 'closed' AND c.ClosedAt IS NOT NULL 
                    THEN TIMESTAMPDIFF(HOUR, c.CreatedAt, c.ClosedAt) 
                    ELSE NULL END), 2) as avgResolutionHours
            FROM complaints c
            ${whereClause}
        `, params);
        
        // الاتجاه الشهري
        const [monthlyTrend] = await pool.execute(`
            SELECT 
                DATE_FORMAT(c.CreatedAt, '%Y-%m') as month,
                COUNT(*) as total,
                SUM(CASE WHEN c.Status = 'closed' THEN 1 ELSE 0 END) as closed,
                SUM(CASE WHEN c.Priority = 'urgent' THEN 1 ELSE 0 END) as urgent
            FROM complaints c
            WHERE c.CreatedAt >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            ${fromDate && toDate ? 'AND DATE(c.CreatedAt) BETWEEN ? AND ?' : ''}
            GROUP BY DATE_FORMAT(c.CreatedAt, '%Y-%m')
            ORDER BY month DESC
            LIMIT 12
        `, params);
        
        console.log('✅ تم جلب إحصائيات النظرة العامة بنجاح');
        
        res.json({
            success: true,
            data: {
                overview: generalStats[0],
                repeated: repeatedStats[0],
                departmentBreakdown: departmentStats,
                typeBreakdown: typeStats,
                topComplaints: topComplaints,
                sensitiveComplaints: sensitiveComplaints,
                performance: performanceStats[0],
                monthlyTrend: monthlyTrend
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب إحصائيات النظرة العامة:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// تصدير بيانات النظرة العامة
const exportOverviewData = async (req, res) => {
    try {
        const { fromDate, toDate, format = 'json' } = req.query;
        const userID = req.user?.UserID || req.user?.EmployeeID;
        
        console.log('📤 تصدير بيانات النظرة العامة:', { fromDate, toDate, format });
        
        let whereClause = '';
        let params = [];
        
        if (fromDate && toDate) {
            whereClause = 'WHERE DATE(c.CreatedAt) BETWEEN ? AND ?';
            params = [fromDate, toDate];
        }
        
        // استعلام شامل للتصدير
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
                COALESCE(cr.ReasonName, 'غير محدد') as 'نوع الشكوى',
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
                        CONCAT(TIMESTAMPDIFF(HOUR, c.CreatedAt, c.ClosedAt), ' ساعة')
                    ELSE 'لم تُغلق بعد'
                END as 'مدة المعالجة',
                (SELECT COUNT(*) FROM complaint_replies WHERE ComplaintID = c.ComplaintID) as 'عدد الردود',
                (SELECT COUNT(*) FROM complaint_attachments WHERE ComplaintID = c.ComplaintID) as 'عدد المرفقات'
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
            LIMIT 5000
        `;
        
        const [exportData] = await pool.execute(exportQuery, params);
        
        // تسجيل عملية التصدير
        if (userID) {
            await logActivity(userID, null, 'OVERVIEW_DATA_EXPORTED', {
                recordCount: exportData.length,
                filters: { fromDate, toDate },
                format
            });
        }
        
        console.log(`✅ تم تصدير ${exportData.length} سجل من النظرة العامة`);
        
        res.json({
            success: true,
            data: exportData,
            totalRecords: exportData.length,
            exportedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ خطأ في تصدير بيانات النظرة العامة:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// جلب إحصائيات الأداء المفصلة
const getPerformanceStats = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        
        let whereClause = '';
        let params = [];
        
        if (fromDate && toDate) {
            whereClause = 'WHERE DATE(c.CreatedAt) BETWEEN ? AND ?';
            params = [fromDate, toDate];
        }
        
        // إحصائيات الأداء العامة
        const [performanceStats] = await pool.execute(`
            SELECT 
                COUNT(*) as totalComplaints,
                COUNT(CASE WHEN c.Status = 'closed' THEN 1 END) as resolvedComplaints,
                ROUND((COUNT(CASE WHEN c.Status = 'closed' THEN 1 END) * 100.0 / COUNT(*)), 2) as resolutionRate,
                AVG(CASE WHEN c.Status = 'closed' AND c.ClosedAt IS NOT NULL 
                    THEN TIMESTAMPDIFF(HOUR, c.CreatedAt, c.ClosedAt) 
                    ELSE NULL END) as avgResolutionHours,
                MIN(CASE WHEN c.Status = 'closed' AND c.ClosedAt IS NOT NULL 
                    THEN TIMESTAMPDIFF(HOUR, c.CreatedAt, c.ClosedAt) 
                    ELSE NULL END) as minResolutionHours,
                MAX(CASE WHEN c.Status = 'closed' AND c.ClosedAt IS NOT NULL 
                    THEN TIMESTAMPDIFF(HOUR, c.CreatedAt, c.ClosedAt) 
                    ELSE NULL END) as maxResolutionHours,
                COUNT(CASE WHEN c.Status = 'closed' AND c.ClosedAt IS NOT NULL 
                      AND TIMESTAMPDIFF(HOUR, c.CreatedAt, c.ClosedAt) <= 24 THEN 1 END) as resolvedWithin24Hours,
                COUNT(CASE WHEN c.Status = 'closed' AND c.ClosedAt IS NOT NULL 
                      AND TIMESTAMPDIFF(HOUR, c.CreatedAt, c.ClosedAt) <= 72 THEN 1 END) as resolvedWithin72Hours
            FROM complaints c
            ${whereClause}
        `, params);
        
        // إحصائيات الأداء حسب القسم
        const [departmentPerformance] = await pool.execute(`
            SELECT 
                d.DepartmentName,
                COUNT(*) as totalComplaints,
                COUNT(CASE WHEN c.Status = 'closed' THEN 1 END) as resolvedComplaints,
                ROUND((COUNT(CASE WHEN c.Status = 'closed' THEN 1 END) * 100.0 / COUNT(*)), 2) as resolutionRate,
                AVG(CASE WHEN c.Status = 'closed' AND c.ClosedAt IS NOT NULL 
                    THEN TIMESTAMPDIFF(HOUR, c.CreatedAt, c.ClosedAt) 
                    ELSE NULL END) as avgResolutionHours
            FROM complaints c
            LEFT JOIN departments d ON c.DepartmentID = d.DepartmentID
            ${whereClause}
            GROUP BY d.DepartmentID, d.DepartmentName
            HAVING totalComplaints > 0
            ORDER BY resolutionRate DESC
        `, params);
        
        // اتجاه الأداء الشهري
        const [monthlyPerformance] = await pool.execute(`
            SELECT 
                DATE_FORMAT(c.CreatedAt, '%Y-%m') as month,
                COUNT(*) as total,
                COUNT(CASE WHEN c.Status = 'closed' THEN 1 END) as resolved,
                ROUND((COUNT(CASE WHEN c.Status = 'closed' THEN 1 END) * 100.0 / COUNT(*)), 2) as resolutionRate,
                AVG(CASE WHEN c.Status = 'closed' AND c.ClosedAt IS NOT NULL 
                    THEN TIMESTAMPDIFF(HOUR, c.CreatedAt, c.ClosedAt) 
                    ELSE NULL END) as avgResolutionHours
            FROM complaints c
            WHERE c.CreatedAt >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            ${fromDate && toDate ? 'AND DATE(c.CreatedAt) BETWEEN ? AND ?' : ''}
            GROUP BY DATE_FORMAT(c.CreatedAt, '%Y-%m')
            ORDER BY month DESC
            LIMIT 12
        `, params);
        
        res.json({
            success: true,
            data: {
                overall: performanceStats[0],
                byDepartment: departmentPerformance,
                monthlyTrend: monthlyPerformance
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب إحصائيات الأداء:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// جلب أحدث الأنشطة
const getRecentActivities = async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        
        const [activities] = await pool.execute(`
            SELECT 
                al.LogID,
                al.Action,
                al.Details,
                al.CreatedAt,
                u.FullName as ActorName,
                u.Email as ActorEmail
            FROM activitylogs al
            LEFT JOIN users u ON al.ActorUserID = u.UserID
            ORDER BY al.CreatedAt DESC
            LIMIT ?
        `, [parseInt(limit)]);
        
        const processedActivities = activities.map(activity => ({
            ...activity,
            Details: typeof activity.Details === 'string' ? JSON.parse(activity.Details) : activity.Details
        }));
        
        res.json({
            success: true,
            data: processedActivities
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب الأنشطة الحديثة:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

module.exports = {
    getOverviewStats,
    exportOverviewData,
    getPerformanceStats,
    getRecentActivities
};