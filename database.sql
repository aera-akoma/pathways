-- ========================================================
-- PODAR PATHWAYS - MySQL DATABASE IMPORT SCRIPT
-- Target: cPanel phpMyAdmin / MySQL 5.7+ / MariaDB 10.3+
-- Engine: InnoDB | Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ========================================================
--
-- INSTRUCTIONS FOR cPanel phpMyAdmin:
-- 1. In cPanel, go to "MySQL Databases" and create a database (e.g. youruser_pathways).
-- 2. Create a MySQL user, set a strong password, and add the user to the database with ALL PRIVILEGES.
-- 3. Open "phpMyAdmin" from cPanel.
-- 4. In the LEFT sidebar, click on your database name to select it.
-- 5. Click the "Import" tab at the top.
-- 6. Click "Choose File", select this "database.sql" file, and click "Import" (or "Go").
-- 7. Done! All tables, indexes, and initial admin/system records are created cleanly.
--
-- DEFAULT ADMINISTRATOR CREDENTIALS:
-- Email: jatp22316@gmail.com   | Password: Admin@123 | 2FA: email code (or 123456 on localhost)
-- Email: admin@podar.edu        | Password: Admin@123 | 2FA: email code (or 123456 on localhost)
-- ========================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- Table structure for: students
-- --------------------------------------------------------
DROP TABLE IF EXISTS `students`;
CREATE TABLE `students` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `fathersName` VARCHAR(150) DEFAULT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `course` VARCHAR(100) NOT NULL,
  `semester` VARCHAR(20) NOT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `passwordHash` VARCHAR(255) DEFAULT NULL,
  `salt` VARCHAR(64) DEFAULT NULL,
  `linkedin` VARCHAR(255) DEFAULT NULL,
  `github` VARCHAR(255) DEFAULT NULL,
  `skills` TEXT DEFAULT NULL,
  `goal` VARCHAR(255) DEFAULT NULL,
  `score` INT DEFAULT 0,
  `completion` INT DEFAULT 28,
  `applications` INT DEFAULT 0,
  `projects` INT DEFAULT 0,
  `certificates` INT DEFAULT 0,
  `avatar` MEDIUMTEXT DEFAULT NULL,
  `bio` TEXT DEFAULT NULL,
  `portfolio` VARCHAR(255) DEFAULT NULL,
  `gender` VARCHAR(20) DEFAULT NULL,
  `houseNo` VARCHAR(255) DEFAULT NULL,
  `district` VARCHAR(100) DEFAULT NULL,
  `state` VARCHAR(100) DEFAULT NULL,
  `pinCode` VARCHAR(6) DEFAULT NULL,
  `dob` DATE DEFAULT NULL,
  `profileCompletedAt` DATETIME DEFAULT NULL,
  `rollNo` VARCHAR(50) DEFAULT NULL,
  `graduationYear` VARCHAR(20) DEFAULT NULL,
  `jobType` VARCHAR(100) DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `softSkills` TEXT DEFAULT NULL,
  `resumeUrl` TEXT DEFAULT NULL,
  `addedByAdmin` TINYINT(1) DEFAULT 1,
  `isRegistered` TINYINT(1) DEFAULT 0,
  `status` ENUM('active', 'suspended', 'pending') DEFAULT 'active',
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_students_phone` (`phone`),
  UNIQUE KEY `idx_students_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for: admins
-- --------------------------------------------------------
DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `passwordHash` VARCHAR(255) DEFAULT NULL,
  `salt` VARCHAR(64) DEFAULT NULL,
  `role` VARCHAR(50) DEFAULT 'Admin',
  `department` VARCHAR(100) DEFAULT 'Career & Placement Cell',
  `permissions` TEXT DEFAULT NULL,
  `avatar` MEDIUMTEXT DEFAULT NULL,
  `status` ENUM('active', 'suspended') DEFAULT 'active',
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_admins_phone` (`phone`),
  UNIQUE KEY `idx_admins_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for: email_otps
-- --------------------------------------------------------
DROP TABLE IF EXISTS `email_otps`;
CREATE TABLE `email_otps` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `code` VARCHAR(10) NOT NULL,
  `role` VARCHAR(30) DEFAULT 'student',
  `purpose` VARCHAR(50) NOT NULL,
  `payload` TEXT DEFAULT NULL,
  `createdAt` BIGINT NOT NULL,
  `expiresAt` BIGINT NOT NULL,
  `isUsed` TINYINT(1) DEFAULT 0,
  `attempts` INT DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_otps_email_purpose` (`email`, `purpose`),
  KEY `idx_otps_expires` (`expiresAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for: notifications
