const pool = require('../config/database');
const { logActivity } = require('./logsController');

// جلب إحصائيات الطلبات العامة من الشكاوى الفعلية
const getGeneralRequestStats = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        
        console.log('📊 جلب إحصائيات الطلبات العامة من قاعدة البيانات:', { fromDate, toDate });
        
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
        
        // بناء شروط التاريخ
        let dateCondition = '';
        let params = [];
        
        if (fromDate && toDate) {
            dateCondition = 'AND DATE(c.CreatedAt) BETWEEN ? AND ?';
            params.push(fromDate, toDate);
        }
        
        // الإحصائيات العامة
        const [generalStats] = await pool.execute(`
            SELECT 
                COUNT(*) as totalRequests,
                SUM(CASE WHEN c.Status = 'open' THEN 1 ELSE 0 END) as pendingRequests,
                SUM(CASE WHEN c.Status = 'closed' THEN 1 ELSE 0 END) as fulfilledRequests,
                SUM(CASE WHEN c.Status = 'in_progress' THEN 1 ELSE 0 END) as inProgressRequests,
                SUM(CASE WHEN c.Priority = 'urgent' THEN 1 ELSE 0 END) as urgentRequests,
                AVG(CASE WHEN c.Status = 'closed' AND c.ClosedAt IS NOT NULL 
                    THEN TIMESTAMPDIFF(HOUR, c.CreatedAt, c.ClosedAt) 
                    ELSE NULL END) as avgFulfillmentTimeHours
            FROM complaints c
            WHERE 1=1 ${dateCondition}
        `, params);
        
        // إحصائيات حسب القسم
        const [departmentStats] = await pool.execute(`
            SELECT 
                d.DepartmentName,
                COUNT(c.ComplaintID) as requestCount,
                SUM(CASE WHEN c.Status = 'closed' THEN 1 ELSE 0 END) as fulfilledCount,
                ROUND(AVG(CASE WHEN c.Status = 'closed' AND c.ClosedAt IS NOT NULL 
                    THEN TIMESTAMPDIFF(HOUR, c.CreatedAt, c.ClosedAt) 
                    ELSE NULL END), 2) as avgHours
            FROM complaints c
            LEFT JOIN departments d ON c.DepartmentID = d.DepartmentID
            WHERE 1=1 ${dateCondition}
            GROUP BY d.DepartmentID, d.DepartmentName
            HAVING requestCount > 0
            ORDER BY requestCount DESC
            LIMIT 10
        `, params);
        
        // إحصائيات حسب نوع الطلب (استخدام أسباب الشكاوى كأنواع طلبات)
        const [typeStats] = await pool.execute(`
            SELECT 
                COALESCE(cr.ReasonName, 'غير محدد') as requestType,
                COUNT(c.ComplaintID) as count,
                SUM(CASE WHEN c.Status = 'closed' THEN 1 ELSE 0 END) as fulfilled
            FROM complaints c
            LEFT JOIN complaint_subtypes st ON c.SubtypeID = st.SubtypeID
            LEFT JOIN complaint_reasons cr ON st.ReasonID = cr.ReasonID
            WHERE 1=1 ${dateCondition}
            GROUP BY cr.ReasonName
            ORDER BY count DESC
            LIMIT 10
        `, params);
        
        // إحصائيات شهرية
        const [monthlyStats] = await pool.execute(`
            SELECT 
                DATE_FORMAT(c.CreatedAt, '%Y-%m') as month,
                COUNT(*) as total,
                SUM(CASE WHEN c.Status = 'closed' THEN 1 ELSE 0 END) as fulfilled,
                SUM(CASE WHEN c.Status = 'open' THEN 1 ELSE 0 END) as pending
            FROM complaints c
            WHERE c.CreatedAt >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            ${dateCondition}
            GROUP BY DATE_FORMAT(c.CreatedAt, '%Y-%m')
            ORDER BY month DESC
            LIMIT 12
        `, params);
        
        // إحصائيات الأداء
        const [performanceStats] = await pool.execute(`
            SELECT 
                COUNT(CASE WHEN c.Status = 'closed' AND c.ClosedAt IS NOT NULL 
                      AND TIMESTAMPDIFF(HOUR, c.CreatedAt, c.ClosedAt) <= 24 THEN 1 END) as within24Hours,
                COUNT(CASE WHEN c.Status = 'closed' AND c.ClosedAt IS NOT NULL 
                      AND TIMESTAMPDIFF(HOUR, c.CreatedAt, c.ClosedAt) <= 72 THEN 1 END) as within72Hours,
                COUNT(CASE WHEN c.Status = 'closed' AND c.ClosedAt IS NOT NULL 
                      AND TIMESTAMPDIFF(HOUR, c.CreatedAt, c.ClosedAt) > 72 THEN 1 END) as moreThan72Hours
            FROM complaints c
            WHERE c.Status = 'closed' AND c.ClosedAt IS NOT NULL ${dateCondition}
        `, params);
        
        console.log('✅ تم جلب إحصائيات الطلبات العامة بنجاح');
        
        res.json({
            success: true,
            data: {
                overview: generalStats[0],
                departmentBreakdown: departmentStats,
                typeBreakdown: typeStats,
                monthlyTrend: monthlyStats,
                performance: performanceStats[0]
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب إحصائيات الطلبات العامة:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// تصدير بيانات الطلبات العامة
const exportGeneralRequestData = async (req, res) => {
    try {
        const { fromDate, toDate, status, department, format } = req.query;
        
        console.log('📤 تصدير بيانات الطلبات العامة:', { fromDate, toDate, status, department, format });
        
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
        
        if (conditions.length > 0) {
            whereClause = 'WHERE ' + conditions.join(' AND ');
        }
        
        const exportQuery = `
            SELECT 
                c.ComplaintNumber as 'رقم الطلب',
                c.Title as 'عنوان الطلب',
                c.Description as 'تفاصيل الطلب',
                CASE 
                    WHEN c.Status = 'open' THEN 'معلق'
                    WHEN c.Status = 'in_progress' THEN 'قيد التنفيذ'
                    WHEN c.Status = 'closed' THEN 'مكتمل'
                    ELSE c.Status
                END as 'حالة الطلب',
                CASE 
                    WHEN c.Priority = 'low' THEN 'منخفضة'
                    WHEN c.Priority = 'normal' THEN 'عادية'
                    WHEN c.Priority = 'high' THEN 'عالية'
                    WHEN c.Priority = 'urgent' THEN 'عاجلة'
                    ELSE c.Priority
                END as 'الأولوية',
                d.DepartmentName as 'القسم المسؤول',
                cr.ReasonName as 'نوع الطلب',
                st.SubtypeName as 'التصنيف الفرعي',
                creator.FullName as 'مقدم الطلب',
                assignee.FullName as 'المسؤول عن التنفيذ',
                DATE_FORMAT(c.CreatedAt, '%Y-%m-%d %H:%i:%s') as 'تاريخ التقديم',
                DATE_FORMAT(c.UpdatedAt, '%Y-%m-%d %H:%i:%s') as 'تاريخ آخر تحديث',
                DATE_FORMAT(c.ClosedAt, '%Y-%m-%d %H:%i:%s') as 'تاريخ الإكمال',
                CASE 
                    WHEN c.ClosedAt IS NOT NULL THEN 
                        CONCAT(TIMESTAMPDIFF(HOUR, c.CreatedAt, c.ClosedAt), ' ساعة')
                    ELSE 'لم يكتمل بعد'
                END as 'مدة التنفيذ'
            FROM complaints c
            LEFT JOIN departments d ON c.DepartmentID = d.DepartmentID
            LEFT JOIN complaint_subtypes st ON c.SubtypeID = st.SubtypeID
            LEFT JOIN complaint_reasons cr ON st.ReasonID = cr.ReasonID
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
        const userID = req.user?.UserID || req.user?.EmployeeID;
        if (userID) {
            await logActivity(userID, null, 'GENERAL_REQUESTS_EXPORTED', {
                recordCount: exportData.length,
                filters: { fromDate, toDate, status, department },
                format: format || 'json'
            });
        }
        
        console.log(`✅ تم تصدير ${exportData.length} طلب عام`);
        
        res.json({
            success: true,
            data: exportData,
            totalRecords: exportData.length,
            exportedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ خطأ في تصدير بيانات الطلبات العامة:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// جلب تفاصيل طلب محدد
const getRequestDetails = async (req, res) => {
    try {
        const { requestId } = req.params;
        
        console.log('🔍 جلب تفاصيل الطلب:', requestId);
        
        // استخدام نفس منطق جلب تفاصيل الشكوى لأن الطلبات العامة هي شكاوى أيضاً
        const [requests] = await pool.execute(`
            SELECT 
                c.*,
                d.DepartmentName,
                cr.ReasonName as RequestType,
                st.SubtypeName,
                creator.FullName as CreatedByName,
                creator.Email as CreatedByEmail
            FROM complaints c
            LEFT JOIN departments d ON c.DepartmentID = d.DepartmentID
            LEFT JOIN complaint_subtypes st ON c.SubtypeID = st.SubtypeID
            LEFT JOIN complaint_reasons cr ON st.ReasonID = cr.ReasonID
            LEFT JOIN users creator ON c.CreatedBy = creator.UserID
            WHERE c.ComplaintID = ?
        `, [requestId]);
        
        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الطلب غير موجود'
            });
        }
        
        const request = requests[0];
        
        // جلب تاريخ التحديثات
        const [updates] = await pool.execute(`
            SELECT 
                ch.HistoryID,
                ch.PrevStatus,
                ch.NewStatus,
                ch.FieldChanged,
                ch.OldValue,
                ch.NewValue,
                ch.CreatedAt,
                u.FullName as UpdatedByName
            FROM complaint_history ch
            LEFT JOIN users u ON ch.ActorUserID = u.UserID
            WHERE ch.ComplaintID = ?
            ORDER BY ch.CreatedAt DESC
        `, [requestId]);
        
        // جلب التكليفات
        const [assignments] = await pool.execute(`
            SELECT 
                ca.AssignmentID,
                ca.Notes,
                ca.CreatedAt,
                assigned_to.FullName as ResponsiblePersonName,
                assigned_to.Email as ResponsiblePersonEmail,
                assigned_by.FullName as AssignedByName
            FROM complaint_assignments ca
            LEFT JOIN users assigned_to ON ca.AssignedToUserID = assigned_to.UserID
            LEFT JOIN users assigned_by ON ca.AssignedByUserID = assigned_by.UserID
            WHERE ca.ComplaintID = ?
            ORDER BY ca.CreatedAt DESC
        `, [requestId]);
        
        console.log('✅ تم جلب تفاصيل الطلب بنجاح');
        
        res.json({
            success: true,
            data: {
                request,
                updates,
                assignments
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب تفاصيل الطلب:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// تحديث حالة طلب عام
const updateRequestStatus = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status, notes } = req.body;
        const userID = req.user?.UserID || req.user?.EmployeeID;
        
        if (!status || !['open', 'in_progress', 'closed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'حالة غير صحيحة'
            });
        }
        
        // جلب الحالة الحالية
        const [currentRequest] = await pool.execute(
            'SELECT Status FROM complaints WHERE ComplaintID = ?',
            [requestId]
        );
        
        if (currentRequest.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الطلب غير موجود'
            });
        }
        
        const oldStatus = currentRequest[0].Status;
        
        // تحديث الحالة
        const updateData = [status];
        let updateQuery = 'UPDATE complaints SET Status = ?, UpdatedAt = CURRENT_TIMESTAMP';
        
        if (status === 'closed') {
            updateQuery += ', ClosedAt = CURRENT_TIMESTAMP';
        }
        
        updateQuery += ' WHERE ComplaintID = ?';
        updateData.push(requestId);
        
        await pool.execute(updateQuery, updateData);
        
        // إضافة سجل في التاريخ
        await pool.execute(
            `INSERT INTO complaint_history (ComplaintID, ActorUserID, PrevStatus, NewStatus, 
                                          FieldChanged, OldValue, NewValue) 
             VALUES (?, ?, ?, ?, 'Status', ?, ?)`,
            [requestId, userID, oldStatus, status, oldStatus, status]
        );
        
        // تسجيل النشاط
        await logActivity(userID, null, 'REQUEST_STATUS_UPDATED', {
            requestId,
            oldStatus,
            newStatus: status,
            notes
        });
        
        console.log(`✅ تم تحديث حالة الطلب ${requestId} من ${oldStatus} إلى ${status}`);
        
        res.json({
            success: true,
            message: 'تم تحديث حالة الطلب بنجاح'
        });
        
    } catch (error) {
        console.error('❌ خطأ في تحديث حالة الطلب:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// تكليف طلب لمسؤول
const assignRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { responsiblePersonId, notes } = req.body;
        const assignerID = req.user?.UserID || req.user?.EmployeeID;
        
        if (!responsiblePersonId) {
            return res.status(400).json({
                success: false,
                message: 'معرف المسؤول مطلوب'
            });
        }
        
        // التحقق من وجود المسؤول
        const [responsible] = await pool.execute(
            'SELECT UserID, FullName FROM users WHERE UserID = ? AND IsActive = 1',
            [responsiblePersonId]
        );
        
        if (responsible.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'المسؤول غير موجود أو غير نشط'
            });
        }
        
        // إضافة التكليف
        await pool.execute(
            `INSERT INTO complaint_assignments (ComplaintID, AssignedToUserID, AssignedByUserID, Notes) 
             VALUES (?, ?, ?, ?)`,
            [requestId, responsiblePersonId, assignerID, notes || '']
        );
        
        // تحديث حالة الطلب
        await pool.execute(
            'UPDATE complaints SET Status = ?, UpdatedAt = CURRENT_TIMESTAMP WHERE ComplaintID = ?',
            ['in_progress', requestId]
        );
        
        // تسجيل النشاط
        await logActivity(assignerID, responsiblePersonId, 'REQUEST_ASSIGNED', {
            requestId,
            assignedToName: responsible[0].FullName,
            notes
        });
        
        console.log(`✅ تم تكليف الطلب ${requestId} للمسؤول ${responsible[0].FullName}`);
        
        res.json({
            success: true,
            message: 'تم تكليف الطلب بنجاح'
        });
        
    } catch (error) {
        console.error('❌ خطأ في تكليف الطلب:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

module.exports = {
    getGeneralRequestStats,
    exportGeneralRequestData,
    getRequestDetails,
    updateRequestStatus,
    assignRequest
};