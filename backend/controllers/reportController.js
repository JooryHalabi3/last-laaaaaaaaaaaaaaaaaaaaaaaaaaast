const pool = require('../config/database');
const { logActivity } = require('./logsController');

// جلب إحصائيات الشكاوى حسب الفترة
const getComplaintStats = async (req, res) => {
  try {
    const { fromDate, toDate, includePatientData, includeEmployeeData } = req.query;
    
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
    
    // إحصائيات عامة
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as totalComplaints,
        SUM(CASE WHEN c.Status = 'closed' THEN 1 ELSE 0 END) as closedComplaints,
        SUM(CASE WHEN c.Status = 'in_progress' THEN 1 ELSE 0 END) as inProgressComplaints,
        SUM(CASE WHEN c.Status = 'open' THEN 1 ELSE 0 END) as openComplaints,
        SUM(CASE WHEN c.Status = 'responded' THEN 1 ELSE 0 END) as respondedComplaints,
        SUM(CASE WHEN c.Priority = 'urgent' THEN 1 ELSE 0 END) as urgentComplaints,
        SUM(CASE WHEN c.Priority = 'high' THEN 1 ELSE 0 END) as highPriorityComplaints,
        AVG(CASE WHEN c.Status = 'closed' AND c.ClosedAt IS NOT NULL 
            THEN TIMESTAMPDIFF(HOUR, c.CreatedAt, c.ClosedAt) 
            ELSE NULL END) as avgResolutionTimeHours
      FROM complaints c
      ${whereClause}
    `, params);
    
    console.log('Query result:', stats);
    
    // الشكاوى المتكررة (نفس المريض، نفس النوع الفرعي)
    const [repeatedComplaints] = await pool.execute(`
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
    `, params);
    
    // معالجة النتائج الفارغة
    const generalStats = stats[0] || {
      totalComplaints: 0,
      closedComplaints: 0,
      inProgressComplaints: 0,
      openComplaints: 0,
      respondedComplaints: 0,
      urgentComplaints: 0,
      highPriorityComplaints: 0,
      avgResolutionTimeHours: 0
    };
    
    const repeatedStats = repeatedComplaints[0] || { repeatedCount: 0 };
    
    console.log('General stats:', generalStats);
    console.log('Repeated stats:', repeatedStats);
    
    res.json({
      success: true,
      data: {
        general: generalStats,
        repeated: repeatedStats,
        byDepartment: departmentStats || [],
        byType: typeStats || []
      }
    });
    
  } catch (error) {
    console.error('خطأ في جلب إحصائيات الشكاوى:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في جلب الإحصائيات',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};