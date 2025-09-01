// utils/notificationUtils.js
const pool = require('../config/database');

/**
 * إرسال إشعار للسوبر أدمن (RoleID = 1)
 * @param {string} title - عنوان الإشعار
 * @param {string} body - محتوى الإشعار
 * @param {string} type - نوع الإشعار
 */
async function notifySuperAdmin(title, body, type = 'info') {
  try {
    // الحصول على جميع السوبر أدمن (RoleID = 1)
    const [superAdmins] = await pool.execute(
      'SELECT UserID FROM users WHERE RoleID = 1 AND IsActive = 1'
    );

    if (superAdmins.length === 0) {
      console.log('لا يوجد سوبر أدمن في النظام');
      return;
    }

    // إرسال إشعار لكل سوبر أدمن
    for (const admin of superAdmins) {
      await pool.execute(
        `INSERT INTO notifications (UserID, Title, Body, Type) 
         VALUES (?, ?, ?, ?)`,
        [admin.UserID, title, body, type]
      );
    }

    console.log(`تم إرسال إشعار للسوبر أدمن: ${title}`);
  } catch (error) {
    console.error('خطأ في إرسال إشعار للسوبر أدمن:', error);
  }
}

/**
 * إرسال إشعار لمستخدم محدد
 * @param {number} userID - معرف المستخدم
 * @param {string} title - عنوان الإشعار
 * @param {string} body - محتوى الإشعار
 * @param {string} type - نوع الإشعار
 */
async function notifyUser(userID, title, body, type = 'info') {
  try {
    await pool.execute(
      `INSERT INTO notifications (UserID, Title, Body, Type) 
       VALUES (?, ?, ?, ?)`,
      [userID, title, body, type]
    );

    console.log(`تم إرسال إشعار للمستخدم ${userID}: ${title}`);
  } catch (error) {
    console.error('خطأ في إرسال إشعار للمستخدم:', error);
  }
}

/**
 * إرسال إشعار عند إنشاء شكوى جديدة
 * @param {number} complaintID - معرف الشكوى
 * @param {number} createdBy - معرف منشئ الشكوى
 */
async function notifyNewComplaint(complaintID, createdBy) {
  try {
    // جلب تفاصيل الشكوى
    const [complaints] = await pool.execute(
      `SELECT c.ComplaintNumber, c.Title, u.FullName as CreatedByName,
              d.DepartmentName, p.FullName as PatientName
       FROM complaints c
       LEFT JOIN users u ON c.CreatedBy = u.UserID
       LEFT JOIN departments d ON c.DepartmentID = d.DepartmentID
       LEFT JOIN patients p ON c.PatientID = p.PatientID
       WHERE c.ComplaintID = ?`,
      [complaintID]
    );

    if (complaints.length === 0) return;

    const complaint = complaints[0];
    const title = 'شكوى جديدة تم إنشاؤها';
    const body = `تم إنشاء شكوى جديدة رقم ${complaint.ComplaintNumber} بواسطة ${complaint.CreatedByName}${complaint.PatientName ? ` للمريض ${complaint.PatientName}` : ''}${complaint.DepartmentName ? ` في قسم ${complaint.DepartmentName}` : ''}`;
    
    await notifySuperAdmin(title, body, 'complaint_created');
  } catch (error) {
    console.error('خطأ في إرسال إشعار الشكوى الجديدة:', error);
  }
}

/**
 * إرسال إشعار عند تحديث حالة الشكوى
 * @param {number} complaintID - معرف الشكوى
 * @param {string} oldStatus - الحالة القديمة
 * @param {string} newStatus - الحالة الجديدة
 * @param {number} updatedBy - معرف المحدث
 */
async function notifyStatusUpdate(complaintID, oldStatus, newStatus, updatedBy) {
  try {
    // جلب تفاصيل الشكوى والمحدث
    const [details] = await pool.execute(
      `SELECT c.ComplaintNumber, u.FullName as UpdatedByName
       FROM complaints c
       LEFT JOIN users u ON u.UserID = ?
       WHERE c.ComplaintID = ?`,
      [updatedBy, complaintID]
    );

    if (details.length === 0) return;

    const detail = details[0];
    const statusMap = {
      'open': 'مفتوحة',
      'in_progress': 'قيد المعالجة',
      'responded': 'تم الرد',
      'closed': 'مغلقة'
    };

    const title = 'تم تحديث حالة شكوى';
    const body = `تم تحديث حالة الشكوى رقم ${detail.ComplaintNumber} من "${statusMap[oldStatus] || oldStatus}" إلى "${statusMap[newStatus] || newStatus}" بواسطة ${detail.UpdatedByName}`;
    
    await notifySuperAdmin(title, body, 'status_update');
  } catch (error) {
    console.error('خطأ في إرسال إشعار تحديث الحالة:', error);
  }
}

/**
 * إرسال إشعار عند إضافة رد جديد
 * @param {number} complaintID - معرف الشكوى
 * @param {number} authorID - معرف كاتب الرد
 */
async function notifyNewReply(complaintID, authorID) {
  try {
    // جلب تفاصيل الشكوى والكاتب
    const [details] = await pool.execute(
      `SELECT c.ComplaintNumber, u.FullName as AuthorName
       FROM complaints c
       LEFT JOIN users u ON u.UserID = ?
       WHERE c.ComplaintID = ?`,
      [authorID, complaintID]
    );

    if (details.length === 0) return;

    const detail = details[0];
    const title = 'رد جديد على شكوى';
    const body = `تم إضافة رد جديد على الشكوى رقم ${detail.ComplaintNumber} بواسطة ${detail.AuthorName}`;
    
    await notifySuperAdmin(title, body, 'new_reply');
  } catch (error) {
    console.error('خطأ في إرسال إشعار الرد الجديد:', error);
  }
}

