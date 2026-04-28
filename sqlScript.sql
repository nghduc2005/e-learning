CREATE TABLE IF NOT EXISTS `curriculums` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `courses` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `curriculumId` INT UNSIGNED DEFAULT NULL,
    `description` TEXT DEFAULT NULL,
    `status` ENUM('hidden', 'active', 'locked', 'deleted') NOT NULL DEFAULT 'hidden',
    `banner` VARCHAR(255) DEFAULT NULL,
    `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    `deletedAt` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_name` (`name`),
    INDEX `idx_status` (`status`),
    CONSTRAINT `fk_course_curriculum` 
        FOREIGN KEY (`curriculumId`) 
        REFERENCES `curriculums`(`id`) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `units` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `status` ENUM('hidden', 'locked', 'active') NOT NULL DEFAULT 'hidden',
    `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    `deletedAt` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `curriculum_units` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `curriculumId` INT UNSIGNED NOT NULL,
    `unitId` INT UNSIGNED NOT NULL,
    `position` INT NOT NULL DEFAULT 0,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_curriculum_unit` (`curriculumId`, `unitId`),
    CONSTRAINT `fk_pivot_curriculum`
        FOREIGN KEY (`curriculumId`)
        REFERENCES `curriculums` (`id`)
        ON DELETE CASCADE,
    CONSTRAINT `fk_pivot_unit`
        FOREIGN KEY (`unitId`)
        REFERENCES `units` (`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lessons` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `learnMode` ENUM('article', 'video') NOT NULL DEFAULT 'video',
    `status` ENUM('hidden', 'locked', 'active') NOT NULL DEFAULT 'hidden',
    `passScore` INT UNSIGNED DEFAULT 0,
    `document` VARCHAR(255) DEFAULT NULL,
    `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    `deletedAt` TIMESTAMP NULL DEFAULT NULL,
	CONSTRAINT `chk_pass_score_range` CHECK (`passScore` BETWEEN 0 AND 100),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_lesson_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lesson_documents` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `lessonId` INT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,    -- Tên file hiển thị (ví dụ: Bai_tap_JS.pdf)
    `url` VARCHAR(500) NOT NULL,     -- Link file (Cloudinary, S3, v.v.)
    `fileType` VARCHAR(50) DEFAULT NULL, -- Loại file (pdf, docx, zip...)
    `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    INDEX `idx_lesson_document` (`lessonId`),
    CONSTRAINT `fk_document_lesson`
        FOREIGN KEY (`lessonId`)
        REFERENCES `lessons` (`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `unit_lessons` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `curriculumId` INT UNSIGNED NOT NULL,
    `unitId` INT UNSIGNED NOT NULL,
    `lessonId` INT UNSIGNED NOT NULL,
    `position` INT NOT NULL DEFAULT 0,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_curr_lesson` (`curriculumId`, `lessonId`), -- một bài 1 chương trình học
    INDEX `idx_curriculum_unit` (`curriculumId`, `unitId`),
    CONSTRAINT `fk_pivot_curriculum_id`
        FOREIGN KEY (`curriculumId`)
        REFERENCES `curriculums` (`id`)
        ON DELETE CASCADE,
    CONSTRAINT `fk_pivot_unit_id`
        FOREIGN KEY (`unitId`)
        REFERENCES `units` (`id`)
        ON DELETE CASCADE,
    CONSTRAINT `fk_pivot_lesson_id`
        FOREIGN KEY (`lessonId`)
        REFERENCES `lessons` (`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `questions` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `lessonId` INT UNSIGNED NOT NULL,
    `question` TEXT NOT NULL,
    `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_question_lesson`
        FOREIGN KEY (`lessonId`)
        REFERENCES `lessons` (`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `answers` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `questionId` INT UNSIGNED NOT NULL,
    `answer` TEXT NOT NULL,
    `isCorrect` TINYINT(1) NOT NULL DEFAULT 0, -- dúng 1 sai 0
    `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_answer_question`
        FOREIGN KEY (`questionId`)
        REFERENCES `questions` (`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `avatar` VARCHAR(255) DEFAULT NULL,
    `status` ENUM('active', 'banned', 'unverified') NOT NULL DEFAULT 'unverified',
    `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reviews` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `courseId` INT UNSIGNED NOT NULL,
    `userId` INT UNSIGNED NOT NULL,
    `content` TEXT DEFAULT NULL,
    `ratingNum` TINYINT UNSIGNED NOT NULL,
    `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    CONSTRAINT `chk_rating` CHECK (`ratingNum` BETWEEN 1 AND 5),
	CONSTRAINT `fk_review_user`
		FOREIGN KEY (`userId`)
		REFERENCES `users` (`id`)
		ON DELETE CASCADE,
    CONSTRAINT `fk_review_course`
        FOREIGN KEY (`courseId`)
        REFERENCES `courses` (`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `comments` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `userId` INT UNSIGNED NOT NULL,
    `lessonId` INT UNSIGNED NOT NULL,
    `parentId` INT UNSIGNED DEFAULT NULL,
    `content` TEXT NOT NULL,
    `isDeleted` TINYINT(1) NOT NULL DEFAULT 0,
    `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    CONSTRAINT `fk_comment_parent`
        FOREIGN KEY (`parentId`)
        REFERENCES `comments` (`id`)
        ON DELETE CASCADE,
    CONSTRAINT `fk_comment_user`
        FOREIGN KEY (`userId`)
        REFERENCES `users` (`id`)
        ON DELETE CASCADE,
    CONSTRAINT `fk_comment_lesson`
        FOREIGN KEY (`lessonId`)
        REFERENCES `lessons` (`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `enrollments` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `userId` INT UNSIGNED NOT NULL,
    `courseId` INT UNSIGNED NOT NULL,
    `status` ENUM('active', 'cancel') NOT NULL DEFAULT 'active',
    `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_course_enroll` (`userId`, `courseId`),
    CONSTRAINT `fk_enroll_user`
        FOREIGN KEY (`userId`)
        REFERENCES `users` (`id`)
        ON DELETE CASCADE,
    CONSTRAINT `fk_enroll_course`
        FOREIGN KEY (`courseId`)
        REFERENCES `courses` (`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `report_comments` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `commentId` INT UNSIGNED NOT NULL,
    `reporterId` INT UNSIGNED NOT NULL,
    `reason` TEXT NOT NULL,
    `status` ENUM('pending', 'accept', 'reject') NOT NULL DEFAULT 'pending',
    `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_report_comment_id`
        FOREIGN KEY (`commentId`)
        REFERENCES `comments` (`id`)
        ON DELETE CASCADE,
    CONSTRAINT `fk_report_reporter_id`
        FOREIGN KEY (`reporterId`)
        REFERENCES `users` (`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `admins` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `status` ENUM('active', 'banned') NOT NULL DEFAULT 'active',
    `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_admin_username` (`username`),
    UNIQUE KEY `uk_admin_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `email_verifications` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `userId` INT UNSIGNED NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `isUsed` TINYINT(1) NOT NULL DEFAULT 0,
    `expiredAt` TIMESTAMP NOT NULL,
    `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_token` (`token`),
    INDEX `idx_user_token` (`userId`),

    CONSTRAINT `fk_email_verify_user`
        FOREIGN KEY (`userId`)
        REFERENCES `users` (`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `password_resets` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `userId` INT UNSIGNED NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `isUsed` TINYINT(1) NOT NULL DEFAULT 0,
    `expiredAt` TIMESTAMP NOT NULL,
    `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_reset_token` (`token`),
    INDEX `idx_user_reset` (`userId`),
    CONSTRAINT `fk_password_reset_user`
        FOREIGN KEY (`userId`)
        REFERENCES `users` (`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `refresh_tokens` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `userId` INT UNSIGNED NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `deviceInfo` TEXT DEFAULT NULL,
    `ipAddress` VARCHAR(45) DEFAULT NULL,
    `expiredAt` TIMESTAMP NOT NULL,
    `revoked` TINYINT(1) NOT NULL DEFAULT 0,
    `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_refresh_token` (`token`),
    INDEX `idx_user_token` (`userId`),
    CONSTRAINT `fk_refresh_token_user`
        FOREIGN KEY (`userId`)
        REFERENCES `users` (`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `admin_audit_logs` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `adminId` INT UNSIGNED NOT NULL,
    `targetUserId` INT UNSIGNED DEFAULT NULL,
    `action` VARCHAR(100) NOT NULL,
    `detail` TEXT DEFAULT NULL,
    `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),

    INDEX `idx_admin_id` (`adminId`),
    INDEX `idx_target_user_id` (`targetUserId`),

    CONSTRAINT `fk_audit_admin_ref`
        FOREIGN KEY (`adminId`)
        REFERENCES `admins` (`id`)
        ON DELETE CASCADE,
    CONSTRAINT `fk_audit_target_user_ref`
        FOREIGN KEY (`targetUserId`)
        REFERENCES `users` (`id`)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lesson_progress` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `userId` INT UNSIGNED NOT NULL,
    `lessonId` INT UNSIGNED NOT NULL,
    `watchPercent` TINYINT UNSIGNED DEFAULT 0,
    `lastPositionSec` INT UNSIGNED DEFAULT 0,
    `isCompleted` TINYINT(1) NOT NULL DEFAULT 0,
    `completedAt` TIMESTAMP NULL DEFAULT NULL,
    `updatedAt` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_lesson_progress` (`userId`, `lessonId`),
    CONSTRAINT `fk_progress_user`
        FOREIGN KEY (`userId`)
        REFERENCES `users` (`id`)
        ON DELETE CASCADE,
    CONSTRAINT `fk_progress_lesson`
        FOREIGN KEY (`lessonId`)
        REFERENCES `lessons` (`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `question_attempts` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `userId` INT UNSIGNED NOT NULL,
    `lessonId` INT UNSIGNED NOT NULL,
    `score` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `isPassed` TINYINT(1) NOT NULL DEFAULT 0,
    `submittedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `chk_attempt_score_range` CHECK (`score` BETWEEN 0 AND 100),
    CONSTRAINT `fk_attempt_user`
        FOREIGN KEY (`userId`)
        REFERENCES `users` (`id`)
        ON DELETE CASCADE,
    CONSTRAINT `fk_attempt_lesson`
        FOREIGN KEY (`lessonId`)
        REFERENCES `lessons` (`id`)
        ON DELETE CASCADE,
    INDEX `idx_user_lesson_attempt` (`userId`, `lessonId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
