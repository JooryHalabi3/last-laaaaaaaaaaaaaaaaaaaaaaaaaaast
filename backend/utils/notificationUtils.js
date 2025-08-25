// utils/notificationUtils.js
const pool = require('../config/database');

/**
 * إرسال إشعار للسوبر أدمن (RoleID = 1)
 * @param {string} title - عنوان الإشعار
 * @param {string} body - محتوى الإشعار
 * @param {string} type - نوع الإشعار
 * @param {string} relatedType - نوع العنصر المرتبط (complaint, employee, etc.)
 * @param {number} relatedID - معرف العنصر المرتبط
 */
async function notifySuperAdmin(title, body, type = 'info', relatedType = null, relatedID = null) {
  try {
    // الحصول على جميع السوبر أدمن (RoleID = 1)
    const [superAdmins] = await pool.execute(
      'SELECT EmployeeID FROM employees WHERE RoleID = 1'
    );

    if (superAdmins.length === 0) {
      console.log('لا يوجد سوبر أدمن في النظام');
      return;
    }

    // إرسال إشعار لكل سوبر أدمن
    for (const admin of superAdmins) {
      await pool.execute(
        `INSERT INTO notifications (RecipientEmployeeID, Title, Body, Type, RelatedType, RelatedID, CreatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [admin.EmployeeID, title, body, type, relatedType, relatedID]
      );
    }

    console.log(`تم إرسال إشعار للسوبر أدمن: ${title}`);
  } catch (error) {
    console.error('خطأ في إرسال إشعار للسوبر أدمن:', error);
  }
}

/**
 * إرسال إشعار عند إنشاء شكوى جديدة
 * @param {number} complaintId - معرف الشكوى
 * @param {string} patientName - اسم المريض
 * @param {string} departmentName - اسم القسم
 */
async function notifyNewComplaint(complaintId, patientName, departmentName) {
  const title = 'شكوى جديدة تم إنشاؤها';
  const body = `تم إنشاء شكوى جديدة رقم ${complaintId} للمريض ${patientName} في قسم ${departmentName}`;
  
  await notifySuperAdmin(title, body, 'info', 'complaint', complaintId);
}

/**
 * إرسال إشعار عند تحديث حالة الشكوى
 * @param {number} complaintId - معرف الشكوى
 * @param {string} oldStatus - الحالة القديمة
 * @param {string} newStatus - الحالة الجديدة
 * @param {string} updatedBy - اسم الشخص الذي قام بالتحديث
 */
async function notifyStatusUpdate(complaintId, oldStatus, newStatus, updatedBy) {
  const title = 'تم تحديث حالة شكوى';
  const body = `تم تحديث حالة الشكوى رقم ${complaintId} من "${oldStatus}" إلى "${newStatus}" بواسطة ${updatedBy}`;
  
  await notifySuperAdmin(title, body, 'status_update', 'complaint', complaintId);
}

/**
 * إرسال إشعار عند إضافة رد جديد
 * @param {number} complaintId - معرف الشكوى
 * @param {string} responseType - نوع الرد (داخلي/خارجي)
 * @param {string} respondedBy - اسم الشخص الذي قام بالرد
 */
async function notifyNewResponse(complaintId, responseType, respondedBy) {
  const title = 'رد جديد على شكوى';
  const body = `تم إضافة رد ${responseType} جديد على الشكوى رقم ${complaintId} بواسطة ${respondedBy}`;
  
  await notifySuperAdmin(title, body, 'response', 'complaint', complaintId);
}

/**
 * إرسال إشعار عند تحديث بيانات الشكوى
 * @param {number} complaintId - معرف الشكوى
 * @param {string} updateType - نوع التحديث
 * @param {string} updatedBy - اسم الشخص الذي قام بالتحديث
 */
async function notifyComplaintUpdate(complaintId, updateType, updatedBy) {
  const title = 'تم تحديث بيانات شكوى';
  const body = `تم ${updateType} للشكوى رقم ${complaintId} بواسطة ${updatedBy}`;
  
  await notifySuperAdmin(title, body, 'info', 'complaint', complaintId);
}

/**
 * إرسال إشعار عند تعيين شكوى لموظف
 * @param {number} complaintId - معرف الشكوى
 * @param {string} employeeName - اسم الموظف المعين
 * @param {string} assignedBy - اسم الشخص الذي قام بالتعيين
 */
async function notifyComplaintAssignment(complaintId, employeeName, assignedBy) {
  const title = 'تم تعيين شكوى لموظف';
  const body = `تم تعيين الشكوى رقم ${complaintId} للموظف ${employeeName} بواسطة ${assignedBy}`;
  
  await notifySuperAdmin(title, body, 'assignment', 'complaint', complaintId);
}

/**
 * إرسال إشعار عند تصعيد شكوى
 * @param {number} complaintId - معرف الشكوى
 * @param {string} reason - سبب التصعيد
 */
async function notifyComplaintEscalation(complaintId, reason) {
  const title = 'تم تصعيد شكوى';
  const body = `تم تصعيد الشكوى رقم ${complaintId}. السبب: ${reason}`;
  
  await notifySuperAdmin(title, body, 'escalation', 'complaint', complaintId);
}

/**
 * إرسال إشعار عند إضافة مرفق جديد
 * @param {number} complaintId - معرف الشكوى
 * @param {string} fileName - اسم الملف المرفق
 * @param {string} uploadedBy - اسم الشخص الذي رفع الملف
 */
async function notifyNewAttachment(complaintId, fileName, uploadedBy) {
  const title = 'مرفق جديد للشكوى';
  const body = `تم إضافة مرفق جديد (${fileName}) للشكوى رقم ${complaintId} بواسطة ${uploadedBy}`;
  
  await notifySuperAdmin(title, body, 'info', 'complaint', complaintId);
}

/**
 * إرسال إشعار عند تحديث أي بيانات شكوى أخرى
 * @param {number} complaintId - معرف الشكوى
 * @param {string} fieldName - اسم الحقل المحدث
 * @param {string} oldValue - القيمة القديمة
 * @param {string} newValue - القيمة الجديدة
 * @param {string} updatedBy - اسم الشخص الذي قام بالتحديث
 */
async function notifyDataUpdate(complaintId, fieldName, oldValue, newValue, updatedBy) {
  const title = 'تم تحديث بيانات شكوى';
  const body = `تم تحديث ${fieldName} للشكوى رقم ${complaintId} من "${oldValue}" إلى "${newValue}" بواسطة ${updatedBy}`;
  
  await notifySuperAdmin(title, body, 'info', 'complaint', complaintId);
}

/**
 * إرسال إشعار عند حذف أو إلغاء شكوى
 * @param {number} complaintId - معرف الشكوى
 * @param {string} reason - سبب الحذف أو الإلغاء
 * @param {string} deletedBy - اسم الشخص الذي قام بالحذف
 */
async function notifyComplaintDeletion(complaintId, reason, deletedBy) {
  const title = 'تم حذف/إلغاء شكوى';
  const body = `تم حذف أو إلغاء الشكوى رقم ${complaintId}. السبب: ${reason}. بواسطة: ${deletedBy}`;
  
  await notifySuperAdmin(title, body, 'info', 'complaint', complaintId);
}

/**
 * إرسال إشعار عند تحويل شكوى بين الأقسام
 * @param {number} complaintId - معرف الشكوى
 * @param {string} fromDepartment - القسم السابق
 * @param {string} toDepartment - القسم الجديد
 * @param {string} transferredBy - اسم الشخص الذي قام بالتحويل
 */
async function notifyComplaintTransfer(complaintId, fromDepartment, toDepartment, transferredBy) {
  const title = 'تم تحويل شكوى بين الأقسام';
  const body = `تم تحويل الشكوى رقم ${complaintId} من قسم "${fromDepartment}" إلى قسم "${toDepartment}" بواسطة ${transferredBy}`;
  
  await notifySuperAdmin(title, body, 'info', 'complaint', complaintId);
}

module.exports = {
  notifySuperAdmin,
  notifyNewComplaint,
  notifyStatusUpdate,
  notifyNewResponse,
  notifyComplaintUpdate,
  notifyComplaintAssignment,
  notifyComplaintEscalation,
  notifyNewAttachment,
  notifyDataUpdate,
  notifyComplaintDeletion,
  notifyComplaintTransfer
};
