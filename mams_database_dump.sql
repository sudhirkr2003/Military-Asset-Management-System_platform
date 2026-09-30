-- =============================================================================
-- MILITARY ASSET MANAGEMENT SYSTEM (MAMS) - RELATIONAL DATABASE DUMP & SCHEMA
-- Compatible with MySQL 8+, PostgreSQL 14+, and H2 In-Memory DB
-- Engine: InnoDB | Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `mams_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `mams_db`;

-- -----------------------------------------------------------------------------
-- 1. TABLE: bases (Military Installations & Strategic Commands)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `bases`;
CREATE TABLE `bases` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL UNIQUE,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `location` VARCHAR(255) NOT NULL,
  `commander_name` VARCHAR(150),
  `status` VARCHAR(30) DEFAULT 'ACTIVE',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. TABLE: users (Officers, RBAC Authentication & Base Assignments)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `role` VARCHAR(50) NOT NULL,
  `base_id` BIGINT,
  `status` VARCHAR(30) DEFAULT 'ACTIVE',
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_users_base` FOREIGN KEY (`base_id`) REFERENCES `bases` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. TABLE: equipment_types (Defense Asset Registry & Specifications)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `equipment_types`;
CREATE TABLE `equipment_types` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL UNIQUE,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `category` VARCHAR(50) NOT NULL,
  `unit_of_measure` VARCHAR(50) NOT NULL,
  `is_expendable` BOOLEAN NOT NULL DEFAULT FALSE,
  `description` TEXT,
  `status` VARCHAR(30) DEFAULT 'ACTIVE',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. TABLE: inventories (Live Base Stock Balances & Reconciliation)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `inventories`;
CREATE TABLE `inventories` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `base_id` BIGINT NOT NULL,
  `equipment_type_id` BIGINT NOT NULL,
  `opening_balance` BIGINT NOT NULL DEFAULT 0,
  `available_quantity` BIGINT NOT NULL DEFAULT 0,
  `assigned_quantity` BIGINT NOT NULL DEFAULT 0,
  `expended_quantity` BIGINT NOT NULL DEFAULT 0,
  `closing_balance` BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_base_equipment` (`base_id`, `equipment_type_id`),
  CONSTRAINT `fk_inventory_base` FOREIGN KEY (`base_id`) REFERENCES `bases` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_inventory_equipment` FOREIGN KEY (`equipment_type_id`) REFERENCES `equipment_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. TABLE: movement_ledger (Immutable Audit Trail for Logistics & Movements)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `movement_ledger`;
CREATE TABLE `movement_ledger` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `base_id` BIGINT NOT NULL,
  `equipment_type_id` BIGINT NOT NULL,
  `movement_type` VARCHAR(30) NOT NULL,
  `quantity` BIGINT NOT NULL,
  `reference_type` VARCHAR(50),
  `reference_id` BIGINT,
  `remarks` VARCHAR(255),
  `created_by` VARCHAR(100),
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_movement_base` FOREIGN KEY (`base_id`) REFERENCES `bases` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_movement_equipment` FOREIGN KEY (`equipment_type_id`) REFERENCES `equipment_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- SAMPLE DATA INITIALIZATION (MAMS PRODUCTION STARTER PACK)
-- =============================================================================

-- Bases
INSERT INTO `bases` (`id`, `name`, `code`, `location`, `commander_name`, `status`) VALUES
(1, 'Alpha Base Command', 'ALPHA01', 'Northern Border Sector', 'Maj. Gen. Sharma', 'ACTIVE'),
(2, 'Bravo Armor Depot', 'BRAVO02', 'Western Desert Sector', 'Brig. Vikram Rathore', 'ACTIVE'),
(3, 'Charlie Air Support', 'CHARLIE03', 'Eastern Mountain Sector', 'Wing Cmdr. Aditi', 'ACTIVE'),
(4, 'Delta Logistics Hub', 'DELTA04', 'Central Strategic Command', 'Col. Ramesh Singh', 'ACTIVE');

-- Users (BCrypt Hashes for 'Admin@123')
INSERT INTO `users` (`id`, `username`, `email`, `password`, `full_name`, `role`, `base_id`, `status`) VALUES
(1, 'admin', 'admin@mams.mil', '$2a$10$7vN3fQ17QZJv7W8N.1P3E.mYwA0sRzT1pA2aPzH0F6sQzG6Uqg5G2', 'Commander Rajesh Singh', 'ADMIN', 1, 'ACTIVE'),
(2, 'commander_sharma', 'sharma@mams.mil', '$2a$10$7vN3fQ17QZJv7W8N.1P3E.mYwA0sRzT1pA2aPzH0F6sQzG6Uqg5G2', 'Col. Anita Sharma', 'BASE_COMMANDER', 1, 'ACTIVE'),
(3, 'logistics_verma', 'verma@mams.mil', '$2a$10$7vN3fQ17QZJv7W8N.1P3E.mYwA0sRzT1pA2aPzH0F6sQzG6Uqg5G2', 'Major Vikram Verma', 'LOGISTICS_OFFICER', 1, 'ACTIVE');

-- Equipment Catalog
INSERT INTO `equipment_types` (`id`, `name`, `code`, `category`, `unit_of_measure`, `is_expendable`, `description`, `status`) VALUES
(1, 'INSAS 5.56mm Assault Rifle', 'WPN-INSAS-01', 'WEAPON', 'units', FALSE, 'Standard service issue assault rifle', 'ACTIVE'),
(2, 'T-90 Bhishma MBT', 'VEH-T90-02', 'VEHICLE', 'units', FALSE, 'Main battle tank with thermal optics', 'ACTIVE'),
(3, '5.56x45mm NATO Ammo', 'AMM-556-03', 'AMMUNITION', 'rounds', TRUE, 'Standard caliber ammunition rounds', 'ACTIVE'),
(4, 'VHF Tactical Radio Set', 'COM-VHF-04', 'COMMUNICATION_EQUIPMENT', 'units', FALSE, 'Encrypted battlefield communicator', 'ACTIVE');

-- Inventories
INSERT INTO `inventories` (`id`, `base_id`, `equipment_type_id`, `opening_balance`, `available_quantity`, `assigned_quantity`, `expended_quantity`, `closing_balance`) VALUES
(1, 1, 1, 100, 150, 50, 0, 150),
(2, 1, 2, 10, 12, 2, 0, 12),
(3, 1, 3, 5000, 4800, 200, 0, 4800),
(4, 2, 1, 80, 80, 0, 0, 80);

-- Movement Audit Trail
INSERT INTO `movement_ledger` (`id`, `base_id`, `equipment_type_id`, `movement_type`, `quantity`, `reference_type`, `reference_id`, `remarks`, `created_by`, `timestamp`) VALUES
(1, 1, 1, 'PURCHASE', 50, 'PURCHASE', 101, 'Quarterly defense procurement PO#7881', 'admin', NOW() - INTERVAL 5 DAY),
(2, 1, 1, 'ASSIGNMENT', 10, 'ASSIGNMENT', 201, 'Troop deployment for border security patrol', 'commander_sharma', NOW() - INTERVAL 3 DAY),
(3, 1, 3, 'EXPENDITURE', 200, 'EXPENDITURE', 301, 'Range practice drill for infantry platoon', 'commander_sharma', NOW() - INTERVAL 1 DAY);
