-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.4.3 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Dumping structure for table eos365-bak.activity_log
CREATE TABLE IF NOT EXISTS `activity_log` (
  `id` bigint unsigned NOT NULL,
  `log_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject_type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `event` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject_id` bigint unsigned DEFAULT NULL,
  `causer_type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `causer_id` bigint unsigned DEFAULT NULL,
  `properties` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `batch_uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `subject` (`subject_type`,`subject_id`),
  KEY `causer` (`causer_type`,`causer_id`),
  KEY `activity_log_log_name_index` (`log_name`),
  CONSTRAINT `activity_log_chk_1` CHECK (json_valid(`properties`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.activity_log: 387 rows
/*!40000 ALTER TABLE `activity_log` DISABLE KEYS */;


-- Dumping structure for table eos365-bak.assessments
CREATE TABLE IF NOT EXISTS `assessments` (
  `id` bigint unsigned NOT NULL,
  `course_id` bigint unsigned NOT NULL,
  `module_id` bigint unsigned DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `passing_score` int NOT NULL DEFAULT '70',
  `time_limit_minutes` int DEFAULT NULL,
  `is_final_exam` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `assessments_course_id_foreign` (`course_id`),
  KEY `assessments_module_id_foreign` (`module_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.assessments: 0 rows
/*!40000 ALTER TABLE `assessments` DISABLE KEYS */;
/*!40000 ALTER TABLE `assessments` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.assessment_answers
CREATE TABLE IF NOT EXISTS `assessment_answers` (
  `id` bigint unsigned NOT NULL,
  `question_id` bigint unsigned NOT NULL,
  `answer_text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_correct` tinyint(1) NOT NULL DEFAULT '0',
  `explanation` text COLLATE utf8mb4_unicode_ci,
  `order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `assessment_answers_question_id_foreign` (`question_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.assessment_answers: 0 rows
/*!40000 ALTER TABLE `assessment_answers` DISABLE KEYS */;
/*!40000 ALTER TABLE `assessment_answers` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.assessment_attempts
CREATE TABLE IF NOT EXISTS `assessment_attempts` (
  `id` bigint unsigned NOT NULL,
  `enrollment_id` bigint unsigned NOT NULL,
  `assessment_id` bigint unsigned NOT NULL,
  `started_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `submitted_at` timestamp NULL DEFAULT NULL,
  `score` int DEFAULT NULL,
  `percentage` double DEFAULT NULL,
  `passed` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `assessment_attempts_enrollment_id_foreign` (`enrollment_id`),
  KEY `assessment_attempts_assessment_id_foreign` (`assessment_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.assessment_attempts: 0 rows
/*!40000 ALTER TABLE `assessment_attempts` DISABLE KEYS */;
/*!40000 ALTER TABLE `assessment_attempts` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.assessment_questions
CREATE TABLE IF NOT EXISTS `assessment_questions` (
  `id` bigint unsigned NOT NULL,
  `assessment_id` bigint unsigned NOT NULL,
  `question` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `question_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'multiple_choice',
  `points` int NOT NULL DEFAULT '1',
  `order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `assessment_questions_assessment_id_foreign` (`assessment_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.assessment_questions: 0 rows
/*!40000 ALTER TABLE `assessment_questions` DISABLE KEYS */;
/*!40000 ALTER TABLE `assessment_questions` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.assets
CREATE TABLE IF NOT EXISTS `assets` (
  `id` bigint unsigned NOT NULL,
  `assignee` bigint unsigned NOT NULL,
  `asset_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `assigned_date` timestamp NULL DEFAULT NULL,
  `asset_image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `assets_asset_id_unique` (`asset_id`),
  KEY `assets_assignee_foreign` (`assignee`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.assets: ~0 rows (approximately)

-- Dumping structure for table eos365-bak.attempt_answers
CREATE TABLE IF NOT EXISTS `attempt_answers` (
  `id` bigint unsigned NOT NULL,
  `attempt_id` bigint unsigned NOT NULL,
  `question_id` bigint unsigned NOT NULL,
  `answer_id` bigint unsigned DEFAULT NULL,
  `text_answer` text COLLATE utf8mb4_unicode_ci,
  `is_correct` tinyint(1) NOT NULL DEFAULT '0',
  `points_earned` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `attempt_answers_attempt_id_foreign` (`attempt_id`),
  KEY `attempt_answers_question_id_foreign` (`question_id`),
  KEY `attempt_answers_answer_id_foreign` (`answer_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.attempt_answers: 0 rows
/*!40000 ALTER TABLE `attempt_answers` DISABLE KEYS */;
/*!40000 ALTER TABLE `attempt_answers` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.attendances
CREATE TABLE IF NOT EXISTS `attendances` (
  `id` bigint unsigned NOT NULL,
  `user_id` int NOT NULL,
  `date` date NOT NULL,
  `punchin` time DEFAULT NULL,
  `punchout` time DEFAULT NULL,
  `punchin_location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `punchout_location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping structure for table eos365-bak.attendance_types
CREATE TABLE IF NOT EXISTS `attendance_types` (
  `id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `icon` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `priority` int NOT NULL DEFAULT '100',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `required_permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `attendance_types_slug_unique` (`slug`),
  CONSTRAINT `attendance_types_chk_1` CHECK (json_valid(`config`)),
  CONSTRAINT `attendance_types_chk_2` CHECK (json_valid(`required_permissions`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.attendance_types: ~3 rows (approximately)
INSERT INTO `attendance_types` (`id`, `name`, `slug`, `config`, `icon`, `description`, `priority`, `is_active`, `required_permissions`, `created_at`, `updated_at`) VALUES
	(5, 'K0-48', 'route_waypoint', '{"tolerance":500,"validation_mode":"any","allow_without_location":false,"waypoints":[{"lat":"23.986586","lng":"90.362533"},{"lat":"23.690532","lng":"90.546699"}]}', 'ðŸ—ºï¸', NULL, 100, 1, '[]', '2025-11-26 06:22:50', '2025-11-26 07:04:28'),
	(7, 'K26 Office', 'geo_polygon_2', '{"validation_mode":"any","allow_without_location":false,"polygon":[{"lat":"23.833677","lng":"90.532022"},{"lat":"23.831401","lng":"90.536399"},{"lat":"23.830144","lng":"90.541935"},{"lat":"23.831204","lng":"90.546527"},{"lat":"23.836602","lng":"90.543652"},{"lat":"23.840370","lng":"90.541484"},{"lat":"23.843314","lng":"90.540969"},{"lat":"23.841980","lng":"90.533137"}]}', 'ðŸ“', NULL, 100, 1, '[]', '2025-11-26 06:32:31', '2025-11-26 07:21:15'),
	(8, 'K-26 Office', 'wifi_ip', '{"allowed_ips":["45.251.57.220"],"allowed_ranges":[],"validation_mode":"any","allow_without_network":false}', 'ðŸ“¶', NULL, 100, 1, '[]', '2025-11-26 06:45:01', '2025-11-27 20:47:57');

-- Dumping data for table eos365-bak.attendances: ~0 rows (approximately)

-- Dumping structure for table eos365-bak.attendance_settings
CREATE TABLE IF NOT EXISTS `attendance_settings` (
  `id` bigint unsigned NOT NULL,
  `office_start_time` time NOT NULL DEFAULT '09:00:00',
  `office_end_time` time NOT NULL DEFAULT '18:00:00',
  `break_time_duration` int NOT NULL DEFAULT '60',
  `late_mark_after` int NOT NULL DEFAULT '15',
  `early_leave_before` int NOT NULL DEFAULT '15',
  `overtime_after` int NOT NULL DEFAULT '30',
  `auto_punch_out` tinyint(1) NOT NULL DEFAULT '0',
  `auto_punch_out_time` time DEFAULT NULL,
  `weekend_days` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `attendance_settings_chk_1` CHECK (json_valid(`weekend_days`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.attendance_settings: ~1 rows (approximately)


-- Dumping structure for table eos365-bak.audit_findings
CREATE TABLE IF NOT EXISTS `audit_findings` (
  `id` bigint unsigned NOT NULL,
  `audit_id` bigint unsigned NOT NULL,
  `finding_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `severity` enum('critical','major','minor','observation') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'minor',
  `category` enum('non_conformance','opportunity_for_improvement','best_practice','observation') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'non_conformance',
  `area_affected` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `requirement_reference` text COLLATE utf8mb4_unicode_ci,
  `evidence` text COLLATE utf8mb4_unicode_ci,
  `root_cause` text COLLATE utf8mb4_unicode_ci,
  `immediate_action` text COLLATE utf8mb4_unicode_ci,
  `corrective_action_required` text COLLATE utf8mb4_unicode_ci,
  `assigned_to` bigint unsigned DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `status` enum('open','in_progress','completed','verified','closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `implementation_notes` text COLLATE utf8mb4_unicode_ci,
  `completed_date` date DEFAULT NULL,
  `verified_by` bigint unsigned DEFAULT NULL,
  `verified_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `audit_findings_audit_id_foreign` (`audit_id`),
  KEY `audit_findings_assigned_to_foreign` (`assigned_to`),
  KEY `audit_findings_verified_by_foreign` (`verified_by`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.audit_findings: 0 rows
/*!40000 ALTER TABLE `audit_findings` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_findings` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.audit_logs
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` bigint unsigned NOT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `context` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `level` enum('emergency','alert','critical','error','warning','notice','info','debug') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'info',
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `route` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `method` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url` text COLLATE utf8mb4_unicode_ci,
  `session_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `audit_logs_user_id_created_at_index` (`user_id`,`created_at`),
  KEY `audit_logs_level_created_at_index` (`level`,`created_at`),
  KEY `audit_logs_action_index` (`action`),
  KEY `audit_logs_created_at_index` (`created_at`),
  KEY `audit_logs_ip_address_index` (`ip_address`),
  KEY `audit_logs_route_index` (`route`),
  CONSTRAINT `audit_logs_chk_1` CHECK (json_valid(`context`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.audit_logs: 0 rows
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.authentication_events
CREATE TABLE IF NOT EXISTS `authentication_events` (
  `id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `event_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `risk_level` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'low',
  `occurred_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `authentication_events_user_id_event_type_index` (`user_id`,`event_type`),
  KEY `authentication_events_ip_address_occurred_at_index` (`ip_address`,`occurred_at`),
  CONSTRAINT `authentication_events_chk_1` CHECK (json_valid(`metadata`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.authentication_events: 2,438 rows
/*!40000 ALTER TABLE `authentication_events` DISABLE KEYS */;
/*!40000 ALTER TABLE `authentication_events` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.benefits
CREATE TABLE IF NOT EXISTS `benefits` (
  `id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cost` decimal(10,2) DEFAULT NULL,
  `eligibility_criteria` text COLLATE utf8mb4_unicode_ci,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- Dumping structure for table eos365-bak.cache
CREATE TABLE IF NOT EXISTS `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.cache: ~2 rows (approximately)

-- Dumping structure for table eos365-bak.cache_locks
CREATE TABLE IF NOT EXISTS `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.cache_locks: ~0 rows (approximately)

-- Dumping structure for table eos365-bak.cash_registers
CREATE TABLE IF NOT EXISTS `cash_registers` (
  `id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `opening_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `closing_amount` decimal(15,2) DEFAULT NULL,
  `opened_at` timestamp NULL DEFAULT NULL,
  `closed_at` timestamp NULL DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cash_registers_user_id_foreign` (`user_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.cash_registers: 0 rows
/*!40000 ALTER TABLE `cash_registers` DISABLE KEYS */;
/*!40000 ALTER TABLE `cash_registers` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.company_settings
CREATE TABLE IF NOT EXISTS `company_settings` (
  `id` bigint unsigned NOT NULL,
  `companyName` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contactPerson` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `state` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `postalCode` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phoneNumber` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mobileNumber` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fax` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `websiteUrl` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.company_settings: ~1 rows (approximately)
INSERT INTO `company_settings` (`id`, `companyName`, `contactPerson`, `address`, `country`, `city`, `state`, `postalCode`, `email`, `phoneNumber`, `mobileNumber`, `fax`, `websiteUrl`, `created_at`, `updated_at`) VALUES
	(1, 'DBEDC', 'Emam Hosen', 'Road 305, Sector 4,', 'Bangladesh', 'Narayanganj', 'Dhaka', '1461', 'qcd@dhakabypass.com', '01610285004', NULL, NULL, NULL, '2024-09-12 21:18:14', '2024-09-12 21:21:05');

-- Dumping structure for table eos365-bak.competencies
CREATE TABLE IF NOT EXISTS `competencies` (
  `id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `level` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Dumping structure for table eos365-bak.competency_skills
CREATE TABLE IF NOT EXISTS `competency_skills` (
  `id` bigint unsigned NOT NULL,
  `competency_id` bigint unsigned NOT NULL,
  `skill_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `competency_skills_competency_id_foreign` (`competency_id`),
  KEY `competency_skills_skill_id_foreign` (`skill_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.competency_skills: 0 rows
/*!40000 ALTER TABLE `competency_skills` DISABLE KEYS */;
/*!40000 ALTER TABLE `competency_skills` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.compliance_audits
CREATE TABLE IF NOT EXISTS `compliance_audits` (
  `id` bigint unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `type` enum('internal','external','supplier','surveillance','certification') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('planned','in_progress','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL,
  `planned_date` date NOT NULL,
  `actual_date` date DEFAULT NULL,
  `lead_auditor_id` bigint unsigned NOT NULL,
  `department_id` bigint unsigned DEFAULT NULL,
  `scope` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `findings` text COLLATE utf8mb4_unicode_ci,
  `reference_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.compliance_audits: 0 rows
/*!40000 ALTER TABLE `compliance_audits` DISABLE KEYS */;
/*!40000 ALTER TABLE `compliance_audits` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.compliance_audit_findings
CREATE TABLE IF NOT EXISTS `compliance_audit_findings` (
  `id` bigint unsigned NOT NULL,
  `audit_id` bigint unsigned NOT NULL,
  `type` enum('non_conformance','observation','opportunity_for_improvement') COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `root_cause` text COLLATE utf8mb4_unicode_ci,
  `corrective_action` text COLLATE utf8mb4_unicode_ci,
  `due_date` date DEFAULT NULL,
  `assigned_to` bigint unsigned DEFAULT NULL,
  `status` enum('open','in_progress','closed','verified') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.compliance_audit_findings: 0 rows
/*!40000 ALTER TABLE `compliance_audit_findings` DISABLE KEYS */;
/*!40000 ALTER TABLE `compliance_audit_findings` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.compliance_documents
CREATE TABLE IF NOT EXISTS `compliance_documents` (
  `id` bigint unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `document_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `version` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('draft','review','approved','published','archived','superseded') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `document_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `effective_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `owner_id` bigint unsigned NOT NULL,
  `department_id` bigint unsigned DEFAULT NULL,
  `keywords` text COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `approved_at` timestamp NULL DEFAULT NULL,
  `approved_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.compliance_documents: 0 rows
/*!40000 ALTER TABLE `compliance_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `compliance_documents` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.compliance_document_revisions
CREATE TABLE IF NOT EXISTS `compliance_document_revisions` (
  `id` bigint unsigned NOT NULL,
  `document_id` bigint unsigned NOT NULL,
  `version` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `change_summary` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.compliance_document_revisions: 0 rows
/*!40000 ALTER TABLE `compliance_document_revisions` DISABLE KEYS */;
/*!40000 ALTER TABLE `compliance_document_revisions` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.compliance_policies
CREATE TABLE IF NOT EXISTS `compliance_policies` (
  `id` bigint unsigned NOT NULL,
  `policy_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `policy_type` enum('internal','regulatory','industry','customer','vendor') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'internal',
  `category` enum('hr','finance','operations','security','quality','environmental','legal','other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'other',
  `department` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `owner_id` bigint unsigned NOT NULL,
  `effective_date` date NOT NULL,
  `review_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `version` int NOT NULL DEFAULT '1',
  `status` enum('draft','under_review','approved','active','expired','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `priority` enum('low','medium','high','critical') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `applicable_locations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `applicable_roles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `approval_notes` text COLLATE utf8mb4_unicode_ci,
  `approved_by` bigint unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `tags` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `compliance_policies_chk_1` CHECK (json_valid(`applicable_locations`)),
  CONSTRAINT `compliance_policies_chk_2` CHECK (json_valid(`applicable_roles`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.compliance_policies: 0 rows
/*!40000 ALTER TABLE `compliance_policies` DISABLE KEYS */;
/*!40000 ALTER TABLE `compliance_policies` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.compliance_policy_acknowledgments
CREATE TABLE IF NOT EXISTS `compliance_policy_acknowledgments` (
  `id` bigint unsigned NOT NULL,
  `policy_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `acknowledged_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `acknowledgment_method` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'digital',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.compliance_policy_acknowledgments: 0 rows
/*!40000 ALTER TABLE `compliance_policy_acknowledgments` DISABLE KEYS */;
/*!40000 ALTER TABLE `compliance_policy_acknowledgments` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.compliance_requirements
CREATE TABLE IF NOT EXISTS `compliance_requirements` (
  `id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `source` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `applicable` tinyint(1) NOT NULL DEFAULT '1',
  `status` enum('compliant','non_compliant','partially_compliant','in_progress','not_evaluated') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'not_evaluated',
  `compliance_evidence` text COLLATE utf8mb4_unicode_ci,
  `responsible_person_id` bigint unsigned DEFAULT NULL,
  `last_evaluation_date` date DEFAULT NULL,
  `next_evaluation_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.compliance_requirements: 0 rows
/*!40000 ALTER TABLE `compliance_requirements` DISABLE KEYS */;
/*!40000 ALTER TABLE `compliance_requirements` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.compliance_training_records
CREATE TABLE IF NOT EXISTS `compliance_training_records` (
  `id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `training_title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `training_description` text COLLATE utf8mb4_unicode_ci,
  `training_type` enum('policy','regulatory','safety','security','quality','ethics','other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'policy',
  `training_provider` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `training_date` date NOT NULL,
  `expiry_date` date DEFAULT NULL,
  `duration_hours` int DEFAULT NULL,
  `completion_status` enum('completed','in_progress','not_started','expired') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'not_started',
  `score` decimal(5,2) DEFAULT NULL,
  `passing_score` decimal(5,2) DEFAULT NULL,
  `certificate_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `certificate_file_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.compliance_training_records: 0 rows
/*!40000 ALTER TABLE `compliance_training_records` DISABLE KEYS */;
/*!40000 ALTER TABLE `compliance_training_records` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.controlled_documents
CREATE TABLE IF NOT EXISTS `controlled_documents` (
  `id` bigint unsigned NOT NULL,
  `document_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `document_type` enum('policy','procedure','work_instruction','form','record','manual','specification','other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'procedure',
  `department` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `owner_id` bigint unsigned NOT NULL,
  `approver_id` bigint unsigned DEFAULT NULL,
  `version` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `effective_date` date NOT NULL,
  `review_date` date DEFAULT NULL,
  `next_review_date` date DEFAULT NULL,
  `status` enum('draft','under_review','approved','active','superseded','obsolete') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` int DEFAULT NULL,
  `mime_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `revision_notes` text COLLATE utf8mb4_unicode_ci,
  `distribution_list` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `controlled_copy` tinyint(1) NOT NULL DEFAULT '1',
  `retention_period` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `controlled_documents_chk_1` CHECK (json_valid(`distribution_list`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.controlled_documents: 0 rows
/*!40000 ALTER TABLE `controlled_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `controlled_documents` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.courses
CREATE TABLE IF NOT EXISTS `courses` (
  `id` bigint unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `objectives` text COLLATE utf8mb4_unicode_ci,
  `level` enum('beginner','intermediate','advanced') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'beginner',
  `duration_minutes` int NOT NULL DEFAULT '0',
  `thumbnail` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `instructor_id` bigint unsigned DEFAULT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `published_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.courses: 0 rows
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
/*!40000 ALTER TABLE `courses` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.course_categories
CREATE TABLE IF NOT EXISTS `course_categories` (
  `id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `parent_id` bigint unsigned DEFAULT NULL,
  `icon` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.course_categories: 0 rows
/*!40000 ALTER TABLE `course_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `course_categories` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.course_category
CREATE TABLE IF NOT EXISTS `course_category` (
  `id` bigint unsigned NOT NULL,
  `course_id` bigint unsigned NOT NULL,
  `course_category_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.course_category: 0 rows
/*!40000 ALTER TABLE `course_category` DISABLE KEYS */;
/*!40000 ALTER TABLE `course_category` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.course_lessons
CREATE TABLE IF NOT EXISTS `course_lessons` (
  `id` bigint unsigned NOT NULL,
  `module_id` bigint unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `content_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text',
  `content_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration_minutes` int NOT NULL DEFAULT '0',
  `order` int NOT NULL DEFAULT '0',
  `is_free` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.course_lessons: 0 rows
/*!40000 ALTER TABLE `course_lessons` DISABLE KEYS */;
/*!40000 ALTER TABLE `course_lessons` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.course_modules
CREATE TABLE IF NOT EXISTS `course_modules` (
  `id` bigint unsigned NOT NULL,
  `course_id` bigint unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.course_modules: 0 rows
/*!40000 ALTER TABLE `course_modules` DISABLE KEYS */;
/*!40000 ALTER TABLE `course_modules` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.customers
CREATE TABLE IF NOT EXISTS `customers` (
  `id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `company` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive','lead','prospect') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'lead',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `customer_type` enum('individual','company') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'individual',
  `assigned_to` bigint unsigned DEFAULT NULL,
  `last_contact_date` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.customers: 0 rows
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.customer_interactions
CREATE TABLE IF NOT EXISTS `customer_interactions` (
  `id` bigint unsigned NOT NULL,
  `customer_id` bigint unsigned NOT NULL,
  `opportunity_id` bigint unsigned DEFAULT NULL,
  `type` enum('call','email','meeting','note','task') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'note',
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `interaction_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `user_id` bigint unsigned NOT NULL,
  `outcome` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_completed` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.customer_interactions: 0 rows
/*!40000 ALTER TABLE `customer_interactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_interactions` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.customs_declarations
CREATE TABLE IF NOT EXISTS `customs_declarations` (
  `id` bigint unsigned NOT NULL,
  `declaration_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `declaration_type` enum('import','export') COLLATE utf8mb4_unicode_ci NOT NULL,
  `declarable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `declarable_id` bigint unsigned NOT NULL,
  `origin_country` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL,
  `destination_country` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL,
  `port_of_entry` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `port_of_exit` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `declared_value` decimal(15,2) NOT NULL,
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USD',
  `duties_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `taxes_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total_charges` decimal(15,2) NOT NULL DEFAULT '0.00',
  `hs_codes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `declaration_date` date NOT NULL,
  `clearance_date` date DEFAULT NULL,
  `status` enum('pending','submitted','under_review','cleared','held','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `customs_officer` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `customs_declarations_chk_1` CHECK (json_valid(`hs_codes`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.customs_declarations: 0 rows
/*!40000 ALTER TABLE `customs_declarations` DISABLE KEYS */;
/*!40000 ALTER TABLE `customs_declarations` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.daily_work_has_report
CREATE TABLE IF NOT EXISTS `daily_work_has_report` (
  `id` bigint unsigned NOT NULL,
  `daily_work_id` bigint unsigned NOT NULL,
  `report_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.daily_work_has_report: ~0 rows (approximately)

-- Dumping structure for table eos365-bak.daily_work_summaries
CREATE TABLE IF NOT EXISTS `daily_work_summaries` (
  `id` bigint unsigned NOT NULL,
  `date` date NOT NULL,
  `incharge` bigint unsigned NOT NULL,
  `totalDailyWorks` int NOT NULL,
  `resubmissions` int NOT NULL,
  `embankment` int NOT NULL,
  `structure` int NOT NULL,
  `pavement` int NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Dumping structure for table eos365-bak.dashboards
CREATE TABLE IF NOT EXISTS `dashboards` (
  `id` bigint unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `dashboard_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT '0',
  `refresh_interval` int DEFAULT NULL,
  `layout` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `dashboards_chk_1` CHECK (json_valid(`layout`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.dashboards: 0 rows
/*!40000 ALTER TABLE `dashboards` DISABLE KEYS */;
/*!40000 ALTER TABLE `dashboards` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.dashboard_widgets
CREATE TABLE IF NOT EXISTS `dashboard_widgets` (
  `id` bigint unsigned NOT NULL,
  `dashboard_id` bigint unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `widget_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `chart_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `size` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `position` int NOT NULL,
  `data_source` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `refresh_interval` int DEFAULT NULL,
  `settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `dashboard_widgets_chk_1` CHECK (json_valid(`settings`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.dashboard_widgets: 0 rows
/*!40000 ALTER TABLE `dashboard_widgets` DISABLE KEYS */;
/*!40000 ALTER TABLE `dashboard_widgets` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.demand_forecasts
CREATE TABLE IF NOT EXISTS `demand_forecasts` (
  `id` bigint unsigned NOT NULL,
  `forecast_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `inventory_item_id` bigint unsigned DEFAULT NULL,
  `forecast_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `forecast_period_start` date NOT NULL,
  `forecast_period_end` date NOT NULL,
  `forecast_method` enum('historical','linear_regression','moving_average','exponential_smoothing','manual') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'historical',
  `forecast_parameters` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `forecasted_demand` decimal(15,2) NOT NULL,
  `confidence_level` decimal(5,2) NOT NULL DEFAULT '80.00',
  `actual_demand` decimal(15,2) DEFAULT NULL,
  `accuracy_percentage` decimal(5,2) DEFAULT NULL,
  `created_by` bigint unsigned NOT NULL,
  `status` enum('draft','active','completed','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `demand_forecasts_chk_1` CHECK (json_valid(`forecast_parameters`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.demand_forecasts: 0 rows
/*!40000 ALTER TABLE `demand_forecasts` DISABLE KEYS */;
/*!40000 ALTER TABLE `demand_forecasts` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.departments
CREATE TABLE IF NOT EXISTS `departments` (
  `id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `parent_id` bigint unsigned DEFAULT NULL,
  `manager_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `established_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Dumping structure for table eos365-bak.designations
CREATE TABLE IF NOT EXISTS `designations` (
  `id` bigint unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Designation title',
  `department_id` bigint unsigned NOT NULL,
  `parent_id` bigint unsigned DEFAULT NULL COMMENT 'For hierarchical structure, if applicable',
  `hierarchy_level` int unsigned NOT NULL DEFAULT '1' COMMENT 'Hierarchy level: 1 = highest (CEO, Director), higher numbers = lower positions',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Designation active status',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Dumping structure for table eos365-bak.dms_approval_workflows
CREATE TABLE IF NOT EXISTS `dms_approval_workflows` (
  `id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `steps` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `dms_approval_workflows_chk_1` CHECK (json_valid(`steps`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.dms_approval_workflows: 0 rows
/*!40000 ALTER TABLE `dms_approval_workflows` DISABLE KEYS */;
/*!40000 ALTER TABLE `dms_approval_workflows` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.dms_categories
CREATE TABLE IF NOT EXISTS `dms_categories` (
  `id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `color` varchar(7) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#3B82F6',
  `icon` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `allowed_file_types` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `max_file_size` int NOT NULL DEFAULT '10240',
  `retention_period` int DEFAULT NULL,
  `requires_approval` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  `parent_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `dms_categories_chk_1` CHECK (json_valid(`allowed_file_types`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.dms_categories: 0 rows
/*!40000 ALTER TABLE `dms_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `dms_categories` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.dms_documents
CREATE TABLE IF NOT EXISTS `dms_documents` (
  `id` bigint unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `category_id` bigint unsigned NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int NOT NULL,
  `mime_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `keywords` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `custom_fields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `version` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1.0',
  `parent_document_id` bigint unsigned DEFAULT NULL,
  `is_latest_version` tinyint(1) NOT NULL DEFAULT '1',
  `status` enum('draft','pending_review','approved','published','archived','expired') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `created_by` bigint unsigned NOT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `approved_by` bigint unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `published_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `visibility` enum('public','internal','restricted','confidential') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'internal',
  `access_permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `search_content` text COLLATE utf8mb4_unicode_ci,
  `is_searchable` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `dms_documents_chk_1` CHECK (json_valid(`tags`)),
  CONSTRAINT `dms_documents_chk_2` CHECK (json_valid(`keywords`)),
  CONSTRAINT `dms_documents_chk_3` CHECK (json_valid(`custom_fields`)),
  CONSTRAINT `dms_documents_chk_4` CHECK (json_valid(`access_permissions`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.dms_documents: 0 rows
/*!40000 ALTER TABLE `dms_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `dms_documents` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.dms_document_access_logs
CREATE TABLE IF NOT EXISTS `dms_document_access_logs` (
  `id` bigint unsigned NOT NULL,
  `document_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `action` enum('view','download','edit','delete','share') COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `dms_document_access_logs_chk_1` CHECK (json_valid(`metadata`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.dms_document_access_logs: 0 rows
/*!40000 ALTER TABLE `dms_document_access_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `dms_document_access_logs` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.dms_document_approvals
CREATE TABLE IF NOT EXISTS `dms_document_approvals` (
  `id` bigint unsigned NOT NULL,
  `document_id` bigint unsigned NOT NULL,
  `workflow_id` bigint unsigned NOT NULL,
  `step_number` int NOT NULL,
  `approver_id` bigint unsigned NOT NULL,
  `status` enum('pending','approved','rejected','skipped') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `comments` text COLLATE utf8mb4_unicode_ci,
  `responded_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.dms_document_approvals: 0 rows
/*!40000 ALTER TABLE `dms_document_approvals` DISABLE KEYS */;
/*!40000 ALTER TABLE `dms_document_approvals` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.dms_document_comments
CREATE TABLE IF NOT EXISTS `dms_document_comments` (
  `id` bigint unsigned NOT NULL,
  `document_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `type` enum('general','annotation','review','approval') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'general',
  `parent_comment_id` bigint unsigned DEFAULT NULL,
  `is_resolved` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `dms_document_comments_chk_1` CHECK (json_valid(`position`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.dms_document_comments: 0 rows
/*!40000 ALTER TABLE `dms_document_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `dms_document_comments` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.dms_document_folders
CREATE TABLE IF NOT EXISTS `dms_document_folders` (
  `id` bigint unsigned NOT NULL,
  `document_id` bigint unsigned NOT NULL,
  `folder_id` bigint unsigned NOT NULL,
  `added_by` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.dms_document_folders: 0 rows
/*!40000 ALTER TABLE `dms_document_folders` DISABLE KEYS */;
/*!40000 ALTER TABLE `dms_document_folders` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.dms_document_shares
CREATE TABLE IF NOT EXISTS `dms_document_shares` (
  `id` bigint unsigned NOT NULL,
  `document_id` bigint unsigned NOT NULL,
  `shared_by` bigint unsigned NOT NULL,
  `shared_with` bigint unsigned DEFAULT NULL,
  `share_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `permission` enum('view','comment','edit') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'view',
  `expires_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `download_count` int NOT NULL DEFAULT '0',
  `view_count` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.dms_document_shares: 0 rows
/*!40000 ALTER TABLE `dms_document_shares` DISABLE KEYS */;
/*!40000 ALTER TABLE `dms_document_shares` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.dms_document_versions
CREATE TABLE IF NOT EXISTS `dms_document_versions` (
  `id` bigint unsigned NOT NULL,
  `document_id` bigint unsigned NOT NULL,
  `version` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `change_summary` text COLLATE utf8mb4_unicode_ci,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int NOT NULL,
  `checksum` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.dms_document_versions: 0 rows
/*!40000 ALTER TABLE `dms_document_versions` DISABLE KEYS */;
/*!40000 ALTER TABLE `dms_document_versions` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.dms_folders
CREATE TABLE IF NOT EXISTS `dms_folders` (
  `id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `color` varchar(7) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#6B7280',
  `parent_id` bigint unsigned DEFAULT NULL,
  `created_by` bigint unsigned NOT NULL,
  `access_permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `is_shared` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `dms_folders_chk_1` CHECK (json_valid(`access_permissions`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.dms_folders: 0 rows
/*!40000 ALTER TABLE `dms_folders` DISABLE KEYS */;
/*!40000 ALTER TABLE `dms_folders` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.dms_signatures
CREATE TABLE IF NOT EXISTS `dms_signatures` (
  `id` bigint unsigned NOT NULL,
  `document_id` bigint unsigned NOT NULL,
  `signer_id` bigint unsigned NOT NULL,
  `signature_data` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `signature_type` enum('digital','electronic','wet') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'electronic',
  `certificate_fingerprint` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `signed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_valid` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `dms_signatures_chk_1` CHECK (json_valid(`metadata`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.dms_signatures: 0 rows
/*!40000 ALTER TABLE `dms_signatures` DISABLE KEYS */;
/*!40000 ALTER TABLE `dms_signatures` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.dms_templates
CREATE TABLE IF NOT EXISTS `dms_templates` (
  `id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `category_id` bigint unsigned NOT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `placeholders` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `dms_templates_chk_1` CHECK (json_valid(`placeholders`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.dms_templates: 0 rows
/*!40000 ALTER TABLE `dms_templates` DISABLE KEYS */;
/*!40000 ALTER TABLE `dms_templates` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.document_categories
CREATE TABLE IF NOT EXISTS `document_categories` (
  `id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `parent_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Dumping structure for table eos365-bak.document_revisions
CREATE TABLE IF NOT EXISTS `document_revisions` (
  `id` bigint unsigned NOT NULL,
  `controlled_document_id` bigint unsigned NOT NULL,
  `version` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `revision_description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `revised_by` bigint unsigned NOT NULL,
  `revision_date` date NOT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.document_revisions: 0 rows
/*!40000 ALTER TABLE `document_revisions` DISABLE KEYS */;
/*!40000 ALTER TABLE `document_revisions` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.domains
CREATE TABLE IF NOT EXISTS `domains` (
  `id` int unsigned NOT NULL,
  `domain` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.domains: 0 rows
/*!40000 ALTER TABLE `domains` DISABLE KEYS */;
/*!40000 ALTER TABLE `domains` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.education
CREATE TABLE IF NOT EXISTS `education` (
  `id` bigint unsigned NOT NULL,
  `institution` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `starting_date` date NOT NULL,
  `complete_date` date NOT NULL,
  `degree` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `grade` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.education: ~0 rows (approximately)

-- Dumping structure for table eos365-bak.employee_benefits
CREATE TABLE IF NOT EXISTS `employee_benefits` (
  `id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `benefit_id` bigint unsigned NOT NULL,
  `enrollment_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `coverage_level` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cost_to_employee` decimal(10,2) DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.employee_benefits: 0 rows
/*!40000 ALTER TABLE `employee_benefits` DISABLE KEYS */;
/*!40000 ALTER TABLE `employee_benefits` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.employee_documents
CREATE TABLE IF NOT EXISTS `employee_documents` (
  `id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `hr_document_id` bigint unsigned NOT NULL,
  `acknowledgment_status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `acknowledgment_date` datetime DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.employee_documents: 0 rows
/*!40000 ALTER TABLE `employee_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `employee_documents` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.employee_skills
CREATE TABLE IF NOT EXISTS `employee_skills` (
  `id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `skill_id` bigint unsigned NOT NULL,
  `proficiency_level` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `acquired_date` date DEFAULT NULL,
  `expires_at` date DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `is_verified` tinyint(1) NOT NULL DEFAULT '0',
  `verified_by` bigint unsigned DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.employee_skills: 0 rows
/*!40000 ALTER TABLE `employee_skills` DISABLE KEYS */;
/*!40000 ALTER TABLE `employee_skills` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.enrollments
CREATE TABLE IF NOT EXISTS `enrollments` (
  `id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `course_id` bigint unsigned NOT NULL,
  `enrolled_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL DEFAULT NULL,
  `price_paid` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` enum('active','completed','expired','canceled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `progress_percentage` double NOT NULL DEFAULT '0',
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.enrollments: 0 rows
/*!40000 ALTER TABLE `enrollments` DISABLE KEYS */;
/*!40000 ALTER TABLE `enrollments` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.error_logs
CREATE TABLE IF NOT EXISTS `error_logs` (
  `id` bigint unsigned NOT NULL,
  `error_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stack_trace` text COLLATE utf8mb4_unicode_ci,
  `component_stack` text COLLATE utf8mb4_unicode_ci,
  `url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_agent` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `resolved` tinyint(1) NOT NULL DEFAULT '0',
  `resolution_notes` text COLLATE utf8mb4_unicode_ci,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `error_logs_chk_1` CHECK (json_valid(`metadata`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.error_logs: 0 rows
/*!40000 ALTER TABLE `error_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `error_logs` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.events
CREATE TABLE IF NOT EXISTS `events` (
  `id` bigint unsigned NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `venue` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_date` date NOT NULL,
  `event_time` time NOT NULL,
  `banner_image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `food_details` text COLLATE utf8mb4_unicode_ci,
  `rules` text COLLATE utf8mb4_unicode_ci,
  `organizer_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `organizer_email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `organizer_phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `registration_deadline` datetime DEFAULT NULL,
  `max_participants` int DEFAULT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT '0',
  `is_registration_open` tinyint(1) NOT NULL DEFAULT '1',
  `venue_map_url` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta_title` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta_description` text COLLATE utf8mb4_unicode_ci,
  `meta_keywords` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.events: 0 rows
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
/*!40000 ALTER TABLE `events` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.event_activity_logs
CREATE TABLE IF NOT EXISTS `event_activity_logs` (
  `id` bigint unsigned NOT NULL,
  `event_id` bigint unsigned DEFAULT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `action` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `model_id` bigint unsigned DEFAULT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `ip_address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `event_activity_logs_chk_1` CHECK (json_valid(`old_values`)),
  CONSTRAINT `event_activity_logs_chk_2` CHECK (json_valid(`new_values`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.event_activity_logs: 0 rows
/*!40000 ALTER TABLE `event_activity_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `event_activity_logs` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.event_custom_fields
CREATE TABLE IF NOT EXISTS `event_custom_fields` (
  `id` bigint unsigned NOT NULL,
  `event_id` bigint unsigned NOT NULL,
  `field_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `field_label` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `field_type` enum('text','textarea','number','email','phone','select','radio','checkbox','date','file') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text',
  `field_options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `is_required` tinyint(1) NOT NULL DEFAULT '0',
  `placeholder` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `help_text` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `event_custom_fields_chk_1` CHECK (json_valid(`field_options`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.event_custom_fields: 0 rows
/*!40000 ALTER TABLE `event_custom_fields` DISABLE KEYS */;
/*!40000 ALTER TABLE `event_custom_fields` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.event_registrations
CREATE TABLE IF NOT EXISTS `event_registrations` (
  `id` bigint unsigned NOT NULL,
  `event_id` bigint unsigned NOT NULL,
  `token` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `organization` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` enum('male','female','other','prefer_not_to_say') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_proof` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_verified` tinyint(1) NOT NULL DEFAULT '0',
  `payment_verified_at` datetime DEFAULT NULL,
  `payment_verified_by` bigint unsigned DEFAULT NULL,
  `admin_notes` text COLLATE utf8mb4_unicode_ci,
  `qr_code` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','approved','rejected','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `custom_fields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `event_registrations_chk_1` CHECK (json_valid(`custom_fields`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.event_registrations: 0 rows
/*!40000 ALTER TABLE `event_registrations` DISABLE KEYS */;
/*!40000 ALTER TABLE `event_registrations` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.event_registration_sub_events
CREATE TABLE IF NOT EXISTS `event_registration_sub_events` (
  `id` bigint unsigned NOT NULL,
  `event_registration_id` bigint unsigned NOT NULL,
  `sub_event_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.event_registration_sub_events: 0 rows
/*!40000 ALTER TABLE `event_registration_sub_events` DISABLE KEYS */;
/*!40000 ALTER TABLE `event_registration_sub_events` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.experiences
CREATE TABLE IF NOT EXISTS `experiences` (
  `id` bigint unsigned NOT NULL,
  `company_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `job_position` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `period_from` date NOT NULL,
  `period_to` date NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `user_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.experiences: ~0 rows (approximately)

-- Dumping structure for table eos365-bak.failed_jobs
CREATE TABLE IF NOT EXISTS `failed_jobs` (
  `id` bigint unsigned NOT NULL,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.failed_jobs: ~0 rows (approximately)

-- Dumping structure for table eos365-bak.failed_login_attempts
CREATE TABLE IF NOT EXISTS `failed_login_attempts` (
  `id` bigint unsigned NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `failure_reason` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `attempted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `failed_login_attempts_chk_1` CHECK (json_valid(`metadata`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Dumping structure for table eos365-bak.helpdesk_tickets
CREATE TABLE IF NOT EXISTS `helpdesk_tickets` (
  `id` bigint unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `priority` enum('low','medium','high','critical') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `status` enum('open','in_progress','on_hold','resolved','closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `requester_id` bigint unsigned NOT NULL,
  `assignee_id` bigint unsigned DEFAULT NULL,
  `department_id` bigint unsigned DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `first_response_at` timestamp NULL DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `helpdesk_tickets_chk_1` CHECK (json_valid(`tags`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.helpdesk_tickets: 0 rows
/*!40000 ALTER TABLE `helpdesk_tickets` DISABLE KEYS */;
/*!40000 ALTER TABLE `helpdesk_tickets` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.holidays
CREATE TABLE IF NOT EXISTS `holidays` (
  `id` bigint unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `from_date` date NOT NULL,
  `to_date` date NOT NULL,
  `type` enum('public','religious','national','company','optional') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'company',
  `is_recurring` tinyint(1) NOT NULL DEFAULT '0',
  `recurrence_pattern` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` bigint unsigned DEFAULT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Dumping structure for table eos365-bak.hr_documents
CREATE TABLE IF NOT EXISTS `hr_documents` (
  `id` bigint unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_id` bigint unsigned DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `version` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1.0',
  `effective_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `is_confidential` tinyint(1) NOT NULL DEFAULT '0',
  `created_by` bigint unsigned NOT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.hr_documents: 0 rows
/*!40000 ALTER TABLE `hr_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `hr_documents` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.inventory_adjustments
CREATE TABLE IF NOT EXISTS `inventory_adjustments` (
  `id` bigint unsigned NOT NULL,
  `reference_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `location_id` bigint unsigned NOT NULL,
  `adjustment_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `type` enum('addition','subtraction','write-off','count') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'count',
  `reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.inventory_adjustments: 0 rows
/*!40000 ALTER TABLE `inventory_adjustments` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_adjustments` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.inventory_adjustment_items
CREATE TABLE IF NOT EXISTS `inventory_adjustment_items` (
  `id` bigint unsigned NOT NULL,
  `inventory_adjustment_id` bigint unsigned NOT NULL,
  `inventory_item_id` bigint unsigned NOT NULL,
  `expected_quantity` decimal(15,2) NOT NULL,
  `actual_quantity` decimal(15,2) NOT NULL,
  `adjusted_quantity` decimal(15,2) NOT NULL,
  `cost` decimal(15,2) DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.inventory_adjustment_items: 0 rows
/*!40000 ALTER TABLE `inventory_adjustment_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_adjustment_items` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.inventory_items
CREATE TABLE IF NOT EXISTS `inventory_items` (
  `id` bigint unsigned NOT NULL,
  `item_code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'each',
  `cost_price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `selling_price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `reorder_level` decimal(15,2) NOT NULL DEFAULT '0.00',
  `reorder_quantity` decimal(15,2) NOT NULL DEFAULT '0.00',
  `barcode` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sku` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_taxable` tinyint(1) NOT NULL DEFAULT '1',
  `tax_rate` decimal(8,2) NOT NULL DEFAULT '0.00',
  `track_inventory` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.inventory_items: 0 rows
/*!40000 ALTER TABLE `inventory_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_items` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.inventory_locations
CREATE TABLE IF NOT EXISTS `inventory_locations` (
  `id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `address` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'warehouse',
  `parent_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.inventory_locations: 0 rows
/*!40000 ALTER TABLE `inventory_locations` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_locations` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.inventory_stocks
CREATE TABLE IF NOT EXISTS `inventory_stocks` (
  `id` bigint unsigned NOT NULL,
  `inventory_item_id` bigint unsigned NOT NULL,
  `location_id` bigint unsigned DEFAULT NULL,
  `quantity` decimal(15,2) NOT NULL DEFAULT '0.00',
  `allocated_quantity` decimal(15,2) NOT NULL DEFAULT '0.00',
  `available_quantity` decimal(15,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.inventory_stocks: 0 rows
/*!40000 ALTER TABLE `inventory_stocks` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_stocks` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.inventory_transfers
CREATE TABLE IF NOT EXISTS `inventory_transfers` (
  `id` bigint unsigned NOT NULL,
  `reference_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `from_location_id` bigint unsigned NOT NULL,
  `to_location_id` bigint unsigned NOT NULL,
  `transfer_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` enum('pending','in_transit','completed','canceled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.inventory_transfers: 0 rows
/*!40000 ALTER TABLE `inventory_transfers` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_transfers` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.inventory_transfer_items
CREATE TABLE IF NOT EXISTS `inventory_transfer_items` (
  `id` bigint unsigned NOT NULL,
  `inventory_transfer_id` bigint unsigned NOT NULL,
  `inventory_item_id` bigint unsigned NOT NULL,
  `quantity` decimal(15,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.inventory_transfer_items: 0 rows
/*!40000 ALTER TABLE `inventory_transfer_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_transfer_items` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.jobs
CREATE TABLE IF NOT EXISTS `jobs` (
  `id` bigint unsigned NOT NULL,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Dumping structure for table eos365-bak.jobs_recruitment
CREATE TABLE IF NOT EXISTS `jobs_recruitment` (
  `id` bigint unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `requirements` text COLLATE utf8mb4_unicode_ci,
  `responsibilities` text COLLATE utf8mb4_unicode_ci,
  `qualifications` text COLLATE utf8mb4_unicode_ci,
  `benefits` text COLLATE utf8mb4_unicode_ci,
  `department_id` bigint unsigned DEFAULT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` enum('full_time','part_time','contract','temporary','internship','remote') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'full_time',
  `status` enum('draft','open','closed','on_hold','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `positions` int NOT NULL DEFAULT '1',
  `salary_min` decimal(10,2) DEFAULT NULL,
  `salary_max` decimal(10,2) DEFAULT NULL,
  `salary_currency` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USD',
  `salary_visible` tinyint(1) NOT NULL DEFAULT '0',
  `posting_date` date DEFAULT NULL,
  `closing_date` date DEFAULT NULL,
  `hiring_manager_id` bigint unsigned DEFAULT NULL,
  `skills_required` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `custom_fields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  `is_remote_allowed` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `jobs_recruitment_chk_1` CHECK (json_valid(`skills_required`)),
  CONSTRAINT `jobs_recruitment_chk_2` CHECK (json_valid(`custom_fields`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.jobs_recruitment: 0 rows
/*!40000 ALTER TABLE `jobs_recruitment` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs_recruitment` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.job_applicant_education
CREATE TABLE IF NOT EXISTS `job_applicant_education` (
  `id` bigint unsigned NOT NULL,
  `application_id` bigint unsigned NOT NULL,
  `institution` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `degree` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `field_of_study` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_current` tinyint(1) NOT NULL DEFAULT '0',
  `grade` decimal(5,2) DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.job_applicant_education: 0 rows
/*!40000 ALTER TABLE `job_applicant_education` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_applicant_education` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.job_applicant_experience
CREATE TABLE IF NOT EXISTS `job_applicant_experience` (
  `id` bigint unsigned NOT NULL,
  `application_id` bigint unsigned NOT NULL,
  `company` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `is_current` tinyint(1) NOT NULL DEFAULT '0',
  `description` text COLLATE utf8mb4_unicode_ci,
  `achievements` text COLLATE utf8mb4_unicode_ci,
  `reference_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_contact` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.job_applicant_experience: 0 rows
/*!40000 ALTER TABLE `job_applicant_experience` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_applicant_experience` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.job_applications
CREATE TABLE IF NOT EXISTS `job_applications` (
  `id` bigint unsigned NOT NULL,
  `job_id` bigint unsigned NOT NULL,
  `applicant_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cover_letter` text COLLATE utf8mb4_unicode_ci,
  `resume_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `current_stage_id` bigint unsigned DEFAULT NULL,
  `status` enum('new','in_review','shortlisted','interviewed','offered','hired','rejected','withdrawn') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'new',
  `rating` decimal(3,2) DEFAULT NULL,
  `application_date` date NOT NULL,
  `last_status_change` datetime DEFAULT NULL,
  `source` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referral_source` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `skills` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `expected_salary` decimal(10,2) DEFAULT NULL,
  `salary_currency` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USD',
  `notice_period` int DEFAULT NULL,
  `experience_years` decimal(4,1) DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `custom_fields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `application_ip` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `referrer_id` bigint unsigned DEFAULT NULL,
  CONSTRAINT `job_applications_chk_1` CHECK (json_valid(`skills`)),
  CONSTRAINT `job_applications_chk_2` CHECK (json_valid(`custom_fields`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.job_applications: 0 rows
/*!40000 ALTER TABLE `job_applications` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_applications` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.job_application_stage_history
CREATE TABLE IF NOT EXISTS `job_application_stage_history` (
  `id` bigint unsigned NOT NULL,
  `application_id` bigint unsigned NOT NULL,
  `stage_id` bigint unsigned NOT NULL,
  `moved_by` bigint unsigned DEFAULT NULL,
  `moved_at` datetime NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.job_application_stage_history: 0 rows
/*!40000 ALTER TABLE `job_application_stage_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_application_stage_history` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.job_batches
CREATE TABLE IF NOT EXISTS `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.job_batches: ~0 rows (approximately)

-- Dumping structure for table eos365-bak.job_hiring_stages
CREATE TABLE IF NOT EXISTS `job_hiring_stages` (
  `id` bigint unsigned NOT NULL,
  `job_id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `sequence` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `required_actions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `requires_approval` tinyint(1) NOT NULL DEFAULT '0',
  `is_final` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `job_hiring_stages_chk_1` CHECK (json_valid(`required_actions`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.job_hiring_stages: 0 rows
/*!40000 ALTER TABLE `job_hiring_stages` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_hiring_stages` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.job_interviews
CREATE TABLE IF NOT EXISTS `job_interviews` (
  `id` bigint unsigned NOT NULL,
  `application_id` bigint unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `interview_date` datetime NOT NULL,
  `duration_minutes` int NOT NULL DEFAULT '60',
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meeting_link` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` enum('phone','video','in_person','technical','panel') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'video',
  `status` enum('scheduled','completed','cancelled','rescheduled','no_show') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'scheduled',
  `interviewers` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `interviewer_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `scheduled_by` bigint unsigned DEFAULT NULL,
  `interview_notes` text COLLATE utf8mb4_unicode_ci,
  `feedback` text COLLATE utf8mb4_unicode_ci,
  CONSTRAINT `job_interviews_chk_1` CHECK (json_valid(`interviewers`)),
  CONSTRAINT `job_interviews_chk_2` CHECK (json_valid(`interviewer_ids`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.job_interviews: 0 rows
/*!40000 ALTER TABLE `job_interviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_interviews` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.job_interview_feedback
CREATE TABLE IF NOT EXISTS `job_interview_feedback` (
  `id` bigint unsigned NOT NULL,
  `interview_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `technical_rating` int DEFAULT NULL,
  `communication_rating` int DEFAULT NULL,
  `cultural_fit_rating` int DEFAULT NULL,
  `overall_rating` int DEFAULT NULL,
  `strengths` text COLLATE utf8mb4_unicode_ci,
  `weaknesses` text COLLATE utf8mb4_unicode_ci,
  `comments` text COLLATE utf8mb4_unicode_ci,
  `recommendation` enum('strong_hire','hire','neutral','do_not_hire','strong_do_not_hire') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.job_interview_feedback: 0 rows
/*!40000 ALTER TABLE `job_interview_feedback` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_interview_feedback` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.job_offers
CREATE TABLE IF NOT EXISTS `job_offers` (
  `id` bigint unsigned NOT NULL,
  `application_id` bigint unsigned NOT NULL,
  `salary_offered` decimal(10,2) NOT NULL,
  `salary_currency` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USD',
  `benefits` text COLLATE utf8mb4_unicode_ci,
  `start_date` date NOT NULL,
  `offer_date` date NOT NULL,
  `response_deadline` date DEFAULT NULL,
  `status` enum('draft','sent','accepted','negotiating','declined','expired') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `response_date` date DEFAULT NULL,
  `negotiation_notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` bigint unsigned NOT NULL,
  `approved_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.job_offers: 0 rows
/*!40000 ALTER TABLE `job_offers` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_offers` ENABLE KEYS */;



-- Dumping structure for table eos365-bak.knowledge_base_articles
CREATE TABLE IF NOT EXISTS `knowledge_base_articles` (
  `id` bigint unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_id` bigint unsigned DEFAULT NULL,
  `author_id` bigint unsigned NOT NULL,
  `last_updated_by` bigint unsigned DEFAULT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT '0',
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `view_count` int NOT NULL DEFAULT '0',
  `helpful_count` int NOT NULL DEFAULT '0',
  `not_helpful_count` int NOT NULL DEFAULT '0',
  `published_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `knowledge_base_articles_chk_1` CHECK (json_valid(`tags`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.knowledge_base_articles: 0 rows
/*!40000 ALTER TABLE `knowledge_base_articles` DISABLE KEYS */;
/*!40000 ALTER TABLE `knowledge_base_articles` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.knowledge_base_categories
CREATE TABLE IF NOT EXISTS `knowledge_base_categories` (
  `id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `parent_id` bigint unsigned DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.knowledge_base_categories: 0 rows
/*!40000 ALTER TABLE `knowledge_base_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `knowledge_base_categories` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.kpis
CREATE TABLE IF NOT EXISTS `kpis` (
  `id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_value` decimal(15,2) NOT NULL,
  `unit` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `frequency` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `formula` text COLLATE utf8mb4_unicode_ci,
  `data_source` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `responsible_user_id` bigint unsigned DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.kpis: 0 rows
/*!40000 ALTER TABLE `kpis` DISABLE KEYS */;
/*!40000 ALTER TABLE `kpis` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.kpi_values
CREATE TABLE IF NOT EXISTS `kpi_values` (
  `id` bigint unsigned NOT NULL,
  `kpi_id` bigint unsigned NOT NULL,
  `value` decimal(15,2) NOT NULL,
  `date` date NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `recorded_by_user_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.kpi_values: 0 rows
/*!40000 ALTER TABLE `kpi_values` DISABLE KEYS */;
/*!40000 ALTER TABLE `kpi_values` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.leaves
CREATE TABLE IF NOT EXISTS `leaves` (
  `id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `leave_type` bigint unsigned NOT NULL,
  `from_date` date NOT NULL,
  `to_date` date NOT NULL,
  `no_of_days` int NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `approval_chain` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `current_approval_level` int NOT NULL DEFAULT '0',
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `approved_by` bigint unsigned DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `rejected_by` bigint unsigned DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `leaves_chk_1` CHECK (json_valid(`approval_chain`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Dumping structure for table eos365-bak.leave_accruals
CREATE TABLE IF NOT EXISTS `leave_accruals` (
  `id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `leave_type_id` bigint unsigned NOT NULL,
  `accrual_date` date NOT NULL,
  `accrued_days` decimal(5,2) NOT NULL,
  `balance_after_accrual` decimal(5,2) NOT NULL,
  `accrual_type` enum('monthly','annual','joining','adjustment') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'monthly',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.leave_accruals: 0 rows
/*!40000 ALTER TABLE `leave_accruals` DISABLE KEYS */;
/*!40000 ALTER TABLE `leave_accruals` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.leave_carry_forwards
CREATE TABLE IF NOT EXISTS `leave_carry_forwards` (
  `id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `leave_type_id` bigint unsigned NOT NULL,
  `year` year NOT NULL,
  `carried_days` decimal(5,1) NOT NULL DEFAULT '0.0',
  `used_days` decimal(5,1) NOT NULL DEFAULT '0.0',
  `expiry_date` date DEFAULT NULL,
  `is_expired` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.leave_carry_forwards: 0 rows
/*!40000 ALTER TABLE `leave_carry_forwards` DISABLE KEYS */;
/*!40000 ALTER TABLE `leave_carry_forwards` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.leave_settings
CREATE TABLE IF NOT EXISTS `leave_settings` (
  `id` bigint unsigned NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `days` int NOT NULL,
  `eligibility` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `carry_forward` tinyint(1) NOT NULL DEFAULT '0',
  `earned_leave` tinyint(1) NOT NULL DEFAULT '0',
  `requires_approval` tinyint(1) NOT NULL DEFAULT '1',
  `auto_approve` tinyint(1) NOT NULL DEFAULT '0',
  `is_earned` tinyint(1) NOT NULL DEFAULT '0',
  `special_conditions` text COLLATE utf8mb4_unicode_ci,
  `symbol` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Dumping structure for table eos365-bak.lesson_progress
CREATE TABLE IF NOT EXISTS `lesson_progress` (
  `id` bigint unsigned NOT NULL,
  `enrollment_id` bigint unsigned NOT NULL,
  `lesson_id` bigint unsigned NOT NULL,
  `is_completed` tinyint(1) NOT NULL DEFAULT '0',
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `time_spent_seconds` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.lesson_progress: 0 rows
/*!40000 ALTER TABLE `lesson_progress` DISABLE KEYS */;
/*!40000 ALTER TABLE `lesson_progress` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.letters
CREATE TABLE IF NOT EXISTS `letters` (
  `id` bigint unsigned NOT NULL,
  `from` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('Closed','Open') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Open',
  `received_date` date NOT NULL,
  `memo_number` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `handling_memo` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_taken` text COLLATE utf8mb4_unicode_ci,
  `handling_link` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `handling_status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `need_reply` tinyint(1) NOT NULL DEFAULT '0',
  `replied_status` tinyint(1) NOT NULL DEFAULT '0',
  `need_forward` tinyint(1) NOT NULL DEFAULT '0',
  `forwarded_status` tinyint(1) NOT NULL DEFAULT '0',
  `dealt_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Dumping structure for table eos365-bak.logistics_carriers
CREATE TABLE IF NOT EXISTS `logistics_carriers` (
  `id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_info` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tracking_url_format` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.logistics_carriers: 0 rows
/*!40000 ALTER TABLE `logistics_carriers` DISABLE KEYS */;
/*!40000 ALTER TABLE `logistics_carriers` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.logistics_shipments
CREATE TABLE IF NOT EXISTS `logistics_shipments` (
  `id` bigint unsigned NOT NULL,
  `shipment_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `carrier_id` bigint unsigned DEFAULT NULL,
  `tracking_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shippable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `shippable_id` bigint unsigned NOT NULL,
  `from_location_id` bigint unsigned DEFAULT NULL,
  `to_location_id` bigint unsigned DEFAULT NULL,
  `shipping_method` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_cost` decimal(15,2) NOT NULL DEFAULT '0.00',
  `weight` decimal(10,2) DEFAULT NULL,
  `weight_unit` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'kg',
  `length` decimal(10,2) DEFAULT NULL,
  `width` decimal(10,2) DEFAULT NULL,
  `height` decimal(10,2) DEFAULT NULL,
  `dimensions_unit` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cm',
  `from_address` text COLLATE utf8mb4_unicode_ci,
  `to_address` text COLLATE utf8mb4_unicode_ci,
  `ship_date` timestamp NULL DEFAULT NULL,
  `estimated_delivery` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `status` enum('pending','processed','shipped','in_transit','delivered','failed','returned') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.logistics_shipments: 0 rows
/*!40000 ALTER TABLE `logistics_shipments` DISABLE KEYS */;
/*!40000 ALTER TABLE `logistics_shipments` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.media
CREATE TABLE IF NOT EXISTS `media` (
  `id` bigint unsigned NOT NULL,
  `model_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_id` bigint unsigned NOT NULL,
  `uuid` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `collection_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `disk` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `conversions_disk` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `size` bigint unsigned NOT NULL,
  `manipulations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `custom_properties` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `generated_conversions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `responsive_images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `order_column` int unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


-- Dumping structure for table eos365-bak.migrations
CREATE TABLE IF NOT EXISTS `migrations` (
  `id` int unsigned NOT NULL,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Dumping structure for table eos365-bak.model_has_permissions
CREATE TABLE IF NOT EXISTS `model_has_permissions` (
  `permission_id` bigint unsigned NOT NULL,
  `model_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_id` bigint unsigned NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.model_has_permissions: 0 rows
/*!40000 ALTER TABLE `model_has_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `model_has_permissions` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.model_has_roles
CREATE TABLE IF NOT EXISTS `model_has_roles` (
  `role_id` bigint unsigned NOT NULL,
  `model_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_id` bigint unsigned NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Dumping structure for table eos365-bak.modules
CREATE TABLE IF NOT EXISTS `modules` (
  `id` bigint unsigned NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Unique module identifier (hrm, crm, dms)',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Display name of the module',
  `description` text COLLATE utf8mb4_unicode_ci,
  `icon` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Icon class or component name',
  `route_prefix` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'URL route prefix',
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'operations' COMMENT 'Module category for grouping',
  `priority` smallint unsigned NOT NULL DEFAULT '100' COMMENT 'Display order priority',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_core` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Core system module that cannot be disabled',
  `settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin COMMENT 'Module-specific configuration',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `modules_chk_1` CHECK (json_valid(`settings`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.modules: 10 rows
/*!40000 ALTER TABLE `modules` DISABLE KEYS */;
INSERT INTO `modules` (`id`, `code`, `name`, `description`, `icon`, `route_prefix`, `category`, `priority`, `is_active`, `is_core`, `settings`, `created_at`, `updated_at`, `deleted_at`) VALUES
	(1, 'CORE', 'Dashboard & Analytics', 'Core system dashboard, analytics, and overview', 'HomeIcon', '/', 'core_system', 1, 1, 0, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(2, 'SELF_SERVICE', 'Self Service Portal', 'Employee self-service for attendance, leave, and profile management', 'UserCircleIcon', '/self-service', 'self_service', 2, 1, 0, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(3, 'HRM', 'Human Resource Management', 'Comprehensive HR management including employees, departments, attendance, and leaves', 'UsersIcon', '/hr', 'human_resources', 3, 1, 0, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(4, 'PPM', 'Project & Portfolio Management', 'Project management, daily work logs, tasks, and reports', 'FolderOpenIcon', '/projects', 'project_management', 4, 1, 0, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(5, 'DMS', 'Document Management', 'Document and letter management system', 'DocumentDuplicateIcon', '/dms', 'document_management', 5, 1, 0, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(6, 'CRM', 'Customer Relationship Management', 'Customer, lead, and feedback management', 'UserGroupIcon', '/crm', 'customer_relations', 6, 0, 0, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(7, 'SCM', 'Supply Chain & Inventory', 'Inventory, suppliers, and purchase order management', 'TruckIcon', '/scm', 'supply_chain', 7, 0, 0, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(8, 'RETAIL', 'Retail & Sales', 'Point of sale and retail operations', 'ShoppingBagIcon', '/retail', 'retail_sales', 8, 0, 0, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(9, 'FINANCE', 'Financial Management', 'Accounting and financial operations', 'BanknotesIcon', '/finance', 'financial_management', 9, 0, 0, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51', NULL),
	(10, 'ADMIN', 'System Administration', 'System settings, users, roles, and administration', 'Cog8ToothIcon', '/admin', 'system_administration', 10, 1, 0, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51', NULL);
/*!40000 ALTER TABLE `modules` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.module_components
CREATE TABLE IF NOT EXISTS `module_components` (
  `id` bigint unsigned NOT NULL,
  `sub_module_id` bigint unsigned DEFAULT NULL,
  `module_id` bigint unsigned NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Component identifier',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `type` enum('page','section','widget','action','api') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'page',
  `route` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `module_components_chk_1` CHECK (json_valid(`settings`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.module_components: 143 rows
/*!40000 ALTER TABLE `module_components` DISABLE KEYS */;
INSERT INTO `module_components` (`id`, `sub_module_id`, `module_id`, `code`, `name`, `description`, `type`, `route`, `is_active`, `settings`, `created_at`, `updated_at`) VALUES
	(1, 1, 1, 'DASHBOARD_PAGE', 'Dashboard Page', NULL, 'page', 'dashboard', 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(2, 1, 1, 'STATS_WIDGET', 'Statistics Widget', NULL, 'widget', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(3, 1, 1, 'UPDATES_WIDGET', 'Recent Updates Widget', NULL, 'widget', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(4, 2, 2, 'MY_ATTENDANCE_PAGE', 'My Attendance Page', NULL, 'page', 'self-service.attendance', 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(5, 2, 2, 'PUNCH_ACTION', 'Punch In/Out', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(6, 3, 2, 'MY_LEAVES_PAGE', 'My Leaves Page', NULL, 'page', 'self-service.leaves', 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(7, 3, 2, 'CREATE_LEAVE_BTN', 'Create Leave Request', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(8, 3, 2, 'EDIT_LEAVE_BTN', 'Edit Leave Request', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(9, 3, 2, 'CANCEL_LEAVE_BTN', 'Cancel Leave Request', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(10, 4, 2, 'PROFILE_PAGE', 'Profile Page', NULL, 'page', 'profile.show', 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(11, 4, 2, 'EDIT_PROFILE_BTN', 'Edit Profile', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(12, 4, 2, 'CHANGE_PASSWORD_BTN', 'Change Password', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(13, 5, 3, 'EMPLOYEES_LIST', 'Employees List Page', NULL, 'page', 'employees.index', 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(14, 5, 3, 'EMPLOYEE_DETAIL', 'Employee Detail Page', NULL, 'page', 'employees.show', 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(15, 5, 3, 'CREATE_EMPLOYEE_BTN', 'Create Employee', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(16, 5, 3, 'EDIT_EMPLOYEE_BTN', 'Edit Employee', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(17, 5, 3, 'DELETE_EMPLOYEE_BTN', 'Delete Employee', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(18, 5, 3, 'IMPORT_EMPLOYEES_BTN', 'Import Employees', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(19, 5, 3, 'EXPORT_EMPLOYEES_BTN', 'Export Employees', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(20, 6, 3, 'DEPARTMENTS_LIST', 'Departments List Page', NULL, 'page', 'departments.index', 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(21, 6, 3, 'CREATE_DEPT_BTN', 'Create Department', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(22, 6, 3, 'EDIT_DEPT_BTN', 'Edit Department', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(23, 6, 3, 'DELETE_DEPT_BTN', 'Delete Department', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(24, 7, 3, 'DESIGNATIONS_LIST', 'Designations List Page', NULL, 'page', 'designations.index', 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(25, 7, 3, 'CREATE_DESIG_BTN', 'Create Designation', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(26, 7, 3, 'EDIT_DESIG_BTN', 'Edit Designation', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(27, 7, 3, 'DELETE_DESIG_BTN', 'Delete Designation', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(28, 8, 3, 'ATTENDANCE_LIST', 'Attendance List Page', NULL, 'page', 'attendance.index', 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(29, 8, 3, 'CREATE_ATTEND_BTN', 'Create Attendance', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(30, 8, 3, 'EDIT_ATTEND_BTN', 'Edit Attendance', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(31, 8, 3, 'DELETE_ATTEND_BTN', 'Delete Attendance', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(32, 8, 3, 'IMPORT_ATTEND_BTN', 'Import Attendance', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(33, 8, 3, 'EXPORT_ATTEND_BTN', 'Export Attendance', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(34, 9, 3, 'HOLIDAYS_LIST', 'Holidays List Page', NULL, 'page', 'holidays.index', 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(35, 9, 3, 'CREATE_HOLIDAY_BTN', 'Create Holiday', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(36, 9, 3, 'EDIT_HOLIDAY_BTN', 'Edit Holiday', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(37, 9, 3, 'DELETE_HOLIDAY_BTN', 'Delete Holiday', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(38, 10, 3, 'LEAVES_LIST', 'Leaves List Page', NULL, 'page', 'leaves.index', 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(39, 10, 3, 'LEAVE_ANALYTICS', 'Leave Analytics', NULL, 'page', 'leaves.analytics', 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(40, 10, 3, 'CREATE_LEAVE_BTN', 'Create Leave', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(41, 10, 3, 'EDIT_LEAVE_BTN', 'Edit Leave', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(42, 10, 3, 'DELETE_LEAVE_BTN', 'Delete Leave', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(43, 10, 3, 'APPROVE_LEAVE_BTN', 'Approve Leave', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(44, 11, 3, 'LEAVE_SETTINGS_PAGE', 'Leave Settings Page', NULL, 'page', 'leave-settings.index', 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(45, 11, 3, 'UPDATE_LEAVE_SETTINGS', 'Update Leave Settings', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(46, 12, 3, 'JURISDICTIONS_LIST', 'Jurisdictions List Page', NULL, 'page', 'jurisdictions.index', 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(47, 12, 3, 'CREATE_JURIS_BTN', 'Create Jurisdiction', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(48, 12, 3, 'EDIT_JURIS_BTN', 'Edit Jurisdiction', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(49, 12, 3, 'DELETE_JURIS_BTN', 'Delete Jurisdiction', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(50, 13, 4, 'DAILY_WORKS_LIST', 'Daily Works List Page', NULL, 'page', 'daily-works.index', 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(51, 13, 4, 'CREATE_DAILY_WORK_BTN', 'Create Daily Work', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(52, 13, 4, 'EDIT_DAILY_WORK_BTN', 'Edit Daily Work', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(53, 13, 4, 'DELETE_DAILY_WORK_BTN', 'Delete Daily Work', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(54, 13, 4, 'IMPORT_DAILY_WORK_BTN', 'Import Daily Works', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(55, 13, 4, 'EXPORT_DAILY_WORK_BTN', 'Export Daily Works', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(56, 14, 4, 'PROJECT_ANALYTICS_PAGE', 'Project Analytics Page', NULL, 'page', 'projects.analytics', 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(57, 15, 4, 'TASKS_LIST', 'Tasks List Page', NULL, 'page', 'tasks.index', 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(58, 15, 4, 'CREATE_TASK_BTN', 'Create Task', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(59, 15, 4, 'EDIT_TASK_BTN', 'Edit Task', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(60, 15, 4, 'DELETE_TASK_BTN', 'Delete Task', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(61, 15, 4, 'ASSIGN_TASK_BTN', 'Assign Task', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(62, 16, 4, 'REPORTS_LIST', 'Reports List Page', NULL, 'page', 'reports.index', 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(63, 16, 4, 'CREATE_REPORT_BTN', 'Create Report', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(64, 16, 4, 'EDIT_REPORT_BTN', 'Edit Report', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(65, 16, 4, 'DELETE_REPORT_BTN', 'Delete Report', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(66, 17, 5, 'LETTERS_LIST', 'Letters List Page', NULL, 'page', 'letters.index', 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(67, 17, 5, 'CREATE_LETTER_BTN', 'Create Letter', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(68, 17, 5, 'EDIT_LETTER_BTN', 'Edit Letter', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(69, 17, 5, 'DELETE_LETTER_BTN', 'Delete Letter', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(70, 18, 5, 'DOCUMENTS_LIST', 'Documents List Page', NULL, 'page', 'documents.index', 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(71, 18, 5, 'CREATE_DOC_BTN', 'Create Document', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(72, 18, 5, 'EDIT_DOC_BTN', 'Edit Document', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(73, 18, 5, 'DELETE_DOC_BTN', 'Delete Document', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(74, 19, 6, 'CUSTOMERS_LIST', 'Customers List Page', NULL, 'page', 'customers.index', 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(75, 19, 6, 'CREATE_CUSTOMER_BTN', 'Create Customer', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(76, 19, 6, 'EDIT_CUSTOMER_BTN', 'Edit Customer', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(77, 19, 6, 'DELETE_CUSTOMER_BTN', 'Delete Customer', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(78, 20, 6, 'LEADS_LIST', 'Leads List Page', NULL, 'page', 'leads.index', 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(79, 20, 6, 'CREATE_LEAD_BTN', 'Create Lead', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(80, 20, 6, 'EDIT_LEAD_BTN', 'Edit Lead', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(81, 20, 6, 'DELETE_LEAD_BTN', 'Delete Lead', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(82, 21, 6, 'FEEDBACK_LIST', 'Feedback List Page', NULL, 'page', 'feedback.index', 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(83, 21, 6, 'CREATE_FEEDBACK_BTN', 'Create Feedback', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(84, 21, 6, 'EDIT_FEEDBACK_BTN', 'Edit Feedback', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(85, 21, 6, 'DELETE_FEEDBACK_BTN', 'Delete Feedback', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(86, 22, 7, 'INVENTORY_LIST', 'Inventory List Page', NULL, 'page', 'inventory.index', 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(87, 22, 7, 'CREATE_INVENTORY_BTN', 'Create Inventory', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(88, 22, 7, 'EDIT_INVENTORY_BTN', 'Edit Inventory', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(89, 22, 7, 'DELETE_INVENTORY_BTN', 'Delete Inventory', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(90, 23, 7, 'SUPPLIERS_LIST', 'Suppliers List Page', NULL, 'page', 'suppliers.index', 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(91, 23, 7, 'CREATE_SUPPLIER_BTN', 'Create Supplier', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(92, 23, 7, 'EDIT_SUPPLIER_BTN', 'Edit Supplier', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(93, 23, 7, 'DELETE_SUPPLIER_BTN', 'Delete Supplier', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(94, 24, 7, 'PO_LIST', 'Purchase Orders List Page', NULL, 'page', 'purchase-orders.index', 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(95, 24, 7, 'CREATE_PO_BTN', 'Create Purchase Order', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(96, 24, 7, 'EDIT_PO_BTN', 'Edit Purchase Order', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(97, 24, 7, 'DELETE_PO_BTN', 'Delete Purchase Order', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(98, 25, 7, 'WAREHOUSING_PAGE', 'Warehousing Page', NULL, 'page', 'warehousing.index', 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(99, 25, 7, 'MANAGE_WAREHOUSE_BTN', 'Manage Warehouse', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(100, 26, 8, 'POS_PAGE', 'POS Terminal', NULL, 'page', 'pos.index', 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(101, 26, 8, 'POS_OPERATE_BTN', 'Operate POS', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(102, 27, 8, 'SALES_LIST', 'Sales List Page', NULL, 'page', 'sales.index', 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(103, 27, 8, 'CREATE_SALE_BTN', 'Create Sale', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(104, 27, 8, 'SALES_ANALYTICS_PAGE', 'Sales Analytics', NULL, 'page', 'sales.analytics', 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(105, 28, 9, 'AP_LIST', 'Accounts Payable Page', NULL, 'page', 'payables.index', 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(106, 28, 9, 'MANAGE_AP_BTN', 'Manage Payables', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(107, 29, 9, 'AR_LIST', 'Accounts Receivable Page', NULL, 'page', 'receivables.index', 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(108, 29, 9, 'MANAGE_AR_BTN', 'Manage Receivables', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(109, 30, 9, 'LEDGER_PAGE', 'General Ledger Page', NULL, 'page', 'ledger.index', 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(110, 30, 9, 'MANAGE_LEDGER_BTN', 'Manage Ledger', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(111, 31, 9, 'FIN_REPORTS_LIST', 'Financial Reports Page', NULL, 'page', 'financial-reports.index', 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(112, 31, 9, 'CREATE_FIN_REPORT_BTN', 'Create Financial Report', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(113, 32, 10, 'USERS_LIST', 'Users List Page', NULL, 'page', 'users.index', 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(114, 32, 10, 'CREATE_USER_BTN', 'Create User', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(115, 32, 10, 'EDIT_USER_BTN', 'Edit User', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(116, 32, 10, 'DELETE_USER_BTN', 'Delete User', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(117, 32, 10, 'IMPERSONATE_USER_BTN', 'Impersonate User', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(118, 33, 10, 'ROLES_LIST', 'Roles List Page', NULL, 'page', 'roles.index', 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(119, 33, 10, 'CREATE_ROLE_BTN', 'Create Role', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(120, 33, 10, 'EDIT_ROLE_BTN', 'Edit Role', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(121, 33, 10, 'DELETE_ROLE_BTN', 'Delete Role', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(122, 33, 10, 'ASSIGN_PERMISSIONS_BTN', 'Assign Permissions', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(123, 34, 10, 'MODULES_LIST', 'Modules List Page', NULL, 'page', 'modules.index', 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(124, 34, 10, 'CREATE_MODULE_BTN', 'Create Module', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(125, 34, 10, 'EDIT_MODULE_BTN', 'Edit Module', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(126, 34, 10, 'DELETE_MODULE_BTN', 'Delete Module', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(127, 35, 10, 'SETTINGS_PAGE', 'Settings Page', NULL, 'page', 'settings.index', 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(128, 35, 10, 'COMPANY_SETTINGS', 'Company Settings', NULL, 'section', NULL, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(129, 35, 10, 'ATTENDANCE_SETTINGS', 'Attendance Settings', NULL, 'section', NULL, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(130, 35, 10, 'EMAIL_SETTINGS', 'Email Settings', NULL, 'section', NULL, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(131, 35, 10, 'NOTIFICATION_SETTINGS', 'Notification Settings', NULL, 'section', NULL, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(132, 35, 10, 'THEME_SETTINGS', 'Theme Settings', NULL, 'section', NULL, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(133, 35, 10, 'LOCALIZATION_SETTINGS', 'Localization Settings', NULL, 'section', NULL, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(134, 35, 10, 'PERFORMANCE_SETTINGS', 'Performance Settings', NULL, 'section', NULL, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(135, 35, 10, 'APPROVAL_SETTINGS', 'Approval Settings', NULL, 'section', NULL, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(136, 35, 10, 'INVOICE_SETTINGS', 'Invoice Settings', NULL, 'section', NULL, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(137, 35, 10, 'SALARY_SETTINGS', 'Salary Settings', NULL, 'section', NULL, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(138, 35, 10, 'SYSTEM_SETTINGS', 'System Settings', NULL, 'section', NULL, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(139, 36, 10, 'AUDIT_LIST', 'Audit Logs Page', NULL, 'page', 'audit.index', 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(140, 36, 10, 'EXPORT_AUDIT_BTN', 'Export Audit Logs', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(141, 37, 10, 'BACKUP_PAGE', 'Backup Page', NULL, 'page', 'backup.index', 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(142, 37, 10, 'CREATE_BACKUP_BTN', 'Create Backup', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(143, 37, 10, 'RESTORE_BACKUP_BTN', 'Restore Backup', NULL, 'action', NULL, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51');
/*!40000 ALTER TABLE `module_components` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.module_permission_requirements
CREATE TABLE IF NOT EXISTS `module_permission_requirements` (
  `id` bigint unsigned NOT NULL,
  `module_id` bigint unsigned DEFAULT NULL,
  `sub_module_id` bigint unsigned DEFAULT NULL,
  `component_id` bigint unsigned DEFAULT NULL,
  `permission_id` bigint unsigned NOT NULL COMMENT 'References Spatie permissions table',
  `requirement_type` enum('required','any','all') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'required' COMMENT 'required=must have, any=need one of group, all=need all in group',
  `requirement_group` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Group name for any/all logic',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.module_permission_requirements: 304 rows
/*!40000 ALTER TABLE `module_permission_requirements` DISABLE KEYS */;
INSERT INTO `module_permission_requirements` (`id`, `module_id`, `sub_module_id`, `component_id`, `permission_id`, `requirement_type`, `requirement_group`, `is_active`, `created_at`, `updated_at`) VALUES
	(1, 1, NULL, NULL, 1, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(2, 1, NULL, NULL, 2, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(3, 1, NULL, NULL, 3, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(4, 1, 1, NULL, 1, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(311, 1, 1, 1, 1, 'required', 'default', 1, '2025-11-27 22:22:44', '2025-11-27 22:22:44'),
	(6, 1, 1, 2, 2, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(7, 1, 1, 3, 3, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(8, 2, NULL, NULL, 4, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(9, 2, NULL, NULL, 6, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(10, 2, NULL, NULL, 11, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(11, 2, 2, NULL, 4, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(12, 2, 2, NULL, 5, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(13, 2, 2, 4, 4, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(14, 2, 2, 5, 5, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(15, 2, 3, NULL, 6, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(16, 2, 3, NULL, 7, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(17, 2, 3, NULL, 8, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(18, 2, 3, NULL, 9, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(19, 2, 3, 6, 6, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(20, 2, 3, 7, 7, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(21, 2, 3, 8, 8, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(22, 2, 3, 9, 9, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(23, 2, 4, NULL, 11, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(24, 2, 4, NULL, 12, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(25, 2, 4, NULL, 13, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(26, 2, 4, 10, 11, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(27, 2, 4, 11, 12, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(28, 2, 4, 12, 13, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(29, 3, NULL, NULL, 14, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(30, 3, NULL, NULL, 20, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(31, 3, NULL, NULL, 28, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(32, 3, NULL, NULL, 38, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(33, 3, 5, NULL, 14, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(34, 3, 5, NULL, 15, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(35, 3, 5, NULL, 16, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(36, 3, 5, NULL, 17, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(37, 3, 5, NULL, 18, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(38, 3, 5, NULL, 19, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(39, 3, 5, 13, 14, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(40, 3, 5, 14, 14, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(41, 3, 5, 15, 15, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(42, 3, 5, 16, 16, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(43, 3, 5, 17, 17, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(44, 3, 5, 18, 18, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(45, 3, 5, 19, 19, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(46, 3, 6, NULL, 20, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(47, 3, 6, NULL, 21, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(48, 3, 6, NULL, 22, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(49, 3, 6, NULL, 23, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(50, 3, 6, 20, 20, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(51, 3, 6, 21, 21, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(52, 3, 6, 22, 22, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(53, 3, 6, 23, 23, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(54, 3, 7, NULL, 24, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(55, 3, 7, NULL, 25, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(56, 3, 7, NULL, 26, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(57, 3, 7, NULL, 27, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(58, 3, 7, 24, 24, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(59, 3, 7, 25, 25, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(60, 3, 7, 26, 26, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(61, 3, 7, 27, 27, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(62, 3, 8, NULL, 28, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(63, 3, 8, NULL, 29, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(64, 3, 8, NULL, 30, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(65, 3, 8, NULL, 31, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(66, 3, 8, NULL, 32, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(67, 3, 8, NULL, 33, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(68, 3, 8, 28, 28, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(69, 3, 8, 29, 29, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(70, 3, 8, 30, 30, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(71, 3, 8, 31, 31, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(72, 3, 8, 32, 32, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(73, 3, 8, 33, 33, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(74, 3, 9, NULL, 34, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(75, 3, 9, NULL, 35, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(76, 3, 9, NULL, 36, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(77, 3, 9, NULL, 37, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(78, 3, 9, 34, 34, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(79, 3, 9, 35, 35, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(80, 3, 9, 36, 36, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(81, 3, 9, 37, 37, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(82, 3, 10, NULL, 38, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(83, 3, 10, NULL, 39, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(84, 3, 10, NULL, 40, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(85, 3, 10, NULL, 41, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(86, 3, 10, NULL, 42, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(87, 3, 10, NULL, 43, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(88, 3, 10, 38, 38, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(89, 3, 10, 39, 43, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(90, 3, 10, 40, 39, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(91, 3, 10, 41, 40, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(92, 3, 10, 42, 41, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(93, 3, 10, 43, 42, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(94, 3, 11, NULL, 44, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(95, 3, 11, NULL, 45, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(96, 3, 11, 44, 44, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(97, 3, 11, 45, 45, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(98, 3, 12, NULL, 46, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(99, 3, 12, NULL, 47, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(100, 3, 12, NULL, 48, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(101, 3, 12, NULL, 49, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(102, 3, 12, 46, 46, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(103, 3, 12, 47, 47, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(104, 3, 12, 48, 48, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(105, 3, 12, 49, 49, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(106, 4, NULL, NULL, 139, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(107, 4, NULL, NULL, 146, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(108, 4, NULL, NULL, 151, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(109, 4, NULL, NULL, 145, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(110, 4, 13, NULL, 139, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(111, 4, 13, NULL, 140, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(112, 4, 13, NULL, 141, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(113, 4, 13, NULL, 142, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(114, 4, 13, NULL, 143, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(115, 4, 13, NULL, 144, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(116, 4, 13, 50, 139, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(117, 4, 13, 51, 140, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(118, 4, 13, 52, 141, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(119, 4, 13, 53, 142, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(120, 4, 13, 54, 143, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(121, 4, 13, 55, 144, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(122, 4, 14, NULL, 145, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(123, 4, 14, 56, 145, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(124, 4, 15, NULL, 146, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(125, 4, 15, NULL, 147, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(126, 4, 15, NULL, 148, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(127, 4, 15, NULL, 149, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(128, 4, 15, NULL, 150, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(129, 4, 15, 57, 146, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(130, 4, 15, 58, 147, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(131, 4, 15, 59, 148, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(132, 4, 15, 60, 149, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(133, 4, 15, 61, 150, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(134, 4, 16, NULL, 151, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(135, 4, 16, NULL, 152, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(136, 4, 16, NULL, 153, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(137, 4, 16, NULL, 154, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(138, 4, 16, 62, 151, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(139, 4, 16, 63, 152, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(140, 4, 16, 64, 153, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(141, 4, 16, 65, 154, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(142, 5, NULL, NULL, 222, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(143, 5, NULL, NULL, 226, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(144, 5, 17, NULL, 222, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(145, 5, 17, NULL, 223, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(146, 5, 17, NULL, 224, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(147, 5, 17, NULL, 225, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(148, 5, 17, 66, 222, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(149, 5, 17, 67, 223, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(150, 5, 17, 68, 224, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(151, 5, 17, 69, 225, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(152, 5, 18, NULL, 226, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(153, 5, 18, NULL, 227, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(154, 5, 18, NULL, 228, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(155, 5, 18, NULL, 229, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(156, 5, 18, 70, 226, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(157, 5, 18, 71, 227, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(158, 5, 18, 72, 228, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(159, 5, 18, 73, 229, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(160, 6, NULL, NULL, 230, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(161, 6, NULL, NULL, 234, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(162, 6, NULL, NULL, 238, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(163, 6, 19, NULL, 230, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(164, 6, 19, NULL, 231, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(165, 6, 19, NULL, 232, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(166, 6, 19, NULL, 233, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(167, 6, 19, 74, 230, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(168, 6, 19, 75, 231, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(169, 6, 19, 76, 232, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(170, 6, 19, 77, 233, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(171, 6, 20, NULL, 234, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(172, 6, 20, NULL, 235, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(173, 6, 20, NULL, 236, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(174, 6, 20, NULL, 237, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(175, 6, 20, 78, 234, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(176, 6, 20, 79, 235, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(177, 6, 20, 80, 236, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(178, 6, 20, 81, 237, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(179, 6, 21, NULL, 238, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(180, 6, 21, NULL, 239, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(181, 6, 21, NULL, 240, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(182, 6, 21, NULL, 241, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(183, 6, 21, 82, 238, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(184, 6, 21, 83, 239, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(185, 6, 21, 84, 240, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(186, 6, 21, 85, 241, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(187, 7, NULL, NULL, 242, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(188, 7, NULL, NULL, 246, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(189, 7, NULL, NULL, 250, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(190, 7, 22, NULL, 242, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(191, 7, 22, NULL, 243, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(192, 7, 22, NULL, 244, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(193, 7, 22, NULL, 245, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(194, 7, 22, 86, 242, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(195, 7, 22, 87, 243, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(196, 7, 22, 88, 244, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(197, 7, 22, 89, 245, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(198, 7, 23, NULL, 246, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(199, 7, 23, NULL, 247, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(200, 7, 23, NULL, 248, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(201, 7, 23, NULL, 249, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(202, 7, 23, 90, 246, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(203, 7, 23, 91, 247, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(204, 7, 23, 92, 248, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(205, 7, 23, 93, 249, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(206, 7, 24, NULL, 250, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(207, 7, 24, NULL, 251, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(208, 7, 24, NULL, 252, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(209, 7, 24, NULL, 253, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(210, 7, 24, 94, 250, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(211, 7, 24, 95, 251, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(212, 7, 24, 96, 252, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(213, 7, 24, 97, 253, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(214, 7, 25, NULL, 254, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(215, 7, 25, NULL, 255, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(216, 7, 25, 98, 254, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(217, 7, 25, 99, 255, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(218, 8, NULL, NULL, 256, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(219, 8, NULL, NULL, 258, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(220, 8, 26, NULL, 256, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(221, 8, 26, NULL, 257, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(222, 8, 26, 100, 256, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(223, 8, 26, 101, 257, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(224, 8, 27, NULL, 258, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(225, 8, 27, NULL, 259, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(226, 8, 27, NULL, 260, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(227, 8, 27, 102, 258, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(228, 8, 27, 103, 259, 'required', NULL, 1, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(229, 8, 27, 104, 260, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(230, 9, NULL, NULL, 261, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(231, 9, NULL, NULL, 263, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(232, 9, NULL, NULL, 265, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(233, 9, NULL, NULL, 267, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(234, 9, 28, NULL, 261, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(235, 9, 28, NULL, 262, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(236, 9, 28, 105, 261, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(237, 9, 28, 106, 262, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(238, 9, 29, NULL, 263, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(239, 9, 29, NULL, 264, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(240, 9, 29, 107, 263, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(241, 9, 29, 108, 264, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(242, 9, 30, NULL, 265, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(243, 9, 30, NULL, 266, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(244, 9, 30, 109, 265, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(245, 9, 30, 110, 266, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(246, 9, 31, NULL, 267, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(247, 9, 31, NULL, 268, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(248, 9, 31, 111, 267, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(249, 9, 31, 112, 268, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(250, 10, NULL, NULL, 269, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(251, 10, NULL, NULL, 274, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(252, 10, NULL, NULL, 279, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(253, 10, NULL, NULL, 393, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(254, 10, 32, NULL, 269, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(255, 10, 32, NULL, 270, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(256, 10, 32, NULL, 271, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(257, 10, 32, NULL, 272, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(258, 10, 32, NULL, 273, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(259, 10, 32, 113, 269, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(260, 10, 32, 114, 270, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(261, 10, 32, 115, 271, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(262, 10, 32, 116, 272, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(263, 10, 32, 117, 273, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(264, 10, 33, NULL, 274, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(265, 10, 33, NULL, 275, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(266, 10, 33, NULL, 276, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(267, 10, 33, NULL, 277, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(268, 10, 33, NULL, 278, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(269, 10, 33, 118, 274, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(270, 10, 33, 119, 275, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(271, 10, 33, 120, 276, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(272, 10, 33, 121, 277, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(273, 10, 33, 122, 278, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(274, 10, 34, NULL, 393, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(275, 10, 34, NULL, 394, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(276, 10, 34, NULL, 395, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(277, 10, 34, NULL, 396, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(278, 10, 34, 123, 393, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(279, 10, 34, 124, 394, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(280, 10, 34, 125, 395, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(281, 10, 34, 126, 396, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(282, 10, 35, NULL, 279, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(283, 10, 35, NULL, 280, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(284, 10, 35, 127, 279, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(285, 10, 35, 128, 281, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(286, 10, 35, 129, 282, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(287, 10, 35, 130, 283, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(288, 10, 35, 131, 284, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(289, 10, 35, 132, 285, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(290, 10, 35, 133, 286, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(291, 10, 35, 134, 287, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(292, 10, 35, 135, 288, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(293, 10, 35, 136, 289, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(294, 10, 35, 137, 290, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(295, 10, 35, 138, 291, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(296, 10, 36, NULL, 292, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(297, 10, 36, NULL, 293, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(298, 10, 36, 139, 292, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(299, 10, 36, 140, 293, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(300, 10, 37, NULL, 294, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(301, 10, 37, NULL, 295, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(302, 10, 37, 141, 294, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(303, 10, 37, 142, 294, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51'),
	(304, 10, 37, 143, 295, 'required', NULL, 1, '2025-11-27 21:37:51', '2025-11-27 21:37:51');
/*!40000 ALTER TABLE `module_permission_requirements` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.offboardings
CREATE TABLE IF NOT EXISTS `offboardings` (
  `id` bigint unsigned NOT NULL,
  `employee_id` bigint unsigned NOT NULL,
  `initiation_date` date NOT NULL,
  `last_working_date` date NOT NULL,
  `exit_interview_date` date DEFAULT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` bigint unsigned NOT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.offboardings: 0 rows
/*!40000 ALTER TABLE `offboardings` DISABLE KEYS */;
/*!40000 ALTER TABLE `offboardings` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.offboarding_tasks
CREATE TABLE IF NOT EXISTS `offboarding_tasks` (
  `id` bigint unsigned NOT NULL,
  `offboarding_id` bigint unsigned NOT NULL,
  `task` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `due_date` date DEFAULT NULL,
  `completed_date` date DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `assigned_to` bigint unsigned DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.offboarding_tasks: 0 rows
/*!40000 ALTER TABLE `offboarding_tasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `offboarding_tasks` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.onboardings
CREATE TABLE IF NOT EXISTS `onboardings` (
  `id` bigint unsigned NOT NULL,
  `employee_id` bigint unsigned NOT NULL,
  `start_date` date NOT NULL,
  `expected_completion_date` date NOT NULL,
  `actual_completion_date` date DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` bigint unsigned NOT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.onboardings: 0 rows
/*!40000 ALTER TABLE `onboardings` DISABLE KEYS */;
/*!40000 ALTER TABLE `onboardings` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.onboarding_tasks
CREATE TABLE IF NOT EXISTS `onboarding_tasks` (
  `id` bigint unsigned NOT NULL,
  `onboarding_id` bigint unsigned NOT NULL,
  `task` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `due_date` date DEFAULT NULL,
  `completed_date` date DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `assigned_to` bigint unsigned DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.onboarding_tasks: 0 rows
/*!40000 ALTER TABLE `onboarding_tasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `onboarding_tasks` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.opportunities
CREATE TABLE IF NOT EXISTS `opportunities` (
  `id` bigint unsigned NOT NULL,
  `customer_id` bigint unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `value` decimal(15,2) NOT NULL DEFAULT '0.00',
  `status` enum('open','won','lost','in-progress') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `stage` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `probability` int NOT NULL DEFAULT '0',
  `expected_close_date` date DEFAULT NULL,
  `assigned_to` bigint unsigned DEFAULT NULL,
  `source` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.opportunities: 0 rows
/*!40000 ALTER TABLE `opportunities` DISABLE KEYS */;
/*!40000 ALTER TABLE `opportunities` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.orders
CREATE TABLE IF NOT EXISTS `orders` (
  `id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `customer_id` bigint unsigned DEFAULT NULL,
  `order_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `total_amount` decimal(15,2) NOT NULL,
  `status` enum('pending','processing','completed','canceled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `order_type` enum('dine_in','takeaway','delivery') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'dine_in',
  `delivery_address` text COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.orders: 0 rows
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.order_items
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` bigint unsigned NOT NULL,
  `order_id` bigint unsigned NOT NULL,
  `inventory_item_id` bigint unsigned NOT NULL,
  `quantity` int NOT NULL,
  `price` decimal(15,2) NOT NULL,
  `subtotal` decimal(15,2) NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.order_items: 0 rows
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.password_reset_tokens
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.password_reset_tokens: ~0 rows (approximately)
INSERT INTO `password_reset_tokens` (`email`, `token`, `created_at`) VALUES
	('emamhsajeeb@gmail.com', '$2y$12$PRdaFKgj7mulVhS8ByQfeeyClf2hUuwh5FfjlwZ79CmZp66BaYS5m', '2024-10-30 18:12:24');

-- Dumping structure for table eos365-bak.password_reset_tokens_secure
CREATE TABLE IF NOT EXISTS `password_reset_tokens_secure` (
  `id` bigint unsigned NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `verification_code` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT '0',
  `attempts` int NOT NULL DEFAULT '0',
  `expires_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `verified_at` timestamp NULL DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.password_reset_tokens_secure: 0 rows
/*!40000 ALTER TABLE `password_reset_tokens_secure` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens_secure` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.payrolls
CREATE TABLE IF NOT EXISTS `payrolls` (
  `id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.payrolls: 0 rows
/*!40000 ALTER TABLE `payrolls` DISABLE KEYS */;
/*!40000 ALTER TABLE `payrolls` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.performance_competencies
CREATE TABLE IF NOT EXISTS `performance_competencies` (
  `id` bigint unsigned NOT NULL,
  `category_id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `weight` int NOT NULL DEFAULT '1',
  `order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.performance_competencies: 0 rows
/*!40000 ALTER TABLE `performance_competencies` DISABLE KEYS */;
/*!40000 ALTER TABLE `performance_competencies` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.performance_competency_categories
CREATE TABLE IF NOT EXISTS `performance_competency_categories` (
  `id` bigint unsigned NOT NULL,
  `template_id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `weight` int NOT NULL DEFAULT '1',
  `order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.performance_competency_categories: 0 rows
/*!40000 ALTER TABLE `performance_competency_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `performance_competency_categories` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.performance_competency_ratings
CREATE TABLE IF NOT EXISTS `performance_competency_ratings` (
  `id` bigint unsigned NOT NULL,
  `review_id` bigint unsigned NOT NULL,
  `competency_id` bigint unsigned NOT NULL,
  `rating` double NOT NULL,
  `comments` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.performance_competency_ratings: 0 rows
/*!40000 ALTER TABLE `performance_competency_ratings` DISABLE KEYS */;
/*!40000 ALTER TABLE `performance_competency_ratings` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.performance_metrics
CREATE TABLE IF NOT EXISTS `performance_metrics` (
  `id` bigint unsigned NOT NULL,
  `metric_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `identifier` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `execution_time_ms` double NOT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `performance_metrics_chk_1` CHECK (json_valid(`metadata`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.performance_metrics: 0 rows
/*!40000 ALTER TABLE `performance_metrics` DISABLE KEYS */;
/*!40000 ALTER TABLE `performance_metrics` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.performance_reviews
CREATE TABLE IF NOT EXISTS `performance_reviews` (
  `id` bigint unsigned NOT NULL,
  `employee_id` bigint unsigned NOT NULL,
  `reviewer_id` bigint unsigned NOT NULL,
  `review_period_start` date NOT NULL,
  `review_period_end` date NOT NULL,
  `review_date` date NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'scheduled',
  `overall_rating` double DEFAULT NULL,
  `goals_achieved` text COLLATE utf8mb4_unicode_ci,
  `strengths` text COLLATE utf8mb4_unicode_ci,
  `areas_for_improvement` text COLLATE utf8mb4_unicode_ci,
  `comments` text COLLATE utf8mb4_unicode_ci,
  `acknowledgment_date` date DEFAULT NULL,
  `employee_comments` text COLLATE utf8mb4_unicode_ci,
  `next_review_date` date DEFAULT NULL,
  `department_id` bigint unsigned NOT NULL,
  `template_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.performance_reviews: 0 rows
/*!40000 ALTER TABLE `performance_reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `performance_reviews` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.performance_review_templates
CREATE TABLE IF NOT EXISTS `performance_review_templates` (
  `id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `created_by` bigint unsigned NOT NULL,
  `default_for_department_id` bigint unsigned DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.performance_review_templates: 0 rows
/*!40000 ALTER TABLE `performance_review_templates` DISABLE KEYS */;
/*!40000 ALTER TABLE `performance_review_templates` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.permissions
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `guard_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.permissions: 396 rows
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` (`id`, `name`, `guard_name`, `module`, `description`, `created_at`, `updated_at`) VALUES
	(1, 'core.dashboard.view', 'web', 'core', 'View dashboard and analytics', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(2, 'core.stats.view', 'web', 'core', 'View system statistics', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(3, 'core.updates.view', 'web', 'core', 'View system updates', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(4, 'attendance.own.view', 'web', 'self-service', 'View own attendance records', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(5, 'attendance.own.punch', 'web', 'self-service', 'Punch in/out attendance', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(6, 'leave.own.view', 'web', 'self-service', 'View own leave requests', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(7, 'leave.own.create', 'web', 'self-service', 'Create own leave requests', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(8, 'leave.own.update', 'web', 'self-service', 'Update own leave requests', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(9, 'leave.own.delete', 'web', 'self-service', 'Delete own leave requests', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(10, 'communications.own.view', 'web', 'self-service', 'View own communications', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(11, 'profile.own.view', 'web', 'self-service', 'View own profile', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(12, 'profile.own.update', 'web', 'self-service', 'Update own profile', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(13, 'profile.password.change', 'web', 'self-service', 'Change own password', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(14, 'employees.view', 'web', 'hrm', 'View employee records', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(15, 'employees.create', 'web', 'hrm', 'Create employee records', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(16, 'employees.update', 'web', 'hrm', 'Update employee records', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(17, 'employees.delete', 'web', 'hrm', 'Delete employee records', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(18, 'employees.import', 'web', 'hrm', 'Import employee data', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(19, 'employees.export', 'web', 'hrm', 'Export employee data', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(20, 'departments.view', 'web', 'hrm', 'View departments', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(21, 'departments.create', 'web', 'hrm', 'Create departments', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(22, 'departments.update', 'web', 'hrm', 'Update departments', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(23, 'departments.delete', 'web', 'hrm', 'Delete departments', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(24, 'designations.view', 'web', 'hrm', 'View designations/positions', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(25, 'designations.create', 'web', 'hrm', 'Create designations', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(26, 'designations.update', 'web', 'hrm', 'Update designations', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(27, 'designations.delete', 'web', 'hrm', 'Delete designations', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(28, 'attendance.view', 'web', 'hrm', 'View all attendance records', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(29, 'attendance.create', 'web', 'hrm', 'Create attendance records', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(30, 'attendance.update', 'web', 'hrm', 'Update attendance records', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(31, 'attendance.delete', 'web', 'hrm', 'Delete attendance records', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(32, 'attendance.import', 'web', 'hrm', 'Import attendance data', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(33, 'attendance.export', 'web', 'hrm', 'Export attendance data', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(34, 'holidays.view', 'web', 'hrm', 'View holidays', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(35, 'holidays.create', 'web', 'hrm', 'Create holidays', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(36, 'holidays.update', 'web', 'hrm', 'Update holidays', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(37, 'holidays.delete', 'web', 'hrm', 'Delete holidays', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(38, 'leaves.view', 'web', 'hrm', 'View all leave requests', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(39, 'leaves.create', 'web', 'hrm', 'Create leave requests', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(40, 'leaves.update', 'web', 'hrm', 'Update leave requests', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(41, 'leaves.delete', 'web', 'hrm', 'Delete leave requests', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(42, 'leaves.approve', 'web', 'hrm', 'Approve/reject leave requests', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(43, 'leaves.analytics', 'web', 'hrm', 'View leave analytics', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(44, 'leave-settings.view', 'web', 'hrm', 'View leave policy settings', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(45, 'leave-settings.update', 'web', 'hrm', 'Update leave policy settings', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(46, 'jurisdiction.view', 'web', 'hrm', 'View work locations', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(47, 'jurisdiction.create', 'web', 'hrm', 'Create work locations', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(48, 'jurisdiction.update', 'web', 'hrm', 'Update work locations', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(49, 'jurisdiction.delete', 'web', 'hrm', 'Delete work locations', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(50, 'hr.onboarding.view', 'web', 'hrm', 'View employee onboarding', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(51, 'hr.onboarding.create', 'web', 'hrm', 'Create onboarding process', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(52, 'hr.onboarding.update', 'web', 'hrm', 'Update onboarding process', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(53, 'hr.onboarding.delete', 'web', 'hrm', 'Delete onboarding process', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(54, 'hr.offboarding.view', 'web', 'hrm', 'View employee offboarding', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(55, 'hr.offboarding.create', 'web', 'hrm', 'Create offboarding process', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(56, 'hr.offboarding.update', 'web', 'hrm', 'Update offboarding process', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(57, 'hr.offboarding.delete', 'web', 'hrm', 'Delete offboarding process', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(58, 'hr.checklists.view', 'web', 'hrm', 'View HR checklists', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(59, 'hr.checklists.create', 'web', 'hrm', 'Create HR checklists', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(60, 'hr.checklists.update', 'web', 'hrm', 'Update HR checklists', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(61, 'hr.checklists.delete', 'web', 'hrm', 'Delete HR checklists', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(62, 'hr.skills.view', 'web', 'hrm', 'View skills database', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(63, 'hr.skills.create', 'web', 'hrm', 'Create skills', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(64, 'hr.skills.update', 'web', 'hrm', 'Update skills', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(65, 'hr.skills.delete', 'web', 'hrm', 'Delete skills', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(66, 'hr.competencies.view', 'web', 'hrm', 'View competencies', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(67, 'hr.competencies.create', 'web', 'hrm', 'Create competencies', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(68, 'hr.competencies.update', 'web', 'hrm', 'Update competencies', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(69, 'hr.competencies.delete', 'web', 'hrm', 'Delete competencies', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(70, 'hr.employee.skills.view', 'web', 'hrm', 'View employee skills', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(71, 'hr.employee.skills.create', 'web', 'hrm', 'Add employee skills', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(72, 'hr.employee.skills.update', 'web', 'hrm', 'Update employee skills', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(73, 'hr.employee.skills.delete', 'web', 'hrm', 'Remove employee skills', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(74, 'hr.benefits.view', 'web', 'hrm', 'View benefits programs', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(75, 'hr.benefits.create', 'web', 'hrm', 'Create benefits programs', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(76, 'hr.benefits.update', 'web', 'hrm', 'Update benefits programs', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(77, 'hr.benefits.delete', 'web', 'hrm', 'Delete benefits programs', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(78, 'hr.employee.benefits.view', 'web', 'hrm', 'View employee benefits', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(79, 'hr.employee.benefits.assign', 'web', 'hrm', 'Assign benefits to employees', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(80, 'hr.employee.benefits.update', 'web', 'hrm', 'Update employee benefits', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(81, 'hr.employee.benefits.remove', 'web', 'hrm', 'Remove employee benefits', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(82, 'hr.timeoff.view', 'web', 'hrm', 'View time-off management', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(83, 'hr.timeoff.calendar.view', 'web', 'hrm', 'View time-off calendar', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(84, 'hr.timeoff.approve', 'web', 'hrm', 'Approve time-off requests', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(85, 'hr.timeoff.reject', 'web', 'hrm', 'Reject time-off requests', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(86, 'hr.timeoff.reports.view', 'web', 'hrm', 'View time-off reports', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(87, 'hr.timeoff.settings.view', 'web', 'hrm', 'View time-off settings', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(88, 'hr.timeoff.settings.update', 'web', 'hrm', 'Update time-off settings', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(89, 'hr.safety.view', 'web', 'hrm', 'View workplace safety', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(90, 'hr.safety.incidents.view', 'web', 'hrm', 'View safety incidents', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(91, 'hr.safety.incidents.create', 'web', 'hrm', 'Create safety incidents', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(92, 'hr.safety.incidents.update', 'web', 'hrm', 'Update safety incidents', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(93, 'hr.safety.inspections.view', 'web', 'hrm', 'View safety inspections', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(94, 'hr.safety.inspections.create', 'web', 'hrm', 'Create safety inspections', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(95, 'hr.safety.inspections.update', 'web', 'hrm', 'Update safety inspections', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(96, 'hr.safety.training.view', 'web', 'hrm', 'View safety training', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(97, 'hr.safety.training.create', 'web', 'hrm', 'Create safety training', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(98, 'hr.safety.training.update', 'web', 'hrm', 'Update safety training', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(99, 'hr.analytics.view', 'web', 'hrm', 'View HR analytics', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(100, 'hr.analytics.attendance', 'web', 'hrm', 'View attendance analytics', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(101, 'hr.analytics.performance', 'web', 'hrm', 'View performance analytics', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(102, 'hr.analytics.recruitment', 'web', 'hrm', 'View recruitment analytics', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(103, 'hr.analytics.turnover', 'web', 'hrm', 'View employee turnover analytics', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(104, 'hr.analytics.training', 'web', 'hrm', 'View training analytics', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(105, 'hr.analytics.reports.view', 'web', 'hrm', 'View HR reports', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(106, 'hr.analytics.reports.generate', 'web', 'hrm', 'Generate HR reports', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(107, 'hr.documents.view', 'web', 'hrm', 'View HR documents', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(108, 'hr.documents.create', 'web', 'hrm', 'Create HR documents', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(109, 'hr.documents.update', 'web', 'hrm', 'Update HR documents', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(110, 'hr.documents.delete', 'web', 'hrm', 'Delete HR documents', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(111, 'hr.documents.categories.view', 'web', 'hrm', 'View document categories', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(112, 'hr.documents.categories.create', 'web', 'hrm', 'Create document categories', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(113, 'hr.documents.categories.update', 'web', 'hrm', 'Update document categories', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(114, 'hr.documents.categories.delete', 'web', 'hrm', 'Delete document categories', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(115, 'hr.employee.documents.view', 'web', 'hrm', 'View employee documents', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(116, 'hr.employee.documents.create', 'web', 'hrm', 'Create employee documents', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(117, 'hr.employee.documents.delete', 'web', 'hrm', 'Delete employee documents', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(118, 'hr.selfservice.view', 'web', 'hrm', 'Access self-service portal', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(119, 'hr.selfservice.profile.view', 'web', 'hrm', 'View own profile in self-service', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(120, 'hr.selfservice.profile.update', 'web', 'hrm', 'Update own profile in self-service', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(121, 'hr.selfservice.documents.view', 'web', 'hrm', 'View own documents in self-service', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(122, 'hr.selfservice.benefits.view', 'web', 'hrm', 'View own benefits in self-service', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(123, 'hr.selfservice.timeoff.view', 'web', 'hrm', 'View own time-off in self-service', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(124, 'hr.selfservice.timeoff.request', 'web', 'hrm', 'Request time-off in self-service', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(125, 'hr.selfservice.trainings.view', 'web', 'hrm', 'View own trainings in self-service', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(126, 'hr.selfservice.payslips.view', 'web', 'hrm', 'View own payslips in self-service', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(127, 'hr.selfservice.performance.view', 'web', 'hrm', 'View own performance in self-service', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(128, 'hr.payroll.view', 'web', 'hrm', 'View payroll records', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(129, 'hr.payroll.create', 'web', 'hrm', 'Create payroll records', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(130, 'hr.payroll.update', 'web', 'hrm', 'Update payroll records', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(131, 'hr.payroll.delete', 'web', 'hrm', 'Delete payroll records', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(132, 'hr.payroll.process', 'web', 'hrm', 'Process payroll records', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(133, 'hr.payroll.bulk', 'web', 'hrm', 'Bulk payroll operations', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(134, 'hr.payslips.view', 'web', 'hrm', 'View payslips', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(135, 'hr.payslips.download', 'web', 'hrm', 'Download payslips', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(136, 'hr.payslips.email', 'web', 'hrm', 'Email payslips', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(137, 'hr.payroll.reports', 'web', 'hrm', 'View payroll reports', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(138, 'hr.payroll.analytics', 'web', 'hrm', 'View payroll analytics', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(139, 'daily-works.view', 'web', 'ppm', 'View work logs', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(140, 'daily-works.create', 'web', 'ppm', 'Create work logs', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(141, 'daily-works.update', 'web', 'ppm', 'Update work logs', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(142, 'daily-works.delete', 'web', 'ppm', 'Delete work logs', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(143, 'daily-works.import', 'web', 'ppm', 'Import work log data', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(144, 'daily-works.export', 'web', 'ppm', 'Export work log data', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(145, 'projects.analytics', 'web', 'ppm', 'View project analytics', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(146, 'tasks.view', 'web', 'ppm', 'View tasks', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(147, 'tasks.create', 'web', 'ppm', 'Create tasks', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(148, 'tasks.update', 'web', 'ppm', 'Update tasks', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(149, 'tasks.delete', 'web', 'ppm', 'Delete tasks', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(150, 'tasks.assign', 'web', 'ppm', 'Assign tasks', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(151, 'reports.view', 'web', 'ppm', 'View reports', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(152, 'reports.create', 'web', 'ppm', 'Create reports', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(153, 'reports.update', 'web', 'ppm', 'Update reports', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(154, 'reports.delete', 'web', 'ppm', 'Delete reports', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(155, 'performance-reviews.view', 'web', 'performance', 'View performance reviews', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(156, 'performance-reviews.create', 'web', 'performance', 'Create performance reviews', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(157, 'performance-reviews.update', 'web', 'performance', 'Update performance reviews', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(158, 'performance-reviews.delete', 'web', 'performance', 'Delete performance reviews', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(159, 'performance-reviews.approve', 'web', 'performance', 'Approve/reject performance reviews', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(160, 'performance-reviews.own.view', 'web', 'performance', 'View own performance reviews', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(161, 'performance-reviews.own.create', 'web', 'performance', 'Create own performance reviews', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(162, 'performance-reviews.own.update', 'web', 'performance', 'Update own performance reviews', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(163, 'performance-templates.view', 'web', 'performance', 'View performance review templates', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(164, 'performance-templates.create', 'web', 'performance', 'Create performance review templates', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(165, 'performance-templates.update', 'web', 'performance', 'Update performance review templates', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(166, 'performance-templates.delete', 'web', 'performance', 'Delete performance review templates', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(167, 'performance-analytics.view', 'web', 'performance', 'View performance analytics', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(168, 'training-sessions.view', 'web', 'training', 'View training sessions', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(169, 'training-sessions.create', 'web', 'training', 'Create training sessions', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(170, 'training-sessions.update', 'web', 'training', 'Update training sessions', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(171, 'training-sessions.delete', 'web', 'training', 'Delete training sessions', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(172, 'training-categories.view', 'web', 'training', 'View training categories', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(173, 'training-categories.create', 'web', 'training', 'Create training categories', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(174, 'training-categories.update', 'web', 'training', 'Update training categories', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(175, 'training-categories.delete', 'web', 'training', 'Delete training categories', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(176, 'training-materials.view', 'web', 'training', 'View training materials', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(177, 'training-materials.create', 'web', 'training', 'Create training materials', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(178, 'training-materials.update', 'web', 'training', 'Update training materials', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(179, 'training-materials.delete', 'web', 'training', 'Delete training materials', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(180, 'training-enrollments.view', 'web', 'training', 'View training enrollments', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(181, 'training-enrollments.create', 'web', 'training', 'Create training enrollments', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(182, 'training-enrollments.update', 'web', 'training', 'Update training enrollments', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(183, 'training-enrollments.delete', 'web', 'training', 'Delete training enrollments', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(184, 'training-assignments.view', 'web', 'training', 'View training assignments', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(185, 'training-assignments.create', 'web', 'training', 'Create training assignments', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(186, 'training-assignments.update', 'web', 'training', 'Update training assignments', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(187, 'training-assignments.delete', 'web', 'training', 'Delete training assignments', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(188, 'training-assignment-submissions.view', 'web', 'training', 'View training assignment submissions', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(189, 'training-assignment-submissions.create', 'web', 'training', 'Create training assignment submissions', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(190, 'training-assignment-submissions.update', 'web', 'training', 'Update training assignment submissions', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(191, 'training-assignment-submissions.grade', 'web', 'training', 'Grade training assignment submissions', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(192, 'training-feedback.view', 'web', 'training', 'View training feedback', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(193, 'training-feedback.create', 'web', 'training', 'Create training feedback', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(194, 'training-feedback.own.view', 'web', 'training', 'View own training enrollments', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(195, 'training-feedback.own.create', 'web', 'training', 'Create own training feedback', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(196, 'training-analytics.view', 'web', 'training', 'View training analytics', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(197, 'jobs.view', 'web', 'recruitment', 'View job postings', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(198, 'jobs.create', 'web', 'recruitment', 'Create job postings', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(199, 'jobs.update', 'web', 'recruitment', 'Update job postings', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(200, 'jobs.delete', 'web', 'recruitment', 'Delete job postings', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(201, 'job-applications.view', 'web', 'recruitment', 'View job applications', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(202, 'job-applications.create', 'web', 'recruitment', 'Create job applications', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(203, 'job-applications.update', 'web', 'recruitment', 'Update job applications', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(204, 'job-applications.delete', 'web', 'recruitment', 'Delete job applications', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(205, 'job-hiring-stages.view', 'web', 'recruitment', 'View job hiring stages', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(206, 'job-hiring-stages.create', 'web', 'recruitment', 'Create job hiring stages', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(207, 'job-hiring-stages.update', 'web', 'recruitment', 'Update job hiring stages', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(208, 'job-hiring-stages.delete', 'web', 'recruitment', 'Delete job hiring stages', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(209, 'job-interviews.view', 'web', 'recruitment', 'View job interviews', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(210, 'job-interviews.create', 'web', 'recruitment', 'Create job interviews', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(211, 'job-interviews.update', 'web', 'recruitment', 'Update job interviews', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(212, 'job-interviews.delete', 'web', 'recruitment', 'Delete job interviews', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(213, 'job-interview-feedback.view', 'web', 'recruitment', 'View job interview feedback', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(214, 'job-interview-feedback.create', 'web', 'recruitment', 'Create job interview feedback', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(215, 'job-interview-feedback.update', 'web', 'recruitment', 'Update job interview feedback', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(216, 'job-offers.view', 'web', 'recruitment', 'View job offers', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(217, 'job-offers.create', 'web', 'recruitment', 'Create job offers', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(218, 'job-offers.update', 'web', 'recruitment', 'Update job offers', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(219, 'job-offers.delete', 'web', 'recruitment', 'Delete job offers', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(220, 'job-offers.approve', 'web', 'recruitment', 'Approve job offers', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(221, 'recruitment-analytics.view', 'web', 'recruitment', 'View recruitment analytics', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(222, 'letters.view', 'web', 'dms', 'View official correspondence', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(223, 'letters.create', 'web', 'dms', 'Create official correspondence', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(224, 'letters.update', 'web', 'dms', 'Update official correspondence', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(225, 'letters.delete', 'web', 'dms', 'Delete official correspondence', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(226, 'documents.view', 'web', 'dms', 'View documents', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(227, 'documents.create', 'web', 'dms', 'Create documents', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(228, 'documents.update', 'web', 'dms', 'Update documents', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(229, 'documents.delete', 'web', 'dms', 'Delete documents', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(230, 'customers.view', 'web', 'crm', 'View customer records', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(231, 'customers.create', 'web', 'crm', 'Create customer records', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(232, 'customers.update', 'web', 'crm', 'Update customer records', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(233, 'customers.delete', 'web', 'crm', 'Delete customer records', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(234, 'leads.view', 'web', 'crm', 'View leads and opportunities', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(235, 'leads.create', 'web', 'crm', 'Create leads', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(236, 'leads.update', 'web', 'crm', 'Update leads', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(237, 'leads.delete', 'web', 'crm', 'Delete leads', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(238, 'feedback.view', 'web', 'crm', 'View customer feedback', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(239, 'feedback.create', 'web', 'crm', 'Create feedback records', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(240, 'feedback.update', 'web', 'crm', 'Update feedback', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(241, 'feedback.delete', 'web', 'crm', 'Delete feedback', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(242, 'inventory.view', 'web', 'scm', 'View inventory', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(243, 'inventory.create', 'web', 'scm', 'Create inventory items', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(244, 'inventory.update', 'web', 'scm', 'Update inventory', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(245, 'inventory.delete', 'web', 'scm', 'Delete inventory items', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(246, 'suppliers.view', 'web', 'scm', 'View suppliers', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(247, 'suppliers.create', 'web', 'scm', 'Create supplier records', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(248, 'suppliers.update', 'web', 'scm', 'Update suppliers', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(249, 'suppliers.delete', 'web', 'scm', 'Delete suppliers', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(250, 'purchase-orders.view', 'web', 'scm', 'View purchase orders', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(251, 'purchase-orders.create', 'web', 'scm', 'Create purchase orders', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(252, 'purchase-orders.update', 'web', 'scm', 'Update purchase orders', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(253, 'purchase-orders.delete', 'web', 'scm', 'Delete purchase orders', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(254, 'warehousing.view', 'web', 'scm', 'View warehouse operations', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(255, 'warehousing.manage', 'web', 'scm', 'Manage warehouse operations', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(256, 'pos.view', 'web', 'retail', 'View point of sale', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(257, 'pos.operate', 'web', 'retail', 'Operate POS terminal', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(258, 'sales.view', 'web', 'retail', 'View sales records', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(259, 'sales.create', 'web', 'retail', 'Create sales transactions', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(260, 'sales.analytics', 'web', 'retail', 'View sales analytics', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(261, 'accounts-payable.view', 'web', 'finance', 'View accounts payable', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(262, 'accounts-payable.manage', 'web', 'finance', 'Manage accounts payable', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(263, 'accounts-receivable.view', 'web', 'finance', 'View accounts receivable', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(264, 'accounts-receivable.manage', 'web', 'finance', 'Manage accounts receivable', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(265, 'ledger.view', 'web', 'finance', 'View general ledger', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(266, 'ledger.manage', 'web', 'finance', 'Manage general ledger', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(267, 'financial-reports.view', 'web', 'finance', 'View financial reports', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(268, 'financial-reports.create', 'web', 'finance', 'Create financial reports', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(269, 'users.view', 'web', 'admin', 'View user accounts', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(270, 'users.create', 'web', 'admin', 'Create user accounts', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(271, 'users.update', 'web', 'admin', 'Update user accounts', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(272, 'users.delete', 'web', 'admin', 'Delete user accounts', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(273, 'users.impersonate', 'web', 'admin', 'Impersonate other users', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(274, 'roles.view', 'web', 'admin', 'View roles and permissions', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(275, 'roles.create', 'web', 'admin', 'Create roles', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(276, 'roles.update', 'web', 'admin', 'Update roles', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(277, 'roles.delete', 'web', 'admin', 'Delete roles', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(278, 'permissions.assign', 'web', 'admin', 'Assign permissions to roles', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(279, 'settings.view', 'web', 'admin', 'View system settings', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(280, 'settings.update', 'web', 'admin', 'Update system settings', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(281, 'company.settings', 'web', 'admin', 'Manage company settings', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(282, 'attendance.settings', 'web', 'admin', 'Manage attendance settings', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(283, 'email.settings', 'web', 'admin', 'Manage email settings', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(284, 'notification.settings', 'web', 'admin', 'Manage notification settings', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(285, 'theme.settings', 'web', 'admin', 'Manage theme and branding', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(286, 'localization.settings', 'web', 'admin', 'Manage localization settings', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(287, 'performance.settings', 'web', 'admin', 'Manage performance settings', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(288, 'approval.settings', 'web', 'admin', 'Manage approval workflows', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(289, 'invoice.settings', 'web', 'admin', 'Manage invoice settings', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(290, 'salary.settings', 'web', 'admin', 'Manage salary settings', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(291, 'system.settings', 'web', 'admin', 'Manage system architecture', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(292, 'audit.view', 'web', 'admin', 'View audit logs', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(293, 'audit.export', 'web', 'admin', 'Export audit data', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(294, 'backup.create', 'web', 'admin', 'Create system backups', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(295, 'backup.restore', 'web', 'admin', 'Restore system backups', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(296, 'compliance.view', 'web', 'compliance', 'Access compliance module', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(297, 'compliance.dashboard.view', 'web', 'compliance', 'View compliance dashboard', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(298, 'compliance.documents.view', 'web', 'compliance', 'View compliance documents', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(299, 'compliance.documents.create', 'web', 'compliance', 'Create compliance documents', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(300, 'compliance.documents.update', 'web', 'compliance', 'Update compliance documents', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(301, 'compliance.documents.delete', 'web', 'compliance', 'Delete compliance documents', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(302, 'compliance.audits.view', 'web', 'compliance', 'View compliance audits', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(303, 'compliance.audits.create', 'web', 'compliance', 'Create compliance audits', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(304, 'compliance.audits.update', 'web', 'compliance', 'Update compliance audits', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(305, 'compliance.audits.delete', 'web', 'compliance', 'Delete compliance audits', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(306, 'compliance.requirements.view', 'web', 'compliance', 'View compliance requirements', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(307, 'compliance.requirements.create', 'web', 'compliance', 'Create compliance requirements', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(308, 'compliance.requirements.update', 'web', 'compliance', 'Update compliance requirements', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(309, 'compliance.requirements.delete', 'web', 'compliance', 'Delete compliance requirements', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(310, 'compliance.settings', 'web', 'compliance', 'Manage compliance settings', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(311, 'quality.view', 'web', 'quality', 'Access quality control module', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(312, 'quality.dashboard.view', 'web', 'quality', 'View quality dashboard', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(313, 'quality.inspections.view', 'web', 'quality', 'View quality inspections', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(314, 'quality.inspections.create', 'web', 'quality', 'Create quality inspections', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(315, 'quality.inspections.update', 'web', 'quality', 'Update quality inspections', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(316, 'quality.inspections.delete', 'web', 'quality', 'Delete quality inspections', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(317, 'quality.ncr.view', 'web', 'quality', 'View non-conformance reports', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(318, 'quality.ncr.create', 'web', 'quality', 'Create non-conformance reports', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(319, 'quality.ncr.update', 'web', 'quality', 'Update non-conformance reports', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(320, 'quality.ncr.delete', 'web', 'quality', 'Delete non-conformance reports', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(321, 'quality.calibrations.view', 'web', 'quality', 'View equipment calibrations', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(322, 'quality.calibrations.create', 'web', 'quality', 'Create equipment calibrations', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(323, 'quality.calibrations.update', 'web', 'quality', 'Update equipment calibrations', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(324, 'quality.calibrations.delete', 'web', 'quality', 'Delete equipment calibrations', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(325, 'quality.settings', 'web', 'quality', 'Manage quality control settings', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(326, 'analytics.view', 'web', 'analytics', 'Access analytics module', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(327, 'analytics.reports.view', 'web', 'analytics', 'View analytics reports', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(328, 'analytics.reports.create', 'web', 'analytics', 'Create analytics reports', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(329, 'analytics.reports.update', 'web', 'analytics', 'Update analytics reports', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(330, 'analytics.reports.delete', 'web', 'analytics', 'Delete analytics reports', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(331, 'analytics.reports.schedule', 'web', 'analytics', 'Schedule analytics reports', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(332, 'analytics.dashboards.view', 'web', 'analytics', 'View analytics dashboards', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(333, 'analytics.dashboards.create', 'web', 'analytics', 'Create analytics dashboards', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(334, 'analytics.dashboards.update', 'web', 'analytics', 'Update analytics dashboards', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(335, 'analytics.dashboards.delete', 'web', 'analytics', 'Delete analytics dashboards', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(336, 'analytics.kpi.view', 'web', 'analytics', 'View key performance indicators', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(337, 'analytics.kpi.create', 'web', 'analytics', 'Create key performance indicators', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(338, 'analytics.kpi.update', 'web', 'analytics', 'Update key performance indicators', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(339, 'analytics.kpi.delete', 'web', 'analytics', 'Delete key performance indicators', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(340, 'analytics.kpi.log', 'web', 'analytics', 'Log KPI values', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(341, 'analytics.settings', 'web', 'analytics', 'Manage analytics settings', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(342, 'project-management.view', 'web', 'project-management', 'Access project management module', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(343, 'project-management.dashboard.view', 'web', 'project-management', 'View project management dashboard', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(344, 'project-management.projects.view', 'web', 'project-management', 'View projects', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(345, 'project-management.projects.create', 'web', 'project-management', 'Create projects', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(346, 'project-management.projects.update', 'web', 'project-management', 'Update projects', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(347, 'project-management.projects.delete', 'web', 'project-management', 'Delete projects', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(348, 'project-management.milestones.view', 'web', 'project-management', 'View project milestones', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(349, 'project-management.milestones.create', 'web', 'project-management', 'Create project milestones', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(350, 'project-management.milestones.update', 'web', 'project-management', 'Update project milestones', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(351, 'project-management.milestones.delete', 'web', 'project-management', 'Delete project milestones', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(352, 'project-management.tasks.view', 'web', 'project-management', 'View project tasks', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(353, 'project-management.tasks.create', 'web', 'project-management', 'Create project tasks', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(354, 'project-management.tasks.update', 'web', 'project-management', 'Update project tasks', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(355, 'project-management.tasks.delete', 'web', 'project-management', 'Delete project tasks', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(356, 'project-management.tasks.assign', 'web', 'project-management', 'Assign project tasks', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(357, 'project-management.resources.view', 'web', 'project-management', 'View project resources', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(358, 'project-management.resources.assign', 'web', 'project-management', 'Assign project resources', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(359, 'project-management.issues.view', 'web', 'project-management', 'View project issues', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(360, 'project-management.issues.create', 'web', 'project-management', 'Create project issues', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(361, 'project-management.issues.update', 'web', 'project-management', 'Update project issues', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(362, 'project-management.issues.delete', 'web', 'project-management', 'Delete project issues', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(363, 'project-management.reports.view', 'web', 'project-management', 'View project reports', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(364, 'project-management.settings', 'web', 'project-management', 'Manage project settings', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(365, 'lms.view', 'web', 'lms', 'View LMS dashboard', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(366, 'lms.courses.view', 'web', 'lms', 'View courses', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(367, 'lms.courses.create', 'web', 'lms', 'Create courses', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(368, 'lms.courses.update', 'web', 'lms', 'Update courses', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(369, 'lms.courses.delete', 'web', 'lms', 'Delete courses', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(370, 'lms.students.view', 'web', 'lms', 'View students', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(371, 'lms.students.create', 'web', 'lms', 'Enroll students', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(372, 'lms.students.update', 'web', 'lms', 'Update student records', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(373, 'lms.students.delete', 'web', 'lms', 'Remove students', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(374, 'lms.instructors.view', 'web', 'lms', 'View instructors', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(375, 'lms.instructors.create', 'web', 'lms', 'Add instructors', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(376, 'lms.instructors.update', 'web', 'lms', 'Update instructor records', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(377, 'lms.instructors.delete', 'web', 'lms', 'Remove instructors', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(378, 'lms.assessments.view', 'web', 'lms', 'View assessments', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(379, 'lms.assessments.create', 'web', 'lms', 'Create assessments', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(380, 'lms.assessments.update', 'web', 'lms', 'Update assessments', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(381, 'lms.assessments.delete', 'web', 'lms', 'Delete assessments', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(382, 'lms.certificates.view', 'web', 'lms', 'View certificates', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(383, 'lms.certificates.create', 'web', 'lms', 'Issue certificates', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(384, 'lms.certificates.update', 'web', 'lms', 'Update certificates', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(385, 'lms.certificates.delete', 'web', 'lms', 'Revoke certificates', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(386, 'lms.reports.view', 'web', 'lms', 'View LMS reports', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(387, 'lms.settings.manage', 'web', 'lms', 'Manage LMS settings', '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(388, 'event.view', 'web', NULL, NULL, '2025-11-18 22:32:58', '2025-11-18 22:32:58'),
	(389, 'event.create', 'web', NULL, NULL, '2025-11-18 22:32:58', '2025-11-18 22:32:58'),
	(390, 'event.update', 'web', NULL, NULL, '2025-11-18 22:32:58', '2025-11-18 22:32:58'),
	(391, 'event.delete', 'web', NULL, NULL, '2025-11-18 22:32:58', '2025-11-18 22:32:58'),
	(392, 'event.registration.manage', 'web', NULL, NULL, '2025-11-18 22:32:58', '2025-11-18 22:32:58'),
	(393, 'modules.view', 'web', NULL, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(394, 'modules.create', 'web', NULL, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(395, 'modules.update', 'web', NULL, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50'),
	(396, 'modules.delete', 'web', NULL, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.personal_access_tokens
CREATE TABLE IF NOT EXISTS `personal_access_tokens` (
  `id` bigint unsigned NOT NULL,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.personal_access_tokens: ~0 rows (approximately)

-- Dumping structure for table eos365-bak.picnic_participants
CREATE TABLE IF NOT EXISTS `picnic_participants` (
  `id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `team` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `random_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_amount` decimal(8,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.picnic_participants: 0 rows
/*!40000 ALTER TABLE `picnic_participants` DISABLE KEYS */;
/*!40000 ALTER TABLE `picnic_participants` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.position_competencies
CREATE TABLE IF NOT EXISTS `position_competencies` (
  `id` bigint unsigned NOT NULL,
  `position_id` bigint unsigned NOT NULL,
  `competency_id` bigint unsigned NOT NULL,
  `importance` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.position_competencies: 0 rows
/*!40000 ALTER TABLE `position_competencies` DISABLE KEYS */;
/*!40000 ALTER TABLE `position_competencies` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.procurement_requests
CREATE TABLE IF NOT EXISTS `procurement_requests` (
  `id` bigint unsigned NOT NULL,
  `request_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requester_id` bigint unsigned NOT NULL,
  `department_id` bigint unsigned DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `estimated_budget` decimal(15,2) DEFAULT NULL,
  `required_by` date NOT NULL,
  `priority` enum('low','medium','high','urgent') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `status` enum('draft','submitted','approved','rejected','in_sourcing','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `approver_id` bigint unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `approval_notes` text COLLATE utf8mb4_unicode_ci,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.procurement_requests: 0 rows
/*!40000 ALTER TABLE `procurement_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `procurement_requests` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.procurement_request_items
CREATE TABLE IF NOT EXISTS `procurement_request_items` (
  `id` bigint unsigned NOT NULL,
  `procurement_request_id` bigint unsigned NOT NULL,
  `item_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `specifications` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(15,2) NOT NULL,
  `unit_of_measure` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estimated_unit_price` decimal(15,2) DEFAULT NULL,
  `estimated_total` decimal(15,2) DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.procurement_request_items: 0 rows
/*!40000 ALTER TABLE `procurement_request_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `procurement_request_items` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.production_plans
CREATE TABLE IF NOT EXISTS `production_plans` (
  `id` bigint unsigned NOT NULL,
  `plan_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `plan_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `inventory_item_id` bigint unsigned NOT NULL,
  `planned_quantity` decimal(15,2) NOT NULL,
  `planned_start_date` date NOT NULL,
  `planned_end_date` date NOT NULL,
  `actual_start_date` date DEFAULT NULL,
  `actual_end_date` date DEFAULT NULL,
  `actual_quantity` decimal(15,2) NOT NULL DEFAULT '0.00',
  `status` enum('planning','scheduled','in_progress','completed','cancelled','on_hold') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'planning',
  `assigned_to` bigint unsigned DEFAULT NULL,
  `estimated_cost` decimal(15,2) DEFAULT NULL,
  `actual_cost` decimal(15,2) DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.production_plans: 0 rows
/*!40000 ALTER TABLE `production_plans` DISABLE KEYS */;
/*!40000 ALTER TABLE `production_plans` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.production_plan_materials
CREATE TABLE IF NOT EXISTS `production_plan_materials` (
  `id` bigint unsigned NOT NULL,
  `production_plan_id` bigint unsigned NOT NULL,
  `inventory_item_id` bigint unsigned NOT NULL,
  `required_quantity` decimal(15,2) NOT NULL,
  `allocated_quantity` decimal(15,2) NOT NULL DEFAULT '0.00',
  `consumed_quantity` decimal(15,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.production_plan_materials: 0 rows
/*!40000 ALTER TABLE `production_plan_materials` DISABLE KEYS */;
/*!40000 ALTER TABLE `production_plan_materials` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.projects
CREATE TABLE IF NOT EXISTS `projects` (
  `id` bigint unsigned NOT NULL,
  `project_name` varchar(255) DEFAULT NULL,
  `project_code` varchar(255) DEFAULT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_id` int DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `rate` decimal(10,2) DEFAULT NULL,
  `rate_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `budget` decimal(15,2) DEFAULT NULL,
  `priority` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `project_leader_id` bigint unsigned NOT NULL,
  `team_leader_id` bigint unsigned NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `notes` text,
  `status` varchar(255) NOT NULL DEFAULT 'not_started',
  `files` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `open_tasks` int NOT NULL DEFAULT '0',
  `completed_tasks` int NOT NULL DEFAULT '0',
  `progress` int NOT NULL DEFAULT '0',
  `color` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `department_id` bigint unsigned DEFAULT NULL,
  `spi` decimal(5,2) NOT NULL DEFAULT '1.00' COMMENT 'Schedule Performance Index',
  `cpi` decimal(5,2) NOT NULL DEFAULT '1.00' COMMENT 'Cost Performance Index',
  `budget_utilization` decimal(5,2) NOT NULL DEFAULT '0.00' COMMENT 'Budget utilization percentage',
  `health_status` enum('good','at_risk','critical','unknown') NOT NULL DEFAULT 'unknown',
  `risk_level` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  `risk_factors` text COMMENT 'Risk assessment details',
  `methodology` enum('waterfall','agile','scrum','prince2','kanban','hybrid','other') NOT NULL DEFAULT 'agile',
  `project_type` varchar(255) DEFAULT NULL COMMENT 'digital, enhancement, analytics, integration, security, marketing',
  `planned_start_date` date DEFAULT NULL,
  `planned_end_date` date DEFAULT NULL,
  `actual_start_date` date DEFAULT NULL,
  `actual_end_date` date DEFAULT NULL,
  `budget_allocated` decimal(15,2) NOT NULL DEFAULT '0.00',
  `budget_spent` decimal(15,2) NOT NULL DEFAULT '0.00',
  `budget_committed` decimal(15,2) NOT NULL DEFAULT '0.00',
  `expected_roi` decimal(8,2) DEFAULT NULL COMMENT 'Expected Return on Investment percentage',
  `strategic_importance` int NOT NULL DEFAULT '50' COMMENT 'Strategic importance score 0-100',
  `business_impact` int NOT NULL DEFAULT '50' COMMENT 'Business impact score 0-100',
  `business_unit` varchar(255) DEFAULT NULL,
  `team_size` int NOT NULL DEFAULT '0',
  `resource_utilization` decimal(5,2) NOT NULL DEFAULT '0.00' COMMENT 'Resource utilization percentage',
  `skill_requirements` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin COMMENT 'Required skills and competencies',
  `quality_score` decimal(5,2) NOT NULL DEFAULT '0.00' COMMENT 'Quality assessment score',
  `defect_count` int NOT NULL DEFAULT '0',
  `customer_satisfaction` decimal(5,2) NOT NULL DEFAULT '0.00' COMMENT 'Customer satisfaction score',
  `current_phase` varchar(255) DEFAULT NULL,
  `next_milestone` varchar(255) DEFAULT NULL,
  `next_milestone_date` date DEFAULT NULL,
  `milestones` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin COMMENT 'Milestone tracking data',
  `iso_compliant` tinyint(1) NOT NULL DEFAULT '0',
  `pmbok_compliant` tinyint(1) NOT NULL DEFAULT '0',
  `compliance_checklist` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `change_log` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin COMMENT 'Project change history',
  `last_health_check` timestamp NULL DEFAULT NULL,
  `last_modified_by` varchar(255) DEFAULT NULL,
  `portfolio_category` varchar(255) DEFAULT NULL,
  `portfolio_priority` int NOT NULL DEFAULT '50' COMMENT 'Portfolio priority ranking',
  `is_archived` tinyint(1) NOT NULL DEFAULT '0',
  `archived_at` timestamp NULL DEFAULT NULL,
  `archived_by` varchar(255) DEFAULT NULL,
  `archive_reason` text,
  `external_project_id` varchar(255) DEFAULT NULL COMMENT 'External system project ID',
  `external_integrations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin COMMENT 'External system integrations',
  `jira_project_key` varchar(255) DEFAULT NULL,
  `confluence_space` varchar(255) DEFAULT NULL,
  CONSTRAINT `projects_chk_1` CHECK (json_valid(`skill_requirements`)),
  CONSTRAINT `projects_chk_2` CHECK (json_valid(`milestones`)),
  CONSTRAINT `projects_chk_3` CHECK (json_valid(`compliance_checklist`)),
  CONSTRAINT `projects_chk_4` CHECK (json_valid(`change_log`)),
  CONSTRAINT `projects_chk_5` CHECK (json_valid(`external_integrations`))
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumping data for table eos365-bak.projects: ~0 rows (approximately)

-- Dumping structure for table eos365-bak.project_budgets
CREATE TABLE IF NOT EXISTS `project_budgets` (
  `id` bigint unsigned NOT NULL,
  `project_id` bigint unsigned NOT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `budget_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `initial_budget` decimal(12,2) NOT NULL,
  `allocated_budget` decimal(12,2) NOT NULL,
  `spent_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `remaining_budget` decimal(12,2) NOT NULL,
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USD',
  `description` text COLLATE utf8mb4_unicode_ci,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.project_budgets: 0 rows
/*!40000 ALTER TABLE `project_budgets` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_budgets` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.project_budget_expenses
CREATE TABLE IF NOT EXISTS `project_budget_expenses` (
  `id` bigint unsigned NOT NULL,
  `budget_id` bigint unsigned NOT NULL,
  `project_id` bigint unsigned NOT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USD',
  `expense_date` date NOT NULL,
  `receipt_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vendor` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approved` tinyint(1) NOT NULL DEFAULT '0',
  `approved_by` bigint unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `receipt_file_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.project_budget_expenses: 0 rows
/*!40000 ALTER TABLE `project_budget_expenses` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_budget_expenses` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.project_issues
CREATE TABLE IF NOT EXISTS `project_issues` (
  `id` bigint unsigned NOT NULL,
  `project_id` bigint unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'bug',
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `priority` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `reported_by` bigint unsigned NOT NULL,
  `assigned_to` bigint unsigned DEFAULT NULL,
  `reported_date` date NOT NULL,
  `resolution_date` date DEFAULT NULL,
  `resolution` text COLLATE utf8mb4_unicode_ci,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `project_issues_chk_1` CHECK (json_valid(`tags`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.project_issues: 0 rows
/*!40000 ALTER TABLE `project_issues` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_issues` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.project_milestones
CREATE TABLE IF NOT EXISTS `project_milestones` (
  `id` bigint unsigned NOT NULL,
  `project_id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `due_date` date DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'not_started',
  `weight` int NOT NULL DEFAULT '1',
  `order` int NOT NULL DEFAULT '0',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.project_milestones: 0 rows
/*!40000 ALTER TABLE `project_milestones` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_milestones` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.project_resources
CREATE TABLE IF NOT EXISTS `project_resources` (
  `id` bigint unsigned NOT NULL,
  `project_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `role` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `allocation_percentage` decimal(5,2) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `hourly_rate` decimal(10,2) DEFAULT NULL,
  `cost_per_hour` decimal(10,2) DEFAULT NULL,
  `availability_status` enum('available','partially_available','busy','unavailable') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'available',
  `skills` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `project_resources_chk_1` CHECK (json_valid(`skills`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.project_resources: 0 rows
/*!40000 ALTER TABLE `project_resources` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_resources` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.project_tasks
CREATE TABLE IF NOT EXISTS `project_tasks` (
  `id` bigint unsigned NOT NULL,
  `project_id` bigint unsigned NOT NULL,
  `milestone_id` bigint unsigned DEFAULT NULL,
  `parent_task_id` bigint unsigned DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'todo',
  `priority` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `start_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `estimated_hours` decimal(8,2) DEFAULT NULL,
  `actual_hours` decimal(8,2) DEFAULT NULL,
  `assigned_to` bigint unsigned DEFAULT NULL,
  `progress` int NOT NULL DEFAULT '0',
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `project_tasks_chk_1` CHECK (json_valid(`tags`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.project_tasks: 0 rows
/*!40000 ALTER TABLE `project_tasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_tasks` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.project_task_attachments
CREATE TABLE IF NOT EXISTS `project_task_attachments` (
  `id` bigint unsigned NOT NULL,
  `task_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.project_task_attachments: 0 rows
/*!40000 ALTER TABLE `project_task_attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_task_attachments` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.project_task_comments
CREATE TABLE IF NOT EXISTS `project_task_comments` (
  `id` bigint unsigned NOT NULL,
  `task_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.project_task_comments: 0 rows
/*!40000 ALTER TABLE `project_task_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_task_comments` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.project_task_dependencies
CREATE TABLE IF NOT EXISTS `project_task_dependencies` (
  `id` bigint unsigned NOT NULL,
  `predecessor_id` bigint unsigned NOT NULL,
  `successor_id` bigint unsigned NOT NULL,
  `dependency_type` enum('finish_to_start','start_to_start','finish_to_finish','start_to_finish') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'finish_to_start',
  `lag_days` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.project_task_dependencies: 0 rows
/*!40000 ALTER TABLE `project_task_dependencies` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_task_dependencies` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.project_task_issues
CREATE TABLE IF NOT EXISTS `project_task_issues` (
  `id` bigint unsigned NOT NULL,
  `task_id` bigint unsigned NOT NULL,
  `issue_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.project_task_issues: 0 rows
/*!40000 ALTER TABLE `project_task_issues` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_task_issues` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.project_time_entries
CREATE TABLE IF NOT EXISTS `project_time_entries` (
  `id` bigint unsigned NOT NULL,
  `project_id` bigint unsigned NOT NULL,
  `task_id` bigint unsigned DEFAULT NULL,
  `user_id` bigint unsigned NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `duration_minutes` int NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `billable` tinyint(1) NOT NULL DEFAULT '0',
  `hourly_rate` decimal(10,2) DEFAULT NULL,
  `date` date NOT NULL,
  `approved` tinyint(1) NOT NULL DEFAULT '0',
  `approved_by` bigint unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.project_time_entries: 0 rows
/*!40000 ALTER TABLE `project_time_entries` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_time_entries` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.purchase_orders
CREATE TABLE IF NOT EXISTS `purchase_orders` (
  `id` bigint unsigned NOT NULL,
  `po_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplier_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `approver_id` bigint unsigned DEFAULT NULL,
  `order_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `expected_delivery_date` timestamp NULL DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `shipping_method` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_address` text COLLATE utf8mb4_unicode_ci,
  `billing_address` text COLLATE utf8mb4_unicode_ci,
  `subtotal` decimal(15,2) NOT NULL,
  `tax` decimal(15,2) NOT NULL DEFAULT '0.00',
  `shipping_cost` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total` decimal(15,2) NOT NULL,
  `status` enum('draft','pending_approval','approved','sent','received','partially_received','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `terms` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `rfq_id` bigint unsigned DEFAULT NULL,
  `rfq_quote_id` bigint unsigned DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.purchase_orders: 0 rows
/*!40000 ALTER TABLE `purchase_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_orders` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.purchase_order_items
CREATE TABLE IF NOT EXISTS `purchase_order_items` (
  `id` bigint unsigned NOT NULL,
  `purchase_order_id` bigint unsigned NOT NULL,
  `inventory_item_id` bigint unsigned NOT NULL,
  `quantity` decimal(15,2) NOT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `tax_rate` decimal(8,2) NOT NULL DEFAULT '0.00',
  `tax_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `subtotal` decimal(15,2) NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `received_quantity` decimal(15,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.purchase_order_items: 0 rows
/*!40000 ALTER TABLE `purchase_order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_order_items` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.purchase_receipts
CREATE TABLE IF NOT EXISTS `purchase_receipts` (
  `id` bigint unsigned NOT NULL,
  `receipt_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `purchase_order_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `receipt_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `carrier` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tracking_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('complete','partial','damaged','returned') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'complete',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.purchase_receipts: 0 rows
/*!40000 ALTER TABLE `purchase_receipts` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_receipts` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.purchase_receipt_items
CREATE TABLE IF NOT EXISTS `purchase_receipt_items` (
  `id` bigint unsigned NOT NULL,
  `purchase_receipt_id` bigint unsigned NOT NULL,
  `purchase_order_item_id` bigint unsigned NOT NULL,
  `received_quantity` decimal(15,2) NOT NULL,
  `condition` enum('good','damaged','wrong_item') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'good',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.purchase_receipt_items: 0 rows
/*!40000 ALTER TABLE `purchase_receipt_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_receipt_items` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.push_subscriptions
CREATE TABLE IF NOT EXISTS `push_subscriptions` (
  `id` bigint unsigned NOT NULL,
  `subscribable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subscribable_id` bigint unsigned NOT NULL,
  `endpoint` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `public_key` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `auth_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content_encoding` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.push_subscriptions: ~0 rows (approximately)

-- Dumping structure for table eos365-bak.quality_calibrations
CREATE TABLE IF NOT EXISTS `quality_calibrations` (
  `id` bigint unsigned NOT NULL,
  `equipment_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `equipment_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `equipment_serial_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `calibration_date` date NOT NULL,
  `next_calibration_date` date NOT NULL,
  `performed_by` bigint unsigned NOT NULL,
  `calibration_certificate_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `calibration_method` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `calibration_notes` text COLLATE utf8mb4_unicode_ci,
  `status` enum('calibrated','out_of_calibration','pending','removed_from_service') COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.quality_calibrations: 0 rows
/*!40000 ALTER TABLE `quality_calibrations` DISABLE KEYS */;
/*!40000 ALTER TABLE `quality_calibrations` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.quality_checkpoints
CREATE TABLE IF NOT EXISTS `quality_checkpoints` (
  `id` bigint unsigned NOT NULL,
  `inspection_id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `specification` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit_of_measure` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `min_value` decimal(10,4) DEFAULT NULL,
  `max_value` decimal(10,4) DEFAULT NULL,
  `target_value` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `result` enum('pass','fail','not_applicable','conditionally_passed') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `comments` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.quality_checkpoints: 0 rows
/*!40000 ALTER TABLE `quality_checkpoints` DISABLE KEYS */;
/*!40000 ALTER TABLE `quality_checkpoints` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.quality_inspections
CREATE TABLE IF NOT EXISTS `quality_inspections` (
  `id` bigint unsigned NOT NULL,
  `inspection_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `type` enum('incoming','in_process','final','customer_return','supplier_evaluation') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('scheduled','in_progress','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL,
  `scheduled_date` date NOT NULL,
  `actual_date` date DEFAULT NULL,
  `inspector_id` bigint unsigned NOT NULL,
  `department_id` bigint unsigned DEFAULT NULL,
  `product_batch` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sample_size` int DEFAULT NULL,
  `inspection_criteria` text COLLATE utf8mb4_unicode_ci,
  `results` text COLLATE utf8mb4_unicode_ci,
  `result_status` enum('passed','failed','conditionally_passed') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.quality_inspections: 0 rows
/*!40000 ALTER TABLE `quality_inspections` DISABLE KEYS */;
/*!40000 ALTER TABLE `quality_inspections` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.quality_ncrs
CREATE TABLE IF NOT EXISTS `quality_ncrs` (
  `id` bigint unsigned NOT NULL,
  `ncr_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `severity` enum('minor','major','critical') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('open','under_review','action_assigned','action_in_progress','closed','verified') COLLATE utf8mb4_unicode_ci NOT NULL,
  `reported_by` bigint unsigned NOT NULL,
  `department_id` bigint unsigned DEFAULT NULL,
  `assigned_to` bigint unsigned DEFAULT NULL,
  `detected_date` date NOT NULL,
  `root_cause_analysis` text COLLATE utf8mb4_unicode_ci,
  `immediate_action` text COLLATE utf8mb4_unicode_ci,
  `corrective_action` text COLLATE utf8mb4_unicode_ci,
  `preventive_action` text COLLATE utf8mb4_unicode_ci,
  `closed_by` bigint unsigned DEFAULT NULL,
  `closure_date` date DEFAULT NULL,
  `lessons_learned` text COLLATE utf8mb4_unicode_ci,
  `requires_verification` tinyint(1) NOT NULL DEFAULT '0',
  `verification_date` date DEFAULT NULL,
  `verified_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.quality_ncrs: 0 rows
/*!40000 ALTER TABLE `quality_ncrs` DISABLE KEYS */;
/*!40000 ALTER TABLE `quality_ncrs` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.register_transactions
CREATE TABLE IF NOT EXISTS `register_transactions` (
  `id` bigint unsigned NOT NULL,
  `cash_register_id` bigint unsigned NOT NULL,
  `sale_id` bigint unsigned DEFAULT NULL,
  `type` enum('sale','refund','expense','deposit','withdrawal') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'sale',
  `amount` decimal(15,2) NOT NULL,
  `payment_method` enum('cash','card','bank_transfer','credit') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cash',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.register_transactions: 0 rows
/*!40000 ALTER TABLE `register_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `register_transactions` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.regulatory_requirements
CREATE TABLE IF NOT EXISTS `regulatory_requirements` (
  `id` bigint unsigned NOT NULL,
  `requirement_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `regulatory_body` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `regulation_reference` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requirement_type` enum('mandatory','recommended','best_practice') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'mandatory',
  `industry` enum('healthcare','finance','manufacturing','technology','food','automotive','general') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'general',
  `applicable_locations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `effective_date` date NOT NULL,
  `compliance_deadline` date DEFAULT NULL,
  `status` enum('pending','in_progress','compliant','non_compliant','not_applicable') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `priority` enum('low','medium','high','critical') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `assigned_to` bigint unsigned DEFAULT NULL,
  `compliance_percentage` decimal(5,2) NOT NULL DEFAULT '0.00',
  `implementation_notes` text COLLATE utf8mb4_unicode_ci,
  `evidence_documents` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `regulatory_requirements_chk_1` CHECK (json_valid(`applicable_locations`)),
  CONSTRAINT `regulatory_requirements_chk_2` CHECK (json_valid(`evidence_documents`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.regulatory_requirements: 0 rows
/*!40000 ALTER TABLE `regulatory_requirements` DISABLE KEYS */;
/*!40000 ALTER TABLE `regulatory_requirements` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.reports
CREATE TABLE IF NOT EXISTS `reports` (
  `id` bigint unsigned NOT NULL,
  `ref_no` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `report_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `issue_date` date NOT NULL,
  `details` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remarks` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.reports: ~0 rows (approximately)

-- Dumping structure for table eos365-bak.return_requests
CREATE TABLE IF NOT EXISTS `return_requests` (
  `id` bigint unsigned NOT NULL,
  `rma_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `returnable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `returnable_id` bigint unsigned NOT NULL,
  `requested_by` bigint unsigned NOT NULL,
  `return_type` enum('defective','wrong_item','overage','damaged','expired','other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'defective',
  `reason` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity_returned` decimal(15,2) NOT NULL,
  `condition` enum('new','used','damaged','defective') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'used',
  `status` enum('requested','approved','rejected','in_transit','received','processed','completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'requested',
  `approver_id` bigint unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `expected_return_date` date DEFAULT NULL,
  `actual_return_date` date DEFAULT NULL,
  `resolution` enum('refund','replacement','credit','disposal','repair') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `refund_amount` decimal(15,2) DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.return_requests: 0 rows
/*!40000 ALTER TABLE `return_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `return_requests` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.rfqs
CREATE TABLE IF NOT EXISTS `rfqs` (
  `id` bigint unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `deadline` datetime NOT NULL,
  `status` enum('draft','published','closed','awarded','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `specifications` text COLLATE utf8mb4_unicode_ci,
  `terms_conditions` text COLLATE utf8mb4_unicode_ci,
  `created_by` bigint unsigned NOT NULL,
  `published_at` datetime DEFAULT NULL,
  `closed_at` datetime DEFAULT NULL,
  `awarded_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.rfqs: 0 rows
/*!40000 ALTER TABLE `rfqs` DISABLE KEYS */;
/*!40000 ALTER TABLE `rfqs` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.rfq_items
CREATE TABLE IF NOT EXISTS `rfq_items` (
  `id` bigint unsigned NOT NULL,
  `rfq_id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `quantity` decimal(10,2) NOT NULL,
  `unit` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.rfq_items: 0 rows
/*!40000 ALTER TABLE `rfq_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `rfq_items` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.rfq_quotes
CREATE TABLE IF NOT EXISTS `rfq_quotes` (
  `id` bigint unsigned NOT NULL,
  `rfq_id` bigint unsigned NOT NULL,
  `supplier_id` bigint unsigned NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USD',
  `delivery_time` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_terms` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_terms` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `validity_period` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `status` enum('draft','submitted','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `submitted_at` datetime DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `rejected_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.rfq_quotes: 0 rows
/*!40000 ALTER TABLE `rfq_quotes` DISABLE KEYS */;
/*!40000 ALTER TABLE `rfq_quotes` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.rfq_quote_items
CREATE TABLE IF NOT EXISTS `rfq_quote_items` (
  `id` bigint unsigned NOT NULL,
  `rfq_quote_id` bigint unsigned NOT NULL,
  `rfq_item_id` bigint unsigned NOT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `subtotal` decimal(15,2) NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.rfq_quote_items: 0 rows
/*!40000 ALTER TABLE `rfq_quote_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `rfq_quote_items` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.rfq_suppliers
CREATE TABLE IF NOT EXISTS `rfq_suppliers` (
  `id` bigint unsigned NOT NULL,
  `rfq_id` bigint unsigned NOT NULL,
  `supplier_id` bigint unsigned NOT NULL,
  `invited` tinyint(1) NOT NULL DEFAULT '1',
  `invitation_sent_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.rfq_suppliers: 0 rows
/*!40000 ALTER TABLE `rfq_suppliers` DISABLE KEYS */;
/*!40000 ALTER TABLE `rfq_suppliers` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.risk_assessments
CREATE TABLE IF NOT EXISTS `risk_assessments` (
  `id` bigint unsigned NOT NULL,
  `assessment_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `risk_category` enum('operational','financial','legal','regulatory','reputational','strategic','technology','environmental') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'operational',
  `risk_type` enum('compliance','security','safety','quality','financial','operational','strategic') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'compliance',
  `risk_description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `impact_description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `probability_score` int NOT NULL COMMENT '1-5 scale',
  `impact_score` int NOT NULL COMMENT '1-5 scale',
  `risk_score` int NOT NULL COMMENT 'Calculated: probability * impact',
  `risk_level` enum('very_low','low','medium','high','very_high') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `current_controls` text COLLATE utf8mb4_unicode_ci,
  `mitigation_plan` text COLLATE utf8mb4_unicode_ci,
  `owner_id` bigint unsigned NOT NULL,
  `assessor_id` bigint unsigned NOT NULL,
  `assessment_date` date NOT NULL,
  `review_date` date DEFAULT NULL,
  `status` enum('draft','under_review','approved','active','mitigated','closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.risk_assessments: 0 rows
/*!40000 ALTER TABLE `risk_assessments` DISABLE KEYS */;
/*!40000 ALTER TABLE `risk_assessments` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.risk_mitigation_actions
CREATE TABLE IF NOT EXISTS `risk_mitigation_actions` (
  `id` bigint unsigned NOT NULL,
  `risk_assessment_id` bigint unsigned NOT NULL,
  `action_title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_type` enum('preventive','detective','corrective','directive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'preventive',
  `assigned_to` bigint unsigned NOT NULL,
  `due_date` date NOT NULL,
  `completed_date` date DEFAULT NULL,
  `status` enum('planned','in_progress','completed','cancelled','overdue') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'planned',
  `priority` enum('low','medium','high','urgent') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `implementation_notes` text COLLATE utf8mb4_unicode_ci,
  `cost_estimate` decimal(15,2) DEFAULT NULL,
  `actual_cost` decimal(15,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.risk_mitigation_actions: 0 rows
/*!40000 ALTER TABLE `risk_mitigation_actions` DISABLE KEYS */;
/*!40000 ALTER TABLE `risk_mitigation_actions` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.roles
CREATE TABLE IF NOT EXISTS `roles` (
  `id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `guard_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hierarchy_level` int NOT NULL DEFAULT '50',
  `is_system_role` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.roles: 10 rows
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` (`id`, `name`, `guard_name`, `description`, `hierarchy_level`, `is_system_role`, `created_at`, `updated_at`) VALUES
	(1, 'Super Administrator', 'web', 'Full system access with all privileges', 1, 1, '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(2, 'Administrator', 'web', 'Administrative access to most system functions', 10, 1, '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(3, 'HR Manager', 'web', 'Human resources management and employee operations', 20, 0, '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(4, 'Project Manager', 'web', 'Project and portfolio management capabilities', 20, 0, '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(5, 'Department Manager', 'web', 'Departmental management and team oversight', 30, 0, '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(6, 'Team Lead', 'web', 'Team leadership and basic management functions', 40, 0, '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(7, 'Senior Employee', 'web', 'Senior level employee with extended access', 50, 0, '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(8, 'Employee', 'web', 'Standard employee access to self-service functions', 60, 0, '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(9, 'Contractor', 'web', 'Limited access for contractors and temporary staff', 70, 0, '2025-07-13 16:08:54', '2025-07-13 16:08:54'),
	(10, 'Intern', 'web', 'Basic access for interns and trainees', 80, 0, '2025-07-13 16:08:54', '2025-07-13 16:08:54');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.role_has_permissions
CREATE TABLE IF NOT EXISTS `role_has_permissions` (
  `permission_id` bigint unsigned NOT NULL,
  `role_id` bigint unsigned NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.role_has_permissions: 1,208 rows
/*!40000 ALTER TABLE `role_has_permissions` DISABLE KEYS */;
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES
	(1, 1),
	(1, 2),
	(1, 3),
	(1, 4),
	(1, 5),
	(1, 6),
	(1, 7),
	(1, 8),
	(2, 1),
	(2, 2),
	(2, 3),
	(2, 4),
	(2, 5),
	(2, 6),
	(2, 7),
	(2, 8),
	(3, 1),
	(3, 2),
	(3, 3),
	(3, 4),
	(3, 5),
	(3, 6),
	(3, 7),
	(3, 8),
	(4, 1),
	(4, 2),
	(4, 3),
	(4, 4),
	(4, 5),
	(4, 6),
	(4, 7),
	(4, 8),
	(4, 9),
	(4, 10),
	(5, 1),
	(5, 2),
	(5, 3),
	(5, 4),
	(5, 5),
	(5, 6),
	(5, 7),
	(5, 8),
	(5, 9),
	(5, 10),
	(6, 1),
	(6, 2),
	(6, 3),
	(6, 4),
	(6, 5),
	(6, 6),
	(6, 7),
	(6, 8),
	(7, 1),
	(7, 2),
	(7, 3),
	(7, 4),
	(7, 5),
	(7, 6),
	(7, 7),
	(7, 8),
	(8, 1),
	(8, 2),
	(8, 3),
	(8, 4),
	(8, 5),
	(8, 6),
	(8, 7),
	(8, 8),
	(9, 1),
	(9, 2),
	(9, 3),
	(9, 4),
	(9, 5),
	(9, 6),
	(9, 7),
	(9, 8),
	(10, 1),
	(10, 2),
	(10, 3),
	(10, 4),
	(10, 5),
	(10, 6),
	(10, 7),
	(10, 8),
	(11, 1),
	(11, 2),
	(11, 3),
	(11, 4),
	(11, 5),
	(11, 6),
	(11, 7),
	(11, 8),
	(11, 9),
	(11, 10),
	(12, 1),
	(12, 2),
	(12, 3),
	(12, 4),
	(12, 5),
	(12, 6),
	(12, 7),
	(12, 8),
	(12, 9),
	(13, 1),
	(13, 2),
	(13, 3),
	(13, 4),
	(13, 5),
	(13, 6),
	(13, 7),
	(13, 8),
	(13, 9),
	(13, 10),
	(14, 1),
	(14, 2),
	(14, 3),
	(14, 4),
	(14, 5),
	(14, 6),
	(15, 1),
	(15, 2),
	(15, 3),
	(16, 1),
	(16, 2),
	(16, 3),
	(16, 5),
	(17, 1),
	(17, 2),
	(17, 3),
	(18, 1),
	(18, 2),
	(18, 3),
	(19, 1),
	(19, 2),
	(19, 3),
	(20, 1),
	(20, 2),
	(20, 3),
	(20, 4),
	(20, 5),
	(21, 1),
	(21, 2),
	(21, 3),
	(22, 1),
	(22, 2),
	(22, 3),
	(23, 1),
	(23, 2),
	(23, 3),
	(24, 1),
	(24, 2),
	(24, 3),
	(24, 4),
	(24, 5),
	(25, 1),
	(25, 2),
	(25, 3),
	(26, 1),
	(26, 2),
	(26, 3),
	(27, 1),
	(27, 2),
	(27, 3),
	(28, 1),
	(28, 2),
	(28, 3),
	(28, 5),
	(28, 6),
	(29, 1),
	(29, 2),
	(29, 3),
	(29, 5),
	(30, 1),
	(30, 2),
	(30, 3),
	(31, 1),
	(31, 2),
	(31, 3),
	(32, 1),
	(32, 2),
	(32, 3),
	(33, 1),
	(33, 2),
	(33, 3),
	(34, 1),
	(34, 2),
	(34, 3),
	(35, 1),
	(35, 2),
	(35, 3),
	(36, 1),
	(36, 2),
	(36, 3),
	(37, 1),
	(37, 2),
	(37, 3),
	(38, 1),
	(38, 2),
	(38, 3),
	(38, 5),
	(38, 6),
	(39, 1),
	(39, 2),
	(39, 3),
	(40, 1),
	(40, 2),
	(40, 3),
	(41, 1),
	(41, 2),
	(41, 3),
	(42, 1),
	(42, 2),
	(42, 3),
	(42, 5),
	(43, 1),
	(43, 2),
	(43, 3),
	(44, 1),
	(44, 2),
	(44, 3),
	(45, 1),
	(45, 2),
	(45, 3),
	(46, 1),
	(46, 2),
	(46, 3),
	(47, 1),
	(47, 2),
	(47, 3),
	(48, 1),
	(48, 2),
	(48, 3),
	(49, 1),
	(49, 2),
	(49, 3),
	(50, 1),
	(50, 2),
	(50, 3),
	(50, 5),
	(51, 1),
	(51, 2),
	(51, 3),
	(52, 1),
	(52, 2),
	(52, 3),
	(53, 1),
	(53, 2),
	(53, 3),
	(54, 1),
	(54, 2),
	(54, 3),
	(54, 5),
	(55, 1),
	(55, 2),
	(55, 3),
	(56, 1),
	(56, 2),
	(56, 3),
	(57, 1),
	(57, 2),
	(57, 3),
	(58, 1),
	(58, 2),
	(58, 3),
	(59, 1),
	(59, 2),
	(59, 3),
	(60, 1),
	(60, 2),
	(60, 3),
	(61, 1),
	(61, 2),
	(61, 3),
	(62, 1),
	(62, 2),
	(62, 3),
	(62, 5),
	(63, 1),
	(63, 2),
	(63, 3),
	(64, 1),
	(64, 2),
	(64, 3),
	(65, 1),
	(65, 2),
	(65, 3),
	(66, 1),
	(66, 2),
	(66, 3),
	(67, 1),
	(67, 2),
	(67, 3),
	(68, 1),
	(68, 2),
	(68, 3),
	(69, 1),
	(69, 2),
	(69, 3),
	(70, 1),
	(70, 2),
	(70, 3),
	(70, 5),
	(70, 6),
	(71, 1),
	(71, 2),
	(71, 3),
	(72, 1),
	(72, 2),
	(72, 3),
	(72, 5),
	(73, 1),
	(73, 2),
	(73, 3),
	(74, 1),
	(74, 2),
	(74, 3),
	(75, 1),
	(75, 2),
	(75, 3),
	(76, 1),
	(76, 2),
	(76, 3),
	(77, 1),
	(77, 2),
	(77, 3),
	(78, 1),
	(78, 2),
	(78, 3),
	(79, 1),
	(79, 2),
	(79, 3),
	(80, 1),
	(80, 2),
	(80, 3),
	(81, 1),
	(81, 2),
	(81, 3),
	(82, 1),
	(82, 2),
	(82, 3),
	(82, 5),
	(82, 6),
	(83, 1),
	(83, 2),
	(83, 3),
	(83, 6),
	(84, 1),
	(84, 2),
	(84, 3),
	(84, 5),
	(84, 6),
	(85, 1),
	(85, 2),
	(85, 3),
	(85, 5),
	(86, 1),
	(86, 2),
	(86, 3),
	(87, 1),
	(87, 2),
	(87, 3),
	(88, 1),
	(88, 2),
	(88, 3),
	(89, 1),
	(89, 2),
	(89, 3),
	(89, 6),
	(90, 1),
	(90, 2),
	(90, 3),
	(90, 6),
	(91, 1),
	(91, 2),
	(91, 3),
	(91, 8),
	(92, 1),
	(92, 2),
	(92, 3),
	(93, 1),
	(93, 2),
	(93, 3),
	(94, 1),
	(94, 2),
	(94, 3),
	(95, 1),
	(95, 2),
	(95, 3),
	(96, 1),
	(96, 2),
	(96, 3),
	(97, 1),
	(97, 2),
	(97, 3),
	(98, 1),
	(98, 2),
	(98, 3),
	(99, 1),
	(99, 2),
	(99, 3),
	(99, 5),
	(100, 1),
	(100, 2),
	(100, 3),
	(101, 1),
	(101, 2),
	(101, 3),
	(102, 1),
	(102, 2),
	(102, 3),
	(103, 1),
	(103, 2),
	(103, 3),
	(104, 1),
	(104, 2),
	(104, 3),
	(105, 1),
	(105, 2),
	(105, 3),
	(106, 1),
	(106, 2),
	(106, 3),
	(107, 1),
	(107, 2),
	(107, 3),
	(108, 1),
	(108, 2),
	(108, 3),
	(109, 1),
	(109, 2),
	(109, 3),
	(110, 1),
	(110, 2),
	(110, 3),
	(111, 1),
	(111, 2),
	(111, 3),
	(112, 1),
	(112, 2),
	(112, 3),
	(113, 1),
	(113, 2),
	(113, 3),
	(114, 1),
	(114, 2),
	(114, 3),
	(115, 1),
	(115, 2),
	(115, 3),
	(115, 5),
	(116, 1),
	(116, 2),
	(116, 3),
	(117, 1),
	(117, 2),
	(117, 3),
	(118, 1),
	(118, 2),
	(118, 3),
	(118, 8),
	(119, 1),
	(119, 2),
	(119, 3),
	(119, 8),
	(120, 1),
	(120, 2),
	(120, 3),
	(120, 8),
	(121, 1),
	(121, 2),
	(121, 3),
	(121, 8),
	(122, 1),
	(122, 2),
	(122, 3),
	(122, 8),
	(123, 1),
	(123, 2),
	(123, 3),
	(123, 8),
	(124, 1),
	(124, 2),
	(124, 3),
	(124, 8),
	(125, 1),
	(125, 2),
	(125, 3),
	(125, 8),
	(126, 1),
	(126, 2),
	(126, 3),
	(126, 8),
	(127, 1),
	(127, 2),
	(127, 3),
	(127, 8),
	(128, 1),
	(128, 2),
	(128, 3),
	(129, 1),
	(129, 2),
	(129, 3),
	(130, 1),
	(130, 2),
	(130, 3),
	(131, 1),
	(131, 2),
	(131, 3),
	(132, 1),
	(132, 2),
	(132, 3),
	(133, 1),
	(133, 2),
	(133, 3),
	(134, 1),
	(134, 2),
	(134, 3),
	(135, 1),
	(135, 2),
	(135, 3),
	(136, 1),
	(136, 2),
	(136, 3),
	(137, 1),
	(137, 2),
	(137, 3),
	(138, 1),
	(138, 2),
	(138, 3),
	(139, 1),
	(139, 2),
	(139, 4),
	(139, 5),
	(139, 6),
	(139, 7),
	(139, 8),
	(139, 9),
	(140, 1),
	(140, 2),
	(140, 4),
	(140, 5),
	(140, 6),
	(140, 7),
	(140, 8),
	(140, 9),
	(141, 1),
	(141, 2),
	(141, 4),
	(141, 5),
	(141, 6),
	(141, 7),
	(142, 1),
	(142, 2),
	(142, 4),
	(142, 5),
	(143, 1),
	(143, 2),
	(143, 4),
	(143, 5),
	(144, 1),
	(144, 2),
	(144, 4),
	(144, 5),
	(145, 1),
	(145, 2),
	(145, 4),
	(145, 5),
	(146, 1),
	(146, 2),
	(146, 4),
	(146, 5),
	(146, 6),
	(146, 7),
	(146, 8),
	(146, 9),
	(146, 10),
	(147, 1),
	(147, 2),
	(147, 4),
	(147, 5),
	(147, 6),
	(147, 7),
	(148, 1),
	(148, 2),
	(148, 4),
	(148, 5),
	(148, 6),
	(148, 7),
	(149, 1),
	(149, 2),
	(149, 4),
	(149, 5),
	(150, 1),
	(150, 2),
	(150, 4),
	(150, 5),
	(150, 6),
	(151, 1),
	(151, 2),
	(151, 4),
	(151, 5),
	(152, 1),
	(152, 2),
	(152, 4),
	(152, 5),
	(153, 1),
	(153, 2),
	(153, 4),
	(153, 5),
	(154, 1),
	(154, 2),
	(154, 4),
	(154, 5),
	(155, 1),
	(155, 2),
	(155, 3),
	(155, 5),
	(155, 6),
	(156, 1),
	(156, 2),
	(156, 3),
	(156, 5),
	(156, 6),
	(157, 1),
	(157, 2),
	(157, 3),
	(157, 5),
	(157, 6),
	(158, 1),
	(158, 2),
	(158, 3),
	(159, 1),
	(159, 2),
	(159, 3),
	(159, 5),
	(160, 1),
	(160, 2),
	(160, 3),
	(160, 7),
	(160, 8),
	(161, 1),
	(161, 2),
	(161, 3),
	(161, 7),
	(162, 1),
	(162, 2),
	(162, 3),
	(162, 7),
	(163, 1),
	(163, 2),
	(163, 3),
	(164, 1),
	(164, 2),
	(164, 3),
	(165, 1),
	(165, 2),
	(165, 3),
	(166, 1),
	(166, 2),
	(166, 3),
	(167, 1),
	(167, 2),
	(167, 3),
	(167, 5),
	(168, 1),
	(168, 2),
	(168, 3),
	(168, 6),
	(169, 1),
	(169, 2),
	(169, 3),
	(170, 1),
	(170, 2),
	(170, 3),
	(171, 1),
	(171, 2),
	(171, 3),
	(172, 1),
	(172, 2),
	(172, 3),
	(173, 1),
	(173, 2),
	(173, 3),
	(174, 1),
	(174, 2),
	(174, 3),
	(175, 1),
	(175, 2),
	(175, 3),
	(176, 1),
	(176, 2),
	(176, 3),
	(177, 1),
	(177, 2),
	(177, 3),
	(178, 1),
	(178, 2),
	(178, 3),
	(179, 1),
	(179, 2),
	(179, 3),
	(180, 1),
	(180, 2),
	(180, 3),
	(180, 6),
	(181, 1),
	(181, 2),
	(181, 3),
	(181, 6),
	(182, 1),
	(182, 2),
	(182, 3),
	(183, 1),
	(183, 2),
	(183, 3),
	(184, 1),
	(184, 2),
	(184, 3),
	(185, 1),
	(185, 2),
	(185, 3),
	(186, 1),
	(186, 2),
	(186, 3),
	(187, 1),
	(187, 2),
	(187, 3),
	(188, 1),
	(188, 2),
	(188, 3),
	(188, 6),
	(189, 1),
	(189, 2),
	(189, 3),
	(189, 7),
	(189, 8),
	(190, 1),
	(190, 2),
	(190, 3),
	(190, 7),
	(191, 1),
	(191, 2),
	(191, 3),
	(191, 6),
	(192, 1),
	(192, 2),
	(192, 3),
	(193, 1),
	(193, 2),
	(193, 3),
	(194, 1),
	(194, 2),
	(194, 3),
	(194, 7),
	(194, 8),
	(195, 1),
	(195, 2),
	(195, 3),
	(195, 7),
	(195, 8),
	(196, 1),
	(196, 2),
	(196, 3),
	(197, 1),
	(197, 2),
	(197, 3),
	(198, 1),
	(198, 2),
	(198, 3),
	(199, 1),
	(199, 2),
	(199, 3),
	(200, 1),
	(200, 2),
	(200, 3),
	(201, 1),
	(201, 2),
	(201, 3),
	(202, 1),
	(202, 2),
	(202, 3),
	(203, 1),
	(203, 2),
	(203, 3),
	(204, 1),
	(204, 2),
	(204, 3),
	(205, 1),
	(205, 2),
	(205, 3),
	(206, 1),
	(206, 2),
	(206, 3),
	(207, 1),
	(207, 2),
	(207, 3),
	(208, 1),
	(208, 2),
	(208, 3),
	(209, 1),
	(209, 2),
	(209, 3),
	(210, 1),
	(210, 2),
	(210, 3),
	(211, 1),
	(211, 2),
	(211, 3),
	(212, 1),
	(212, 2),
	(212, 3),
	(213, 1),
	(213, 2),
	(213, 3),
	(214, 1),
	(214, 2),
	(214, 3),
	(215, 1),
	(215, 2),
	(215, 3),
	(216, 1),
	(216, 2),
	(216, 3),
	(217, 1),
	(217, 2),
	(217, 3),
	(218, 1),
	(218, 2),
	(218, 3),
	(219, 1),
	(219, 2),
	(219, 3),
	(220, 1),
	(220, 2),
	(220, 3),
	(221, 1),
	(221, 2),
	(221, 3),
	(222, 1),
	(222, 2),
	(222, 3),
	(222, 4),
	(223, 1),
	(223, 2),
	(223, 3),
	(223, 4),
	(224, 1),
	(224, 2),
	(224, 3),
	(224, 4),
	(225, 1),
	(225, 2),
	(225, 3),
	(225, 4),
	(226, 1),
	(226, 2),
	(226, 3),
	(226, 4),
	(227, 1),
	(227, 2),
	(227, 3),
	(227, 4),
	(228, 1),
	(228, 2),
	(228, 3),
	(228, 4),
	(229, 1),
	(229, 2),
	(229, 3),
	(229, 4),
	(230, 1),
	(230, 2),
	(231, 1),
	(231, 2),
	(232, 1),
	(232, 2),
	(233, 1),
	(233, 2),
	(234, 1),
	(234, 2),
	(235, 1),
	(235, 2),
	(236, 1),
	(236, 2),
	(237, 1),
	(237, 2),
	(238, 1),
	(238, 2),
	(239, 1),
	(239, 2),
	(240, 1),
	(240, 2),
	(241, 1),
	(241, 2),
	(242, 1),
	(242, 2),
	(243, 1),
	(243, 2),
	(244, 1),
	(244, 2),
	(245, 1),
	(245, 2),
	(246, 1),
	(246, 2),
	(247, 1),
	(247, 2),
	(248, 1),
	(248, 2),
	(249, 1),
	(249, 2),
	(250, 1),
	(250, 2),
	(251, 1),
	(251, 2),
	(252, 1),
	(252, 2),
	(253, 1),
	(253, 2),
	(254, 1),
	(254, 2),
	(255, 1),
	(255, 2),
	(256, 1),
	(256, 2),
	(257, 1),
	(257, 2),
	(258, 1),
	(258, 2),
	(259, 1),
	(259, 2),
	(260, 1),
	(260, 2),
	(261, 1),
	(261, 2),
	(262, 1),
	(262, 2),
	(263, 1),
	(263, 2),
	(264, 1),
	(264, 2),
	(265, 1),
	(265, 2),
	(266, 1),
	(266, 2),
	(267, 1),
	(267, 2),
	(268, 1),
	(268, 2),
	(269, 1),
	(269, 2),
	(269, 3),
	(270, 1),
	(270, 2),
	(270, 3),
	(271, 1),
	(271, 2),
	(271, 3),
	(272, 1),
	(272, 2),
	(272, 3),
	(273, 1),
	(273, 3),
	(274, 1),
	(274, 2),
	(275, 1),
	(275, 2),
	(276, 1),
	(276, 2),
	(277, 1),
	(277, 2),
	(278, 1),
	(278, 2),
	(279, 1),
	(279, 2),
	(279, 3),
	(280, 1),
	(280, 2),
	(280, 3),
	(281, 1),
	(281, 2),
	(281, 3),
	(282, 1),
	(282, 2),
	(282, 3),
	(283, 1),
	(283, 2),
	(284, 1),
	(284, 2),
	(285, 1),
	(285, 2),
	(286, 1),
	(286, 2),
	(287, 1),
	(287, 2),
	(288, 1),
	(288, 2),
	(289, 1),
	(289, 2),
	(290, 1),
	(290, 2),
	(291, 1),
	(291, 2),
	(292, 1),
	(292, 2),
	(293, 1),
	(293, 2),
	(294, 1),
	(295, 1),
	(296, 1),
	(296, 2),
	(297, 1),
	(297, 2),
	(298, 1),
	(298, 2),
	(299, 1),
	(299, 2),
	(300, 1),
	(300, 2),
	(301, 1),
	(301, 2),
	(302, 1),
	(302, 2),
	(303, 1),
	(303, 2),
	(304, 1),
	(304, 2),
	(305, 1),
	(305, 2),
	(306, 1),
	(306, 2),
	(307, 1),
	(307, 2),
	(308, 1),
	(308, 2),
	(309, 1),
	(309, 2),
	(310, 1),
	(310, 2),
	(311, 1),
	(311, 2),
	(312, 1),
	(312, 2),
	(313, 1),
	(313, 2),
	(314, 1),
	(314, 2),
	(315, 1),
	(315, 2),
	(316, 1),
	(316, 2),
	(317, 1),
	(317, 2),
	(318, 1),
	(318, 2),
	(319, 1),
	(319, 2),
	(320, 1),
	(320, 2),
	(321, 1),
	(321, 2),
	(322, 1),
	(322, 2),
	(323, 1),
	(323, 2),
	(324, 1),
	(324, 2),
	(325, 1),
	(325, 2),
	(326, 1),
	(326, 2),
	(327, 1),
	(327, 2),
	(328, 1),
	(328, 2),
	(329, 1),
	(329, 2),
	(330, 1),
	(330, 2),
	(331, 1),
	(331, 2),
	(332, 1),
	(332, 2),
	(333, 1),
	(333, 2),
	(334, 1),
	(334, 2),
	(335, 1),
	(335, 2),
	(336, 1),
	(336, 2),
	(337, 1),
	(337, 2),
	(338, 1),
	(338, 2),
	(339, 1),
	(339, 2),
	(340, 1),
	(340, 2),
	(341, 1),
	(341, 2),
	(342, 1),
	(342, 2),
	(343, 1),
	(343, 2),
	(344, 1),
	(344, 2),
	(345, 1),
	(345, 2),
	(346, 1),
	(346, 2),
	(347, 1),
	(347, 2),
	(348, 1),
	(348, 2),
	(349, 1),
	(349, 2),
	(350, 1),
	(350, 2),
	(351, 1),
	(351, 2),
	(352, 1),
	(352, 2),
	(353, 1),
	(353, 2),
	(354, 1),
	(354, 2),
	(355, 1),
	(355, 2),
	(356, 1),
	(356, 2),
	(357, 1),
	(357, 2),
	(358, 1),
	(358, 2),
	(359, 1),
	(359, 2),
	(360, 1),
	(360, 2),
	(361, 1),
	(361, 2),
	(362, 1),
	(362, 2),
	(363, 1),
	(363, 2),
	(364, 1),
	(364, 2),
	(365, 1),
	(365, 2),
	(366, 1),
	(366, 2),
	(367, 1),
	(367, 2),
	(368, 1),
	(368, 2),
	(369, 1),
	(369, 2),
	(370, 1),
	(370, 2),
	(371, 1),
	(371, 2),
	(372, 1),
	(372, 2),
	(373, 1),
	(373, 2),
	(374, 1),
	(374, 2),
	(375, 1),
	(375, 2),
	(376, 1),
	(376, 2),
	(377, 1),
	(377, 2),
	(378, 1),
	(378, 2),
	(379, 1),
	(379, 2),
	(380, 1),
	(380, 2),
	(381, 1),
	(381, 2),
	(382, 1),
	(382, 2),
	(383, 1),
	(383, 2),
	(384, 1),
	(384, 2),
	(385, 1),
	(385, 2),
	(386, 1),
	(386, 2),
	(387, 1),
	(387, 2),
	(388, 1),
	(388, 2),
	(388, 3),
	(389, 1),
	(389, 2),
	(390, 1),
	(390, 2),
	(391, 1),
	(391, 2),
	(392, 1),
	(392, 2),
	(392, 3),
	(393, 1),
	(394, 1),
	(395, 1),
	(396, 1);
/*!40000 ALTER TABLE `role_has_permissions` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.safety_incidents
CREATE TABLE IF NOT EXISTS `safety_incidents` (
  `id` bigint unsigned NOT NULL,
  `incident_date` date NOT NULL,
  `incident_time` datetime DEFAULT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `incident_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `severity` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reported_by` bigint unsigned NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `immediate_actions` text COLLATE utf8mb4_unicode_ci,
  `root_cause` text COLLATE utf8mb4_unicode_ci,
  `corrective_actions` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'reported',
  `witnesses` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `reported_to_authorities` tinyint(1) NOT NULL DEFAULT '0',
  `authority_report_date` date DEFAULT NULL,
  `related_documents` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `safety_incidents_chk_1` CHECK (json_valid(`witnesses`)),
  CONSTRAINT `safety_incidents_chk_2` CHECK (json_valid(`related_documents`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.safety_incidents: 0 rows
/*!40000 ALTER TABLE `safety_incidents` DISABLE KEYS */;
/*!40000 ALTER TABLE `safety_incidents` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.safety_incident_participants
CREATE TABLE IF NOT EXISTS `safety_incident_participants` (
  `id` bigint unsigned NOT NULL,
  `incident_id` bigint unsigned NOT NULL,
  `employee_id` bigint unsigned NOT NULL,
  `involvement_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `injury_details` text COLLATE utf8mb4_unicode_ci,
  `treatment_received` text COLLATE utf8mb4_unicode_ci,
  `medical_attention_required` tinyint(1) NOT NULL DEFAULT '0',
  `time_off_work_required` tinyint(1) NOT NULL DEFAULT '0',
  `time_off_start_date` date DEFAULT NULL,
  `time_off_end_date` date DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.safety_incident_participants: 0 rows
/*!40000 ALTER TABLE `safety_incident_participants` DISABLE KEYS */;
/*!40000 ALTER TABLE `safety_incident_participants` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.safety_inspections
CREATE TABLE IF NOT EXISTS `safety_inspections` (
  `id` bigint unsigned NOT NULL,
  `inspection_date` date NOT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `inspector_id` bigint unsigned NOT NULL,
  `inspection_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'scheduled',
  `findings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `recommendations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `next_inspection_date` date DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `safety_inspections_chk_1` CHECK (json_valid(`findings`)),
  CONSTRAINT `safety_inspections_chk_2` CHECK (json_valid(`recommendations`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.safety_inspections: 0 rows
/*!40000 ALTER TABLE `safety_inspections` DISABLE KEYS */;
/*!40000 ALTER TABLE `safety_inspections` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.safety_inspection_items
CREATE TABLE IF NOT EXISTS `safety_inspection_items` (
  `id` bigint unsigned NOT NULL,
  `inspection_id` bigint unsigned NOT NULL,
  `item_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `issue_description` text COLLATE utf8mb4_unicode_ci,
  `risk_level` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recommended_action` text COLLATE utf8mb4_unicode_ci,
  `assigned_to` bigint unsigned DEFAULT NULL,
  `target_completion_date` date DEFAULT NULL,
  `actual_completion_date` date DEFAULT NULL,
  `verification_status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.safety_inspection_items: 0 rows
/*!40000 ALTER TABLE `safety_inspection_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `safety_inspection_items` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.safety_trainings
CREATE TABLE IF NOT EXISTS `safety_trainings` (
  `id` bigint unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `training_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `frequency` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration_minutes` int DEFAULT NULL,
  `trainer_id` bigint unsigned DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Dumping structure for table eos365-bak.safety_training_participants
CREATE TABLE IF NOT EXISTS `safety_training_participants` (
  `id` bigint unsigned NOT NULL,
  `training_id` bigint unsigned NOT NULL,
  `employee_id` bigint unsigned NOT NULL,
  `completion_date` date NOT NULL,
  `expiration_date` date DEFAULT NULL,
  `completion_status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `score` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.safety_training_participants: 0 rows
/*!40000 ALTER TABLE `safety_training_participants` DISABLE KEYS */;
/*!40000 ALTER TABLE `safety_training_participants` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.sales
CREATE TABLE IF NOT EXISTS `sales` (
  `id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `customer_id` bigint unsigned DEFAULT NULL,
  `sale_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `total_amount` decimal(15,2) NOT NULL,
  `discount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `tax` decimal(15,2) NOT NULL DEFAULT '0.00',
  `payment_method` enum('cash','card','bank_transfer','credit') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cash',
  `payment_status` enum('paid','pending','partial','canceled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'paid',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.sales: 0 rows
/*!40000 ALTER TABLE `sales` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.sale_items
CREATE TABLE IF NOT EXISTS `sale_items` (
  `id` bigint unsigned NOT NULL,
  `sale_id` bigint unsigned NOT NULL,
  `inventory_item_id` bigint unsigned NOT NULL,
  `quantity` int NOT NULL,
  `price` decimal(15,2) NOT NULL,
  `discount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `subtotal` decimal(15,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.sale_items: 0 rows
/*!40000 ALTER TABLE `sale_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `sale_items` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.security_events
CREATE TABLE IF NOT EXISTS `security_events` (
  `id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `event_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `severity` enum('low','medium','high','critical') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'low',
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `risk_score` enum('low','medium','high','critical') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'low',
  `investigated` tinyint(1) NOT NULL DEFAULT '0',
  `investigated_at` timestamp NULL DEFAULT NULL,
  `investigation_notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `security_events_chk_1` CHECK (json_valid(`metadata`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Dumping structure for table eos365-bak.sessions
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Dumping structure for table eos365-bak.skills
CREATE TABLE IF NOT EXISTS `skills` (
  `id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Dumping structure for table eos365-bak.stock_movements
CREATE TABLE IF NOT EXISTS `stock_movements` (
  `id` bigint unsigned NOT NULL,
  `inventory_item_id` bigint unsigned NOT NULL,
  `reference_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_id` bigint unsigned NOT NULL,
  `quantity` decimal(15,2) NOT NULL,
  `from_location_id` bigint unsigned DEFAULT NULL,
  `to_location_id` bigint unsigned DEFAULT NULL,
  `user_id` bigint unsigned NOT NULL,
  `movement_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.stock_movements: 0 rows
/*!40000 ALTER TABLE `stock_movements` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_movements` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.sub_events
CREATE TABLE IF NOT EXISTS `sub_events` (
  `id` bigint unsigned NOT NULL,
  `event_id` bigint unsigned NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `schedule` text COLLATE utf8mb4_unicode_ci,
  `prize_info` text COLLATE utf8mb4_unicode_ci,
  `max_participants` int DEFAULT NULL,
  `joining_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `display_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.sub_events: 0 rows
/*!40000 ALTER TABLE `sub_events` DISABLE KEYS */;
/*!40000 ALTER TABLE `sub_events` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.sub_modules
CREATE TABLE IF NOT EXISTS `sub_modules` (
  `id` bigint unsigned NOT NULL,
  `module_id` bigint unsigned NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Unique identifier within parent module',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `icon` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `route` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Named route for this sub-module',
  `priority` smallint unsigned NOT NULL DEFAULT '100',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `sub_modules_chk_1` CHECK (json_valid(`settings`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.sub_modules: 37 rows
/*!40000 ALTER TABLE `sub_modules` DISABLE KEYS */;
INSERT INTO `sub_modules` (`id`, `module_id`, `code`, `name`, `description`, `icon`, `route`, `priority`, `is_active`, `settings`, `created_at`, `updated_at`, `deleted_at`) VALUES
	(1, 1, 'DASHBOARD', 'Dashboard', 'Main dashboard with overview widgets', 'ChartBarIcon', '/dashboard', 0, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(2, 2, 'MY_ATTENDANCE', 'My Attendance', 'Personal attendance tracking and punch', 'ClockIcon', '/self-service/attendance', 0, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(3, 2, 'MY_LEAVES', 'My Leave Requests', 'Personal leave management', 'CalendarDaysIcon', '/self-service/leaves', 0, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(4, 2, 'MY_PROFILE', 'My Profile', 'Personal profile and password management', 'UserIcon', '/profile', 0, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(5, 3, 'EMPLOYEES', 'Employees', 'Employee management', 'UsersIcon', '/hr/employees', 0, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(6, 3, 'DEPARTMENTS', 'Departments', 'Department management', 'BuildingOfficeIcon', '/hr/departments', 0, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(7, 3, 'DESIGNATIONS', 'Designations', 'Job designation/position management', 'BriefcaseIcon', '/hr/designations', 0, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(8, 3, 'ATTENDANCE', 'Attendance Management', 'Employee attendance tracking and management', 'ClockIcon', '/hr/attendance', 0, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(9, 3, 'HOLIDAYS', 'Holidays', 'Holiday calendar management', 'CalendarIcon', '/hr/holidays', 0, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(10, 3, 'LEAVES', 'Leave Management', 'Employee leave requests and approvals', 'CalendarDaysIcon', '/hr/leaves', 0, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(11, 3, 'LEAVE_SETTINGS', 'Leave Settings', 'Leave types and policies configuration', 'Cog6ToothIcon', '/hr/leave-settings', 0, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(12, 3, 'JURISDICTIONS', 'Jurisdictions', 'Office/Branch location management', 'MapPinIcon', '/hr/jurisdictions', 0, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(13, 4, 'DAILY_WORKS', 'Daily Works', 'Daily work logging and tracking', 'DocumentTextIcon', '/projects/daily-works', 0, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(14, 4, 'PROJECT_ANALYTICS', 'Project Analytics', 'Project performance analytics and dashboards', 'ChartPieIcon', '/projects/analytics', 0, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(15, 4, 'TASKS', 'Tasks', 'Task management and assignment', 'CheckCircleIcon', '/projects/tasks', 0, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(16, 4, 'REPORTS', 'Reports', 'Project reports and documentation', 'DocumentChartBarIcon', '/projects/reports', 0, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(17, 5, 'LETTERS', 'Letters', 'Official letter management', 'EnvelopeIcon', '/dms/letters', 0, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(18, 5, 'DOCUMENTS', 'Documents', 'Document storage and management', 'DocumentIcon', '/dms/documents', 0, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(19, 6, 'CUSTOMERS', 'Customers', 'Customer management', 'UsersIcon', '/crm/customers', 0, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(20, 6, 'LEADS', 'Leads', 'Sales lead management', 'StarIcon', '/crm/leads', 0, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(21, 6, 'FEEDBACK', 'Feedback', 'Customer feedback management', 'ChatBubbleLeftEllipsisIcon', '/crm/feedback', 0, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(22, 7, 'INVENTORY', 'Inventory', 'Inventory management', 'ArchiveBoxIcon', '/scm/inventory', 0, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(23, 7, 'SUPPLIERS', 'Suppliers', 'Supplier management', 'BuildingStorefrontIcon', '/scm/suppliers', 0, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(24, 7, 'PURCHASE_ORDERS', 'Purchase Orders', 'Purchase order management', 'ShoppingCartIcon', '/scm/purchase-orders', 0, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(25, 7, 'WAREHOUSING', 'Warehousing', 'Warehouse management', 'HomeModernIcon', '/scm/warehousing', 0, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(26, 8, 'POS', 'Point of Sale', 'POS terminal operations', 'CurrencyDollarIcon', '/retail/pos', 0, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(27, 8, 'SALES', 'Sales', 'Sales management and analytics', 'PresentationChartLineIcon', '/retail/sales', 0, 1, NULL, '2025-11-27 21:37:50', '2025-11-27 21:37:50', NULL),
	(28, 9, 'ACCOUNTS_PAYABLE', 'Accounts Payable', 'Payables management', 'ArrowUpTrayIcon', '/finance/payables', 0, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51', NULL),
	(29, 9, 'ACCOUNTS_RECEIVABLE', 'Accounts Receivable', 'Receivables management', 'ArrowDownTrayIcon', '/finance/receivables', 0, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51', NULL),
	(30, 9, 'LEDGER', 'General Ledger', 'General ledger management', 'BookOpenIcon', '/finance/ledger', 0, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51', NULL),
	(31, 9, 'FINANCIAL_REPORTS', 'Financial Reports', 'Financial reporting and analytics', 'DocumentChartBarIcon', '/finance/reports', 0, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51', NULL),
	(32, 10, 'USERS', 'User Management', 'System user management', 'UsersIcon', '/admin/users', 0, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51', NULL),
	(33, 10, 'ROLES', 'Roles & Permissions', 'Role and permission management', 'ShieldCheckIcon', '/admin/roles', 0, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51', NULL),
	(34, 10, 'MODULES', 'Module Management', 'Module permission registry management', 'CubeIcon', '/admin/modules', 0, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51', NULL),
	(35, 10, 'SETTINGS', 'System Settings', 'Application settings configuration', 'Cog6ToothIcon', '/admin/settings', 0, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51', NULL),
	(36, 10, 'AUDIT', 'Audit Logs', 'System audit trail and logs', 'ClipboardDocumentListIcon', '/admin/audit', 0, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51', NULL),
	(37, 10, 'BACKUP', 'Backup & Restore', 'System backup management', 'CloudArrowUpIcon', '/admin/backup', 0, 1, NULL, '2025-11-27 21:37:51', '2025-11-27 21:37:51', NULL);
/*!40000 ALTER TABLE `sub_modules` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.suppliers
CREATE TABLE IF NOT EXISTS `suppliers` (
  `id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_person` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zip_code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tax_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `credit_limit` decimal(15,2) DEFAULT NULL,
  `payment_terms_days` int NOT NULL DEFAULT '30',
  `category_id` bigint unsigned DEFAULT NULL,
  `status` enum('active','inactive','blacklisted') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.suppliers: 0 rows
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.supplier_categories
CREATE TABLE IF NOT EXISTS `supplier_categories` (
  `id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.supplier_categories: 0 rows
/*!40000 ALTER TABLE `supplier_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `supplier_categories` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.tasks
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` bigint unsigned NOT NULL,
  `project_id` bigint unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `due_date` date DEFAULT NULL,
  `is_complete` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.tasks: ~0 rows (approximately)

-- Dumping structure for table eos365-bak.tenants
CREATE TABLE IF NOT EXISTS `tenants` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  CONSTRAINT `tenants_chk_1` CHECK (json_valid(`data`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.tenants: 0 rows
/*!40000 ALTER TABLE `tenants` DISABLE KEYS */;
/*!40000 ALTER TABLE `tenants` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.tenant_user_impersonation_tokens
CREATE TABLE IF NOT EXISTS `tenant_user_impersonation_tokens` (
  `token` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `auth_guard` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `redirect_url` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.tenant_user_impersonation_tokens: 0 rows
/*!40000 ALTER TABLE `tenant_user_impersonation_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `tenant_user_impersonation_tokens` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.ticket_activities
CREATE TABLE IF NOT EXISTS `ticket_activities` (
  `id` bigint unsigned NOT NULL,
  `ticket_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `activity_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `properties` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `ticket_activities_chk_1` CHECK (json_valid(`properties`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.ticket_activities: 0 rows
/*!40000 ALTER TABLE `ticket_activities` DISABLE KEYS */;
/*!40000 ALTER TABLE `ticket_activities` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.ticket_comments
CREATE TABLE IF NOT EXISTS `ticket_comments` (
  `id` bigint unsigned NOT NULL,
  `ticket_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_internal` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.ticket_comments: 0 rows
/*!40000 ALTER TABLE `ticket_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `ticket_comments` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.trade_documents
CREATE TABLE IF NOT EXISTS `trade_documents` (
  `id` bigint unsigned NOT NULL,
  `document_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_type` enum('invoice','bill_of_lading','packing_list','certificate_of_origin','customs_declaration','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `trade_transaction_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trade_transaction_id` bigint unsigned NOT NULL,
  `document_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` int DEFAULT NULL,
  `mime_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `issue_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `issued_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('draft','submitted','approved','rejected','expired') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.trade_documents: 0 rows
/*!40000 ALTER TABLE `trade_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `trade_documents` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.training_assignments
CREATE TABLE IF NOT EXISTS `training_assignments` (
  `id` bigint unsigned NOT NULL,
  `session_id` bigint unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `due_date` datetime DEFAULT NULL,
  `max_score` int NOT NULL DEFAULT '100',
  `is_required` tinyint(1) NOT NULL DEFAULT '1',
  `type` enum('quiz','project','reflection','assessment','other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'quiz',
  `instructions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `resources` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `training_assignments_chk_1` CHECK (json_valid(`instructions`)),
  CONSTRAINT `training_assignments_chk_2` CHECK (json_valid(`resources`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.training_assignments: 0 rows
/*!40000 ALTER TABLE `training_assignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `training_assignments` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.training_assignment_submissions
CREATE TABLE IF NOT EXISTS `training_assignment_submissions` (
  `id` bigint unsigned NOT NULL,
  `assignment_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `submission_content` text COLLATE utf8mb4_unicode_ci,
  `submission_files` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `submitted_at` datetime NOT NULL,
  `score` decimal(5,2) DEFAULT NULL,
  `feedback` text COLLATE utf8mb4_unicode_ci,
  `graded_by` bigint unsigned DEFAULT NULL,
  `graded_at` datetime DEFAULT NULL,
  `status` enum('draft','submitted','graded','resubmit') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `training_assignment_submissions_chk_1` CHECK (json_valid(`submission_files`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.training_assignment_submissions: 0 rows
/*!40000 ALTER TABLE `training_assignment_submissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `training_assignment_submissions` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.training_categories
CREATE TABLE IF NOT EXISTS `training_categories` (
  `id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.training_categories: 0 rows
/*!40000 ALTER TABLE `training_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `training_categories` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.training_enrollments
CREATE TABLE IF NOT EXISTS `training_enrollments` (
  `id` bigint unsigned NOT NULL,
  `session_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `status` enum('enrolled','in_progress','completed','failed','withdrawn') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'enrolled',
  `enrollment_date` datetime NOT NULL,
  `completion_date` datetime DEFAULT NULL,
  `score` decimal(5,2) DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `certificate_issued` tinyint(1) NOT NULL DEFAULT '0',
  `certificate_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `progress_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `training_enrollments_chk_1` CHECK (json_valid(`progress_data`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.training_enrollments: 0 rows
/*!40000 ALTER TABLE `training_enrollments` DISABLE KEYS */;
/*!40000 ALTER TABLE `training_enrollments` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.training_feedback
CREATE TABLE IF NOT EXISTS `training_feedback` (
  `id` bigint unsigned NOT NULL,
  `session_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `content_rating` int DEFAULT NULL,
  `instructor_rating` int DEFAULT NULL,
  `materials_rating` int DEFAULT NULL,
  `overall_rating` int DEFAULT NULL,
  `comments` text COLLATE utf8mb4_unicode_ci,
  `responses` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `is_anonymous` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `training_feedback_chk_1` CHECK (json_valid(`responses`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.training_feedback: 0 rows
/*!40000 ALTER TABLE `training_feedback` DISABLE KEYS */;
/*!40000 ALTER TABLE `training_feedback` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.training_materials
CREATE TABLE IF NOT EXISTS `training_materials` (
  `id` bigint unsigned NOT NULL,
  `session_id` bigint unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('document','video','presentation','quiz','link','other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'document',
  `description` text COLLATE utf8mb4_unicode_ci,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `external_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sequence` int NOT NULL DEFAULT '0',
  `is_required` tinyint(1) NOT NULL DEFAULT '1',
  `duration_minutes` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.training_materials: 0 rows
/*!40000 ALTER TABLE `training_materials` DISABLE KEYS */;
/*!40000 ALTER TABLE `training_materials` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.training_sessions
CREATE TABLE IF NOT EXISTS `training_sessions` (
  `id` bigint unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `category_id` bigint unsigned NOT NULL,
  `instructor_id` bigint unsigned DEFAULT NULL,
  `type` enum('online','in_person','hybrid','self_paced') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'online',
  `status` enum('draft','scheduled','in_progress','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meeting_link` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `capacity` int DEFAULT NULL,
  `prerequisite` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration_minutes` int DEFAULT NULL,
  `skills_covered` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `learning_objectives` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `cost` decimal(10,2) DEFAULT NULL,
  `custom_fields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `is_mandatory` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `training_sessions_chk_1` CHECK (json_valid(`skills_covered`)),
  CONSTRAINT `training_sessions_chk_2` CHECK (json_valid(`learning_objectives`)),
  CONSTRAINT `training_sessions_chk_3` CHECK (json_valid(`custom_fields`))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.training_sessions: 0 rows
/*!40000 ALTER TABLE `training_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `training_sessions` ENABLE KEYS */;

-- Dumping structure for table eos365-bak.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint unsigned NOT NULL,
  `employee_id` int DEFAULT NULL,
  `user_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fcm_token` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `about` text COLLATE utf8mb4_unicode_ci,
  `report_to` bigint unsigned DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `two_factor_secret` text COLLATE utf8mb4_unicode_ci,
  `two_factor_recovery_codes` text COLLATE utf8mb4_unicode_ci,
  `two_factor_confirmed_at` timestamp NULL DEFAULT NULL,
  `designation_id` bigint unsigned DEFAULT NULL,
  `nid` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `department_id` bigint unsigned DEFAULT NULL,
  `date_of_joining` date DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  `gender` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `passport_no` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `passport_exp_date` date DEFAULT NULL,
  `nationality` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `religion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `marital_status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employment_of_spouse` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `number_of_children` int DEFAULT NULL,
  `emergency_contact_primary_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergency_contact_primary_relationship` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergency_contact_primary_phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergency_contact_secondary_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergency_contact_secondary_relationship` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergency_contact_secondary_phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_no` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ifsc_code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pan_no` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `family_member_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `family_member_relationship` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `family_member_dob` date DEFAULT NULL,
  `family_member_phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salary_basis` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salary_amount` decimal(10,2) DEFAULT NULL,
  `payment_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pf_contribution` tinyint(1) DEFAULT NULL,
  `pf_no` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employee_pf_rate` int DEFAULT NULL,
  `additional_pf_rate` int DEFAULT NULL,
  `total_pf_rate` int DEFAULT NULL,
  `esi_contribution` tinyint(1) DEFAULT NULL,
  `esi_no` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employee_esi_rate` int DEFAULT NULL,
  `additional_esi_rate` int DEFAULT NULL,
  `total_esi_rate` int DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `single_device_login_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `device_reset_at` timestamp NULL DEFAULT NULL,
  `device_reset_reason` text COLLATE utf8mb4_unicode_ci,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `last_login_ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `login_count` int NOT NULL DEFAULT '0',
  `notification_preferences` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `security_notifications` tinyint(1) NOT NULL DEFAULT '1',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `account_locked_at` timestamp NULL DEFAULT NULL,
  `locked_reason` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `attendance_type_id` bigint unsigned DEFAULT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `preferences` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `security_email_notifications` tinyint(1) NOT NULL DEFAULT '1',
  `security_push_notifications` tinyint(1) NOT NULL DEFAULT '1',
  `security_sms_notifications` tinyint(1) NOT NULL DEFAULT '0',
  `security_alert_threshold` enum('low','medium','high') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `real_time_monitoring` tinyint(1) NOT NULL DEFAULT '1',
  `geo_location_tracking` tinyint(1) NOT NULL DEFAULT '1',
  `device_fingerprinting` tinyint(1) NOT NULL DEFAULT '1',
  `behavioral_analysis` tinyint(1) NOT NULL DEFAULT '1',
  `session_timeout` int NOT NULL DEFAULT '60',
  `backup_2fa_methods` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `last_security_audit` timestamp NULL DEFAULT NULL,
  `security_preferences` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  CONSTRAINT `users_chk_1` CHECK (json_valid(`notification_preferences`)),
  CONSTRAINT `users_chk_2` CHECK (json_valid(`preferences`)),
  CONSTRAINT `users_chk_3` CHECK (json_valid(`backup_2fa_methods`)),
  CONSTRAINT `users_chk_4` CHECK (json_valid(`security_preferences`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.users: ~27 rows (approximately)
INSERT INTO `users` (`id`, `employee_id`, `user_name`, `phone`, `email`, `fcm_token`, `address`, `about`, `report_to`, `password`, `two_factor_secret`, `two_factor_recovery_codes`, `two_factor_confirmed_at`, `designation_id`, `nid`, `name`, `department_id`, `date_of_joining`, `birthday`, `gender`, `passport_no`, `passport_exp_date`, `nationality`, `religion`, `marital_status`, `employment_of_spouse`, `number_of_children`, `emergency_contact_primary_name`, `emergency_contact_primary_relationship`, `emergency_contact_primary_phone`, `emergency_contact_secondary_name`, `emergency_contact_secondary_relationship`, `emergency_contact_secondary_phone`, `bank_name`, `bank_account_no`, `ifsc_code`, `pan_no`, `family_member_name`, `family_member_relationship`, `family_member_dob`, `family_member_phone`, `salary_basis`, `salary_amount`, `payment_type`, `pf_contribution`, `pf_no`, `employee_pf_rate`, `additional_pf_rate`, `total_pf_rate`, `esi_contribution`, `esi_no`, `employee_esi_rate`, `additional_esi_rate`, `total_esi_rate`, `email_verified_at`, `single_device_login_enabled`, `device_reset_at`, `device_reset_reason`, `last_login_at`, `last_login_ip`, `login_count`, `notification_preferences`, `security_notifications`, `is_active`, `account_locked_at`, `locked_reason`, `attendance_type_id`, `remember_token`, `locale`, `created_at`, `updated_at`, `active`, `deleted_at`, `preferences`, `security_email_notifications`, `security_push_notifications`, `security_sms_notifications`, `security_alert_threshold`, `real_time_monitoring`, `geo_location_tracking`, `device_fingerprinting`, `behavioral_analysis`, `session_timeout`, `backup_2fa_methods`, `last_security_audit`, `security_preferences`) VALUES
	(18, 151, 'super_admin', '01610285004', 'super_admin@gmail.com', 'fIA_odiDa_WbMK2DuoCNPP:APA91bF2yDUt-S4CnCxd4uEAem7DoL6i30mrarTuOSOLXja2I6YW8gl3FMXq6RSEZsQlKhb7euptWpcBMiFTPcqbIRHigIqMCf-nzeGAw7xCEqaQE8ciq0A', 'Narayonkul, Pubail, Gazipur, Dhaka, 1721, Banglades', NULL, 1, '$2y$12$Iq43w9/xmURLcCQCGOc0DOFXEfTCCOOpUjANuPWzIVxX7ZSYp5Ooi', NULL, NULL, NULL, 25, '628371828', 'Emam Hosen', 11, '2023-05-01', '1999-09-22', 'Male', 'A121212', NULL, 'Bangladeshi', 'Islam', 'Single', NULL, NULL, 'Someone', 'Some relation', '+880162929292', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Monthly', 36000.00, 'Bank transfer', 0, NULL, 0, 0, 0, 0, NULL, 0, 0, 0, NULL, 0, '2025-09-01 23:12:09', NULL, NULL, NULL, 0, NULL, 1, 1, NULL, NULL, 8, 'UH5s8Lbf6KEjh5zT20QxcZxhJqaixEdEnOKC2RLIIgTun4NAjDbswMNgNZbI', 'en', NULL, '2025-11-27 22:36:03', 1, NULL, NULL, 1, 1, 0, 'medium', 1, 1, 1, 1, 60, NULL, NULL, NULL);

-- Dumping structure for table eos365-bak.user_devices
CREATE TABLE IF NOT EXISTS `user_devices` (
  `id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `device_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `device_token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `device_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `browser` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `platform` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_trusted` tinyint(1) NOT NULL DEFAULT '0',
  `last_used_at` timestamp NULL DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- Dumping structure for table eos365-bak.user_sessions
CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id` bigint unsigned NOT NULL,
  `session_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `device_fingerprint` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_info` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `location_info` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `is_current` tinyint(1) NOT NULL DEFAULT '1',
  `last_activity` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `user_sessions_chk_1` CHECK (json_valid(`device_info`)),
  CONSTRAINT `user_sessions_chk_2` CHECK (json_valid(`location_info`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.user_sessions: ~14 rows (approximately)

-- Dumping structure for table eos365-bak.user_sessions_tracking
CREATE TABLE IF NOT EXISTS `user_sessions_tracking` (
  `id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `session_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `device_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `browser` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `platform` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_fingerprint` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `last_activity` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `login_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `logout_at` timestamp NULL DEFAULT NULL,
  `logout_type` enum('manual','timeout','forced','admin') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `security_flags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `user_sessions_tracking_chk_1` CHECK (json_valid(`device_fingerprint`)),
  CONSTRAINT `user_sessions_tracking_chk_2` CHECK (json_valid(`security_flags`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table eos365-bak.user_sessions_tracking: ~0 rows (approximately)

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
