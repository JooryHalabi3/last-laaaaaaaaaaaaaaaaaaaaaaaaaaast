-- MySQL dump 10.13  Distrib 8.0.30, for Win64 (x86_64)
--
-- Host: localhost    Database: aounak2
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
  `LogID` int NOT NULL AUTO_INCREMENT,
  `EmployeeID` int DEFAULT NULL,
  `Username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ActivityType` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `IPAddress` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `UserAgent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `RelatedID` int DEFAULT NULL,
  `RelatedType` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`LogID`),
  KEY `idx_employee_id` (`EmployeeID`),
  KEY `idx_activity_type` (`ActivityType`),
  KEY `idx_created_at` (`CreatedAt`),
  CONSTRAINT `activitylogs_ibfk_1` FOREIGN KEY (`EmployeeID`) REFERENCES `employees` (`EmployeeID`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=251 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activitylogs`
--

LOCK TABLES `activitylogs` WRITE;
/*!40000 ALTER TABLE `activitylogs` DISABLE KEYS */;
INSERT INTO `activitylogs` VALUES (28,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 12:58:49'),(29,3,'11','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 12:59:28'),(30,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 12:59:48'),(31,3,'11','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 13:00:06'),(32,3,'11','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 13:11:58'),(33,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 13:12:29'),(34,3,'11','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 13:13:01'),(35,3,'11','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 13:15:13'),(36,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 13:18:28'),(37,3,'11','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 13:40:36'),(38,3,'11','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 13:41:52'),(39,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 13:43:30'),(40,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 16:26:56'),(41,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 16:30:52'),(42,3,'11','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 16:31:11'),(43,3,'11','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 16:49:02'),(44,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 16:49:09'),(45,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 18:37:51'),(46,3,'11','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 18:38:24'),(47,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 18:38:34'),(48,3,'11','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 18:38:52'),(49,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 18:54:42'),(50,3,'11','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 18:55:09'),(51,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 18:56:01'),(52,3,'11','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 18:56:28'),(53,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 18:57:47'),(54,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 19:20:17'),(55,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 19:20:29'),(56,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 19:22:33'),(57,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 19:26:23'),(58,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 19:30:57'),(59,3,'11','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 19:31:34'),(60,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 19:34:33'),(61,3,'11','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 19:34:58'),(62,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 19:35:08'),(63,3,'11','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 19:35:26'),(64,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 19:55:57'),(65,3,'11','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-16 19:56:29'),(66,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-17 06:52:08'),(67,1,'12341','export_logs','تم تصدير 66 سجل بصيغة csv','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-17 06:55:21'),(68,1,'12341','export_logs','تم تصدير 67 سجل بصيغة pdf','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-17 06:55:24'),(69,1,'12341','delete_logs','تم حذف 0 سجل قديم (أقدم من 90 يوم)','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-17 06:55:44'),(70,1,'12341','delete_logs','تم حذف 27 سجل قديم (أقدم من 1 يوم)','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-17 06:55:59'),(71,1,'12341','delete_logs','تم حذف 0 سجل قديم (أقدم من 1 يوم)','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-17 06:56:25'),(72,1,'12341','delete_logs','تم حذف 0 سجل قديم (أقدم من 1 يوم)','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-17 06:56:47'),(73,1,'12341','delete_logs','تم حذف 0 سجل قديم (أقدم من 90 يوم)','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-17 06:56:54'),(74,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-17 09:55:25'),(75,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-18 08:54:13'),(76,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-18 08:58:18'),(77,3,'11','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-18 09:00:22'),(78,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-18 09:00:43'),(79,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-18 09:15:30'),(80,3,'11','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-18 11:27:54'),(81,3,'11','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-18 11:28:28'),(82,3,'11','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-18 11:28:45'),(83,3,'11','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-18 11:28:59'),(84,3,'11','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-18 11:30:18'),(85,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-18 11:32:52'),(86,3,'11','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-18 11:33:40'),(87,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-18 11:54:58'),(88,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-20 07:31:01'),(89,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-20 07:50:05'),(90,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-20 09:01:29'),(91,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-20 11:01:30'),(92,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-20 11:02:06'),(93,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-20 11:29:22'),(94,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-20 11:56:25'),(95,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-20 12:02:32'),(96,2,'1333','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-20 12:14:15'),(97,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-20 12:14:33'),(98,3,'11','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-20 12:17:31'),(99,1,'12341','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-20 12:17:42'),(100,3,'11','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-20 12:18:02'),(101,3,'11','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-20 12:18:40'),(102,4,'22','register','تم إنشاء حساب جديد: 11 (موظف)','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-20 19:49:26'),(103,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-20 19:54:47'),(104,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-20 20:01:02'),(105,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-20 20:04:43'),(106,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-20 20:04:46'),(107,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-20 20:05:14'),(108,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-20 20:10:42'),(109,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-20 20:14:05'),(110,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-20 20:30:13'),(111,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-20 20:44:00'),(112,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-20 20:44:05'),(113,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-20 20:44:56'),(114,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-21 04:46:13'),(115,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-21 04:50:57'),(116,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-21 04:54:15'),(117,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-21 05:36:23'),(118,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-21 05:42:46'),(119,5,'55','register','تم إنشاء حساب جديد: سحر (موظف)','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-21 07:34:24'),(120,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-21 07:40:38'),(121,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-21 10:32:14'),(122,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-21 10:57:25'),(123,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-21 11:13:07'),(124,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-21 11:43:08'),(125,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-21 11:44:08'),(126,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-21 11:48:39'),(127,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-21 11:48:42'),(128,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-21 12:41:45'),(129,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-21 13:40:44'),(130,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-21 13:59:02'),(131,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-21 14:15:58'),(132,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-21 14:16:01'),(133,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-21 14:20:12'),(134,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-21 14:20:30'),(135,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-21 14:34:58'),(136,4,'22','profile_update','تم تحديث بيانات البروفايل','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-21 14:41:38'),(137,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-21 15:26:07'),(138,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-21 15:33:53'),(139,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-21 15:55:29'),(140,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-21 20:40:52'),(141,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-21 20:53:18'),(142,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-21 20:58:53'),(143,4,'22','login','تم تسجيل الدخول بنجاح - الدور: سوبر أدمن','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 20:12:03'),(144,4,'22','login','تم تسجيل الدخول بنجاح - الدور: سوبر أدمن','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 20:12:08'),(145,4,'22','login','تم تسجيل الدخول بنجاح - الدور: سوبر أدمن','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 20:12:30'),(146,4,'22','login','تم تسجيل الدخول بنجاح - الدور: سوبر أدمن','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 20:23:30'),(147,9,'66','register','تم إنشاء حساب جديد: سمورة (موظف)','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 20:29:47'),(148,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 20:36:11'),(149,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 20:39:14'),(150,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 20:54:39'),(151,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 21:11:32'),(152,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 21:13:26'),(153,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 21:18:34'),(154,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 21:33:16'),(155,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 21:33:20'),(156,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 21:36:44'),(157,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 21:40:22'),(158,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 21:42:51'),(159,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 21:50:00'),(160,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 21:52:40'),(161,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 21:59:43'),(162,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 22:00:53'),(163,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 22:03:23'),(164,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 22:26:57'),(165,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 22:35:26'),(166,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 22:57:36'),(167,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 22:57:52'),(168,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 22:58:10'),(169,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 23:00:21'),(170,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 23:00:57'),(171,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 23:05:14'),(172,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 23:05:19'),(173,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 23:05:33'),(174,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 23:07:20'),(175,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 23:07:29'),(176,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 23:07:38'),(177,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 23:08:16'),(178,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 23:08:31'),(179,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 23:14:41'),(180,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 23:16:20'),(181,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 23:16:30'),(182,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 23:16:59'),(183,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 23:17:39'),(184,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-22 23:17:42'),(185,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 10:02:13'),(186,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 10:04:24'),(187,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 10:11:59'),(188,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 10:19:55'),(189,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 10:30:39'),(190,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 10:38:41'),(191,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 10:44:40'),(192,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 10:44:45'),(193,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 10:48:02'),(194,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 10:50:45'),(195,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 10:51:05'),(196,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 10:57:20'),(197,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 11:03:22'),(198,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 11:10:52'),(199,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 11:17:41'),(200,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 11:20:17'),(201,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 11:28:18'),(202,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 11:43:53'),(203,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 11:48:27'),(204,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 12:40:05'),(205,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 12:40:15'),(206,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 12:41:58'),(207,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 12:42:11'),(208,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 12:44:19'),(209,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 12:45:24'),(210,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 12:45:48'),(211,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 12:51:10'),(212,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 12:52:16'),(213,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 12:53:55'),(214,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 13:02:11'),(215,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 13:02:21'),(216,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 13:04:46'),(217,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 13:11:27'),(218,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 13:11:42'),(219,4,'22','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 13:12:38'),(220,9,'66','login','تم تسجيل الدخول بنجاح','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',NULL,NULL,'2025-08-23 13:12:50'),(221,1,'12341','unauthorized_access','محاولة وصول غير مصرح: /api/employee/profile','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,'employee_panel','2025-08-24 07:03:15'),(222,1,'12341','login','تم تسجيل الدخول بنجاح - القسم: غير محدد','::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-24 07:03:33'),(223,1,'12341','login','تم تسجيل الدخول بنجاح - القسم: غير محدد','::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-24 07:03:44'),(224,1,'12341','login','تم تسجيل الدخول بنجاح - القسم: غير محدد','::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-24 07:06:50'),(225,1,'12341','login','تم تسجيل الدخول بنجاح - القسم: غير محدد','::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-24 07:44:04'),(226,1,'12341','login','تم تسجيل الدخول بنجاح - القسم: غير محدد','::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-24 07:44:58'),(227,1,'12341','login','تم تسجيل الدخول بنجاح - القسم: غير محدد','::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-24 07:53:42'),(228,1,'12341','login','تم تسجيل الدخول بنجاح - القسم: غير محدد','::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-24 07:57:50'),(229,1,'12341','login','تم تسجيل الدخول بنجاح - القسم: غير محدد','::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-24 08:00:10'),(230,1,'12341','login','تم تسجيل الدخول بنجاح - القسم: غير محدد','::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-24 08:03:13'),(231,1,'12341','login','تم تسجيل الدخول بنجاح - القسم: غير محدد','::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-24 08:05:59'),(232,1,'12341','login','تم تسجيل الدخول بنجاح - القسم: غير محدد','::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-24 08:08:38'),(233,1,'12341','login','تم تسجيل الدخول بنجاح - القسم: غير محدد','::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-24 08:23:17'),(234,3,'11','login','تم تسجيل الدخول بنجاح - القسم: قسم الباطنة – القلب','::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-24 08:24:08'),(235,1,'12341','login','تم تسجيل الدخول بنجاح - القسم: غير محدد','::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-24 08:24:24'),(236,2,'1333','login','تم تسجيل الدخول بنجاح - القسم: قسم البصريات','::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-24 08:25:40'),(237,1,'12341','login','تم تسجيل الدخول بنجاح - القسم: غير محدد','::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-24 08:26:47'),(238,2,'1333','login','تم تسجيل الدخول بنجاح - القسم: قسم البصريات','::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-24 08:27:37'),(239,1,'12341','login','تم تسجيل الدخول بنجاح - القسم: غير محدد','::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-24 08:42:06'),(240,1,'12341','login','تم تسجيل الدخول بنجاح - القسم: غير محدد','::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-24 09:11:25'),(241,3,'11','login','تم تسجيل الدخول بنجاح - القسم: قسم الباطنة – القلب','::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-24 09:12:43'),(242,1,'12341','login','تم تسجيل الدخول بنجاح - القسم: غير محدد','::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-24 09:13:19'),(243,1,'12341','login','تم تسجيل الدخول بنجاح - القسم: غير محدد','::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-24 09:20:43'),(244,1,'12341','export_logs','تم تصدير 0 سجل بصيغة pdf','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-24 09:31:41'),(245,1,'12341','export_logs','تم تصدير 0 سجل بصيغة csv','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-24 09:31:47'),(246,1,'12341','export_logs','تم تصدير 218 سجل بصيغة pdf','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-24 09:39:20'),(247,3,'11','login','تم تسجيل الدخول بنجاح - القسم: قسم الباطنة – القلب','::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-24 10:43:29'),(248,3,'11','login','تم تسجيل الدخول بنجاح - القسم: قسم الباطنة – القلب','::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-24 10:43:29'),(249,3,'11','login','تم تسجيل الدخول بنجاح - القسم: قسم الباطنة – القلب','::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-24 10:47:19'),(250,1,'12341','login','تم تسجيل الدخول بنجاح - القسم: غير محدد','::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',NULL,NULL,'2025-08-24 23:24:02');
/*!40000 ALTER TABLE `activitylogs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attachments`
--

DROP TABLE IF EXISTS `attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attachments` (
  `AttachmentID` int NOT NULL AUTO_INCREMENT,
  `ComplaintID` int NOT NULL,
  `FileName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `FilePath` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `UploadedByEmployeeID` int DEFAULT NULL,
  `UploadDate` datetime DEFAULT CURRENT_TIMESTAMP,
  `Description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`AttachmentID`),
  KEY `ComplaintID` (`ComplaintID`),
  KEY `UploadedByEmployeeID` (`UploadedByEmployeeID`),
  CONSTRAINT `attachments_ibfk_1` FOREIGN KEY (`ComplaintID`) REFERENCES `complaints` (`ComplaintID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `attachments_ibfk_2` FOREIGN KEY (`UploadedByEmployeeID`) REFERENCES `employees` (`EmployeeID`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attachments`
--

LOCK TABLES `attachments` WRITE;
/*!40000 ALTER TABLE `attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaint_assignments`
--

DROP TABLE IF EXISTS `complaint_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaint_assignments` (
  `AssignmentID` int NOT NULL AUTO_INCREMENT,
  `ComplaintID` int NOT NULL,
  `AssignedBy` int NOT NULL,
  `AssignedTo` int NOT NULL,
  `AssignedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `DueAt` datetime DEFAULT NULL,
  `Reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `Status` enum('assigned','reassigned','accepted','rejected','completed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'assigned',
  PRIMARY KEY (`AssignmentID`),
  KEY `fk_ca_by` (`AssignedBy`),
  KEY `fk_ca_to` (`AssignedTo`),
  KEY `idx_ca_current` (`ComplaintID`,`Status`),
  CONSTRAINT `fk_ca_by` FOREIGN KEY (`AssignedBy`) REFERENCES `employees` (`EmployeeID`) ON DELETE RESTRICT,
  CONSTRAINT `fk_ca_cid` FOREIGN KEY (`ComplaintID`) REFERENCES `complaints` (`ComplaintID`) ON DELETE CASCADE,
  CONSTRAINT `fk_ca_to` FOREIGN KEY (`AssignedTo`) REFERENCES `employees` (`EmployeeID`) ON DELETE RESTRICT
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
-- Table structure for table `complaint_reminders`
--

DROP TABLE IF EXISTS `complaint_reminders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaint_reminders` (
  `ReminderID` int NOT NULL AUTO_INCREMENT,
  `ComplaintID` int NOT NULL,
  `RecipientEmployeeID` int NOT NULL,
  `ReminderNumber` tinyint NOT NULL,
  `SentAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ReminderID`),
  KEY `fk_cr_cid` (`ComplaintID`),
  KEY `fk_cr_emp` (`RecipientEmployeeID`),
  CONSTRAINT `fk_cr_cid` FOREIGN KEY (`ComplaintID`) REFERENCES `complaints` (`ComplaintID`) ON DELETE CASCADE,
  CONSTRAINT `fk_cr_emp` FOREIGN KEY (`RecipientEmployeeID`) REFERENCES `employees` (`EmployeeID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaint_reminders`
--

LOCK TABLES `complaint_reminders` WRITE;
/*!40000 ALTER TABLE `complaint_reminders` DISABLE KEYS */;
INSERT INTO `complaint_reminders` VALUES (1,1,1,1,'2025-08-21 16:02:48'),(2,2,2,1,'2025-08-22 16:02:48'),(3,3,1,2,'2025-08-20 16:02:48');
/*!40000 ALTER TABLE `complaint_reminders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complainthistory`
--

DROP TABLE IF EXISTS `complainthistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complainthistory` (
  `HistoryID` int NOT NULL AUTO_INCREMENT,
  `ComplaintID` int NOT NULL,
  `EmployeeID` int DEFAULT NULL,
  `Timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `Stage` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `OldStatus` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NewStatus` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`HistoryID`),
  KEY `ComplaintID` (`ComplaintID`),
  KEY `EmployeeID` (`EmployeeID`),
  CONSTRAINT `complainthistory_ibfk_1` FOREIGN KEY (`ComplaintID`) REFERENCES `complaints` (`ComplaintID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `complainthistory_ibfk_2` FOREIGN KEY (`EmployeeID`) REFERENCES `employees` (`EmployeeID`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complainthistory`
--

LOCK TABLES `complainthistory` WRITE;
/*!40000 ALTER TABLE `complainthistory` DISABLE KEYS */;
INSERT INTO `complainthistory` VALUES (1,1,1,'2025-08-13 11:56:41','تم تقديم الشكوى','تم استلام الشكوى بنجاح','','جديدة'),(2,2,2,'2025-08-13 11:59:59','تم تقديم الشكوى','تم استلام الشكوى بنجاح','','جديدة'),(3,3,2,'2025-08-13 12:01:46','تم تقديم الشكوى','تم استلام الشكوى بنجاح','','جديدة'),(4,3,1,'2025-08-13 12:11:14','تحديث الحالة','تم تحديث حالة الشكوى من \"جديدة\" إلى \"مغلقة\"','جديدة','مغلقة'),(5,4,3,'2025-08-15 20:33:26','تم تقديم الشكوى','تم استلام الشكوى بنجاح','','جديدة'),(6,5,3,'2025-08-15 23:40:11','تم تقديم الشكوى','تم استلام الشكوى بنجاح','','جديدة'),(7,6,1,'2025-08-18 12:16:39','تم تقديم الشكوى','تم استلام الشكوى بنجاح','','جديدة'),(8,5,1,'2025-08-18 12:22:31','تحديث الحالة','تم تحديث حالة الشكوى من \"جديدة\" إلى \"مغلقة\"','جديدة','مغلقة'),(9,7,1,'2025-08-20 10:32:23','تم تقديم الشكوى','تم استلام الشكوى بنجاح','','جديدة'),(10,5,1,'2025-08-20 10:40:10','تحديث الحالة','تم تحديث حالة الشكوى من \"مغلقة\" إلى \"قيد المعالجة\"','مغلقة','قيد المعالجة'),(11,8,1,'2025-08-20 10:42:03','تم تقديم الشكوى','تم استلام الشكوى بنجاح','','جديدة'),(12,9,1,'2025-08-20 14:30:12','تم تقديم الشكوى','تم استلام الشكوى بنجاح','','جديدة'),(13,10,1,'2025-08-20 14:39:34','تم تقديم الشكوى','تم استلام الشكوى بنجاح','','جديدة'),(14,11,1,'2025-08-20 14:57:24','تم تقديم الشكوى','تم استلام الشكوى بنجاح','','جديدة'),(15,12,1,'2025-08-20 15:03:40','تم تقديم الشكوى','تم استلام الشكوى بنجاح','','جديدة'),(16,10,1,'2025-08-21 08:49:29','إضافة رد','تم إضافة رد: منتاىلب...','جديدة','قيد المعالجة'),(17,10,1,'2025-08-21 08:49:29','تغيير الحالة','تم تغيير الحالة من \"قيد المعالجة\" إلى \"مغلقة\"','قيد المعالجة','مغلقة'),(18,10,1,'2025-08-21 08:50:13','تحديث الحالة','تم تحديث حالة الشكوى من \"مغلقة\" إلى \"مغلقة\"','مغلقة','مغلقة'),(19,10,1,'2025-08-21 13:38:16','تحديث الحالة','منتا','مغلقة','جديدة'),(20,13,4,'2025-08-21 14:14:11','تم تقديم الشكوى','تم استلام الشكوى بنجاح','','جديدة'),(21,14,4,'2025-08-21 14:54:24','تم تقديم الشكوى','تم استلام الشكوى بنجاح','','جديدة'),(22,15,4,'2025-08-21 15:07:38','تم تقديم الشكوى','تم استلام الشكوى بنجاح','','جديدة'),(23,16,4,'2025-08-21 15:11:23','تم تقديم الشكوى','تم استلام الشكوى بنجاح','','جديدة'),(24,17,4,'2025-08-21 15:26:47','تم تقديم الشكوى','تم استلام الشكوى بنجاح','','جديدة'),(25,10,1,'2025-08-21 23:43:34','تحديث الحالة','تم تحديث حالة الشكوى من \"جديدة\" إلى \"قيد المعالجة\"','جديدة','قيد المعالجة'),(26,9,1,'2025-08-21 23:43:53','تحديث الحالة','تم تحديث حالة الشكوى من \"جديدة\" إلى \"قيد المراجعة\"','جديدة','قيد المراجعة'),(27,10,1,'2025-08-23 01:28:19','تحديث الحالة','تم تحديث حالة الشكوى من \"قيد المعالجة\" إلى \"قيد المراجعة\"','قيد المعالجة','قيد المراجعة'),(28,10,1,'2025-08-23 01:28:45','تحديث الحالة','تم تحديث حالة الشكوى من \"قيد المراجعة\" إلى \"تم الحل\"','قيد المراجعة','تم الحل'),(29,18,4,'2025-08-23 13:18:21','تم تقديم الشكوى','تم استلام الشكوى بنجاح','','جديدة'),(30,19,1,'2025-08-24 12:14:41','تم تقديم الشكوى','تم استلام الشكوى بنجاح','','جديدة');
/*!40000 ALTER TABLE `complainthistory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaintresponses`
--

DROP TABLE IF EXISTS `complaintresponses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaintresponses` (
  `ResponseID` int NOT NULL AUTO_INCREMENT,
  `ComplaintID` int NOT NULL,
  `EmployeeID` int NOT NULL,
  `ResponseText` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ResponseType` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'رد رسمي',
  `ResponseDate` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ResponseID`),
  KEY `ComplaintID` (`ComplaintID`),
  KEY `EmployeeID` (`EmployeeID`),
  CONSTRAINT `complaintresponses_ibfk_1` FOREIGN KEY (`ComplaintID`) REFERENCES `complaints` (`ComplaintID`) ON DELETE CASCADE,
  CONSTRAINT `complaintresponses_ibfk_2` FOREIGN KEY (`EmployeeID`) REFERENCES `employees` (`EmployeeID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaintresponses`
--

LOCK TABLES `complaintresponses` WRITE;
/*!40000 ALTER TABLE `complaintresponses` DISABLE KEYS */;
INSERT INTO `complaintresponses` VALUES (1,10,1,'منتاىلب','اعتذار','2025-08-21 08:49:29');
/*!40000 ALTER TABLE `complaintresponses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaints`
--

DROP TABLE IF EXISTS `complaints`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaints` (
  `ComplaintID` int NOT NULL AUTO_INCREMENT,
  `PatientID` int NOT NULL,
  `EmployeeID` int NOT NULL,
  `ComplaintTypeID` int NOT NULL,
  `SubTypeID` int DEFAULT NULL,
  `DepartmentID` int NOT NULL,
  `ComplaintDate` datetime DEFAULT CURRENT_TIMESTAMP,
  `ComplaintDetails` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `CurrentStatus` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Priority` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'متوسطة',
  `MedicalRecordNumber` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ResponsibleEntity` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `IsSensitive` tinyint(1) DEFAULT '0',
  `IsSuggestion` tinyint(1) DEFAULT '0',
  `PatientSatisfactionRating` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ResolutionDetails` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ResolutionDate` datetime DEFAULT NULL,
  `AssignedTo` int DEFAULT NULL,
  `AssignedBy` int DEFAULT NULL,
  `AssignedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`ComplaintID`),
  KEY `PatientID` (`PatientID`),
  KEY `ComplaintTypeID` (`ComplaintTypeID`),
  KEY `SubTypeID` (`SubTypeID`),
  KEY `idx_complaints_dept_status` (`DepartmentID`,`CurrentStatus`),
  KEY `idx_complaints_date` (`ComplaintDate`),
  KEY `idx_complaints_employee` (`EmployeeID`),
  KEY `AssignedTo` (`AssignedTo`),
  KEY `AssignedBy` (`AssignedBy`),
  CONSTRAINT `complaints_ibfk_1` FOREIGN KEY (`PatientID`) REFERENCES `patients` (`PatientID`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `complaints_ibfk_2` FOREIGN KEY (`EmployeeID`) REFERENCES `employees` (`EmployeeID`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `complaints_ibfk_3` FOREIGN KEY (`ComplaintTypeID`) REFERENCES `complainttypes` (`ComplaintTypeID`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `complaints_ibfk_4` FOREIGN KEY (`SubTypeID`) REFERENCES `complaintsubtypes` (`SubTypeID`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `complaints_ibfk_5` FOREIGN KEY (`DepartmentID`) REFERENCES `departments` (`DepartmentID`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `complaints_ibfk_6` FOREIGN KEY (`AssignedTo`) REFERENCES `employees` (`EmployeeID`) ON DELETE SET NULL,
  CONSTRAINT `complaints_ibfk_7` FOREIGN KEY (`AssignedBy`) REFERENCES `employees` (`EmployeeID`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaints`
--

LOCK TABLES `complaints` WRITE;
/*!40000 ALTER TABLE `complaints` DISABLE KEYS */;
INSERT INTO `complaints` VALUES (1,1,1,12,65,43,'2025-08-04 03:00:00','oo','جديدة','متوسطة',NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(2,1,2,12,69,40,'2025-08-03 03:00:00','no no','جديدة','متوسطة',NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(3,2,2,6,34,43,'2025-07-28 03:00:00','ج','مغلقة','متوسطة',NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(4,3,3,4,22,64,'2025-08-06 03:00:00','oo','جديدة','متوسطة',NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(5,1,3,15,80,40,'2025-08-12 03:00:00','o','قيد المعالجة','متوسطة',NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(6,1,1,15,80,62,'2025-08-04 03:00:00','لا يوجد','جديدة','متوسطة',NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(7,1,1,12,69,57,'2025-08-05 03:00:00','p','جديدة','متوسطة',NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(8,3,1,8,46,22,'2025-08-12 03:00:00','جود','جديدة','متوسطة',NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(9,4,1,2,15,40,'2025-08-18 03:00:00','جميل','قيد المراجعة','متوسطة',NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(10,4,1,15,79,58,'2025-08-19 03:00:00','جوووووووووو تو','تم الحل','متوسطة',NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(11,5,1,10,58,58,'2025-08-11 03:00:00','سيء','جديدة','متوسطة',NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(12,6,1,2,16,64,'2025-07-29 03:00:00','جودي','جديدة','متوسطة',NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(13,7,4,10,59,38,'2025-07-31 03:00:00','oooo','جديدة','متوسطة',NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(14,8,4,12,65,59,'2025-07-31 03:00:00','شسيبلا','جديدة','متوسطة',NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(15,8,4,17,92,58,'2025-07-31 03:00:00','pp','جديدة','متوسطة',NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(16,8,4,12,68,40,'2025-07-31 03:00:00','oooioioi','جديدة','متوسطة',NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(17,8,4,5,31,38,'2025-07-31 03:00:00','حخحخحخ','جديدة','متوسطة',NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(18,9,4,10,58,40,'2025-07-31 03:00:00','سمورة','جديدة','متوسطة',NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,NULL),(19,1,1,10,56,40,'2025-08-06 03:00:00','fdsrtyujjjb','جديدة','متوسطة',NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `complaints` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaintsubtypes`
--

DROP TABLE IF EXISTS `complaintsubtypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaintsubtypes` (
  `SubTypeID` int NOT NULL AUTO_INCREMENT,
  `ComplaintTypeID` int NOT NULL,
  `SubTypeName` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`SubTypeID`),
  UNIQUE KEY `ComplaintTypeID` (`ComplaintTypeID`,`SubTypeName`),
  CONSTRAINT `complaintsubtypes_ibfk_1` FOREIGN KEY (`ComplaintTypeID`) REFERENCES `complainttypes` (`ComplaintTypeID`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=107 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaintsubtypes`
--

LOCK TABLES `complaintsubtypes` WRITE;
/*!40000 ALTER TABLE `complaintsubtypes` DISABLE KEYS */;
INSERT INTO `complaintsubtypes` VALUES (1,1,'إجراء علاجي جراحي','شكاوى متعلقة بالإجراءات الجراحية'),(2,1,'إجراء علاجي دوائي','شكاوى متعلقة بالعلاج الدوائي'),(3,1,'الفحوصات التشخيصية','شكاوى متعلقة بالفحوصات التشخيصية'),(4,1,'التحاليل الطبية','شكاوى متعلقة بالتحاليل الطبية'),(5,1,'التقييم الصحي','شكاوى متعلقة بالتقييم الصحي'),(6,1,'إجراءات متعلقة بتشخيص الحالة الصحية وشرح الخيارات','شكاوى متعلقة بتشخيص الحالة الصحية'),(7,1,'وصفة طبية خاطئة','شكاوى متعلقة بالوصفات الطبية الخاطئة'),(8,1,'نقص دواء','شكاوى متعلقة بنقص الأدوية'),(9,1,'تكرار الوصفة','شكاوى متعلقة بتكرار الوصفات'),(10,1,'إحالة مغلقة','شكاوى متعلقة بالإحالات المغلقة'),(11,2,'تجربة حجز موعد','شكاوى متعلقة بحجز المواعيد'),(12,2,'طلب إلغاء موعد','شكاوى متعلقة بإلغاء المواعيد'),(13,2,'المواعيد الخارجية','شكاوى متعلقة بالمواعيد الخارجية'),(14,2,'المواعيد الداخلية','شكاوى متعلقة بالمواعيد الداخلية'),(15,2,'التنسيق الطبي','شكاوى متعلقة بالتنسيق الطبي'),(16,2,'التحويل بين المنشآت','شكاوى متعلقة بالتحويل بين المنشآت'),(17,3,'طلب حضور ممرض','شكاوى متعلقة بحضور الممرضين'),(18,3,'صرف الأدوية','شكاوى متعلقة بصرف الأدوية'),(19,3,'وصفة طبية خاطئة','شكاوى متعلقة بالوصفات الطبية الخاطئة'),(20,3,'تكرار الوصفة','شكاوى متعلقة بتكرار الوصفات'),(21,3,'نقص دواء','شكاوى متعلقة بنقص الأدوية'),(22,4,'التواصل مع الطبيب','شكاوى متعلقة بالتواصل مع الأطباء'),(23,4,'المعاملة السيئة','شكاوى متعلقة بالمعاملة السيئة'),(24,4,'التصرف غير المهني','شكاوى متعلقة بالتصرف غير المهني'),(25,4,'اعتداء لفظي','شكاوى متعلقة بالاعتداء اللفظي'),(26,4,'قلة التواصل','شكاوى متعلقة بقلة التواصل'),(27,5,'القبول والخروج','شكاوى متعلقة بالقبول والخروج'),(28,5,'التوثيق الطبي','شكاوى متعلقة بالتوثيق الطبي'),(29,5,'الإجازات المرضية','شكاوى متعلقة بالإجازات المرضية'),(30,5,'فقدان ملفات','شكاوى متعلقة بفقدان الملفات'),(31,5,'البيانات الشخصية','شكاوى متعلقة بالبيانات الشخصية'),(32,6,'التنويم','شكاوى متعلقة بالتنويم'),(33,6,'التنقل داخل المنشأة','شكاوى متعلقة بالتنقل داخل المنشأة'),(34,6,'نقل مريض','شكاوى متعلقة بنقل المرضى'),(35,6,'التوصيل للمنزل','شكاوى متعلقة بالتوصيل للمنزل'),(36,6,'المرافق والخدمات','شكاوى متعلقة بالمرافق والخدمات'),(37,6,'التغذية','شكاوى متعلقة بالتغذية'),(38,6,'النظافة','شكاوى متعلقة بالنظافة'),(39,6,'وجود ازدحام','شكاوى متعلقة بالازدحام'),(40,6,'الشكاوى المالية','شكاوى متعلقة بالأمور المالية'),(41,6,'وجود خطأ طبي','شكاوى متعلقة بالأخطاء الطبية'),(42,7,'الشكاوى من الاستقبال','شكاوى متعلقة بالاستقبال'),(43,7,'وقت الانتظار','شكاوى متعلقة بوقت الانتظار'),(44,7,'اعتداء لفظي','شكاوى متعلقة بالاعتداء اللفظي'),(45,8,'تأخير في جدولة زيارة منزلية','شكاوى متعلقة بتأخير الزيارات المنزلية'),(46,8,'عدم توفر طاقم تمريض منزلي','شكاوى متعلقة بعدم توفر طاقم التمريض المنزلي'),(47,8,'نقص في المعدات المنزلية','شكاوى متعلقة بنقص المعدات المنزلية'),(48,8,'عدم تقديم تعليمات واضحة للمريض','شكاوى متعلقة بعدم وضوح التعليمات'),(49,8,'عدم المتابعة بعد الخروج من المستشفى','شكاوى متعلقة بعدم المتابعة'),(50,9,'خلل في تطبيق المستشفى','شكاوى متعلقة بخلل في التطبيق'),(51,9,'صعوبة استخدام البوابة الإلكترونية','شكاوى متعلقة بصعوبة استخدام البوابة'),(52,9,'فشل في تسجيل الدخول أو إنشاء حساب','شكاوى متعلقة بتسجيل الدخول'),(53,9,'عدم وصول إشعارات الموعد أو النتائج','شكاوى متعلقة بالإشعارات'),(54,9,'فقدان بيانات عند استخدام التطبيق','شكاوى متعلقة بفقدان البيانات'),(55,10,'منع دخول مرافق دون مبرر','شكاوى متعلقة بمنع دخول المرافقين'),(56,10,'عدم توفر مكان للمرافق','شكاوى متعلقة بعدم توفر مكان للمرافقين'),(57,10,'منع زيارة مريض دون تنسيق','شكاوى متعلقة بمنع الزيارة'),(58,10,'المعاملة السيئة للمرافق','شكاوى متعلقة بمعاملة المرافقين'),(59,10,'عدم توفير وسائل الراحة للزوار','شكاوى متعلقة بعدم توفير الراحة للزوار'),(60,11,'تأخير في تقديم الخدمة','شكاوى متعلقة بتأخير الخدمة'),(61,11,'عدم توفر سرير طوارئ','شكاوى متعلقة بعدم توفر سرير طوارئ'),(62,11,'عدم استجابة الفريق الإسعافي','شكاوى متعلقة بعدم استجابة الفريق'),(63,11,'عدم استقبال الحالة','شكاوى متعلقة بعدم استقبال الحالة'),(64,11,'سوء التنظيم في قسم الطوارئ','شكاوى متعلقة بسوء التنظيم'),(65,12,'تأخير في موعد العلاج الطبيعي','شكاوى متعلقة بتأخير موعد العلاج الطبيعي'),(66,12,'نقص في الأجهزة','شكاوى متعلقة بنقص الأجهزة'),(67,12,'عدم توفر أخصائي','شكاوى متعلقة بعدم توفر الأخصائي'),(68,12,'عدم إعطاء تعليمات للمنزل','شكاوى متعلقة بعدم إعطاء التعليمات'),(69,12,'جلسات غير كافية أو غير فعالة','شكاوى متعلقة بالجلسات غير الكافية'),(70,13,'الكشف عن معلومات المريض لغير المخوّلين','شكاوى متعلقة بكشف المعلومات'),(71,13,'مناقشة الحالة علنًا أمام الآخرين','شكاوى متعلقة بمناقشة الحالة علناً'),(72,13,'تسريب بيانات خاصة','شكاوى متعلقة بتسريب البيانات'),(73,13,'عدم احترام الخصوصية في الغرف','شكاوى متعلقة بعدم احترام الخصوصية'),(74,14,'عدم تقديم إرشادات كافية للمريض','شكاوى متعلقة بعدم تقديم الإرشادات'),(75,14,'نقص التوعية بحقوق المرضى','شكاوى متعلقة بنقص التوعية'),(76,14,'عدم شرح خطة العلاج بشكل واضح','شكاوى متعلقة بعدم وضوح خطة العلاج'),(77,14,'ضعف في توفير مواد تعليمية للمريض','شكاوى متعلقة بضعف المواد التعليمية'),(78,15,'عطل في التكييف','شكاوى متعلقة بعطل التكييف'),(79,15,'انقطاع الكهرباء','شكاوى متعلقة بانقطاع الكهرباء'),(80,15,'تسرب مياه','شكاوى متعلقة بتسرب المياه'),(81,15,'ممرات أو مصاعد معطلة','شكاوى متعلقة بالممرات والمصاعد'),(82,15,'نقص في التهوية أو الإضاءة','شكاوى متعلقة بالتهوية والإضاءة'),(83,15,'عدم توفر أماكن للانتظار','شكاوى متعلقة بعدم توفر أماكن الانتظار'),(84,16,'أدوات طبية غير معقّمة','شكاوى متعلقة بأدوات طبية غير معقمة'),(85,16,'عدم الالتزام بلبس القفازات أو الكمامات','شكاوى متعلقة بعدم الالتزام بالسلامة'),(86,16,'تواجد نفايات طبية في أماكن غير مخصصة','شكاوى متعلقة بالنفايات الطبية'),(87,16,'استخدام نفس الأدوات بين مرضى مختلفين','شكاوى متعلقة باستخدام الأدوات'),(88,16,'عدم عزل حالات معدية','شكاوى متعلقة بعدم عزل الحالات المعدية'),(89,17,'تعطل النظام الإلكتروني','شكاوى متعلقة بتعطل النظام'),(90,17,'توقف شاشة النتائج أو النظام الطبي','شكاوى متعلقة بتوقف الشاشات'),(91,17,'عدم القدرة على طباعة التقارير','شكاوى متعلقة بعدم القدرة على الطباعة'),(92,17,'خطأ في تسجيل الدخول','شكاوى متعلقة بخطأ تسجيل الدخول'),(93,17,'فقد بيانات عند الحفظ','شكاوى متعلقة بفقد البيانات'),(94,18,'تأخير في نقل المريض لقسم آخر','شكاوى متعلقة بتأخير النقل'),(95,18,'عدم تجهيز الغرفة عند التحويل','شكاوى متعلقة بعدم تجهيز الغرفة'),(96,18,'فقدان ملف أثناء النقل','شكاوى متعلقة بفقدان الملف'),(97,18,'رفض استقبال من قسم آخر','شكاوى متعلقة برفض الاستقبال'),(98,19,'لم يتم الرد على الشكوى','شكاوى متعلقة بعدم الرد'),(99,19,'رد غير واضح','شكاوى متعلقة برد غير واضح'),(100,19,'تم تجاهل الشكوى','شكاوى متعلقة بتجاهل الشكوى'),(101,19,'المعالجة غير مرضية','شكاوى متعلقة بمعالجة غير مرضية'),(102,19,'التأخر في الرد','شكاوى متعلقة بالتأخر في الرد'),(103,20,'عدم وجود ترجمة','شكاوى متعلقة بعدم وجود ترجمة'),(104,20,'صعوبة التواصل بلغة غير العربية','شكاوى متعلقة بصعوبة التواصل'),(105,20,'عدم توفير وثائق باللغة الإنجليزية','شكاوى متعلقة بعدم توفير وثائق بالإنجليزية'),(106,20,'عدم وجود مترجم طبي متخصص','شكاوى متعلقة بعدم وجود مترجم طبي');
/*!40000 ALTER TABLE `complaintsubtypes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complainttypes`
--

DROP TABLE IF EXISTS `complainttypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complainttypes` (
  `ComplaintTypeID` int NOT NULL AUTO_INCREMENT,
  `TypeName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`ComplaintTypeID`),
  UNIQUE KEY `TypeName` (`TypeName`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complainttypes`
--

LOCK TABLES `complainttypes` WRITE;
/*!40000 ALTER TABLE `complainttypes` DISABLE KEYS */;
INSERT INTO `complainttypes` VALUES (1,'الخدمات الطبية والعلاجية','شكاوى متعلقة بالخدمات الطبية والعلاجية'),(2,'المواعيد والتحويلات','شكاوى متعلقة بالمواعيد والتحويلات'),(3,'الصيدلية والدواء','شكاوى متعلقة بالصيدلية والأدوية'),(4,'الكوادر الصحية وسلوكهم','شكاوى متعلقة بالكوادر الصحية وسلوكهم'),(5,'الإجراءات الإدارية','شكاوى متعلقة بالإجراءات الإدارية'),(6,'خدمات المرضى العامة','شكاوى متعلقة بخدمات المرضى العامة'),(7,'الاستقبال وخدمة العملاء','شكاوى متعلقة بالاستقبال وخدمة العملاء'),(8,'الدعم المنزلي والرعاية المستمرة','شكاوى متعلقة بالدعم المنزلي والرعاية المستمرة'),(9,'الخدمات الإلكترونية والتطبيقات','شكاوى متعلقة بالخدمات الإلكترونية والتطبيقات'),(10,'تجربة الزوار والمرافقين','شكاوى متعلقة بتجربة الزوار والمرافقين'),(11,'خدمات الطوارئ والإسعاف','شكاوى متعلقة بخدمات الطوارئ والإسعاف'),(12,'خدمات التأهيل والعلاج الطبيعي','شكاوى متعلقة بخدمات التأهيل والعلاج الطبيعي'),(13,'الخصوصية وسرية المعلومات','شكاوى متعلقة بالخصوصية وسرية المعلومات'),(14,'التثقيف والتوعية الصحية','شكاوى متعلقة بالتثقيف والتوعية الصحية'),(15,'بيئة المستشفى والبنية التحتية','شكاوى متعلقة ببيئة المستشفى والبنية التحتية'),(16,'السلامة ومكافحة العدوى','شكاوى متعلقة بالسلامة ومكافحة العدوى'),(17,'خدمات الدعم الفني والأنظمة','شكاوى متعلقة بخدمات الدعم الفني والأنظمة'),(18,'القبول والتحويل الداخلي بين الأقسام','شكاوى متعلقة بالقبول والتحويل الداخلي'),(19,'التقييم بعد المعالجة','شكاوى متعلقة بالتقييم بعد المعالجة'),(20,'ملاحظات المرضى الدوليين','شكاوى متعلقة بالمرضى الدوليين');
/*!40000 ALTER TABLE `complainttypes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dailycommunications`
--

DROP TABLE IF EXISTS `dailycommunications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dailycommunications` (
  `CommunicationID` int NOT NULL AUTO_INCREMENT,
  `CommunicationDate` date NOT NULL,
  `DepartmentID` int NOT NULL,
  `CommunicationType` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Details` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `EmployeeID` int NOT NULL,
  PRIMARY KEY (`CommunicationID`),
  KEY `DepartmentID` (`DepartmentID`),
  KEY `EmployeeID` (`EmployeeID`),
  CONSTRAINT `dailycommunications_ibfk_1` FOREIGN KEY (`DepartmentID`) REFERENCES `departments` (`DepartmentID`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `dailycommunications_ibfk_2` FOREIGN KEY (`EmployeeID`) REFERENCES `employees` (`EmployeeID`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dailycommunications`
--

LOCK TABLES `dailycommunications` WRITE;
/*!40000 ALTER TABLE `dailycommunications` DISABLE KEYS */;
/*!40000 ALTER TABLE `dailycommunications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deletion_requests`
--

DROP TABLE IF EXISTS `deletion_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deletion_requests` (
  `RequestID` int NOT NULL AUTO_INCREMENT,
  `TableName` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `RecordPK` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `RequestedBy` int NOT NULL,
  `Reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `RequestedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `Status` enum('requested','confirmed','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'requested',
  `ConfirmedBy` int DEFAULT NULL,
  `ConfirmedAt` datetime DEFAULT NULL,
  `Snapshot` json DEFAULT NULL,
  PRIMARY KEY (`RequestID`),
  KEY `fk_dr_req_by` (`RequestedBy`),
  KEY `fk_dr_conf_by` (`ConfirmedBy`),
  CONSTRAINT `fk_dr_conf_by` FOREIGN KEY (`ConfirmedBy`) REFERENCES `employees` (`EmployeeID`) ON DELETE SET NULL,
  CONSTRAINT `fk_dr_req_by` FOREIGN KEY (`RequestedBy`) REFERENCES `employees` (`EmployeeID`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deletion_requests`
--

LOCK TABLES `deletion_requests` WRITE;
/*!40000 ALTER TABLE `deletion_requests` DISABLE KEYS */;
INSERT INTO `deletion_requests` VALUES (1,'employees','2',1,'طلب حذف موظف','2025-08-23 16:02:55','requested',NULL,NULL,'{\"FullName\": \"محمود\", \"EmployeeID\": 2}'),(2,'complaints','1',1,'طلب حذف شكوى','2025-08-23 16:02:55','requested',NULL,NULL,'{\"ComplaintID\": 1, \"ComplaintDetails\": \"oo\"}');
/*!40000 ALTER TABLE `deletion_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `department_admins`
--

DROP TABLE IF EXISTS `department_admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `department_admins` (
  `DepartmentID` int NOT NULL,
  `AdminEmployeeID` int NOT NULL,
  `IsPrimary` tinyint(1) DEFAULT '1',
  `EffectiveFrom` datetime DEFAULT CURRENT_TIMESTAMP,
  `EffectiveTo` datetime DEFAULT NULL,
  PRIMARY KEY (`DepartmentID`,`AdminEmployeeID`),
  KEY `fk_da_admin` (`AdminEmployeeID`),
  CONSTRAINT `fk_da_admin` FOREIGN KEY (`AdminEmployeeID`) REFERENCES `employees` (`EmployeeID`) ON DELETE CASCADE,
  CONSTRAINT `fk_da_dept` FOREIGN KEY (`DepartmentID`) REFERENCES `departments` (`DepartmentID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `department_admins`
--

LOCK TABLES `department_admins` WRITE;
/*!40000 ALTER TABLE `department_admins` DISABLE KEYS */;
/*!40000 ALTER TABLE `department_admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `DepartmentID` int NOT NULL AUTO_INCREMENT,
  `DepartmentName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`DepartmentID`),
  UNIQUE KEY `DepartmentName` (`DepartmentName`)
) ENGINE=InnoDB AUTO_INCREMENT=71 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'قسم المدير التنفيذي للمستشفى','Office of the Hospital Executive Director'),(2,'قسم المشرحة','Morgue'),(3,'قسم التنسيق الطبي وأهلية العلاج','Medical Coordination and Eligibility'),(4,'قسم خدمات الضيف','Guest Services'),(5,'قسم المراجعة الداخلية','Internal Audit'),(6,'قسم الشؤون القانونية','Legal Affairs'),(7,'قسم سلاسل الإمداد','Supply Chain'),(8,'قسم الوقاية ومكافحة العدوى','Infection Prevention and Control'),(9,'قسم الجودة والتميز المؤسسي','Quality and Institutional Excellence'),(10,'قسم التواصل والعلاقات العامة','Communications and Public Relations'),(11,'قسم وحدة التخطيط والاستعداد للطوارئ','Hospital Emergency Planning and Preparedness Unit (HEPPU)'),(12,'قسم الشؤون المالية والإدارية','Finance and Administration'),(13,'قسم الموارد البشرية','Human Resources'),(14,'قسم الشؤون الأكاديمية والتدريب','Academic Affairs and Training'),(15,'قسم المرافق والشؤون الهندسية','Facilities and Engineering'),(16,'قسم الإدارة الإستراتيجية','Strategic Management'),(17,'قسم مكتب الخدمات التمريضية','Nursing Services Office'),(18,'قسم الطب الباطني العام','General Internal Medicine'),(19,'قسم الجراحة العامة','General Surgery'),(20,'قسم المسالك البولية','Urology'),(21,'قسم جراحة اليوم الواحد','Same-Day Surgery'),(22,'قسم الأنف والأذن والحنجرة','Otorhinolaryngology'),(23,'قسم العظام','Orthopaedics'),(24,'قسم جراحة المخ والأعصاب','Neurosurgery'),(25,'قسم العمليات الجراحية','Surgical Procedures'),(26,'قسم الطوارئ','Emergency'),(27,'قسم العناية المركزة','Intensive Care'),(28,'قسم الرعاية التنفسية','Respiratory Care'),(29,'قسم التخدير','Anaesthesia'),(30,'قسم الصيدلية','Pharmacy'),(31,'قسم الخدمة الاجتماعية','Social Services'),(32,'قسم المختبرات الطبية','Medical Laboratories'),(33,'قسم بنك الدم','Blood Bank'),(34,'قسم الرعاية المنزلية','Home Care'),(35,'قسم الأشعة','Radiology'),(36,'قسم التغذية العامة','General Nutrition'),(37,'قسم التغذية العلاجية','Therapeutic Nutrition'),(38,'قسم التأهيل الطبي','Medical Rehabilitation'),(39,'قسم التعقيم المركزي','Central Sterilization'),(40,'قسم البصريات','Optometry'),(41,'قسم العيادات الخارجية','Outpatient Clinics'),(42,'قسم التوعية الدينية والدعم الروحي','Religious Awareness and Spiritual Support'),(43,'قسم التثقيف والتوعية الصحية','Health Education and Awareness'),(44,'قسم الصحة العامة','Public Health'),(45,'قسم الصحة المهنية','Occupational Health'),(46,'قسم مركز الأسنان','Dental Centre'),(47,'قسم مركز حساسية القمح','Wheat Allergy Centre'),(48,'قسم مركز الشيخوخة','Geriatric Centre'),(49,'قسم مركز الجلدية','Dermatology Centre'),(50,'قسم مكتب الخدمات الطبية','Medical Services Office'),(51,'قسم شؤون المرضى','Patient Affairs'),(52,'قسم المعلومات الصحية','Health Informatics'),(53,'قسم مكتب الدخول','Admissions Office'),(54,'قسم الأمن السيبراني','Cybersecurity'),(55,'قسم تجربة المريض','Patient Experience'),(56,'قسم الصحة الرقمية','Digital Health'),(57,'قسم الباطنة – أمراض الدم','Internal Medicine – Hematology'),(58,'قسم الباطنة – القلب','Internal Medicine – Cardiology'),(59,'قسم الباطنة – الصدرية','Internal Medicine – Pulmonary'),(60,'قسم الباطنة – الأمراض المعدية','Internal Medicine – Infectious Diseases'),(61,'قسم الباطنة – أمراض الكلية','Internal Medicine – Nephrology'),(62,'قسم الباطنة – العصبية','Internal Medicine – Neurology'),(63,'قسم الباطنة – الرعاية التلطيفية','Internal Medicine – Palliative Care'),(64,'قسم الباطنة – الغدد الصماء','Internal Medicine – Endocrinology'),(65,'قسم الباطنة – الروماتيزم','Internal Medicine – Rheumatology'),(66,'قسم جراحة الأوعية الدموية','Vascular Surgery'),(67,'قسم وحدة العيون','Ophthalmology Unit'),(68,'قسم جراحة الوجه والفكين','Oral and Maxillofacial Surgery'),(69,'قسم إدارة القبول ودعم الوصول','Admissions Management and Access Support'),(70,'قسم إدارة الأسرة','Family Management');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_permissions`
--

DROP TABLE IF EXISTS `employee_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `EmployeeID` int NOT NULL,
  `permission_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `has_permission` tinyint(1) DEFAULT '0',
  `granted_by` int DEFAULT NULL,
  `scope_department_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_emp_perm` (`EmployeeID`,`permission_name`,`scope_department_id`),
  KEY `fk_ep_grantor` (`granted_by`),
  KEY `fk_ep_dept` (`scope_department_id`),
  CONSTRAINT `fk_ep_dept` FOREIGN KEY (`scope_department_id`) REFERENCES `departments` (`DepartmentID`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ep_emp` FOREIGN KEY (`EmployeeID`) REFERENCES `employees` (`EmployeeID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ep_grantor` FOREIGN KEY (`granted_by`) REFERENCES `employees` (`EmployeeID`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_permissions`
--

LOCK TABLES `employee_permissions` WRITE;
/*!40000 ALTER TABLE `employee_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `employee_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `EmployeeID` int NOT NULL AUTO_INCREMENT,
  `FullName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `NationalID_Iqama` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Username` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `EmployeeNumber` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `PasswordHash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `PhoneNumber` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NationalID` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `RoleID` int NOT NULL,
  `DepartmentID` int DEFAULT NULL,
  `JoinDate` datetime DEFAULT CURRENT_TIMESTAMP,
  `Specialty` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `UpdatedAt` datetime DEFAULT NULL,
  `UpdatedBy` int DEFAULT NULL,
  PRIMARY KEY (`EmployeeID`),
  UNIQUE KEY `Username` (`Username`),
  UNIQUE KEY `Email` (`Email`),
  UNIQUE KEY `uq_employees_nationalid` (`NationalID_Iqama`),
  UNIQUE KEY `EmployeeNumber` (`EmployeeNumber`),
  UNIQUE KEY `uniq_employees_nationalid` (`NationalID`),
  KEY `RoleID` (`RoleID`),
  KEY `fk_emp_dept` (`DepartmentID`),
  KEY `idx_employees_departmentid` (`DepartmentID`),
  CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`RoleID`) REFERENCES `roles` (`RoleID`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_emp_dept` FOREIGN KEY (`DepartmentID`) REFERENCES `departments` (`DepartmentID`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES (1,'جود',NULL,'12341',NULL,'$2b$10$VODCmMhKpziOmCsnn2lhF..an7g827NjFmXng5AtNjwKngPQyRpjS','gg@gmail.com','0566666666',NULL,1,NULL,'2025-08-12 13:37:22','',NULL,NULL),(2,'محمود',NULL,'1333',NULL,'$2b$10$gzMRLO6dj8FvsBkkAyFv1eyAlpO9Y7WgwraifyolpYprZW/Hh/XHa','g@gmail.com','0566696666',NULL,3,40,'2025-08-13 11:59:16','',NULL,NULL),(3,'محمود حامد',NULL,'11',NULL,'$2b$10$u0Ou1PIgix8HtncpfwGTXe4uDoresT5ywzXRMTT5rkq/3uHj8gUJO','y@gmail.com','0577777777',NULL,2,58,'2025-08-15 20:32:55','',NULL,NULL),(4,'samar','---','22',NULL,'$2b$10$euTqjoyCYP8nNYhs1dLD8eWJoQaq0.KDLBsD9KcNC8BoBjGZd4jj.','smra12349@gmail.com','0559735137',NULL,3,NULL,'2025-08-20 22:49:26','',NULL,NULL),(5,'سحر','12345676644','55',NULL,'$2b$10$eybWjTcU7kBIIzldsvpXMORun.zvjIb3wqq56CX3CzqGJArHKS3qa','sajsksgh@gmail.com','0559735138',NULL,2,35,'2025-08-21 10:34:24','',NULL,NULL),(9,'سمورة','1234568765','66',NULL,'$2b$10$lgIaYDCYkb61z7ndVRUJYOu24AfWyuYaSlJRCQACM4Xp/jrLHIVIS','admin@kauh.sa','09878675645',NULL,1,40,'2025-08-22 23:29:47','',NULL,NULL),(10,'أحمد محمد',NULL,'ahmad',NULL,'$2b$10$CwTycUXWue0Thq9StjUM0uJ8V/7xL8lHPZXsF6k8bMJ1Q2/8pW9e.','ahmad@example.com','0555555555',NULL,3,1,'2025-08-23 14:02:41',NULL,NULL,NULL),(11,'سارة علي',NULL,'sara',NULL,'$2b$10$CwTycUXWue0Thq9StjUM0uJ8V/7xL8lHPZXsF6k8bMJ1Q2/8pW9e.','sara@example.com','0566666666',NULL,2,26,'2025-08-23 14:02:41',NULL,NULL,NULL);
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `generalrequests`
--

DROP TABLE IF EXISTS `generalrequests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `generalrequests` (
  `RequestID` int NOT NULL AUTO_INCREMENT,
  `RequestType` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `RequestDate` datetime DEFAULT CURRENT_TIMESTAMP,
  `RequestDetails` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `IsFulfilled` tinyint(1) DEFAULT '0',
  `FulfillmentDate` datetime DEFAULT NULL,
  `ResponsibleEmployeeID` int DEFAULT NULL,
  PRIMARY KEY (`RequestID`),
  KEY `ResponsibleEmployeeID` (`ResponsibleEmployeeID`),
  CONSTRAINT `generalrequests_ibfk_1` FOREIGN KEY (`ResponsibleEmployeeID`) REFERENCES `employees` (`EmployeeID`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `generalrequests`
--

LOCK TABLES `generalrequests` WRITE;
/*!40000 ALTER TABLE `generalrequests` DISABLE KEYS */;
/*!40000 ALTER TABLE `generalrequests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `impersonations`
--

DROP TABLE IF EXISTS `impersonations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `impersonations` (
  `ImpersonationID` int NOT NULL AUTO_INCREMENT,
  `SuperAdminID` int NOT NULL,
  `TargetEmployeeID` int NOT NULL,
  `StartedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `EndedAt` datetime DEFAULT NULL,
  `Reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`ImpersonationID`),
  KEY `fk_imp_sa` (`SuperAdminID`),
  KEY `fk_imp_target` (`TargetEmployeeID`),
  CONSTRAINT `fk_imp_sa` FOREIGN KEY (`SuperAdminID`) REFERENCES `employees` (`EmployeeID`) ON DELETE RESTRICT,
  CONSTRAINT `fk_imp_target` FOREIGN KEY (`TargetEmployeeID`) REFERENCES `employees` (`EmployeeID`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `impersonations`
--

LOCK TABLES `impersonations` WRITE;
/*!40000 ALTER TABLE `impersonations` DISABLE KEYS */;
/*!40000 ALTER TABLE `impersonations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `NotificationID` int NOT NULL AUTO_INCREMENT,
  `RecipientEmployeeID` int NOT NULL,
  `Title` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Body` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'info',
  `IsRead` tinyint(1) DEFAULT '0',
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `RelatedType` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `RelatedID` int DEFAULT NULL,
  PRIMARY KEY (`NotificationID`),
  KEY `fk_notif_emp` (`RecipientEmployeeID`),
  CONSTRAINT `fk_notif_emp` FOREIGN KEY (`RecipientEmployeeID`) REFERENCES `employees` (`EmployeeID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_notification_type` CHECK ((`Type` in (_utf8mb4'info',_utf8mb4'assignment',_utf8mb4'status_update',_utf8mb4'response',_utf8mb4'escalation',_utf8mb4'reminder',_utf8mb4'approval',_utf8mb4'rejection')))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,1,'تم تعيين شكوى جديدة لك','تم تعيين شكوى رقم 1 لك','assignment',0,'2025-08-23 16:02:52','complaint',1),(2,2,'تم تحديث حالة شكواك','تم تحديث حالة شكوى رقم 2 إلى قيد المعالجة','status_update',0,'2025-08-23 16:02:52','complaint',2),(3,3,'شكوى تحتاج تصعيد إداري','شكوى رقم 3 تحتاج تدخل إداري','escalation',0,'2025-08-23 16:02:52','complaint',3),(4,1,'تم تعيين شكوى جديدة لك','تم تعيين شكوى رقم 1 لك','assignment',0,'2025-08-23 16:04:02','complaint',1),(5,2,'تم تحديث حالة شكواك','تم تحديث حالة شكوى رقم 2 إلى قيد المعالجة','status_update',0,'2025-08-23 16:04:02','complaint',2),(6,3,'شكوى تحتاج تصعيد إداري','شكوى رقم 3 تحتاج تدخل إداري','escalation',0,'2025-08-23 16:04:02','complaint',3);
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_resets` (
  `ResetID` int NOT NULL AUTO_INCREMENT,
  `Username` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Token` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ExpiresAt` datetime NOT NULL,
  `UsedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`ResetID`),
  UNIQUE KEY `uq_token` (`Token`),
  KEY `idx_username` (`Username`)
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
  `FullName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `NationalID_Iqama` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ContactNumber` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Gender` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `DateOfBirth` date DEFAULT NULL,
  PRIMARY KEY (`PatientID`),
  UNIQUE KEY `NationalID_Iqama` (`NationalID_Iqama`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patients`
--

LOCK TABLES `patients` WRITE;
/*!40000 ALTER TABLE `patients` DISABLE KEYS */;
INSERT INTO `patients` VALUES (1,'فاتن','1128161729','0566750324',NULL,'أنثى',NULL),(2,'محمود','123','0563',NULL,'ذكر',NULL),(3,'محمود','12','0588',NULL,'ذكر',NULL),(4,'داليا','123456789','0566666666',NULL,'أنثى',NULL),(5,'جمال','1234565431','0588887878',NULL,'ذكر',NULL),(6,'جودي','1234567899','0562495829',NULL,'أنثى',NULL),(7,'slnd','2323','423132123',NULL,'أنثى',NULL),(8,'slnd','2323123456','23456789',NULL,'أنثى',NULL),(9,'سمورة','12345678999','09876543',NULL,'ذكر',NULL);
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
  `PermissionName` varchar(150) NOT NULL,
  `Description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`PermissionID`),
  UNIQUE KEY `PermissionName` (`PermissionName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rolepermissions`
--

DROP TABLE IF EXISTS `rolepermissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rolepermissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `permission_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `has_permission` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_role_permission` (`role_name`,`permission_name`)
) ENGINE=InnoDB AUTO_INCREMENT=1149 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rolepermissions`
--

LOCK TABLES `rolepermissions` WRITE;
/*!40000 ALTER TABLE `rolepermissions` DISABLE KEYS */;
INSERT INTO `rolepermissions` VALUES (1,'employee','submit_complaint',0,'2025-08-20 07:12:30','2025-08-24 08:40:26'),(2,'employee','follow_own_complaint',1,'2025-08-20 07:12:30','2025-08-24 08:40:26'),(3,'employee','view_public_complaints',1,'2025-08-20 07:12:30','2025-08-24 08:40:26'),(4,'employee','reply_complaints',1,'2025-08-20 07:12:30','2025-08-24 08:40:26'),(5,'employee','change_complaint_status',1,'2025-08-20 07:12:30','2025-08-24 08:40:26'),(6,'employee','export_reports',1,'2025-08-20 07:12:30','2025-08-24 08:23:58'),(7,'employee','access_dashboard',1,'2025-08-20 07:12:30','2025-08-24 08:23:58'),(8,'manager','full_system_access',1,'2025-08-20 07:12:30','2025-08-24 08:40:26'),(9,'manager','user_management',1,'2025-08-20 07:12:30','2025-08-24 08:24:48'),(10,'manager','roles_management',1,'2025-08-20 07:12:30','2025-08-24 08:40:26'),(11,'manager','performance_reports',1,'2025-08-20 07:12:30','2025-08-24 08:40:26'),(12,'manager','export_data',1,'2025-08-20 07:12:30','2025-08-24 08:40:26'),(13,'manager','audit_logs',1,'2025-08-20 07:12:30','2025-08-24 08:40:26'),(14,'manager','system_config',1,'2025-08-20 07:12:30','2025-08-24 08:40:26'),(15,'manager','backup_restore',1,'2025-08-20 07:12:30','2025-08-24 08:40:26'),(571,'SUPER_ADMIN','full_system_access',1,'2025-08-22 21:09:37','2025-08-22 21:09:37'),(572,'SUPER_ADMIN','user_management',1,'2025-08-22 21:09:37','2025-08-22 21:09:37'),(573,'SUPER_ADMIN','department_management',1,'2025-08-22 21:09:37','2025-08-22 21:09:37'),(574,'SUPER_ADMIN','assign_complaints',1,'2025-08-22 21:09:37','2025-08-22 21:09:37'),(575,'SUPER_ADMIN','transfer_complaints',1,'2025-08-22 21:09:37','2025-08-22 21:09:37'),(576,'SUPER_ADMIN','view_all_complaints',1,'2025-08-22 21:09:37','2025-08-22 21:09:37'),(577,'SUPER_ADMIN','view_reports',1,'2025-08-22 21:09:37','2025-08-22 21:09:37'),(578,'ADMIN','assign_complaints',1,'2025-08-22 21:09:37','2025-08-22 21:09:37'),(579,'ADMIN','transfer_complaints',1,'2025-08-22 21:09:37','2025-08-22 21:09:37'),(580,'ADMIN','view_department_complaints',1,'2025-08-22 21:09:37','2025-08-22 21:09:37'),(581,'ADMIN','view_reports',1,'2025-08-22 21:09:37','2025-08-22 21:09:37'),(582,'ADMIN','update_complaint_status',1,'2025-08-22 21:09:37','2025-08-22 21:09:37'),(583,'ADMIN','add_comments',1,'2025-08-22 21:09:37','2025-08-22 21:09:37'),(584,'EMPLOYEE','view_assigned_complaints',1,'2025-08-22 21:09:37','2025-08-22 21:09:37'),(585,'EMPLOYEE','update_complaint_status',1,'2025-08-22 21:09:37','2025-08-22 21:09:37'),(586,'EMPLOYEE','add_comments',1,'2025-08-22 21:09:37','2025-08-22 21:09:37'),(609,'manager','submit_complaint',0,'2025-08-22 23:08:26','2025-08-22 23:08:26'),(610,'manager','follow_own_complaint',0,'2025-08-22 23:08:26','2025-08-22 23:08:26'),(611,'manager','view_public_complaints',0,'2025-08-22 23:08:26','2025-08-22 23:08:26'),(612,'manager','reply_complaints',0,'2025-08-22 23:08:26','2025-08-22 23:08:26'),(613,'manager','change_complaint_status',0,'2025-08-22 23:08:26','2025-08-22 23:08:26'),(614,'manager','export_reports',0,'2025-08-22 23:08:26','2025-08-22 23:08:26'),(615,'manager','access_dashboard',0,'2025-08-22 23:08:26','2025-08-22 23:08:26'),(764,'موظف','submit_complaint',1,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(765,'موظف','follow_own_complaint',1,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(766,'موظف','view_public_complaints',0,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(767,'موظف','reply_complaints',1,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(768,'موظف','change_complaint_status',1,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(769,'موظف','export_reports',0,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(770,'موظف','access_dashboard',0,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(771,'أدمن (رئيس قسم)','submit_complaint',1,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(772,'أدمن (رئيس قسم)','follow_own_complaint',1,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(773,'أدمن (رئيس قسم)','view_public_complaints',1,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(774,'أدمن (رئيس قسم)','reply_complaints',1,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(775,'أدمن (رئيس قسم)','change_complaint_status',1,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(776,'أدمن (رئيس قسم)','export_reports',1,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(777,'أدمن (رئيس قسم)','access_dashboard',1,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(778,'أدمن (رئيس قسم)','user_management',0,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(779,'أدمن (رئيس قسم)','roles_management',0,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(780,'أدمن (رئيس قسم)','performance_reports',0,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(781,'أدمن (رئيس قسم)','export_data',0,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(782,'أدمن (رئيس قسم)','audit_logs',0,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(783,'أدمن (رئيس قسم)','system_config',0,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(784,'أدمن (رئيس قسم)','backup_restore',0,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(785,'سوبر أدمن','submit_complaint',1,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(786,'سوبر أدمن','follow_own_complaint',1,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(787,'سوبر أدمن','view_public_complaints',1,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(788,'سوبر أدمن','reply_complaints',1,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(789,'سوبر أدمن','change_complaint_status',1,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(790,'سوبر أدمن','export_reports',1,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(791,'سوبر أدمن','access_dashboard',1,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(792,'سوبر أدمن','user_management',1,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(793,'سوبر أدمن','roles_management',1,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(794,'سوبر أدمن','performance_reports',1,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(795,'سوبر أدمن','export_data',1,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(796,'سوبر أدمن','audit_logs',1,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(797,'سوبر أدمن','system_config',1,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(798,'سوبر أدمن','backup_restore',1,'2025-08-23 13:01:43','2025-08-23 13:01:43'),(871,'employee','full_system_access',0,'2025-08-23 13:12:24','2025-08-23 13:12:24'),(872,'employee','user_management',0,'2025-08-23 13:12:24','2025-08-23 13:12:24'),(873,'employee','roles_management',0,'2025-08-23 13:12:24','2025-08-23 13:12:24'),(874,'employee','performance_reports',0,'2025-08-23 13:12:24','2025-08-23 13:12:24'),(875,'employee','export_data',0,'2025-08-23 13:12:24','2025-08-23 13:12:24'),(876,'employee','audit_logs',0,'2025-08-23 13:12:24','2025-08-23 13:12:24'),(877,'employee','system_config',0,'2025-08-23 13:12:24','2025-08-23 13:12:24'),(878,'employee','backup_restore',0,'2025-08-23 13:12:24','2025-08-23 13:12:24');
/*!40000 ALTER TABLE `rolepermissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `RoleID` int NOT NULL AUTO_INCREMENT,
  `RoleName` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Permissions` json DEFAULT NULL,
  PRIMARY KEY (`RoleID`),
  UNIQUE KEY `RoleName` (`RoleName`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'SUPER_ADMIN','مدير النظام - صلاحيات شاملة',NULL),(2,'EMPLOYEE','موظف - صلاحيات يومية عادية','[]'),(3,'ADMIN','رئيس قسم - صلاحيات محدودة بقسمه',NULL);
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles_backup_once`
--

DROP TABLE IF EXISTS `roles_backup_once`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles_backup_once` (
  `RoleID` int NOT NULL AUTO_INCREMENT,
  `RoleName` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Permissions` json DEFAULT NULL,
  PRIMARY KEY (`RoleID`),
  UNIQUE KEY `RoleName` (`RoleName`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles_backup_once`
--

LOCK TABLES `roles_backup_once` WRITE;
/*!40000 ALTER TABLE `roles_backup_once` DISABLE KEYS */;
INSERT INTO `roles_backup_once` VALUES (1,'سوبر أدمن','صلاحيات كاملة + سويتش يوزر',NULL),(2,'موظف','صلاحيات الموظف الافتراضية','[]'),(3,'أدمن (رئيس قسم)','يدير موظفي قسمه ويحوّل الشكاوى',NULL);
/*!40000 ALTER TABLE `roles_backup_once` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-25  2:56:57
