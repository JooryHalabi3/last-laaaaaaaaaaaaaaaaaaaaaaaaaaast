أ) المراجع والصلاحيات (Reference & RBAC)
1) roles

الغرض: تعريف أدوار النظام.

أهم الأعمدة:
RoleID (PK), RoleName.

ملاحظات: القيم القياسية: 1=SuperAdmin, 2=Employee, 3=Admin.

2) departments

الغرض: الأقسام داخل المستشفى.

أهم الأعمدة:
DepartmentID (PK), DepartmentName (UNIQUE), CreatedAt, UpdatedAt.

فهارس/قيود: فريد على DepartmentName.

علاقات: يُشار له من users, complaints, تصنيف الشكاوى، وبعض جداول التحليلات.

3) users

الغرض: جميع المستخدمين (سوبر/أدمن/موظف/مريض).

أهم الأعمدة (مع قيود فريدة):
UserID (PK), FullName, Email (UNIQUE), Username (UNIQUE),
Phone (UNIQUE, 10 أرقام), NationalID (UNIQUE, 10–15),
EmployeeNumber (UNIQUE, ثابت لا يتغير), PasswordHash,
RoleID (FK→roles), DepartmentID (FK→departments, NULLable), IsActive.

فهارس/Checks: تحقق طول الجوال والهوية؛ فهارس ضمن القيود الفريدة.

علاقات: مرجع من جداول عديدة (إسناد، ردود، إشعارات، سجلات…).

4) permissions

الغرض: كتالوج الصلاحيات الذرّية.

أهم الأعمدة:
PermissionID (PK), Code (UNIQUE), Label.

5) role_permissions

الغرض: ربط الصلاحيات بالأدوار (افتراضات).

أهم الأعمدة/المفاتيح:
RoleID (FK), PermissionID (FK), Allowed TINYINT(1),
(PK مركّب: RoleID, PermissionID).

6) user_permissions

الغرض: تجاوزات صلاحيات على مستوى المستخدم.

أهم الأعمدة/المفاتيح:
UserID (FK), PermissionID (FK), Allowed,
(PK مركّب: UserID, PermissionID).

ب) تصنيف الشكاوى (قسم ← سبب ← نوع فرعي)
7) complaint_reasons

الغرض: أسباب الشكوى لكل قسم.

أهم الأعمدة:
ReasonID (PK), DepartmentID (FK→departments), ReasonName.

ملاحظة: تُستورد من القاعدة القديمة بنفس IDs.

8) complaint_subtypes

الغرض: الأنواع الفرعية لكل سبب.

أهم الأعمدة:
SubtypeID (PK), ReasonID (FK→complaint_reasons), SubtypeName.

ملاحظة: تُستورد بنفس IDs القديمة.

علاقة مهمة: الشكوى ترتبط بـ SubtypeID (ومنها يُستنتج السبب والقسم).

ج) دورة حياة الشكاوى
9) complaints

الغرض: الكيان الأساسي للشكوى.

أهم الأعمدة:
ComplaintID (PK), ComplaintNumber (UNIQUE, يولَّد تلقائيًا),
Title, Description,
SubtypeID (FK), DepartmentID (FK, NULLable),
Status ENUM('open','in_progress','responded','closed'),
Priority ENUM('low','normal','high','urgent'),
Source ENUM('in_person','call_center'),
PatientUserID (FK→users, NULLable), CreatedBy (FK→users, NULLable),
CreatedAt, UpdatedAt, ClosedAt (NULLable).

فهارس: على Status, Priority, SubtypeID, DepartmentID, Source, CreatedAt.

ملاحظات: ClosedAt يُضبط/يصفَّر تلقائيًا عبر التريغر عند تغيير الحالة.

10) complaint_attachments

الغرض: مرفقات الشكوى.

أهم الأعمدة:
AttachmentID (PK), ComplaintID (FK→complaints),
FileURL, FileName, MimeType, SizeBytes,
UploadedBy (FK→users, SET NULL), CreatedAt.

حذف: ON DELETE CASCADE عند حذف الشكوى.

11) complaint_assignments

الغرض: سجلات الإسناد/إعادة الإسناد لموظف.

أهم الأعمدة:
AssignmentID (PK), ComplaintID (FK→complaints),
AssignedToUserID (FK→users),
AssignedByUserID (FK→users, SET NULL),
Notes,
FirstReminderAt, SecondReminderAt, EscalatedAt, ReminderCount,
CreatedAt.

