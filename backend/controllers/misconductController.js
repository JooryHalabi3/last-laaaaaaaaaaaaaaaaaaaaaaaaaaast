const pool = require('../config/database');
const { logActivity } = require('./logsController');
let ExcelJS;

// محاولة استيراد ExcelJS مع معالجة الخطأ
try {
    ExcelJS = require('exceljs');
} catch (error) {
    console.log('⚠️ مكتبة ExcelJS غير متوفرة، سيتم استخدام تصدير JSON كبديل');
    ExcelJS = null;
}

// جلب إحصائيات بلاغات سوء التعامل من جدول misconduct_rows
const getMisconductStats = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        
        console.log('📊 جلب إحصائيات بلاغات سوء التعامل:', { fromDate, toDate });
        
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
        
        let whereClause = 'WHERE 1=1';
        let params = [];
        
        if (fromDate && toDate) {
            whereClause += ' AND mr.OccurredAt BETWEEN ? AND ?';
            params = [fromDate, toDate];
        }
        
        // الإحصائيات العامة من جدول misconduct_rows
        const [generalStats] = await pool.execute(`
            SELECT 
                COUNT(*) as totalMisconductReports,
                COUNT(DISTINCT mr.DepartmentName) as affectedDepartments,
                COUNT(DISTINCT mr.IncidentType) as incidentTypes,
                COUNT(CASE WHEN mr.Status = 'resolved' THEN 1 END) as resolvedCases,
                COUNT(CASE WHEN mr.Status = 'pending' THEN 1 END) as pendingCases,
                COUNT(CASE WHEN mr.Status = 'investigating' THEN 1 END) as investigatingCases
            FROM misconduct_rows mr
            ${whereClause}
        `, params);
        
        // إحصائيات حسب القسم
        const [departmentStats] = await pool.execute(`
            SELECT 
                mr.DepartmentName,
                COUNT(*) as reportCount,
                COUNT(CASE WHEN mr.Status = 'resolved' THEN 1 END) as resolvedCount,
                COUNT(DISTINCT mr.IncidentType) as incidentTypeCount
            FROM misconduct_rows mr
            ${whereClause}
            GROUP BY mr.DepartmentName
            HAVING reportCount > 0
            ORDER BY reportCount DESC
            LIMIT 10
        `, params);
        
        // إحصائيات حسب نوع الحادثة
        const [incidentTypeStats] = await pool.execute(`
            SELECT 
                mr.IncidentType,
                COUNT(*) as count,
                COUNT(CASE WHEN mr.Status = 'resolved' THEN 1 END) as resolved
            FROM misconduct_rows mr
            ${whereClause}
            GROUP BY mr.IncidentType
            ORDER BY count DESC
            LIMIT 10
        `, params);
        
        // إحصائيات حسب الحالة
        const [statusStats] = await pool.execute(`
            SELECT 
                COALESCE(mr.Status, 'غير محدد') as status,
                COUNT(*) as count
            FROM misconduct_rows mr
            ${whereClause}
            GROUP BY mr.Status
            ORDER BY count DESC
        `, params);
        
        // الاتجاه الشهري
        const [monthlyTrend] = await pool.execute(`
            SELECT 
                DATE_FORMAT(mr.OccurredAt, '%Y-%m') as month,
                COUNT(*) as total,
                COUNT(CASE WHEN mr.Status = 'resolved' THEN 1 END) as resolved
            FROM misconduct_rows mr
            WHERE mr.OccurredAt >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            ${fromDate && toDate ? 'AND mr.OccurredAt BETWEEN ? AND ?' : ''}
            GROUP BY DATE_FORMAT(mr.OccurredAt, '%Y-%m')
            ORDER BY month DESC
            LIMIT 12
        `, params);
        
        // إحصائيات ربعية
        const [quarterlyStats] = await pool.execute(`
            SELECT 
                mr.Year,
                mr.Quarter,
                COUNT(*) as total,
                COUNT(CASE WHEN mr.Status = 'resolved' THEN 1 END) as resolved
            FROM misconduct_rows mr
            ${whereClause}
            GROUP BY mr.Year, mr.Quarter
            ORDER BY mr.Year DESC, mr.Quarter DESC
            LIMIT 8
        `, params);
        
        console.log('✅ تم جلب إحصائيات بلاغات سوء التعامل بنجاح');
        
        res.json({
            success: true,
            data: {
                overview: generalStats[0],
                departmentBreakdown: departmentStats,
                incidentTypeBreakdown: incidentTypeStats,
                statusBreakdown: statusStats,
                monthlyTrend: monthlyTrend,
                quarterlyTrend: quarterlyStats
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب إحصائيات بلاغات سوء التعامل:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// تصدير بيانات بلاغات سوء التعامل
const exportMisconductData = async (req, res) => {
    try {
        const { fromDate, toDate, department, incidentType, status, format = 'json' } = req.query;
        
        console.log('📤 تصدير بيانات بلاغات سوء التعامل:', { fromDate, toDate, department, incidentType, status, format });
        
        let whereClause = 'WHERE 1=1';
        let params = [];
        
        if (fromDate && toDate) {
            whereClause += ' AND mr.OccurredAt BETWEEN ? AND ?';
            params.push(fromDate, toDate);
        }
        
        if (department) {
            whereClause += ' AND mr.DepartmentName = ?';
            params.push(department);
        }
        
        if (incidentType) {
            whereClause += ' AND mr.IncidentType = ?';
            params.push(incidentType);
        }
        
        if (status) {
            whereClause += ' AND mr.Status = ?';
            params.push(status);
        }
        
        const exportQuery = `
            SELECT 
                mr.RowID as 'معرف البلاغ',
                DATE_FORMAT(mr.OccurredAt, '%Y-%m-%d') as 'تاريخ الحادثة',
                mr.DepartmentName as 'القسم',
                mr.IncidentType as 'نوع الحادثة',
                COALESCE(mr.Status, 'غير محدد') as 'الحالة',
                mr.Description as 'وصف الحادثة',
                mr.Year as 'السنة',
                mr.Quarter as 'الربع',
                DATE_FORMAT(mr.CreatedAt, '%Y-%m-%d %H:%i:%s') as 'تاريخ الإدخال',
                mi.SourceFileName as 'ملف المصدر',
                uploader.FullName as 'رافع البيانات'
            FROM misconduct_rows mr
            LEFT JOIN misconduct_imports mi ON mr.ImportID = mi.ImportID
            LEFT JOIN users uploader ON mi.UploadedBy = uploader.UserID
            ${whereClause}
            ORDER BY mr.OccurredAt DESC, mr.CreatedAt DESC
            LIMIT 10000
        `;
        
        const [exportData] = await pool.execute(exportQuery, params);
        
        if (format === 'excel' && ExcelJS) {
            // إنشاء ملف Excel
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('بلاغات سوء التعامل');
            
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
            res.setHeader('Content-Disposition', `attachment; filename=misconduct-reports-${new Date().toISOString().split('T')[0]}.xlsx`);
            
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
            await logActivity(userID, null, 'MISCONDUCT_DATA_EXPORTED', {
                recordCount: exportData.length,
                filters: { fromDate, toDate, department, incidentType, status },
                format
            });
        }
        
        console.log(`✅ تم تصدير ${exportData.length} بلاغ سوء تعامل`);
        
    } catch (error) {
        console.error('❌ خطأ في تصدير بيانات بلاغات سوء التعامل:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// رفع ملف بيانات سوء التعامل الجديد
const uploadMisconductData = async (req, res) => {
    try {
        const { sourceFileName, fromDate, toDate, note } = req.body;
        const userID = req.user?.UserID || req.user?.EmployeeID;
        
        if (!sourceFileName) {
            return res.status(400).json({
                success: false,
                message: 'اسم الملف المصدر مطلوب'
            });
        }
        
        // إنشاء سجل استيراد جديد
        const [importResult] = await pool.execute(
            `INSERT INTO misconduct_imports (UploadedBy, SourceFileName, FromDate, ToDate) 
             VALUES (?, ?, ?, ?)`,
            [userID, sourceFileName, fromDate || null, toDate || null]
        );
        
        const importID = importResult.insertId;
        
        // تسجيل النشاط
        await logActivity(userID, null, 'MISCONDUCT_DATA_UPLOADED', {
            importID,
            sourceFileName,
            fromDate,
            toDate
        });
        
        res.json({
            success: true,
            message: 'تم رفع ملف بيانات سوء التعامل بنجاح',
            data: {
                importID,
                sourceFileName
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في رفع بيانات سوء التعامل:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// جلب قائمة عمليات الاستيراد
const getMisconductImports = async (req, res) => {
    try {
        const [imports] = await pool.execute(`
            SELECT 
                mi.ImportID,
                mi.SourceFileName,
                mi.FromDate,
                mi.ToDate,
                mi.CreatedAt,
                u.FullName as UploadedByName,
                COUNT(mr.RowID) as RecordCount
            FROM misconduct_imports mi
            LEFT JOIN users u ON mi.UploadedBy = u.UserID
            LEFT JOIN misconduct_rows mr ON mi.ImportID = mr.ImportID
            GROUP BY mi.ImportID, mi.SourceFileName, mi.FromDate, mi.ToDate, mi.CreatedAt, u.FullName
            ORDER BY mi.CreatedAt DESC
            LIMIT 50
        `);
        
        res.json({
            success: true,
            data: imports
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب قائمة عمليات الاستيراد:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// حذف عملية استيراد ومحتوياتها
const deleteMisconductImport = async (req, res) => {
    try {
        const { importID } = req.params;
        const userID = req.user?.UserID || req.user?.EmployeeID;
        
        // التحقق من وجود عملية الاستيراد
        const [importCheck] = await pool.execute(
            'SELECT ImportID, SourceFileName FROM misconduct_imports WHERE ImportID = ?',
            [importID]
        );
        
        if (importCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'عملية الاستيراد غير موجودة'
            });
        }
        
        // حذف البيانات (سيتم حذف misconduct_rows تلقائياً بسبب CASCADE)
        await pool.execute(
            'DELETE FROM misconduct_imports WHERE ImportID = ?',
            [importID]
        );
        
        // تسجيل النشاط
        await logActivity(userID, null, 'MISCONDUCT_IMPORT_DELETED', {
            importID,
            sourceFileName: importCheck[0].SourceFileName
        });
        
        res.json({
            success: true,
            message: 'تم حذف عملية الاستيراد وبياناتها بنجاح'
        });
        
    } catch (error) {
        console.error('❌ خطأ في حذف عملية الاستيراد:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

// جلب تفاصيل عملية استيراد محددة
const getMisconductImportDetails = async (req, res) => {
    try {
        const { importID } = req.params;
        
        // جلب معلومات الاستيراد
        const [importInfo] = await pool.execute(`
            SELECT 
                mi.ImportID,
                mi.SourceFileName,
                mi.FromDate,
                mi.ToDate,
                mi.CreatedAt,
                u.FullName as UploadedByName,
                u.Email as UploadedByEmail
            FROM misconduct_imports mi
            LEFT JOIN users u ON mi.UploadedBy = u.UserID
            WHERE mi.ImportID = ?
        `, [importID]);
        
        if (importInfo.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'عملية الاستيراد غير موجودة'
            });
        }
        
        // جلب السجلات المرتبطة
        const [records] = await pool.execute(`
            SELECT 
                mr.RowID,
                mr.OccurredAt,
                mr.DepartmentName,
                mr.IncidentType,
                mr.Status,
                mr.Description,
                mr.Year,
                mr.Quarter,
                mr.CreatedAt
            FROM misconduct_rows mr
            WHERE mr.ImportID = ?
            ORDER BY mr.OccurredAt DESC, mr.CreatedAt DESC
            LIMIT 1000
        `, [importID]);
        
        res.json({
            success: true,
            data: {
                importInfo: importInfo[0],
                records: records,
                recordCount: records.length
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب تفاصيل عملية الاستيراد:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
};

module.exports = {
    getMisconductStats,
    exportMisconductData,
    uploadMisconductData,
    getMisconductImports,
    deleteMisconductImport,
    getMisconductImportDetails
};