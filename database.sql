-- ========================================================
-- Podar Pathways - MySQL Database Schema
-- Target: cPanel Ultimate Hosting (MySQL / MariaDB)
-- Character Set: utf8mb4 / Engine: InnoDB
-- ========================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- Table structure for: students
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `students` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `fathersName` VARCHAR(150) DEFAULT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `course` VARCHAR(100) NOT NULL,
  `semester` VARCHAR(20) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `passwordHash` VARCHAR(255) DEFAULT NULL,
  `salt` VARCHAR(64) DEFAULT NULL,
  `linkedin` VARCHAR(255) DEFAULT NULL,
  `github` VARCHAR(255) DEFAULT NULL,
  `skills` TEXT DEFAULT NULL,
  `goal` VARCHAR(255) DEFAULT NULL,
  `score` INT DEFAULT 35,
  `completion` INT DEFAULT 28,
  `applications` INT DEFAULT 0,
  `projects` INT DEFAULT 0,
  `certificates` INT DEFAULT 0,
  `avatar` MEDIUMTEXT DEFAULT NULL,
  `bio` TEXT DEFAULT NULL,
  `portfolio` VARCHAR(255) DEFAULT NULL,
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
CREATE TABLE IF NOT EXISTS `admins` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `passwordHash` VARCHAR(255) DEFAULT NULL,
  `salt` VARCHAR(64) DEFAULT NULL,
  `role` VARCHAR(50) DEFAULT 'Admin',
  `department` VARCHAR(100) DEFAULT 'Career & Placement Cell',
  `permissions` TEXT NOT NULL,
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
CREATE TABLE IF NOT EXISTS `email_otps` (
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
CREATE TABLE IF NOT EXISTS `certificates` (
  `id` VARCHAR(64) NOT NULL,
  `programId` VARCHAR(64) DEFAULT NULL,
  `programTitle` VARCHAR(255) NOT NULL,
  `studentId` VARCHAR(64) NOT NULL,
  `studentName` VARCHAR(150) NOT NULL,
  `studentPhone` VARCHAR(20) NOT NULL,
  `credentialId` VARCHAR(100) DEFAULT NULL,
  `issueDate` VARCHAR(50) DEFAULT NULL,
  `fileData` MEDIUMTEXT DEFAULT NULL,
  `fileName` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  `adminRemarks` TEXT DEFAULT NULL,
  `verifiedBy` VARCHAR(150) DEFAULT NULL,
  `verificationCode` VARCHAR(50) DEFAULT NULL,
  `verifiedAt` DATETIME DEFAULT NULL,
  `submittedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_certs_student` (`studentId`),
  KEY `idx_certs_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for: notifications
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
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
CREATE TABLE IF NOT EXISTS `settings` (
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` TEXT NOT NULL,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for: project_categories
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `project_categories` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `icon` VARCHAR(50) DEFAULT 'Code',
  `orderIndex` INT DEFAULT 0,
  `createdAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_cat_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for: project_posts
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `project_posts` (
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
CREATE TABLE IF NOT EXISTS `project_images` (
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
CREATE TABLE IF NOT EXISTS `project_likes` (
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
CREATE TABLE IF NOT EXISTS `project_comments` (
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
CREATE TABLE IF NOT EXISTS `project_bookmarks` (
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
CREATE TABLE IF NOT EXISTS `project_reports` (
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
CREATE TABLE IF NOT EXISTS `project_notifications` (
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
CREATE TABLE IF NOT EXISTS `programs` (
  `id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `issuer` VARCHAR(150) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `link` VARCHAR(500) NOT NULL,
  `bannerImg` TEXT DEFAULT NULL,
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
CREATE TABLE IF NOT EXISTS `program_clicks` (
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
CREATE TABLE IF NOT EXISTS `tests` (
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
CREATE TABLE IF NOT EXISTS `test_submissions` (
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
CREATE TABLE IF NOT EXISTS `schedules` (
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
CREATE TABLE IF NOT EXISTS `attendance` (
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

-- Seed Default Categories
INSERT INTO `project_categories` (`id`, `name`, `icon`, `orderIndex`, `createdAt`) VALUES
('cat-1', 'Web Development', 'Globe', 1, NOW()),
('cat-2', 'Android Development', 'Smartphone', 2, NOW()),
('cat-3', 'Artificial Intelligence', 'Cpu', 3, NOW()),
('cat-4', 'Machine Learning', 'Brain', 4, NOW()),
('cat-5', 'Python', 'Terminal', 5, NOW()),
('cat-6', 'Java', 'Coffee', 6, NOW()),
('cat-7', 'C and C++', 'Code', 7, NOW()),
('cat-8', 'Cybersecurity', 'Shield', 8, NOW()),
('cat-9', 'Database Management', 'Database', 9, NOW()),
('cat-10', 'Graphic Design', 'Palette', 10, NOW()),
('cat-11', 'Business Projects', 'Briefcase', 11, NOW()),
('cat-12', 'Marketing', 'TrendingUp', 12, NOW()),
('cat-13', 'Entrepreneurship', 'Rocket', 13, NOW()),
('cat-14', 'Other', 'Folder', 14, NOW())
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- ========================================================
-- SEED INITIAL DATA
-- ========================================================

-- Initial System Settings
INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES
('adminPhone', '9876543210'),
('systemName', 'Podar Pathways'),
('senderEmail', 'noreply@podarpathways.com')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);

-- Default Administrator (Password: Admin@123)
INSERT INTO `admins` (`id`, `name`, `phone`, `email`, `passwordHash`, `role`, `department`, `permissions`, `status`, `createdAt`, `updatedAt`) VALUES
('admin-jatp-main', 'Main Administrator', '9000000000', 'jatp22316@gmail.com', NULL, 'Super Admin', 'Executive Governance Desk', '["all","manage_students","manage_courses","manage_certificates","manage_opportunities","manage_internships","manage_placements","manage_admins"]', 'active', NOW(), NOW()),
('admin-root', 'Podar Administrator', '9999988888', 'admin@podar.edu', NULL, 'Super Admin', 'Career & Placement Cell', '["all","students","courses","certificates","settings"]', 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

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