فهارس: على ComplaintID, AssignedToUserID, CreatedAt.

12) complaint_replies

الغرض: الردود على الشكوى.

أهم الأعمدة:
ReplyID (PK), ComplaintID (FK→complaints),
AuthorUserID (FK→users, SET NULL),
Body, AttachmentURL, CreatedAt.

فهارس: على ComplaintID, CreatedAt.

13) complaint_history

الغرض: سجل تغييرات الحقول المهمة.

أهم الأعمدة:
HistoryID (PK), ComplaintID (FK→complaints),
ActorUserID (FK→users, SET NULL),
PrevStatus, NewStatus,
FieldChanged, OldValue, NewValue,
CreatedAt.

ملاحظة: يُملأ تلقائيًا بتريغرز + أحداث من التطبيق.

د) الإشعارات والسجلات وكلمات المرور
14) notifications

الغرض: إشعارات حسب الأحداث.

أهم الأعمدة:
NotificationID (PK), UserID (FK→users),
Type, Title, Body, IsRead, CreatedAt.

فهارس: على UserID, IsRead, (UserID, CreatedAt).

15) activitylogs

الغرض: تدقيق شامل للأحداث.

أهم الأعمدة:
LogID (PK), ActorUserID (FK→users, SET NULL),
EffectiveUserID (FK→users, SET NULL),
Action, Details(JSON), CreatedAt.

فهارس: على ActorUserID, EffectiveUserID, CreatedAt.

16) password_resets

الغرض: “نسيت كلمة المرور”.

أهم الأعمدة:
ResetID (PK), UserID (FK→users),
TokenHash (VARBINARY), ExpiresAt, UsedAt, CreatedAt.

فهارس: على UserID, ExpiresAt.

هـ) طلبات الحذف وإعادة فتح الشكاوى
17) delete_requests

الغرض: سير الحذف بمستويي موافقة (أدمن ثم سوبر).

أهم الأعمدة:
RequestID (PK), TableName, RecordPK,
RequestedBy (FK→users),
ConfirmedByAdminAt, ApprovedBySuperAt,
RejectedBy (FK→users, SET NULL), RejectedAt, RejectedReason,
Status ENUM('pending','admin_confirmed','approved','rejected'),
Snapshot(JSON), CreatedAt.

18) complaint_reopen_requests

الغرض: طلبات إعادة فتح شكوى مغلقة (الموظف يطلب، السوبر يعتمد/يرفض).

أهم الأعمدة:
ReopenID (PK), ComplaintID (FK→complaints),
RequestedBy (FK→users),
Reason,
Status ENUM('pending','approved','rejected'),
ApprovedBy (FK→users, SET NULL), ApprovedAt,
RejectedBy (FK→users, SET NULL), RejectedAt, RejectedReason,
CreatedAt.

فهارس: على ComplaintID, Status.

و) بيانات الداشبورد التحليلية (اختياري)
19) report_937_imports / 20) report_937_rows

الغرض: استيراد/عرض بلاغات 937.

أهم الأعمدة (imports):
ImportID (PK), UploadedBy (FK→users), SourceFileName, FromDate, ToDate, Note, CreatedAt.

أهم الأعمدة (rows):
RowID (PK), ImportID (FK→imports, CASCADE),
OccurredAt (+ مشتقات Year, Quarter),
DepartmentID (FK), DepartmentName, CategoryName,
Description, RawData(JSON), RowHash (UNIQUE per Import), CreatedAt.

فهارس: على التاريخ/السنة/الربع/القسم/التصنيف.

21) secret_visitor_imports / 22) secret_visitor_rows

الغرض: تقارير الزائر السري.

أهم الأعمدة (rows):
DepartmentName, NoteText, ResponsibleDepartment,
ExecutionStatus ENUM('executed','not_executed'),
حقول التاريخ والمشتقات والفهارس المشابهة.

23) misconduct_imports / 24) misconduct_rows

الغرض: سوء التعامل.

أهم الأعمدة (rows):
OccurredAt, DepartmentName, IncidentType, Status, Description,
RawData(JSON), RowHash, مشتقات التاريخ، فهارس على Status/القسم/التاريخ.

25) pressganey_imports / 26) pressganey_rows

الغرض: رضا المرضى (PressGaney).

