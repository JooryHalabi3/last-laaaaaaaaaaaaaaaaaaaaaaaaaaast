-- MySQL dump 10.13  Distrib 8.0.30, for Win64 (x86_64)
--
-- Host: localhost    Database: 3oun
-- ------------------------------------------------------
-- Server version	8.0.30

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activitylogs`
--

DROP TABLE IF EXISTS `activitylogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activitylogs` (
  `LogID` bigint NOT NULL AUTO_INCREMENT,
  `ActorUserID` int DEFAULT NULL,
  `EffectiveUserID` int DEFAULT NULL,
  `Action` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Details` json DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`LogID`),
  KEY `idx_al_actor` (`ActorUserID`),
  KEY `idx_al_effective` (`EffectiveUserID`),
  KEY `idx_al_created` (`CreatedAt`),
  CONSTRAINT `fk_al_actor` FOREIGN KEY (`ActorUserID`) REFERENCES `users` (`UserID`) ON DELETE SET NULL,
  CONSTRAINT `fk_al_effective` FOREIGN KEY (`EffectiveUserID`) REFERENCES `users` (`UserID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activitylogs`
--

LOCK TABLES `activitylogs` WRITE;
/*!40000 ALTER TABLE `activitylogs` DISABLE KEYS */;
/*!40000 ALTER TABLE `activitylogs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaint_assignments`
--

DROP TABLE IF EXISTS `complaint_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaint_assignments` (
  `AssignmentID` bigint NOT NULL AUTO_INCREMENT,
  `ComplaintID` bigint NOT NULL,
  `AssignedToUserID` int NOT NULL,
  `AssignedByUserID` int DEFAULT NULL,
  `Notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `FirstReminderAt` datetime DEFAULT NULL,
  `SecondReminderAt` datetime DEFAULT NULL,
  `EscalatedAt` datetime DEFAULT NULL,
  `ReminderCount` tinyint NOT NULL DEFAULT '0',
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`AssignmentID`),
  KEY `idx_ca_c` (`ComplaintID`),
  KEY `idx_ca_to` (`AssignedToUserID`),
  KEY `idx_ca_created` (`CreatedAt`),
  KEY `fk_ca_by` (`AssignedByUserID`),
  CONSTRAINT `fk_ca_by` FOREIGN KEY (`AssignedByUserID`) REFERENCES `users` (`UserID`) ON DELETE SET NULL,
  CONSTRAINT `fk_ca_c` FOREIGN KEY (`ComplaintID`) REFERENCES `complaints` (`ComplaintID`) ON DELETE CASCADE,
  CONSTRAINT `fk_ca_to` FOREIGN KEY (`AssignedToUserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaint_assignments`
--

LOCK TABLES `complaint_assignments` WRITE;
/*!40000 ALTER TABLE `complaint_assignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `complaint_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaint_attachments`
--

DROP TABLE IF EXISTS `complaint_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaint_attachments` (
  `AttachmentID` bigint NOT NULL AUTO_INCREMENT,
  `ComplaintID` bigint NOT NULL,
  `FileURL` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `FileName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MimeType` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `SizeBytes` bigint DEFAULT NULL,
  `UploadedBy` int DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`AttachmentID`),
  KEY `idx_att_c` (`ComplaintID`),
  KEY `fk_att_u` (`UploadedBy`),
  CONSTRAINT `fk_att_c` FOREIGN KEY (`ComplaintID`) REFERENCES `complaints` (`ComplaintID`) ON DELETE CASCADE,
  CONSTRAINT `fk_att_u` FOREIGN KEY (`UploadedBy`) REFERENCES `users` (`UserID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaint_attachments`
--

LOCK TABLES `complaint_attachments` WRITE;
/*!40000 ALTER TABLE `complaint_attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `complaint_attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaint_history`
--

DROP TABLE IF EXISTS `complaint_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaint_history` (
  `HistoryID` bigint NOT NULL AUTO_INCREMENT,
  `ComplaintID` bigint NOT NULL,
  `ActorUserID` int DEFAULT NULL,
  `PrevStatus` enum('open','in_progress','responded','closed') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NewStatus` enum('open','in_progress','responded','closed') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `FieldChanged` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `OldValue` text COLLATE utf8mb4_unicode_ci,
  `NewValue` text COLLATE utf8mb4_unicode_ci,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`HistoryID`),
  KEY `idx_ch_c` (`ComplaintID`),
  KEY `fk_ch_actor` (`ActorUserID`),
  CONSTRAINT `fk_ch_actor` FOREIGN KEY (`ActorUserID`) REFERENCES `users` (`UserID`) ON DELETE SET NULL,
  CONSTRAINT `fk_ch_c` FOREIGN KEY (`ComplaintID`) REFERENCES `complaints` (`ComplaintID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaint_history`
--

LOCK TABLES `complaint_history` WRITE;
/*!40000 ALTER TABLE `complaint_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `complaint_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaint_reasons`
--

DROP TABLE IF EXISTS `complaint_reasons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaint_reasons` (
  `ReasonID` int NOT NULL,
  `DepartmentID` int NOT NULL,
  `ReasonName` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`ReasonID`),
  KEY `fk_reason_dept` (`DepartmentID`),
  CONSTRAINT `fk_reason_dept` FOREIGN KEY (`DepartmentID`) REFERENCES `departments` (`DepartmentID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaint_reasons`
--

LOCK TABLES `complaint_reasons` WRITE;
/*!40000 ALTER TABLE `complaint_reasons` DISABLE KEYS */;
/*!40000 ALTER TABLE `complaint_reasons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaint_reopen_requests`
--

DROP TABLE IF EXISTS `complaint_reopen_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaint_reopen_requests` (
  `ReopenID` bigint NOT NULL AUTO_INCREMENT,
  `ComplaintID` bigint NOT NULL,
  `RequestedBy` int NOT NULL,
  `Reason` text COLLATE utf8mb4_unicode_ci,
  `Status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `ApprovedBy` int DEFAULT NULL,
  `ApprovedAt` datetime DEFAULT NULL,
  `RejectedBy` int DEFAULT NULL,
  `RejectedAt` datetime DEFAULT NULL,
  `RejectedReason` text COLLATE utf8mb4_unicode_ci,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ReopenID`),
  KEY `idx_reopen_c` (`ComplaintID`),
  KEY `idx_reopen_status` (`Status`),
  KEY `RequestedBy` (`RequestedBy`),
  KEY `ApprovedBy` (`ApprovedBy`),
  KEY `RejectedBy` (`RejectedBy`),
  CONSTRAINT `complaint_reopen_requests_ibfk_1` FOREIGN KEY (`ComplaintID`) REFERENCES `complaints` (`ComplaintID`) ON DELETE CASCADE,
  CONSTRAINT `complaint_reopen_requests_ibfk_2` FOREIGN KEY (`RequestedBy`) REFERENCES `users` (`UserID`) ON DELETE CASCADE,
  CONSTRAINT `complaint_reopen_requests_ibfk_3` FOREIGN KEY (`ApprovedBy`) REFERENCES `users` (`UserID`) ON DELETE SET NULL,
  CONSTRAINT `complaint_reopen_requests_ibfk_4` FOREIGN KEY (`RejectedBy`) REFERENCES `users` (`UserID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaint_reopen_requests`
--

LOCK TABLES `complaint_reopen_requests` WRITE;
/*!40000 ALTER TABLE `complaint_reopen_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `complaint_reopen_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaint_replies`
--

DROP TABLE IF EXISTS `complaint_replies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaint_replies` (
  `ReplyID` bigint NOT NULL AUTO_INCREMENT,
  `ComplaintID` bigint NOT NULL,
  `AuthorUserID` int DEFAULT NULL,
  `Body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `AttachmentURL` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ReplyID`),
  KEY `idx_cr_c` (`ComplaintID`),
  KEY `idx_cr_created` (`CreatedAt`),
  KEY `fk_cr_u` (`AuthorUserID`),
  CONSTRAINT `fk_cr_c` FOREIGN KEY (`ComplaintID`) REFERENCES `complaints` (`ComplaintID`) ON DELETE CASCADE,
  CONSTRAINT `fk_cr_u` FOREIGN KEY (`AuthorUserID`) REFERENCES `users` (`UserID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaint_replies`
--

LOCK TABLES `complaint_replies` WRITE;
/*!40000 ALTER TABLE `complaint_replies` DISABLE KEYS */;
/*!40000 ALTER TABLE `complaint_replies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaint_subtypes`
--

DROP TABLE IF EXISTS `complaint_subtypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaint_subtypes` (
  `SubtypeID` int NOT NULL,
  `ReasonID` int NOT NULL,
  `SubtypeName` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`SubtypeID`),
  KEY `fk_subtype_reason` (`ReasonID`),
  CONSTRAINT `fk_subtype_reason` FOREIGN KEY (`ReasonID`) REFERENCES `complaint_reasons` (`ReasonID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaint_subtypes`
--

LOCK TABLES `complaint_subtypes` WRITE;
/*!40000 ALTER TABLE `complaint_subtypes` DISABLE KEYS */;
/*!40000 ALTER TABLE `complaint_subtypes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaints`
--

DROP TABLE IF EXISTS `complaints`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaints` (
  `ComplaintID` bigint NOT NULL AUTO_INCREMENT,
  `ComplaintNumber` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Description` text COLLATE utf8mb4_unicode_ci,
  `SubtypeID` int DEFAULT NULL,
  `DepartmentID` int DEFAULT NULL,
  `Status` enum('open','in_progress','responded','closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `Priority` enum('low','normal','high','urgent') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal',
  `Source` enum('in_person','call_center') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'in_person',
  `PatientID` int DEFAULT NULL,
  `CreatedBy` int DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ClosedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`ComplaintID`),
  UNIQUE KEY `ComplaintNumber` (`ComplaintNumber`),
  KEY `idx_c_dept` (`DepartmentID`),
  KEY `idx_c_status` (`Status`),
  KEY `idx_c_priority` (`Priority`),
  KEY `idx_c_subtype` (`SubtypeID`),
  KEY `idx_c_created` (`CreatedAt`),
  KEY `idx_c_source` (`Source`),
  KEY `idx_c_source_created` (`Source`,`CreatedAt`),
  KEY `idx_c_patient` (`PatientID`),
  KEY `fk_c_createdby` (`CreatedBy`),
  CONSTRAINT `fk_c_createdby` FOREIGN KEY (`CreatedBy`) REFERENCES `users` (`UserID`),
  CONSTRAINT `fk_c_dept` FOREIGN KEY (`DepartmentID`) REFERENCES `departments` (`DepartmentID`),
  CONSTRAINT `fk_c_patient2` FOREIGN KEY (`PatientID`) REFERENCES `patients` (`PatientID`) ON DELETE SET NULL,
  CONSTRAINT `fk_c_subtype` FOREIGN KEY (`SubtypeID`) REFERENCES `complaint_subtypes` (`SubtypeID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaints`
--

LOCK TABLES `complaints` WRITE;
/*!40000 ALTER TABLE `complaints` DISABLE KEYS */;
/*!40000 ALTER TABLE `complaints` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delete_requests`
--

DROP TABLE IF EXISTS `delete_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delete_requests` (
  `RequestID` bigint NOT NULL AUTO_INCREMENT,
  `TableName` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `RecordPK` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `RequestedBy` int NOT NULL,
  `ConfirmedByAdminAt` datetime DEFAULT NULL,
  `ApprovedBySuperAt` datetime DEFAULT NULL,
  `RejectedBy` int DEFAULT NULL,
  `RejectedAt` datetime DEFAULT NULL,
  `RejectedReason` text COLLATE utf8mb4_unicode_ci,
  `Status` enum('pending','admin_confirmed','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `Snapshot` json DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`RequestID`),
  KEY `fk_dr_req` (`RequestedBy`),
  KEY `fk_dr_rej` (`RejectedBy`),
  CONSTRAINT `fk_dr_rej` FOREIGN KEY (`RejectedBy`) REFERENCES `users` (`UserID`) ON DELETE SET NULL,
  CONSTRAINT `fk_dr_req` FOREIGN KEY (`RequestedBy`) REFERENCES `users` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delete_requests`
--

LOCK TABLES `delete_requests` WRITE;
/*!40000 ALTER TABLE `delete_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `delete_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `DepartmentID` int NOT NULL AUTO_INCREMENT,
  `DepartmentName` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`DepartmentID`),
  UNIQUE KEY `uq_dept_name` (`DepartmentName`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'General','2025-08-30 16:50:07','2025-08-30 16:50:07');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `featured_people`
--

DROP TABLE IF EXISTS `featured_people`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `featured_people` (
  `FeaturedID` bigint NOT NULL AUTO_INCREMENT,
  `PersonName` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `EmployeeUserID` int DEFAULT NULL,
  `Title` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `PhotoURL` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Bio` text COLLATE utf8mb4_unicode_ci,
  `DepartmentID` int DEFAULT NULL,
  `FeaturedFrom` date DEFAULT NULL,
  `FeaturedTo` date DEFAULT NULL,
  `IsActive` tinyint(1) NOT NULL DEFAULT '1',
  `AddedBy` int NOT NULL,
  `ApprovedBy` int DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`FeaturedID`),
  KEY `EmployeeUserID` (`EmployeeUserID`),
  KEY `DepartmentID` (`DepartmentID`),
  KEY `AddedBy` (`AddedBy`),
  KEY `ApprovedBy` (`ApprovedBy`),
  CONSTRAINT `featured_people_ibfk_1` FOREIGN KEY (`EmployeeUserID`) REFERENCES `users` (`UserID`) ON DELETE SET NULL,
  CONSTRAINT `featured_people_ibfk_2` FOREIGN KEY (`DepartmentID`) REFERENCES `departments` (`DepartmentID`) ON DELETE SET NULL,
  CONSTRAINT `featured_people_ibfk_3` FOREIGN KEY (`AddedBy`) REFERENCES `users` (`UserID`),
  CONSTRAINT `featured_people_ibfk_4` FOREIGN KEY (`ApprovedBy`) REFERENCES `users` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `featured_people`
--

LOCK TABLES `featured_people` WRITE;
/*!40000 ALTER TABLE `featured_people` DISABLE KEYS */;
/*!40000 ALTER TABLE `featured_people` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `misconduct_imports`
--

DROP TABLE IF EXISTS `misconduct_imports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `misconduct_imports` (
  `ImportID` bigint NOT NULL AUTO_INCREMENT,
  `UploadedBy` int NOT NULL,
  `SourceFileName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `FromDate` date DEFAULT NULL,
  `ToDate` date DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ImportID`),
  KEY `UploadedBy` (`UploadedBy`),
  CONSTRAINT `misconduct_imports_ibfk_1` FOREIGN KEY (`UploadedBy`) REFERENCES `users` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `misconduct_imports`
--

LOCK TABLES `misconduct_imports` WRITE;
/*!40000 ALTER TABLE `misconduct_imports` DISABLE KEYS */;
/*!40000 ALTER TABLE `misconduct_imports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `misconduct_rows`
--

DROP TABLE IF EXISTS `misconduct_rows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `misconduct_rows` (
  `RowID` bigint NOT NULL AUTO_INCREMENT,
  `ImportID` bigint NOT NULL,
  `OccurredAt` date DEFAULT NULL,
  `DepartmentName` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `IncidentType` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Status` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Description` text COLLATE utf8mb4_unicode_ci,
  `RawData` json DEFAULT NULL,
  `RowHash` varbinary(32) DEFAULT NULL,
  `Year` smallint GENERATED ALWAYS AS (year(`OccurredAt`)) STORED,
  `Quarter` tinyint GENERATED ALWAYS AS (quarter(`OccurredAt`)) STORED,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`RowID`),
  UNIQUE KEY `uq_mc_row` (`ImportID`,`RowHash`),
  KEY `idx_mc_date` (`OccurredAt`),
  KEY `idx_mc_yq` (`Year`,`Quarter`),
  KEY `idx_mc_dept` (`DepartmentName`),
  KEY `idx_mc_status` (`Status`),
  CONSTRAINT `misconduct_rows_ibfk_1` FOREIGN KEY (`ImportID`) REFERENCES `misconduct_imports` (`ImportID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `misconduct_rows`
--

LOCK TABLES `misconduct_rows` WRITE;
/*!40000 ALTER TABLE `misconduct_rows` DISABLE KEYS */;
/*!40000 ALTER TABLE `misconduct_rows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `NotificationID` bigint NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `Type` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Body` text COLLATE utf8mb4_unicode_ci,
  `IsRead` tinyint(1) NOT NULL DEFAULT '0',
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`NotificationID`),
  KEY `idx_n_user` (`UserID`),
  KEY `idx_n_read` (`IsRead`),
  KEY `idx_n_created` (`CreatedAt`),
  KEY `idx_n_user_created` (`UserID`,`CreatedAt`),
  CONSTRAINT `fk_n_u` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_resets` (
  `ResetID` bigint NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `TokenHash` varbinary(64) NOT NULL,
  `ExpiresAt` datetime NOT NULL,
  `UsedAt` datetime DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ResetID`),
  KEY `idx_pr_user` (`UserID`),
  KEY `idx_pr_expires` (`ExpiresAt`),
  CONSTRAINT `fk_pr_user` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_resets`
--

LOCK TABLES `password_resets` WRITE;
/*!40000 ALTER TABLE `password_resets` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_resets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patients`
--

DROP TABLE IF EXISTS `patients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patients` (
  `PatientID` int NOT NULL AUTO_INCREMENT,
  `FullName` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `NationalID` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MedicalRecordNumber` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Gender` enum('male','female') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `DateOfBirth` date DEFAULT NULL,
  `Notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`PatientID`),
  UNIQUE KEY `uq_pat_national` (`NationalID`),
  UNIQUE KEY `uq_pat_mrn` (`MedicalRecordNumber`),
  KEY `idx_pat_phone` (`Phone`),
  CONSTRAINT `chk_pat_nid_len` CHECK (((`NationalID` is null) or (char_length(`NationalID`) between 10 and 15))),
  CONSTRAINT `chk_pat_phone_len` CHECK (((`Phone` is null) or regexp_like(`Phone`,_utf8mb4'^[0-9]{10}$')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patients`
--

LOCK TABLES `patients` WRITE;
/*!40000 ALTER TABLE `patients` DISABLE KEYS */;
/*!40000 ALTER TABLE `patients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `PermissionID` int NOT NULL AUTO_INCREMENT,
  `Code` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Label` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`PermissionID`),
  UNIQUE KEY `Code` (`Code`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'permissions.manage','Manage permissions UI & APIs'),(2,'role_permissions.manage','Manage role-level permissions'),(3,'user_permissions.manage','Manage per-user permission overrides'),(4,'users.manage_all','Manage all users'),(5,'dept.employees.manage_basic','Manage own department employees (basic)'),(6,'departments.manage','Manage departments'),(7,'reports.import','Import dashboard data'),(8,'reports.export','Export dashboard data'),(9,'featured.manage','Manage featured people/cards'),(10,'featured.add','Add featured people/cards'),(11,'dashboard.access','Access dashboards'),(12,'complaint.create','Create complaint'),(13,'complaint.view_dept','View department complaints'),(14,'complaint.view_all','View all complaints'),(15,'complaint.view_own','View own/assigned complaints'),(16,'complaint.assign','Assign complaint'),(17,'complaint.reply','Reply to complaint'),(18,'complaint.status','Change complaint status'),(19,'complaint.delete_request_approve','Approve/Reject delete requests'),(20,'logs.view','View activity logs');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pressganey_imports`
--

DROP TABLE IF EXISTS `pressganey_imports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pressganey_imports` (
  `ImportID` bigint NOT NULL AUTO_INCREMENT,
  `UploadedBy` int NOT NULL,
  `SourceFileName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `FromDate` date DEFAULT NULL,
  `ToDate` date DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ImportID`),
  KEY `UploadedBy` (`UploadedBy`),
  CONSTRAINT `pressganey_imports_ibfk_1` FOREIGN KEY (`UploadedBy`) REFERENCES `users` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pressganey_imports`
--

LOCK TABLES `pressganey_imports` WRITE;
/*!40000 ALTER TABLE `pressganey_imports` DISABLE KEYS */;
/*!40000 ALTER TABLE `pressganey_imports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pressganey_rows`
--

DROP TABLE IF EXISTS `pressganey_rows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pressganey_rows` (
  `RowID` bigint NOT NULL AUTO_INCREMENT,
  `ImportID` bigint NOT NULL,
  `OccurredAt` date DEFAULT NULL,
  `DepartmentName` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `QuestionCode` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `QuestionText` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ScoreValue` decimal(6,3) DEFAULT NULL,
  `SampleSize` int DEFAULT NULL,
  `RawData` json DEFAULT NULL,
  `RowHash` varbinary(32) DEFAULT NULL,
  `Year` smallint GENERATED ALWAYS AS (year(`OccurredAt`)) STORED,
  `Quarter` tinyint GENERATED ALWAYS AS (quarter(`OccurredAt`)) STORED,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`RowID`),
  UNIQUE KEY `uq_pg_row` (`ImportID`,`RowHash`),
  KEY `idx_pg_date` (`OccurredAt`),
  KEY `idx_pg_yq` (`Year`,`Quarter`),
  KEY `idx_pg_dept` (`DepartmentName`),
  KEY `idx_pg_q` (`QuestionCode`),
  CONSTRAINT `pressganey_rows_ibfk_1` FOREIGN KEY (`ImportID`) REFERENCES `pressganey_imports` (`ImportID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pressganey_rows`
--

LOCK TABLES `pressganey_rows` WRITE;
/*!40000 ALTER TABLE `pressganey_rows` DISABLE KEYS */;
/*!40000 ALTER TABLE `pressganey_rows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `report_937_imports`
--

DROP TABLE IF EXISTS `report_937_imports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `report_937_imports` (
  `ImportID` bigint NOT NULL AUTO_INCREMENT,
  `UploadedBy` int NOT NULL,
  `SourceFileName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `FromDate` date DEFAULT NULL,
  `ToDate` date DEFAULT NULL,
  `Note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ImportID`),
  KEY `UploadedBy` (`UploadedBy`),
  CONSTRAINT `report_937_imports_ibfk_1` FOREIGN KEY (`UploadedBy`) REFERENCES `users` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `report_937_imports`
--

LOCK TABLES `report_937_imports` WRITE;
/*!40000 ALTER TABLE `report_937_imports` DISABLE KEYS */;
/*!40000 ALTER TABLE `report_937_imports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `report_937_rows`
--

DROP TABLE IF EXISTS `report_937_rows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `report_937_rows` (
  `RowID` bigint NOT NULL AUTO_INCREMENT,
  `ImportID` bigint NOT NULL,
  `OccurredAt` date DEFAULT NULL,
  `DepartmentID` int DEFAULT NULL,
  `DepartmentName` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CategoryName` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Description` text COLLATE utf8mb4_unicode_ci,
  `RawData` json DEFAULT NULL,
  `RowHash` varbinary(32) DEFAULT NULL,
  `Year` smallint GENERATED ALWAYS AS (year(`OccurredAt`)) STORED,
  `Quarter` tinyint GENERATED ALWAYS AS (quarter(`OccurredAt`)) STORED,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`RowID`),
  UNIQUE KEY `uq_937_row` (`ImportID`,`RowHash`),
  KEY `DepartmentID` (`DepartmentID`),
  KEY `idx_937_date` (`OccurredAt`),
  KEY `idx_937_yq` (`Year`,`Quarter`),
  KEY `idx_937_dept` (`DepartmentName`),
  KEY `idx_937_cat` (`CategoryName`),
  CONSTRAINT `report_937_rows_ibfk_1` FOREIGN KEY (`ImportID`) REFERENCES `report_937_imports` (`ImportID`) ON DELETE CASCADE,
  CONSTRAINT `report_937_rows_ibfk_2` FOREIGN KEY (`DepartmentID`) REFERENCES `departments` (`DepartmentID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `report_937_rows`
--

LOCK TABLES `report_937_rows` WRITE;
/*!40000 ALTER TABLE `report_937_rows` DISABLE KEYS */;
/*!40000 ALTER TABLE `report_937_rows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `report_exports`
--

DROP TABLE IF EXISTS `report_exports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `report_exports` (
  `ExportID` bigint NOT NULL AUTO_INCREMENT,
  `RequestedBy` int NOT NULL,
  `Format` enum('Excel','PDF') COLLATE utf8mb4_unicode_ci NOT NULL,
  `FromDate` date NOT NULL,
  `ToDate` date NOT NULL,
  `DataTypes` json NOT NULL,
  `ResultFileURL` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ExportID`),
  KEY `RequestedBy` (`RequestedBy`),
  CONSTRAINT `report_exports_ibfk_1` FOREIGN KEY (`RequestedBy`) REFERENCES `users` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `report_exports`
--

LOCK TABLES `report_exports` WRITE;
/*!40000 ALTER TABLE `report_exports` DISABLE KEYS */;
/*!40000 ALTER TABLE `report_exports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `RoleID` tinyint NOT NULL,
  `PermissionID` int NOT NULL,
  `Allowed` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`RoleID`,`PermissionID`),
  KEY `fk_rp_perm` (`PermissionID`),
  CONSTRAINT `fk_rp_perm` FOREIGN KEY (`PermissionID`) REFERENCES `permissions` (`PermissionID`) ON DELETE CASCADE,
  CONSTRAINT `fk_rp_role` FOREIGN KEY (`RoleID`) REFERENCES `roles` (`RoleID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES (1,1,1),(1,2,1),(1,3,1),(1,4,1),(1,5,1),(1,6,1),(1,7,1),(1,8,1),(1,9,1),(1,10,1),(1,11,1),(1,12,1),(1,13,1),(1,14,1),(1,15,1),(1,16,1),(1,17,1),(1,18,1),(1,19,1),(1,20,1),(3,1,0),(3,2,0),(3,3,0),(3,4,0),(3,5,1),(3,6,0),(3,7,0),(3,8,0),(3,9,0),(3,10,0),(3,11,0),(3,12,0),(3,13,1),(3,14,0),(3,15,0),(3,16,1),(3,17,1),(3,18,1),(3,19,0),(3,20,0);
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `RoleID` tinyint NOT NULL,
  `RoleName` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`RoleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'SuperAdmin'),(2,'Employee'),(3,'Admin');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `secret_visitor_imports`
--

DROP TABLE IF EXISTS `secret_visitor_imports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `secret_visitor_imports` (
  `ImportID` bigint NOT NULL AUTO_INCREMENT,
  `UploadedBy` int NOT NULL,
  `SourceFileName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ReportYear` smallint DEFAULT NULL,
  `ReportMonth` tinyint DEFAULT NULL,
  `ReportLabel` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ImportID`),
  KEY `UploadedBy` (`UploadedBy`),
  CONSTRAINT `secret_visitor_imports_ibfk_1` FOREIGN KEY (`UploadedBy`) REFERENCES `users` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `secret_visitor_imports`
--

LOCK TABLES `secret_visitor_imports` WRITE;
/*!40000 ALTER TABLE `secret_visitor_imports` DISABLE KEYS */;
/*!40000 ALTER TABLE `secret_visitor_imports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `secret_visitor_rows`
--

DROP TABLE IF EXISTS `secret_visitor_rows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `secret_visitor_rows` (
  `RowID` bigint NOT NULL AUTO_INCREMENT,
  `ImportID` bigint NOT NULL,
  `DepartmentName` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NoteText` text COLLATE utf8mb4_unicode_ci,
  `ResponsibleDepartment` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ExecutionStatus` enum('executed','not_executed') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `OccurredAt` date DEFAULT NULL,
  `RawData` json DEFAULT NULL,
  `RowHash` varbinary(32) DEFAULT NULL,
  `Year` smallint GENERATED ALWAYS AS (year(`OccurredAt`)) STORED,
  `Quarter` tinyint GENERATED ALWAYS AS (quarter(`OccurredAt`)) STORED,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`RowID`),
  UNIQUE KEY `uq_sv_row` (`ImportID`,`RowHash`),
  KEY `idx_sv_date` (`OccurredAt`),
  KEY `idx_sv_yq` (`Year`,`Quarter`),
  KEY `idx_sv_dept` (`DepartmentName`),
  KEY `idx_sv_resp` (`ResponsibleDepartment`),
  KEY `idx_sv_status` (`ExecutionStatus`),
  CONSTRAINT `secret_visitor_rows_ibfk_1` FOREIGN KEY (`ImportID`) REFERENCES `secret_visitor_imports` (`ImportID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `secret_visitor_rows`
--

LOCK TABLES `secret_visitor_rows` WRITE;
/*!40000 ALTER TABLE `secret_visitor_rows` DISABLE KEYS */;
/*!40000 ALTER TABLE `secret_visitor_rows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_permissions`
--

DROP TABLE IF EXISTS `user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_permissions` (
  `UserID` int NOT NULL,
  `PermissionID` int NOT NULL,
  `Allowed` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`UserID`,`PermissionID`),
  KEY `fk_up_perm` (`PermissionID`),
  CONSTRAINT `fk_up_perm` FOREIGN KEY (`PermissionID`) REFERENCES `permissions` (`PermissionID`) ON DELETE CASCADE,
  CONSTRAINT `fk_up_user` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_permissions`
--

LOCK TABLES `user_permissions` WRITE;
/*!40000 ALTER TABLE `user_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `UserID` int NOT NULL AUTO_INCREMENT,
  `FullName` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Username` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `NationalID` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `EmployeeNumber` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `PasswordHash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `RoleID` tinyint NOT NULL,
  `DepartmentID` int DEFAULT NULL,
  `IsActive` tinyint(1) NOT NULL DEFAULT '1',
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`UserID`),
  UNIQUE KEY `uq_users_email` (`Email`),
  UNIQUE KEY `uq_users_phone` (`Phone`),
  UNIQUE KEY `uq_users_national` (`NationalID`),
  UNIQUE KEY `uq_users_empno` (`EmployeeNumber`),
  UNIQUE KEY `uq_users_username` (`Username`),
  KEY `fk_users_role` (`RoleID`),
  KEY `fk_users_dept` (`DepartmentID`),
  CONSTRAINT `fk_users_dept` FOREIGN KEY (`DepartmentID`) REFERENCES `departments` (`DepartmentID`),
  CONSTRAINT `fk_users_role` FOREIGN KEY (`RoleID`) REFERENCES `roles` (`RoleID`),
  CONSTRAINT `chk_users_nid_len` CHECK ((char_length(`NationalID`) between 10 and 15)),
  CONSTRAINT `chk_users_phone_len` CHECK (regexp_like(`Phone`,_utf8mb4'^[0-9]{10}$'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `v_assignments_sla_flags`
--

DROP TABLE IF EXISTS `v_assignments_sla_flags`;
/*!50001 DROP VIEW IF EXISTS `v_assignments_sla_flags`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_assignments_sla_flags` AS SELECT 
 1 AS `AssignmentID`,
 1 AS `ComplaintID`,
 1 AS `AssignedToUserID`,
 1 AS `AssignedAt`,
 1 AS `days_since_assignment`,
 1 AS `first_due`,
 1 AS `second_due`,
 1 AS `escalation_due`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_complaint_durations`
--

DROP TABLE IF EXISTS `v_complaint_durations`;
/*!50001 DROP VIEW IF EXISTS `v_complaint_durations`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_complaint_durations` AS SELECT 
 1 AS `ComplaintID`,
 1 AS `ComplaintNumber`,
 1 AS `DepartmentID`,
 1 AS `DepartmentName`,
 1 AS `Source`,
 1 AS `Status`,
 1 AS `CreatedAt`,
 1 AS `ClosedAt`,
 1 AS `hours_to_close`,
 1 AS `days_to_close`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_complaints_enriched`
--

DROP TABLE IF EXISTS `v_complaints_enriched`;
/*!50001 DROP VIEW IF EXISTS `v_complaints_enriched`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_complaints_enriched` AS SELECT 
 1 AS `ComplaintID`,
 1 AS `ComplaintNumber`,
 1 AS `Title`,
 1 AS `Description`,
 1 AS `Source`,
 1 AS `SubtypeName`,
 1 AS `ReasonName`,
 1 AS `DepartmentName`,
 1 AS `Status`,
 1 AS `Priority`,
 1 AS `PatientID`,
 1 AS `PatientFullName`,
 1 AS `PatientNationalID`,
 1 AS `PatientPhone`,
 1 AS `CreatedBy`,
 1 AS `CreatedAt`,
 1 AS `ClosedAt`,
 1 AS `UpdatedAt`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_department_complaint_counts`
--

DROP TABLE IF EXISTS `v_department_complaint_counts`;
/*!50001 DROP VIEW IF EXISTS `v_department_complaint_counts`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_department_complaint_counts` AS SELECT 
 1 AS `DepartmentID`,
 1 AS `DepartmentName`,
 1 AS `TotalComplaints`,
 1 AS `OpenCount`,
 1 AS `InProgressCount`,
 1 AS `RespondedCount`,
 1 AS `ClosedCount`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_employee_summary`
--

DROP TABLE IF EXISTS `v_employee_summary`;
/*!50001 DROP VIEW IF EXISTS `v_employee_summary`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_employee_summary` AS SELECT 
 1 AS `UserID`,
 1 AS `created_total`,
 1 AS `created_open`,
 1 AS `assigned_open`,
 1 AS `closed_total`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_my_complaints_scope`
--

DROP TABLE IF EXISTS `v_my_complaints_scope`;
/*!50001 DROP VIEW IF EXISTS `v_my_complaints_scope`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_my_complaints_scope` AS SELECT 
 1 AS `ComplaintID`,
 1 AS `ComplaintNumber`,
 1 AS `Title`,
 1 AS `Status`,
 1 AS `Priority`,
 1 AS `CreatedBy`,
 1 AS `AssignedToUserID`,
 1 AS `CreatedAt`,
 1 AS `UpdatedAt`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_source_counts_daily`
--

DROP TABLE IF EXISTS `v_source_counts_daily`;
/*!50001 DROP VIEW IF EXISTS `v_source_counts_daily`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_source_counts_daily` AS SELECT 
 1 AS `day`,
 1 AS `Source`,
 1 AS `total`,
 1 AS `open_cnt`,
 1 AS `wip_cnt`,
 1 AS `responded_cnt`,
 1 AS `closed_cnt`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_source_dept_counts`
--

DROP TABLE IF EXISTS `v_source_dept_counts`;
/*!50001 DROP VIEW IF EXISTS `v_source_dept_counts`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_source_dept_counts` AS SELECT 
 1 AS `DepartmentID`,
 1 AS `DepartmentName`,
 1 AS `Source`,
 1 AS `total`,
 1 AS `open_cnt`,
 1 AS `wip_cnt`,
 1 AS `closed_cnt`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_source_detail_rows`
--

DROP TABLE IF EXISTS `v_source_detail_rows`;
/*!50001 DROP VIEW IF EXISTS `v_source_detail_rows`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_source_detail_rows` AS SELECT 
 1 AS `ComplaintID`,
 1 AS `ComplaintNumber`,
 1 AS `Title`,
 1 AS `Source`,
 1 AS `DepartmentName`,
 1 AS `ReasonName`,
 1 AS `SubtypeName`,
 1 AS `Status`,
 1 AS `Priority`,
 1 AS `CreatedAt`,
 1 AS `ClosedAt`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_source_duration_stats`
--

DROP TABLE IF EXISTS `v_source_duration_stats`;
/*!50001 DROP VIEW IF EXISTS `v_source_duration_stats`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_source_duration_stats` AS SELECT 
 1 AS `Source`,
 1 AS `total`,
 1 AS `avg_hours`,
 1 AS `min_hours`,
 1 AS `max_hours`*/;
SET character_set_client = @saved_cs_client;

--
-- Final view structure for view `v_assignments_sla_flags`
--

/*!50001 DROP VIEW IF EXISTS `v_assignments_sla_flags`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_assignments_sla_flags` AS select `a`.`AssignmentID` AS `AssignmentID`,`a`.`ComplaintID` AS `ComplaintID`,`a`.`AssignedToUserID` AS `AssignedToUserID`,`a`.`CreatedAt` AS `AssignedAt`,timestampdiff(DAY,`a`.`CreatedAt`,now()) AS `days_since_assignment`,((`a`.`FirstReminderAt` is null) and (timestampdiff(DAY,`a`.`CreatedAt`,now()) >= 3)) AS `first_due`,((`a`.`SecondReminderAt` is null) and (timestampdiff(DAY,`a`.`CreatedAt`,now()) >= 6)) AS `second_due`,((`a`.`EscalatedAt` is null) and (timestampdiff(DAY,`a`.`CreatedAt`,now()) >= 9)) AS `escalation_due` from `complaint_assignments` `a` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_complaint_durations`
--

/*!50001 DROP VIEW IF EXISTS `v_complaint_durations`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_complaint_durations` AS select `c`.`ComplaintID` AS `ComplaintID`,`c`.`ComplaintNumber` AS `ComplaintNumber`,`c`.`DepartmentID` AS `DepartmentID`,`d`.`DepartmentName` AS `DepartmentName`,`c`.`Source` AS `Source`,`c`.`Status` AS `Status`,`c`.`CreatedAt` AS `CreatedAt`,`c`.`ClosedAt` AS `ClosedAt`,timestampdiff(HOUR,`c`.`CreatedAt`,coalesce(`c`.`ClosedAt`,now())) AS `hours_to_close`,round((timestampdiff(HOUR,`c`.`CreatedAt`,coalesce(`c`.`ClosedAt`,now())) / 24),2) AS `days_to_close` from (`complaints` `c` left join `departments` `d` on((`d`.`DepartmentID` = `c`.`DepartmentID`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_complaints_enriched`
--

/*!50001 DROP VIEW IF EXISTS `v_complaints_enriched`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_complaints_enriched` AS select `c`.`ComplaintID` AS `ComplaintID`,`c`.`ComplaintNumber` AS `ComplaintNumber`,`c`.`Title` AS `Title`,`c`.`Description` AS `Description`,`c`.`Source` AS `Source`,`st`.`SubtypeName` AS `SubtypeName`,`r`.`ReasonName` AS `ReasonName`,`d`.`DepartmentName` AS `DepartmentName`,`c`.`Status` AS `Status`,`c`.`Priority` AS `Priority`,`c`.`PatientID` AS `PatientID`,`p`.`FullName` AS `PatientFullName`,`p`.`NationalID` AS `PatientNationalID`,`p`.`Phone` AS `PatientPhone`,`c`.`CreatedBy` AS `CreatedBy`,`c`.`CreatedAt` AS `CreatedAt`,`c`.`ClosedAt` AS `ClosedAt`,`c`.`UpdatedAt` AS `UpdatedAt` from ((((`complaints` `c` left join `complaint_subtypes` `st` on((`st`.`SubtypeID` = `c`.`SubtypeID`))) left join `complaint_reasons` `r` on((`r`.`ReasonID` = `st`.`ReasonID`))) left join `departments` `d` on((`d`.`DepartmentID` = `c`.`DepartmentID`))) left join `patients` `p` on((`p`.`PatientID` = `c`.`PatientID`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_department_complaint_counts`
--

/*!50001 DROP VIEW IF EXISTS `v_department_complaint_counts`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_department_complaint_counts` AS select `d`.`DepartmentID` AS `DepartmentID`,`d`.`DepartmentName` AS `DepartmentName`,count(`c`.`ComplaintID`) AS `TotalComplaints`,sum((`c`.`Status` = 'open')) AS `OpenCount`,sum((`c`.`Status` = 'in_progress')) AS `InProgressCount`,sum((`c`.`Status` = 'responded')) AS `RespondedCount`,sum((`c`.`Status` = 'closed')) AS `ClosedCount` from (`departments` `d` left join `complaints` `c` on((`c`.`DepartmentID` = `d`.`DepartmentID`))) group by `d`.`DepartmentID`,`d`.`DepartmentName` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_employee_summary`
--

/*!50001 DROP VIEW IF EXISTS `v_employee_summary`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_employee_summary` AS select `u`.`UserID` AS `UserID`,(select count(0) from `complaints` `cc` where (`cc`.`CreatedBy` = `u`.`UserID`)) AS `created_total`,(select count(0) from `complaints` `cc` where ((`cc`.`CreatedBy` = `u`.`UserID`) and (`cc`.`Status` in ('open','in_progress','responded')))) AS `created_open`,(select count(0) from ((`complaints` `c` join (select `ca`.`ComplaintID` AS `ComplaintID`,max(`ca`.`AssignmentID`) AS `MaxAssign` from `complaint_assignments` `ca` group by `ca`.`ComplaintID`) `la` on((`la`.`ComplaintID` = `c`.`ComplaintID`))) join `complaint_assignments` `lasta` on((`lasta`.`AssignmentID` = `la`.`MaxAssign`))) where ((`lasta`.`AssignedToUserID` = `u`.`UserID`) and (`c`.`Status` in ('open','in_progress')))) AS `assigned_open`,(select count(0) from ((`complaints` `c` left join (select `ca`.`ComplaintID` AS `ComplaintID`,max(`ca`.`AssignmentID`) AS `MaxAssign` from `complaint_assignments` `ca` group by `ca`.`ComplaintID`) `la` on((`la`.`ComplaintID` = `c`.`ComplaintID`))) left join `complaint_assignments` `lasta` on((`lasta`.`AssignmentID` = `la`.`MaxAssign`))) where (((`c`.`CreatedBy` = `u`.`UserID`) or (`lasta`.`AssignedToUserID` = `u`.`UserID`)) and (`c`.`Status` = 'closed'))) AS `closed_total` from `users` `u` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_my_complaints_scope`
--

/*!50001 DROP VIEW IF EXISTS `v_my_complaints_scope`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_my_complaints_scope` AS select `c`.`ComplaintID` AS `ComplaintID`,`c`.`ComplaintNumber` AS `ComplaintNumber`,`c`.`Title` AS `Title`,`c`.`Status` AS `Status`,`c`.`Priority` AS `Priority`,`c`.`CreatedBy` AS `CreatedBy`,`lastassign`.`AssignedToUserID` AS `AssignedToUserID`,`c`.`CreatedAt` AS `CreatedAt`,`c`.`UpdatedAt` AS `UpdatedAt` from ((`complaints` `c` left join (select `ca`.`ComplaintID` AS `ComplaintID`,max(`ca`.`AssignmentID`) AS `MaxAssign` from `complaint_assignments` `ca` group by `ca`.`ComplaintID`) `la` on((`la`.`ComplaintID` = `c`.`ComplaintID`))) left join `complaint_assignments` `lastassign` on((`lastassign`.`AssignmentID` = `la`.`MaxAssign`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_source_counts_daily`
--

/*!50001 DROP VIEW IF EXISTS `v_source_counts_daily`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_source_counts_daily` AS select cast(`c`.`CreatedAt` as date) AS `day`,`c`.`Source` AS `Source`,count(0) AS `total`,sum((`c`.`Status` = 'open')) AS `open_cnt`,sum((`c`.`Status` = 'in_progress')) AS `wip_cnt`,sum((`c`.`Status` = 'responded')) AS `responded_cnt`,sum((`c`.`Status` = 'closed')) AS `closed_cnt` from `complaints` `c` group by cast(`c`.`CreatedAt` as date),`c`.`Source` order by `day` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_source_dept_counts`
--

/*!50001 DROP VIEW IF EXISTS `v_source_dept_counts`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_source_dept_counts` AS select `d`.`DepartmentID` AS `DepartmentID`,`d`.`DepartmentName` AS `DepartmentName`,`c`.`Source` AS `Source`,count(0) AS `total`,sum((`c`.`Status` = 'open')) AS `open_cnt`,sum((`c`.`Status` = 'in_progress')) AS `wip_cnt`,sum((`c`.`Status` = 'closed')) AS `closed_cnt` from (`departments` `d` left join `complaints` `c` on((`c`.`DepartmentID` = `d`.`DepartmentID`))) group by `d`.`DepartmentID`,`d`.`DepartmentName`,`c`.`Source` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_source_detail_rows`
--

/*!50001 DROP VIEW IF EXISTS `v_source_detail_rows`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_source_detail_rows` AS select `c`.`ComplaintID` AS `ComplaintID`,`c`.`ComplaintNumber` AS `ComplaintNumber`,`c`.`Title` AS `Title`,`c`.`Source` AS `Source`,`d`.`DepartmentName` AS `DepartmentName`,`r`.`ReasonName` AS `ReasonName`,`st`.`SubtypeName` AS `SubtypeName`,`c`.`Status` AS `Status`,`c`.`Priority` AS `Priority`,`c`.`CreatedAt` AS `CreatedAt`,`c`.`ClosedAt` AS `ClosedAt` from (((`complaints` `c` left join `departments` `d` on((`d`.`DepartmentID` = `c`.`DepartmentID`))) left join `complaint_subtypes` `st` on((`st`.`SubtypeID` = `c`.`SubtypeID`))) left join `complaint_reasons` `r` on((`r`.`ReasonID` = `st`.`ReasonID`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_source_duration_stats`
--

/*!50001 DROP VIEW IF EXISTS `v_source_duration_stats`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_source_duration_stats` AS select `c`.`Source` AS `Source`,count(0) AS `total`,avg(timestampdiff(HOUR,`c`.`CreatedAt`,coalesce(`c`.`ClosedAt`,now()))) AS `avg_hours`,min(timestampdiff(HOUR,`c`.`CreatedAt`,coalesce(`c`.`ClosedAt`,now()))) AS `min_hours`,max(timestampdiff(HOUR,`c`.`CreatedAt`,coalesce(`c`.`ClosedAt`,now()))) AS `max_hours` from `complaints` `c` group by `c`.`Source` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-01  4:52:50
