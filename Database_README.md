3oun – دليل قاعدة البيانات (README)

المحرك: MySQL 8
الترميز: utf8mb4 / utf8mb4_unicode_ci
الأدوار القياسية: 1 = SuperAdmin، 2 = Employee، 3 = Admin

هذا الدليل يشرح كل جدول في قاعدة بيانات 3oun: الغرض، أهم الأعمدة، والعلاقات السريعة بين الجداول. في النهاية ستجد ملخصًا للتريغرز (Triggers) والعروض (Views) والقيود المهمة.

أ) المراجع والصلاحيات (Reference & RBAC)
1) roles

الغرض: تعريف أدوار النظام.

أهم الأعمدة: RoleID (PK)، RoleName.

ملاحظات: القيم القياسية: (1) SuperAdmin، (2) Employee، (3) Admin.

2) hospitals

الغرض: المستشفيات (لدعم العمل متعدد المستشفيات).

أهم الأعمدة: HospitalID (PK)، HospitalName (فريد).

علاقات: مرجع لـ departments و users وبعض جداول الاستيراد.

3) departments

الغرض: الأقسام داخل المستشفيات.

أهم الأعمدة: DepartmentID (PK)، HospitalID (FK)، DepartmentName.

قيود: (HospitalID, DepartmentName) فريد.

علاقات: أب لسُلّم تصنيف الشكاوى (reasons → subtypes) ومرجع اختياري داخل complaints.

4) users

الغرض: جميع المستخدمين (سوبر/أدمن/موظف/مريض).

أهم الأعمدة:

تعريف: FullName, Email(فريد), Username(فريد), Phone(فريد و10 أرقام), NationalID(فريد و10–15 خانة), EmployeeNumber(فريد وغير قابل للتغيير).

تنظيم: RoleID (FK)، HospitalID (FK)، DepartmentID (FK)، IsActive.

قيود: فحوصات على طول Phone وNationalID.

ملاحظات: يوجد تريغر يمنع تعديل EmployeeNumber بعد إنشائه + تريغر يضمن وجود سوبر واحد فقط.

5) permissions

الغرض: كتالوج الصلاحيات الذرّية (مثل: complaint.assign, reports.export…).

أهم الأعمدة: PermissionID (PK)، Code (فريد)، Label.

6) role_permissions

الغرض: ربط الأدوار بالصلاحيات (افتراضيًا).

المفتاح: مركّب (RoleID, PermissionID).

علاقات: RoleID → roles، وPermissionID → permissions.

7) user_permissions

الغرض: تجاوزات على مستوى المستخدم (Overrides) فوق الدور.

المفتاح: مركّب (UserID, PermissionID).

علاقات: UserID → users، وPermissionID → permissions.

ب) تصنيف الشكاوى (قسم ← سبب ← نوع فرعي)
8) complaint_reasons

الغرض: أسباب الشكوى لكل قسم (مطابقة للقاعدة القديمة بنفس الـ IDs).

أهم الأعمدة: ReasonID (PK)، DepartmentID (FK)، ReasonName.

9) complaint_subtypes

الغرض: أنواع فرعية لكل سبب (مطابقة للقديمة بنفس الـ IDs).

أهم الأعمدة: SubtypeID (PK)، ReasonID (FK)، SubtypeName.

ملحوظة: الشكوى ترتبط بـ SubtypeID (أدق مستوى)، ومنه نستنتج السبب والقسم.

ج) دورة حياة الشكاوى
10) complaints

الغرض: الكيان الأساسي للشكوى.

أهم الأعمدة:

هوية: ComplaintID (PK)، ComplaintNumber (يتولّد تلقائيًا بصيغة YYYYMMDD-000123).

المحتوى: Title, Description.

التصنيف: SubtypeID (FK)، DepartmentID (FK اختياري للتقارير).

الحالة/الأولوية: Status {open, in_progress, responded, closed}، Priority {low, normal, high, urgent}، وIsInPerson.

الربط بالمستخدمين: PatientUserID (إن وُجد)، CreatedBy (منشئ الشكوى).

