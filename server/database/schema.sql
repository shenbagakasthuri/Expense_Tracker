-- ===================================================================
-- Expense Tracker Database Schema
-- Database: expense_tracker
-- Engine: InnoDB
-- Charset: utf8mb4 (collation: utf8mb4_unicode_ci)
-- ===================================================================

CREATE DATABASE IF NOT EXISTS `expense_tracker`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `expense_tracker`;

-- Disable foreign key checks during schema re-creation if needed
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `budgets`;
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- ===================================================================
-- Table 1: users
-- Core user entity storing authentication and profile credentials
-- ===================================================================
CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- Table 2: categories
-- User-specific transaction categories (Income & Expense)
-- Includes composite key (id, user_id) to enable composite FK referencing
-- ===================================================================
CREATE TABLE `categories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `type` ENUM('INCOME', 'EXPENSE') NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  -- Composite unique key prevents identical category names under same type for a user
  -- and also serves as the referenced key for transactions and budgets
  UNIQUE KEY `uk_categories_user_name_type` (`user_id`, `name`, `type`),
  UNIQUE KEY `uk_categories_id_user_id` (`id`, `user_id`),
  KEY `idx_categories_user_id` (`user_id`),
  CONSTRAINT `fk_categories_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- Table 3: transactions
-- User financial entries; type is derived from the referenced category
-- Composite FK (category_id, user_id) guarantees category ownership
-- ===================================================================
CREATE TABLE `transactions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `category_id` INT NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `transaction_date` DATE NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  -- Indexes for filtering, reporting, and sorting
  KEY `idx_transactions_user_date` (`user_id`, `transaction_date`),
  KEY `idx_transactions_user_category` (`user_id`, `category_id`),
  KEY `idx_transactions_date` (`transaction_date`),
  -- Positive financial amount enforcement
  CONSTRAINT `chk_transactions_amount` CHECK (`amount` > 0),
  -- Foreign key ensuring valid user
  CONSTRAINT `fk_transactions_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  -- Composite foreign key enforcing category belongs to the exact same user
  CONSTRAINT `fk_transactions_category_user`
    FOREIGN KEY (`category_id`, `user_id`)
    REFERENCES `categories` (`id`, `user_id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- Table 4: budgets
-- Monthly budget thresholds per category per user
-- Composite FK (category_id, user_id) guarantees category ownership
-- ===================================================================
CREATE TABLE `budgets` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `category_id` INT NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `month` TINYINT NOT NULL,
  `year` SMALLINT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  -- Ensure unique budget per user, category, month, and year
  UNIQUE KEY `uk_budgets_user_cat_month_year` (`user_id`, `category_id`, `month`, `year`),
  -- Index for monthly dashboard and report lookups
  KEY `idx_budgets_user_year_month` (`user_id`, `year`, `month`),
  -- Positive budget amount check
  CONSTRAINT `chk_budgets_amount` CHECK (`amount` > 0),
  -- Month validity range check (1 to 12)
  CONSTRAINT `chk_budgets_month` CHECK (`month` BETWEEN 1 AND 12),
  -- Year validity range check (realistic calendar bounds)
  CONSTRAINT `chk_budgets_year` CHECK (`year` >= 2000 AND `year` <= 2100),
  -- Foreign key ensuring valid user
  CONSTRAINT `fk_budgets_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  -- Composite foreign key enforcing category belongs to the exact same user
  CONSTRAINT `fk_budgets_category_user`
    FOREIGN KEY (`category_id`, `user_id`)
    REFERENCES `categories` (`id`, `user_id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
