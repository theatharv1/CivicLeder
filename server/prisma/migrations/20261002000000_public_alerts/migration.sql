-- CreateTable
CREATE TABLE `public_alerts` (
    `id` CHAR(36) NOT NULL,
    `type` VARCHAR(32) NOT NULL,
    `place_name` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `photo_path` VARCHAR(255) NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `area_label` VARCHAR(120) NULL,
    `author_device_hash` VARCHAR(128) NOT NULL,
    `seen_count` INTEGER NOT NULL DEFAULT 0,
    `gone_count` INTEGER NOT NULL DEFAULT 0,
    `flag_count` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(16) NOT NULL DEFAULT 'active',
    `last_seen_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `public_alerts_status_last_seen_at_idx`(`status`, `last_seen_at`),
    INDEX `public_alerts_author_device_hash_created_at_idx`(`author_device_hash`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `public_alert_votes` (
    `id` CHAR(36) NOT NULL,
    `alert_id` CHAR(36) NOT NULL,
    `device_hash` VARCHAR(128) NOT NULL,
    `vote` VARCHAR(16) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `public_alert_votes_alert_id_idx`(`alert_id`),
    UNIQUE INDEX `public_alert_votes_alert_id_device_hash_key`(`alert_id`, `device_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `public_alert_flags` (
    `id` CHAR(36) NOT NULL,
    `alert_id` CHAR(36) NOT NULL,
    `device_hash` VARCHAR(128) NOT NULL,
    `reason` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `public_alert_flags_alert_id_idx`(`alert_id`),
    UNIQUE INDEX `public_alert_flags_alert_id_device_hash_key`(`alert_id`, `device_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `public_alert_votes` ADD CONSTRAINT `public_alert_votes_alert_id_fkey` FOREIGN KEY (`alert_id`) REFERENCES `public_alerts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `public_alert_flags` ADD CONSTRAINT `public_alert_flags_alert_id_fkey` FOREIGN KEY (`alert_id`) REFERENCES `public_alerts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