التواريخ: CreatedAt, UpdatedAt.

فهارس: على Status, SubtypeID, DepartmentID, CreatedAt.

11) complaint_attachments

الغرض: مرفقات الشكوى (صور/ملفات).

أهم الأعمدة: AttachmentID، ComplaintID (FK)، FileURL، معلومات الملف.

12) complaint_assignments

الغرض: إسناد/إعادة إسناد الشكوى لموظف (بواسطة الأدمن).

أهم الأعمدة: AssignedToUserID (الموظف)، AssignedByUserID (الأدمن – يسمح NULL عند حذف الأدمن)، ملاحظات الإسناد.

حقول SLA: FirstReminderAt, SecondReminderAt, EscalatedAt, ReminderCount.

علاقات: ComplaintID → complaints، AssignedToUserID/AssignedByUserID → users.

13) complaint_replies

الغرض: الردود (سلسلة نقاش) على الشكوى.

أهم الأعمدة: ComplaintID (FK)، AuthorUserID (يسمح NULL عند حذف الكاتب)، Body, AttachmentURL, CreatedAt.

14) complaint_history

الغرض: سجل تغييرات الحقول المهمة (الحالة/القسم/الأولوية/…).

أهم الأعمدة: ComplaintID، ActorUserID (من نفّذ)، PrevStatus, NewStatus, FieldChanged, OldValue, NewValue, CreatedAt.

ملاحظات: يُحدَّث تلقائيًا بتريغر عند تغيير الشكوى + أحداث من التطبيق.

د) الإشعارات والسجلات وكلمات المرور
15) notifications

الغرض: إشعارات للمستخدمين حسب الأحداث والصلاحيات.

أمثلة للنوع (Type):
assign, reply, status_change, sla.first, sla.second, sla.escalation,
delete.approve, delete.reject, reopen.request, reopen.approve, …

16) activitylogs

الغرض: تدقيق شامل لكل الأحداث.

أهم الأعمدة: ActorUserID (المستخدم الحقيقي)، EffectiveUserID (المُنتحل عند السويتش)، Action، Details(JSON)، CreatedAt.

17) password_resets

الغرض: دعم “نسيت كلمة المرور” عبر رموز مؤقتة.

أهم الأعمدة: TokenHash, ExpiresAt, UsedAt.

هـ) طلبات الحذف وإعادة فتح الشكاوى
18) delete_requests

الغرض: سير عمل الحذف بموافقتين:
أدمن يطلب ويؤكد → سوبر يوافق أو يرفض.

الحالات: pending, admin_confirmed, approved, rejected.

أهم الأعمدة: اسم الجدول/المفتاح (TableName, RecordPK)، RequestedBy، Snapshot(JSON)، تواريخ/هوية الموافقات أو الرفض.

19) complaint_reopen_requests

الغرض: طلبات إعادة فتح الشكوى بعد إغلاقها (يرسلها الموظف، يعتمدها السوبر).

الحالات: pending, approved, rejected.

أهم الأعمدة: ComplaintID, RequestedBy, Reason, ApprovedBy/At أو RejectedBy/At/Reason.

و) تخزين بيانات الداشبورد والتصدير
20) report_937_imports & 21) report_937_rows

الغرض: استيراد/عرض بيانات بلاغات 937 مع فلاتر (تاريخ/ربع/قسم/تصنيف).

ملاحظات: RowHash لمنع التكرار داخل نفس الاستيراد؛ مشتقات Year/Quarter لتسريع الاستعلام.

22) secret_visitor_imports & 23) secret_visitor_rows

الغرض: تقارير الزائر السري (منفّذ/غير منفّذ) وربطها بالأقسام/الإدارات مع فلاتر.

24) misconduct_imports & 25) misconduct_rows

الغرض: حالات سوء التعامل (تاريخ/قسم/نوع/حالة + بيانات خام JSON).

26) pressganey_imports & 27) pressganey_rows

