-- ========================================================
-- PODAR PATHWAYS - CERTIFICATES DATABASE IMPORT SCRIPT
-- Target: cPanel phpMyAdmin / MySQL 5.7+ / MariaDB 10.3+
-- Database: mpoda209_certificates (or your certificates DB)
-- Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ========================================================
--
-- INSTRUCTIONS FOR cPanel phpMyAdmin:
-- 1. In cPanel, click "phpMyAdmin".
-- 2. In the LEFT sidebar, click on your certificates database (e.g. mpoda209_certificates).
-- 3. Click the "Import" tab at the top.
-- 4. Choose this file ("certificates_database.sql") and click "Import" (or "Go").
-- 5. Done! The certificates table is ready.
-- ========================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- Table structure for: certificates
-- --------------------------------------------------------
DROP TABLE IF EXISTS `certificates`;
CREATE TABLE `certificates` (
  `id` VARCHAR(64) NOT NULL,
  `programTitle` VARCHAR(255) NOT NULL,
  `studentName` VARCHAR(150) NOT NULL,
  `certificateImg` LONGTEXT DEFAULT NULL,
  `verifiedBy` VARCHAR(150) DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'pending',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cert_student` (`studentName`),
  KEY `idx_cert_status` (`status`),
  KEY `idx_cert_created` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Seed Sample Verified Certificate
-- --------------------------------------------------------
INSERT INTO `certificates` (`id`, `programTitle`, `studentName`, `certificateImg`, `verifiedBy`, `status`, `createdAt`) VALUES
('cert-sample-01', 'Career Readiness Foundations', 'Student', NULL, 'Podar Academic Board', 'verified', NOW())
ON DUPLICATE KEY UPDATE `programTitle` = VALUES(`programTitle`);

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