-- --------------------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` VARCHAR(64) NOT NULL,
  `studentId` VARCHAR(64) DEFAULT 'all',
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `type` VARCHAR(50) DEFAULT 'program',
  `programId` VARCHAR(64) DEFAULT NULL,
  `isRead` TINYINT(1) DEFAULT 0,
  `createdAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_student` (`studentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for: settings
-- --------------------------------------------------------
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` TEXT NOT NULL,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
-- Table structure for: programs
-- --------------------------------------------------------
DROP TABLE IF EXISTS `programs`;
CREATE TABLE `programs` (
  `id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `issuer` VARCHAR(150) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `link` VARCHAR(500) NOT NULL,
  `bannerImg` LONGTEXT DEFAULT NULL,
  `targetCourse` VARCHAR(100) DEFAULT 'All',
  `targetSemester` VARCHAR(20) DEFAULT 'All',
  `deadline` VARCHAR(50) DEFAULT '2026-12-31',
  `rewardPoints` INT DEFAULT 15,
  `status` ENUM('active', 'archived') DEFAULT 'active',
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_programs_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for: program_clicks
-- --------------------------------------------------------
DROP TABLE IF EXISTS `program_clicks`;
CREATE TABLE `program_clicks` (
  `id` VARCHAR(64) NOT NULL,
  `programId` VARCHAR(64) NOT NULL,
  `studentId` VARCHAR(64) NOT NULL,
  `studentName` VARCHAR(150) NOT NULL,
  `studentPhone` VARCHAR(20) DEFAULT NULL,
  `clickedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_clicks_program` (`programId`),
  KEY `idx_clicks_student` (`studentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for: tests
-- --------------------------------------------------------
DROP TABLE IF EXISTS `tests`;
CREATE TABLE `tests` (
  `id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) DEFAULT 'Technical',
  `description` TEXT DEFAULT NULL,
  `targetCourse` VARCHAR(100) DEFAULT 'All',
  `targetSemester` VARCHAR(20) DEFAULT 'All',
  `durationMinutes` INT DEFAULT 20,
  `totalMarks` INT DEFAULT 100,
  `passingMarks` INT DEFAULT 40,
  `rewardPoints` INT DEFAULT 15,
  `status` ENUM('active', 'inactive', 'draft') DEFAULT 'active',
  `questions` LONGTEXT NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tests_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for: test_submissions
-- --------------------------------------------------------
DROP TABLE IF EXISTS `test_submissions`;
CREATE TABLE `test_submissions` (
  `id` VARCHAR(64) NOT NULL,
  `testId` VARCHAR(64) NOT NULL,
  `testTitle` VARCHAR(255) NOT NULL,
  `studentId` VARCHAR(64) NOT NULL,
  `studentName` VARCHAR(150) NOT NULL,
  `studentPhone` VARCHAR(20) DEFAULT NULL,
  `studentCourse` VARCHAR(100) DEFAULT NULL,
  `studentSemester` VARCHAR(20) DEFAULT NULL,
  `score` INT NOT NULL,
  `totalMarks` INT NOT NULL,
  `percentage` INT NOT NULL,
  `status` VARCHAR(50) NOT NULL,
  `timeSpentSeconds` INT DEFAULT 0,
  `answers` LONGTEXT NOT NULL,
  `adminRemarks` TEXT DEFAULT NULL,
  `submittedAt` DATETIME NOT NULL,
  `checkedAt` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sub_test` (`testId`),
  KEY `idx_sub_student` (`studentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for: schedules
-- --------------------------------------------------------
DROP TABLE IF EXISTS `schedules`;
CREATE TABLE `schedules` (
  `id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) DEFAULT 'Lecture',
  `date` VARCHAR(50) NOT NULL,
  `startTime` VARCHAR(20) DEFAULT NULL,
  `endTime` VARCHAR(20) DEFAULT NULL,
  `location` VARCHAR(255) DEFAULT NULL,
  `meetLink` VARCHAR(500) DEFAULT NULL,
  `targetCourse` VARCHAR(100) DEFAULT 'All',
  `targetSemester` VARCHAR(20) DEFAULT 'All',
  `instructor` VARCHAR(150) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `isMandatory` TINYINT(1) DEFAULT 0,
  `createdBy` VARCHAR(100) DEFAULT 'Admin',
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_schedules_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for: attendance
-- --------------------------------------------------------
DROP TABLE IF EXISTS `attendance`;
CREATE TABLE `attendance` (
  `id` VARCHAR(64) NOT NULL,
  `scheduleId` VARCHAR(64) NOT NULL,
  `studentId` VARCHAR(64) NOT NULL,
  `studentName` VARCHAR(150) DEFAULT NULL,
  `course` VARCHAR(100) DEFAULT NULL,
  `semester` VARCHAR(20) DEFAULT NULL,
  `status` ENUM('Present', 'Absent', 'Late', 'Excused') NOT NULL,
  `markedAt` DATETIME NOT NULL,
  `markedBy` VARCHAR(100) DEFAULT 'Admin',
  `remarks` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_schedule_student_att` (`scheduleId`, `studentId`),
  KEY `idx_att_schedule` (`scheduleId`),
  KEY `idx_att_student` (`studentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- SEED INITIAL DATA
-- ========================================================

-- Seed Project Categories
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

-- Initial System Settings
INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES
('adminPhone', '9000000000'),
('systemName', 'Podar Pathways'),
('senderEmail', 'noreply@podarpathways.com')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);

-- Default Administrators (Password: Admin@123)
-- bcrypt hash: $2y$10$CKdJkUO1NCx31f/10GhlvOfoHzgSxkFLgcmcjNLFdvRAi4bmjxsX6
INSERT INTO `admins` (`id`, `name`, `phone`, `email`, `passwordHash`, `role`, `department`, `permissions`, `status`, `createdAt`, `updatedAt`) VALUES
('admin-jatp-main', 'Main Administrator', '9000000000', 'jatp22316@gmail.com', '$2y$10$CKdJkUO1NCx31f/10GhlvOfoHzgSxkFLgcmcjNLFdvRAi4bmjxsX6', 'Super Admin', 'Executive Governance Desk', '["all","manage_students","manage_courses","manage_certificates","manage_opportunities","manage_internships","manage_placements","manage_admins"]', 'active', NOW(), NOW()),
('admin-root', 'Podar Administrator', '9999988888', 'admin@podar.edu', '$2y$10$CKdJkUO1NCx31f/10GhlvOfoHzgSxkFLgcmcjNLFdvRAi4bmjxsX6', 'Super Admin', 'Career & Placement Cell', '["all","manage_students","manage_courses","manage_certificates","manage_opportunities","manage_internships","manage_placements","manage_admins"]', 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `passwordHash` = VALUES(`passwordHash`);

-- Sample Programs / Recommended Courses
INSERT INTO `programs` (`id`, `title`, `issuer`, `description`, `link`, `bannerImg`, `targetCourse`, `targetSemester`, `deadline`, `rewardPoints`, `status`, `createdAt`, `updatedAt`) VALUES
('prog-aws-01', 'AWS Cloud Practitioner Certification Program', 'Amazon Web Services (AWS)', 'Comprehensive foundation covering cloud compute, AWS Lambda, S3, IAM security protocols, and architecture best practices.', 'https://aws.amazon.com/certification/certified-cloud-practitioner/', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop', 'All', 'All', '2026-12-31', 25, 'active', NOW(), NOW()),
('prog-meta-02', 'Meta Front-End Developer Professional Certificate', 'Meta', 'Industry-standard frontend curriculum covering React 19, JavaScript ES6+, UI UX principles, and modern client architecture.', 'https://www.coursera.org/professional-certificates/meta-front-end-developer', 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=1000&auto=format&fit=crop', 'All', 'All', '2026-12-31', 20, 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- Sample Schedules & Workshops
INSERT INTO `schedules` (`id`, `title`, `category`, `date`, `startTime`, `endTime`, `location`, `meetLink`, `targetCourse`, `targetSemester`, `instructor`, `description`, `isMandatory`, `createdBy`, `createdAt`, `updatedAt`) VALUES
('sch-01', 'Campus Placement Drive: Barclays & Deloitte Orientation', 'Placement', '2026-11-05', '10:00 AM', '11:30 AM', 'Main Auditorium & Online Stream', 'https://meet.google.com/podar-campus-drive-2026', 'All', 'All', 'Dr. Radhika Desai (Placement Director)', 'Comprehensive orientation detailing campus recruitment rounds, online technical assessments, and interview prep.', 1, 'Admin', NOW(), NOW()),
('sch-02', 'Hands-on Workshop: Building Production Full-Stack React Apps', 'Workshop', '2026-11-12', '02:00 PM', '04:30 PM', 'Computer Lab 3 & Online Meet', 'https://meet.google.com/podar-react-workshop', 'BCA', 'All', 'Prof. Sameer Kulkarni', 'Interactive coding masterclass covering React 19 hooks, state machines, and real-time backend API integration.', 0, 'Admin', NOW(), NOW())
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