الغرض: نتائج رضا المرضى (أسئلة/أكواد/درجات/حجم عينة + بيانات خام).

28) report_exports

الغرض: تسجيل كل عمليات التصدير (Excel/PDF) مع النطاق والأنواع المختارة، وربط الملف الناتج إن وُجد.

ز) صفحة المميّزين
29) featured_people

الغرض: إدارة بطاقات “الموظف/القسم المتميز” المعروضة على صفحات الهوم.

أهم الأعمدة: PersonName, EmployeeUserID (اختياري)، Title, PhotoURL, Bio, نطاق (HospitalID/DepartmentID)، فترة (FeaturedFrom/To)، حالة (IsActive)، AddedBy, ApprovedBy.

صلاحيات: featured.manage (سوبر)، ويمكن منح featured.add لأدمن محدد للإضافة ضمن نطاقه.

التريغرز (Triggers)

trg_complaints_after_insert
توليد رقم الشكوى ComplaintNumber بصيغة YYYYMMDD-000123 بعد الإدراج.

trg_complaints_after_update
تسجيل تغييرات الحالة/القسم/الأولوية تلقائيًا في complaint_history.

trg_users_block_empno_update
منع تعديل رقم الموظف EmployeeNumber بعد إنشائه (قيمة ثابتة).

trg_single_superadmin_insert / trg_single_superadmin_update
ضمان وجود سوبر أدمن واحد فقط في النظام.

trg_users_validate_insert / trg_users_validate_update
تحقق إضافي من رقم الجوال (10 أرقام) وطول الهوية/الإقامة (10–15).

العروض (Views)

v_department_complaint_counts
ملخص أعداد الشكاوى لكل قسم: إجمالي/مفتوحة/قيد المعالجة/مستجابة/مغلقة.

v_complaints_enriched
عرض مُثْرى يربط الشكوى مع Subtype → Reason → Department لتسهيل الاستعلامات والتقارير.

القيود والفهارس المهمة (Highlights)

Uniq:

users.Email, users.Phone, users.NationalID, users.EmployeeNumber, users.Username

hospitals.HospitalName

(departments.HospitalID, DepartmentName)

permissions.Code

Checks:

Phone يطابق ^[0-9]{10}$

طول NationalID بين 10 و15

Indexes:

complaints(Status, SubtypeID, DepartmentID, CreatedAt)

complaint_assignments(ComplaintID, AssignedToUserID)

تواريخ الإنشاء في notifications وactivitylogs؛ فهارس سنة/ربع للجداول التحليلية.

إشعارات SLA (3/6/9 أيام) – منطق مختصر

يبدأ العدّ من وقت الإسناد في complaint_assignments.

بدون أي رد/تحديث من الموظف المُسنَد إليه:

اليوم 3: إشعار للموظف (sla.first).

اليوم 6: إشعار ثانٍ للموظف (sla.second).

اليوم 9: تصعيد للأدمن + السوبر + الموظف (sla.escalation).

أي رد/تحديث من الموظف يعيد العدّ ويوقف التذكيرات تلقائيًا.

استيراد التصنيفات من القاعدة القديمة

يجب استيراد الأقسام/الأسباب/الأنواع الفرعية بنفس المعرفات (IDs) لضمان التطابق:

complaint_reasons(ReasonID, DepartmentID, ReasonName)

complaint_subtypes(SubtypeID, ReasonID, SubtypeName)

ملاحظات ختامية

تم تصميم الجداول لتغطي: إدارة الشكاوى كاملة، الإسناد، التاريخ، الإشعارات، الداشبورد، التصدير، سير عمل الحذف، وإعادة فتح الشكاوى.

أعمدة مثل AssignedByUserID وAuthorUserID تسمح بـ NULL عند الحذف (لتفادي أخطاء FK مع ON DELETE SET NULL).

منع تغيير EmployeeNumber يتم بتريغر + تحقق في الباك.

السوبر أدمن هو الوحيد المخوّل بإدارة الصلاحيات وتغيير الأدوار واعتماد الحذف وإعادة فتح الشكاوى.