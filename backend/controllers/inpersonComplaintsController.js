const pool = require('../config/database');
const ExcelJS = require('exceljs');
const { logActivity } = require('./logsController');

// جلب إحصائيات الشكاوى الحضورية (in_person)
const getInPersonComplaintsStats = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        
        console.log('📊 جلب إحصائيات الشكاوى الحضورية:', { fromDate, toDate });
        
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
        
        let whereClause = "WHERE c.Source = 'in_person'";
        let params = [];
        
        if (fromDate && toDate) {
            whereClause += ' AND DATE(c.CreatedAt) BETWEEN ? AND ?';
            params = [fromDate, toDate];
        }
        
        // جلب البيانات حسب نوع الشكوى والقسم
        const [complaintsByTypeAndDepartment] = await pool.execute(`
            SELECT 
                COALESCE(cr.ReasonName, 'غير محدد') as ComplaintType,
                d.DepartmentName,
                COUNT(*) as complaintCount
            FROM complaints c
            LEFT JOIN complaint_subtypes st ON c.SubtypeID = st.SubtypeID
            LEFT JOIN complaint_reasons cr ON st.ReasonID = cr.ReasonID
            LEFT JOIN departments d ON c.DepartmentID = d.DepartmentID
            ${whereClause}
            GROUP BY cr.ReasonID, cr.ReasonName, d.DepartmentID, d.DepartmentName
            ORDER BY cr.ReasonName, d.DepartmentName
        `, params);
        
        // جلب البيانات حسب الحالة والقسم
        const [complaintsByStatusAndDepartment] = await pool.execute(`
            SELECT 
                CASE 
                    WHEN c.Status = 'open' THEN 'مفتوحة'
                    WHEN c.Status = 'in_progress' THEN 'قيد المعالجة'
                    WHEN c.Status = 'responded' THEN 'تم الرد'
                    WHEN c.Status = 'closed' THEN 'مغلقة'
                    ELSE c.Status
                END as Status,
                d.DepartmentName,
                COUNT(*) as complaintCount
            FROM complaints c
            LEFT JOIN departments d ON c.DepartmentID = d.DepartmentID
            ${whereClause}
            GROUP BY c.Status, d.DepartmentID, d.DepartmentName
            ORDER BY c.Status, d.DepartmentName
        `, params);
        
        // جلب البيانات حسب الأولوية والقسم
        const [complaintsByPriorityAndDepartment] = await pool.execute(`
            SELECT 
                CASE 
                    WHEN c.Priority = 'low' THEN 'منخفضة'
                    WHEN c.Priority = 'normal' THEN 'عادية'
                    WHEN c.Priority = 'high' THEN 'عالية'
                    WHEN c.Priority = 'urgent' THEN 'عاجلة'
                    ELSE c.Priority
                END as Priority,
                d.DepartmentName,
                COUNT(*) as complaintCount
            FROM complaints c
            LEFT JOIN departments d ON c.DepartmentID = d.DepartmentID
            ${whereClause}
            GROUP BY c.Priority, d.DepartmentID, d.DepartmentName
            ORDER BY c.Priority, d.DepartmentName
        `, params);
        
        // إحصائيات عامة
        const [generalStats] = await pool.execute(`
            SELECT 
                COUNT(*) as totalComplaints,
                SUM(CASE WHEN c.Status = 'open' THEN 1 ELSE 0 END) as openComplaints,
                SUM(CASE WHEN c.Status = 'in_progress' THEN 1 ELSE 0 END) as inProgressComplaints,
                SUM(CASE WHEN c.Status = 'responded' THEN 1 ELSE 0 END) as respondedComplaints,
                SUM(CASE WHEN c.Status = 'closed' THEN 1 ELSE 0 END) as closedComplaints,
                SUM(CASE WHEN c.Priority = 'urgent' THEN 1 ELSE 0 END) as urgentComplaints,
                SUM(CASE WHEN c.Priority = 'high' THEN 1 ELSE 0 END) as highPriorityComplaints,
                AVG(CASE WHEN c.Status = 'closed' AND c.ClosedAt IS NOT NULL 
                    THEN TIMESTAMPDIFF(HOUR, c.CreatedAt, c.ClosedAt) 
                    ELSE NULL END) as avgResolutionHours
            FROM complaints c
            ${whereClause}
        `, params);
        
        // إحصائيات شهرية
        const [monthlyStats] = await pool.execute(`
            SELECT 
                DATE_FORMAT(c.CreatedAt, '%Y-%m') as month,
                COUNT(*) as total,
                SUM(CASE WHEN c.Status = 'closed' THEN 1 ELSE 0 END) as closed
            FROM complaints c
            WHERE c.Source = 'in_person' AND c.CreatedAt >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            ${fromDate && toDate ? 'AND DATE(c.CreatedAt) BETWEEN ? AND ?' : ''}
            GROUP BY DATE_FORMAT(c.CreatedAt, '%Y-%m')
            ORDER BY month DESC
            LIMIT 12
        `, params);
        
        console.log('✅ تم جلب إحصائيات الشكاوى الحضورية بنجاح');
        
        res.json({
            success: true,
            data: {
                overview: generalStats[0],
                byTypeAndDepartment: complaintsByTypeAndDepartment,
                byStatusAndDepartment: complaintsByStatusAndDepartment,
                byPriorityAndDepartment: complaintsByPriorityAndDepartment,
                monthlyTrend: monthlyStats
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب إحصائيات الشكاوى الحضورية:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// تصدير بيانات الشكاوى الحضورية
const exportInPersonComplaintsData = async (req, res) => {
    try {
        const { fromDate, toDate, format = 'excel' } = req.query;
        
        console.log('📤 تصدير بيانات الشكاوى الحضورية:', { fromDate, toDate, format });
        
        let whereClause = "WHERE c.Source = 'in_person'";
        let params = [];
        
        if (fromDate && toDate) {
            whereClause += ' AND DATE(c.CreatedAt) BETWEEN ? AND ?';
            params = [fromDate, toDate];
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
            LIMIT 5000
        `;
        
        const [exportData] = await pool.execute(exportQuery, params);
        
        if (format === 'excel') {
            // إنشاء ملف Excel
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('الشكاوى الحضورية');
            
            // إضافة العناوين
            const headers = Object.keys(exportData[0] || {});
            worksheet.addRow(headers);
            
            // إضافة البيانات
            exportData.forEach(row => {
                worksheet.addRow(Object.values(row));
            });
            
            // تنسيق الجدول
            worksheet.getRow(1).font = { bold: true };
            worksheet.columns.forEach(column => {
                column.width = 20;
            });
            
            // إرسال الملف
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=in-person-complaints-${new Date().toISOString().split('T')[0]}.xlsx`);
            
            await workbook.xlsx.write(res);
            res.end();
        } else {
            // إرسال JSON
            res.json({
                success: true,
                data: exportData,
                totalRecords: exportData.length,
                exportedAt: new Date().toISOString()
            });
        }
        
        // تسجيل عملية التصدير
        const userID = req.user?.UserID || req.user?.EmployeeID;
        if (userID) {
            await logActivity(userID, null, 'INPERSON_COMPLAINTS_EXPORTED', {
                recordCount: exportData.length,
                filters: { fromDate, toDate },
                format
            });
        }
        
        console.log(`✅ تم تصدير ${exportData.length} شكوى حضورية`);
        
    } catch (error) {
        console.error('❌ خطأ في تصدير بيانات الشكاوى الحضورية:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// جلب تفاصيل شكوى حضورية محددة
const getInPersonComplaintDetails = async (req, res) => {
    try {
        const { complaintId } = req.params;
        
        console.log('🔍 جلب تفاصيل الشكوى الحضورية:', complaintId);
        
        // جلب تفاصيل الشكوى
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
                creator.FullName as CreatedByName,
                creator.Email as CreatedByEmail
            FROM complaints c
            LEFT JOIN departments d ON c.DepartmentID = d.DepartmentID
            LEFT JOIN complaint_subtypes st ON c.SubtypeID = st.SubtypeID
            LEFT JOIN complaint_reasons cr ON st.ReasonID = cr.ReasonID
            LEFT JOIN patients p ON c.PatientID = p.PatientID
            LEFT JOIN users creator ON c.CreatedBy = creator.UserID
            WHERE c.ComplaintID = ? AND c.Source = 'in_person'
        `, [complaintId]);
        
        if (complaints.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الشكوى الحضورية غير موجودة'
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
                u.FullName as AuthorName
            FROM complaint_replies cr
            LEFT JOIN users u ON cr.AuthorUserID = u.UserID
            WHERE cr.ComplaintID = ?
            ORDER BY cr.CreatedAt ASC
        `, [complaintId]);
        
        // جلب التكليفات
        const [assignments] = await pool.execute(`
            SELECT 
                ca.AssignmentID,
                ca.Notes,
                ca.CreatedAt,
                assigned_to.FullName as AssignedToName,
                assigned_by.FullName as AssignedByName
            FROM complaint_assignments ca
            LEFT JOIN users assigned_to ON ca.AssignedToUserID = assigned_to.UserID
            LEFT JOIN users assigned_by ON ca.AssignedByUserID = assigned_by.UserID
            WHERE ca.ComplaintID = ?
            ORDER BY ca.CreatedAt DESC
        `, [complaintId]);
        
        console.log('✅ تم جلب تفاصيل الشكوى الحضورية بنجاح');
        
        res.json({
            success: true,
            data: {
                complaint,
                attachments,
                replies,
                assignments
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب تفاصيل الشكوى الحضورية:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// جلب إحصائيات الأداء للشكاوى الحضورية
const getInPersonComplaintsPerformance = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        
        let whereClause = "WHERE c.Source = 'in_person'";
        let params = [];
        
        if (fromDate && toDate) {
            whereClause += ' AND DATE(c.CreatedAt) BETWEEN ? AND ?';
            params = [fromDate, toDate];
        }
        
        // إحصائيات الأداء
        const [performanceStats] = await pool.execute(`
            SELECT 
                COUNT(CASE WHEN c.Status = 'closed' AND c.ClosedAt IS NOT NULL 
                      AND TIMESTAMPDIFF(HOUR, c.CreatedAt, c.ClosedAt) <= 24 THEN 1 END) as resolvedWithin24Hours,
                COUNT(CASE WHEN c.Status = 'closed' AND c.ClosedAt IS NOT NULL 
                      AND TIMESTAMPDIFF(HOUR, c.CreatedAt, c.ClosedAt) <= 72 THEN 1 END) as resolvedWithin72Hours,
                COUNT(CASE WHEN c.Status = 'closed' AND c.ClosedAt IS NOT NULL 
                      AND TIMESTAMPDIFF(HOUR, c.CreatedAt, c.ClosedAt) > 72 THEN 1 END) as resolvedAfter72Hours,
                COUNT(CASE WHEN c.Status != 'closed' THEN 1 END) as stillOpen,
                AVG(CASE WHEN c.Status = 'closed' AND c.ClosedAt IS NOT NULL 
                    THEN TIMESTAMPDIFF(HOUR, c.CreatedAt, c.ClosedAt) 
                    ELSE NULL END) as avgResolutionHours,
                MIN(CASE WHEN c.Status = 'closed' AND c.ClosedAt IS NOT NULL 
                    THEN TIMESTAMPDIFF(HOUR, c.CreatedAt, c.ClosedAt) 
                    ELSE NULL END) as minResolutionHours,
                MAX(CASE WHEN c.Status = 'closed' AND c.ClosedAt IS NOT NULL 
                    THEN TIMESTAMPDIFF(HOUR, c.CreatedAt, c.ClosedAt) 
                    ELSE NULL END) as maxResolutionHours
            FROM complaints c
            ${whereClause}
        `, params);
        
        // إحصائيات الأداء حسب القسم
        const [departmentPerformance] = await pool.execute(`
            SELECT 
                d.DepartmentName,
                COUNT(*) as totalComplaints,
                COUNT(CASE WHEN c.Status = 'closed' THEN 1 END) as resolvedComplaints,
                AVG(CASE WHEN c.Status = 'closed' AND c.ClosedAt IS NOT NULL 
                    THEN TIMESTAMPDIFF(HOUR, c.CreatedAt, c.ClosedAt) 
                    ELSE NULL END) as avgResolutionHours,
                ROUND((COUNT(CASE WHEN c.Status = 'closed' THEN 1 END) * 100.0 / COUNT(*)), 2) as resolutionRate
            FROM complaints c
            LEFT JOIN departments d ON c.DepartmentID = d.DepartmentID
            ${whereClause}
            GROUP BY d.DepartmentID, d.DepartmentName
            HAVING totalComplaints > 0
            ORDER BY resolutionRate DESC
        `, params);
        
        res.json({
            success: true,
            data: {
                overall: performanceStats[0],
                byDepartment: departmentPerformance
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب إحصائيات أداء الشكاوى الحضورية:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

module.exports = {
    getInPersonComplaintsStats,
    exportInPersonComplaintsData,
    getInPersonComplaintDetails,
    getInPersonComplaintsPerformance
};