أهم الأعمدة (rows):
OccurredAt, DepartmentName, QuestionCode, QuestionText,
ScoreValue, SampleSize, RawData(JSON), مشتقات التاريخ، فهارس على السؤال والقسم.

27) report_exports

الغرض: تتبّع كل عمليات التصدير (Excel/PDF).

أهم الأعمدة:
ExportID (PK), RequestedBy (FK→users),
Format ENUM('Excel','PDF'),
FromDate, ToDate, DataTypes(JSON), ResultFileURL, CreatedAt.

ز) المميّزون
28) featured_people

الغرض: بطاقات “المميّزين” المعروضة في الهوم.

أهم الأعمدة:
FeaturedID (PK), PersonName, EmployeeUserID (FK→users, SET NULL),
Title, PhotoURL, Bio,
DepartmentID (FK→departments, SET NULL),
FeaturedFrom, FeaturedTo, IsActive,
AddedBy (FK→users), ApprovedBy (FK→users, SET NULL),
الطوابع الزمنية.

صلاحيات مقترحة:
featured.manage (سوبر)، و featured.add (قد تُمنح لأدمن معيّن للإضافة فقط).

ح) العروض (Views) المهمة
1) v_department_complaint_counts

الغرض: ملخص عدادات الشكاوى لكل قسم (إجمالي/مفتوحة/قيد المعالجة/مستجابة/مغلقة).

2) v_complaints_enriched (محدّث بالنوع ووقت الإغلاق)

الغرض: عرض مُثْرى يربط الشكوى بـ Subtype → Reason → Department ويضيف Source, ClosedAt.

3) لوحات حسب نوع الشكوى:

v_source_counts_daily: عدادات يومية لكل نوع (مع تفاصيل الحالات).

v_source_dept_counts: تجميع حسب القسم + النوع.

v_source_duration_stats: إحصاءات مدة الإنجاز لكل نوع (متوسط/أدنى/أقصى).

v_complaint_durations: تفاصيل المدة بالساعة/اليوم لكل شكوى.

v_source_detail_rows: قائمة تفاصيل موحدة لصفحة التفاصيل.

ط) التريغرز (Triggers)

trg_complaints_after_insert: توليد ComplaintNumber بصيغة YYYYMMDD-000123.

trg_complaints_after_update (مُحدَّث):

تسجيل تغييرات الحالة/القسم/الأولوية في complaint_history.

ضبط ClosedAt عند الانتقال إلى closed وتصفيره عند الخروج منها.

trg_users_block_empno_update: منع تعديل EmployeeNumber بعد الإنشاء.

trg_single_superadmin_insert / trg_single_superadmin_update: ضمان سوبر واحد فقط.

trg_users_validate_insert / trg_users_validate_update: تحقق من 10 أرقام للجوال و10–15 للهوية/الإقامة.

ي) ملاحظات وقيود مهمة

فريد (UNIQUE):
users.Email, users.Phone, users.NationalID, users.EmployeeNumber, users.Username,
departments.DepartmentName, permissions.Code.

Checks:
Phone يطابق ^[0-9]{10}$، طول NationalID بين 10 و15.

فهارس أداء:
complaints(Status, Priority, SubtypeID, DepartmentID, Source, CreatedAt)،
complaint_assignments(ComplaintID, AssignedToUserID, CreatedAt)،
notifications(UserID, CreatedAt)، activitylogs(ActorUserID, EffectiveUserID, CreatedAt)،
مشتقات التاريخ (Year/Quarter) في جداول التحليل.

ك) منطق تذكيرات SLA (3/6/9 أيام)

يبدأ العدّ من أحدث سجل في complaint_assignments.CreatedAt.

بدون رد/تحديث من الموظف المُسنَد:

اليوم 3: sla.first إلى الموظف.

اليوم 6: sla.second إلى الموظف.

اليوم 9: sla.escalation إلى الموظف + الأدمن + السوبر.

أي رد/تغيير حالة من الموظف يُصفّر العدّ.

ل) استيراد التصنيفات من القاعدة القديمة

يجب استيراد الأسباب/الأنواع الفرعية بنفس IDs (وبحسب أقسامك الحالية) لضمان التطابق:

complaint_reasons(ReasonID, DepartmentID, ReasonName)

complaint_subtypes(SubtypeID, ReasonID, SubtypeName)