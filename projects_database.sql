-- ========================================================
-- PODAR PATHWAYS - PROJECTS PLATFORM DATABASE IMPORT SCRIPT
-- Target: cPanel phpMyAdmin / MySQL 5.7+ / MariaDB 10.3+
-- Database: mpoda209_projects (or your projects DB)
-- Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ========================================================
--
-- INSTRUCTIONS FOR cPanel phpMyAdmin:
-- 1. In cPanel, click "phpMyAdmin".
-- 2. In the LEFT sidebar, click on your projects database (e.g. mpoda209_projects).
-- 3. Click the "Import" tab at the top.
-- 4. Choose this file ("projects_database.sql") and click "Import" (or "Go").
-- 5. Done! All project showcase, categories, likes, comments, and bookmark tables are ready.
-- ========================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- Table structure for: project_categories
-- --------------------------------------------------------
DROP TABLE IF EXISTS `project_categories`;
CREATE TABLE `project_categories` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) DEFAULT NULL,
  `icon` VARCHAR(50) DEFAULT 'Code',
  `color` VARCHAR(30) DEFAULT '#0d9488',
  `orderIndex` INT DEFAULT 0,
  `createdAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_cat_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for: project_posts
-- --------------------------------------------------------
DROP TABLE IF EXISTS `project_posts`;
CREATE TABLE `project_posts` (
  `id` VARCHAR(64) NOT NULL,
  `studentId` VARCHAR(64) NOT NULL,
  `studentName` VARCHAR(150) NOT NULL,
  `studentAvatar` MEDIUMTEXT DEFAULT NULL,
  `studentCourse` VARCHAR(100) DEFAULT 'BCA',
  `studentSemester` VARCHAR(20) DEFAULT 'V',
  `title` VARCHAR(255) NOT NULL,
  `description` LONGTEXT NOT NULL,
  `category` VARCHAR(100) DEFAULT 'Web Development',
  `demoUrl` VARCHAR(500) DEFAULT NULL,
  `githubUrl` VARCHAR(500) DEFAULT NULL,
  `youtubeUrl` VARCHAR(500) DEFAULT NULL,
  `tags` TEXT DEFAULT NULL,
  `likesCount` INT DEFAULT 0,
  `commentsCount` INT DEFAULT 0,
  `status` ENUM('active', 'reported', 'hidden') DEFAULT 'active',
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_project_student` (`studentId`),
  KEY `idx_project_category` (`category`),
  KEY `idx_project_status` (`status`),
  KEY `idx_project_created` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for: project_images
-- --------------------------------------------------------
DROP TABLE IF EXISTS `project_images`;
CREATE TABLE `project_images` (
  `id` VARCHAR(64) NOT NULL,
  `postId` VARCHAR(64) NOT NULL,
  `imageUrl` LONGTEXT NOT NULL,
  `caption` VARCHAR(255) DEFAULT NULL,
  `orderIndex` INT DEFAULT 0,
  `createdAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_project_images_post` (`postId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for: project_likes
-- --------------------------------------------------------
DROP TABLE IF EXISTS `project_likes`;
CREATE TABLE `project_likes` (
  `id` VARCHAR(64) NOT NULL,
  `postId` VARCHAR(64) NOT NULL,
  `studentId` VARCHAR(64) NOT NULL,
  `createdAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_post_student_like` (`postId`, `studentId`),
  KEY `idx_likes_post` (`postId`),
  KEY `idx_likes_student` (`studentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for: project_comments
-- --------------------------------------------------------
DROP TABLE IF EXISTS `project_comments`;
CREATE TABLE `project_comments` (
  `id` VARCHAR(64) NOT NULL,
  `postId` VARCHAR(64) NOT NULL,
  `parentId` VARCHAR(64) DEFAULT NULL,
  `studentId` VARCHAR(64) NOT NULL,
  `studentName` VARCHAR(150) NOT NULL,
  `studentAvatar` MEDIUMTEXT DEFAULT NULL,
  `content` TEXT NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_comments_post` (`postId`),
  KEY `idx_comments_parent` (`parentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for: project_bookmarks
-- --------------------------------------------------------
DROP TABLE IF EXISTS `project_bookmarks`;
CREATE TABLE `project_bookmarks` (
  `id` VARCHAR(64) NOT NULL,
  `postId` VARCHAR(64) NOT NULL,
  `studentId` VARCHAR(64) NOT NULL,
  `createdAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_post_student_bookmark` (`postId`, `studentId`),
  KEY `idx_bookmarks_student` (`studentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for: project_reports
-- --------------------------------------------------------
DROP TABLE IF EXISTS `project_reports`;
CREATE TABLE `project_reports` (
  `id` VARCHAR(64) NOT NULL,
  `postId` VARCHAR(64) NOT NULL,
  `reporterId` VARCHAR(64) NOT NULL,
  `reporterName` VARCHAR(150) NOT NULL,
  `reason` VARCHAR(255) NOT NULL,
  `details` TEXT DEFAULT NULL,
  `status` ENUM('pending', 'reviewed', 'dismissed') DEFAULT 'pending',
  `createdAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_reports_post` (`postId`),
  KEY `idx_reports_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for: project_notifications
-- --------------------------------------------------------
DROP TABLE IF EXISTS `project_notifications`;
CREATE TABLE `project_notifications` (
  `id` VARCHAR(64) NOT NULL,
  `studentId` VARCHAR(64) NOT NULL,
  `actorId` VARCHAR(64) NOT NULL,
  `actorName` VARCHAR(150) NOT NULL,
  `actorAvatar` MEDIUMTEXT DEFAULT NULL,
  `postId` VARCHAR(64) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `message` TEXT NOT NULL,
  `isRead` TINYINT(1) DEFAULT 0,
  `createdAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pnotif_student` (`studentId`),
  KEY `idx_pnotif_read` (`isRead`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Seed Default Categories
-- --------------------------------------------------------
INSERT INTO `project_categories` (`id`, `name`, `slug`, `icon`, `color`, `orderIndex`, `createdAt`) VALUES
('cat-1', 'Web Development', 'web-development', 'Globe', '#0d9488', 1, NOW()),
('cat-2', 'Android Development', 'android-development', 'Smartphone', '#10b981', 2, NOW()),
('cat-3', 'Artificial Intelligence', 'artificial-intelligence', 'Cpu', '#8b5cf6', 3, NOW()),
('cat-4', 'Machine Learning', 'machine-learning', 'Brain', '#6366f1', 4, NOW()),
('cat-5', 'Python', 'python', 'Terminal', '#f59e0b', 5, NOW()),
('cat-6', 'Java', 'java', 'Coffee', '#ef4444', 6, NOW()),
('cat-7', 'C and C++', 'c-and-cpp', 'Code', '#3b82f6', 7, NOW()),
('cat-8', 'Cybersecurity', 'cybersecurity', 'Shield', '#06b6d4', 8, NOW()),
('cat-9', 'Database Management', 'database-management', 'Database', '#14b8a6', 9, NOW()),
('cat-10', 'Graphic Design', 'graphic-design', 'Palette', '#ec4899', 10, NOW()),
('cat-11', 'Business Projects', 'business-projects', 'Briefcase', '#f97316', 11, NOW()),
('cat-12', 'Marketing', 'marketing', 'TrendingUp', '#84cc16', 12, NOW()),
('cat-13', 'Entrepreneurship', 'entrepreneurship', 'Rocket', '#a855f7', 13, NOW()),
('cat-14', 'Other', 'other', 'Folder', '#64748b', 14, NOW())
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