/**
 * إرسال إشعار عند تكليف شكوى
 * @param {number} complaintID - معرف الشكوى
 * @param {number} assignedToUserID - معرف المكلف
 * @param {number} assignedByUserID - معرف المكلِف
 */
async function notifyComplaintAssignment(complaintID, assignedToUserID, assignedByUserID) {
  try {
    // جلب تفاصيل الشكوى والأشخاص المعنيين
    const [details] = await pool.execute(
      `SELECT c.ComplaintNumber, 
              assigned_to.FullName as AssignedToName,
              assigned_by.FullName as AssignedByName
       FROM complaints c
       LEFT JOIN users assigned_to ON assigned_to.UserID = ?
       LEFT JOIN users assigned_by ON assigned_by.UserID = ?
       WHERE c.ComplaintID = ?`,
      [assignedToUserID, assignedByUserID, complaintID]
    );

    if (details.length === 0) return;

    const detail = details[0];
    const title = 'تم تكليف شكوى';
    const body = `تم تكليف الشكوى رقم ${detail.ComplaintNumber} للموظف ${detail.AssignedToName} بواسطة ${detail.AssignedByName}`;
    
    // إشعار للسوبر أدمن
    await notifySuperAdmin(title, body, 'assignment');
    
    // إشعار للموظف المكلف
    await notifyUser(assignedToUserID, title, body, 'assignment');
  } catch (error) {
    console.error('خطأ في إرسال إشعار التكليف:', error);
  }
}

/**
 * إرسال إشعار عند إضافة مرفق جديد
 * @param {number} complaintID - معرف الشكوى
 * @param {string} fileName - اسم الملف المرفق
 * @param {number} uploadedBy - معرف رافع الملف
 */
async function notifyNewAttachment(complaintID, fileName, uploadedBy) {
  try {
    // جلب تفاصيل الشكوى والرافع
    const [details] = await pool.execute(
      `SELECT c.ComplaintNumber, u.FullName as UploaderName
       FROM complaints c
       LEFT JOIN users u ON u.UserID = ?
       WHERE c.ComplaintID = ?`,
      [uploadedBy, complaintID]
    );

    if (details.length === 0) return;

    const detail = details[0];
    const title = 'مرفق جديد للشكوى';
    const body = `تم إضافة مرفق جديد (${fileName}) للشكوى رقم ${detail.ComplaintNumber} بواسطة ${detail.UploaderName}`;
    
    await notifySuperAdmin(title, body, 'new_attachment');
  } catch (error) {
    console.error('خطأ في إرسال إشعار المرفق الجديد:', error);
  }
}

/**
 * إرسال إشعار عند طلب إعادة فتح شكوى
 * @param {number} complaintID - معرف الشكوى
 * @param {number} requestedBy - معرف طالب إعادة الفتح
 * @param {string} reason - سبب طلب إعادة الفتح
 */
async function notifyReopenRequest(complaintID, requestedBy, reason) {
  try {
    // جلب تفاصيل الشكوى والطالب
    const [details] = await pool.execute(
      `SELECT c.ComplaintNumber, u.FullName as RequesterName
       FROM complaints c
       LEFT JOIN users u ON u.UserID = ?
       WHERE c.ComplaintID = ?`,
      [requestedBy, complaintID]
    );

    if (details.length === 0) return;

    const detail = details[0];
    const title = 'طلب إعادة فتح شكوى';
    const body = `تم طلب إعادة فتح الشكوى رقم ${detail.ComplaintNumber} بواسطة ${detail.RequesterName}. السبب: ${reason}`;
    
    await notifySuperAdmin(title, body, 'reopen_request');
  } catch (error) {
    console.error('خطأ في إرسال إشعار طلب إعادة الفتح:', error);
  }
}

/**
 * إرسال إشعار عند تحديث أولوية الشكوى
 * @param {number} complaintID - معرف الشكوى
 * @param {string} oldPriority - الأولوية القديمة
 * @param {string} newPriority - الأولوية الجديدة
 * @param {number} updatedBy - معرف المحدث
 */
async function notifyPriorityUpdate(complaintID, oldPriority, newPriority, updatedBy) {
  try {
    // جلب تفاصيل الشكوى والمحدث
    const [details] = await pool.execute(
      `SELECT c.ComplaintNumber, u.FullName as UpdatedByName
       FROM complaints c
       LEFT JOIN users u ON u.UserID = ?
       WHERE c.ComplaintID = ?`,
      [updatedBy, complaintID]
    );

    if (details.length === 0) return;

    const detail = details[0];
    const priorityMap = {
      'low': 'منخفضة',
      'normal': 'عادية',
      'high': 'عالية',
      'urgent': 'عاجلة'
    };

    const title = 'تم تحديث أولوية شكوى';
    const body = `تم تحديث أولوية الشكوى رقم ${detail.ComplaintNumber} من "${priorityMap[oldPriority] || oldPriority}" إلى "${priorityMap[newPriority] || newPriority}" بواسطة ${detail.UpdatedByName}`;
    
    await notifySuperAdmin(title, body, 'priority_update');
  } catch (error) {
    console.error('خطأ في إرسال إشعار تحديث الأولوية:', error);
  }
}

module.exports = {
  notifySuperAdmin,
  notifyUser,
  notifyNewComplaint,
  notifyStatusUpdate,
  notifyNewReply,
  notifyComplaintAssignment,
  notifyNewAttachment,
  notifyReopenRequest,
  notifyPriorityUpdate
};