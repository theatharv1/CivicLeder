-- CreateTable
CREATE TABLE `case_id_counter` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `value` BIGINT NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `issue_categories` (
    `id` CHAR(36) NOT NULL,
    `slug` VARCHAR(64) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `short_description` TEXT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `issue_categories_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `issue_types` (
    `id` CHAR(36) NOT NULL,
    `category_id` CHAR(36) NOT NULL,
    `slug` VARCHAR(128) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `short_description` TEXT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `emergency_relevant` BOOLEAN NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `issue_types_slug_key`(`slug`),
    INDEX `issue_types_category_id_idx`(`category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `emergency_contacts` (
    `id` CHAR(36) NOT NULL,
    `region` VARCHAR(64) NOT NULL DEFAULT 'delhi',
    `number` VARCHAR(32) NOT NULL,
    `label` VARCHAR(128) NOT NULL,
    `description` TEXT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `source_name` VARCHAR(255) NULL,
    `source_url` VARCHAR(512) NULL,
    `last_verified_at` DATE NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `emergency_contacts_region_number_key`(`region`, `number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `emergency_rules` (
    `id` CHAR(36) NOT NULL,
    `category_id` CHAR(36) NULL,
    `issue_type_id` CHAR(36) NULL,
    `rule_kind` VARCHAR(64) NOT NULL,
    `question_key` VARCHAR(128) NOT NULL,
    `question_text` TEXT NOT NULL,
    `condition` TEXT NULL,
    `emergency_level` VARCHAR(16) NOT NULL DEFAULT 'high',
    `explanation` TEXT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `source_name` VARCHAR(255) NULL,
    `source_url` VARCHAR(512) NULL,
    `last_verified_at` DATE NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `emergency_rules_category_id_idx`(`category_id`),
    INDEX `emergency_rules_rule_kind_idx`(`rule_kind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `authorities` (
    `id` CHAR(36) NOT NULL,
    `slug` VARCHAR(128) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `department` VARCHAR(255) NULL,
    `government` VARCHAR(255) NULL,
    `official_website` VARCHAR(512) NULL,
    `emergency_number` VARCHAR(32) NULL,
    `source_name` VARCHAR(255) NULL,
    `source_url` VARCHAR(512) NULL,
    `last_verified_at` DATE NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `authorities_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `authority_channels` (
    `id` CHAR(36) NOT NULL,
    `authority_id` CHAR(36) NOT NULL,
    `channel_type` VARCHAR(32) NOT NULL,
    `label` VARCHAR(255) NULL,
    `value` TEXT NULL,
    `source_name` VARCHAR(255) NULL,
    `source_url` VARCHAR(512) NULL,
    `last_verified_at` DATE NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `authority_channels_authority_id_idx`(`authority_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `routing_rules` (
    `id` CHAR(36) NOT NULL,
    `category_id` CHAR(36) NULL,
    `issue_type_id` CHAR(36) NULL,
    `authority_id` CHAR(36) NOT NULL,
    `confidence` VARCHAR(32) NOT NULL DEFAULT 'likely',
    `notes` TEXT NULL,
    `source_name` VARCHAR(255) NULL,
    `source_url` VARCHAR(512) NULL,
    `last_verified_at` DATE NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `routing_rules_category_id_idx`(`category_id`),
    INDEX `routing_rules_issue_type_id_idx`(`issue_type_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `authority_services` (
    `id` CHAR(36) NOT NULL,
    `authority_id` CHAR(36) NOT NULL,
    `service_key` VARCHAR(128) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `channel_type` VARCHAR(64) NULL,
    `channel_value` TEXT NULL,
    `action_url` VARCHAR(512) NULL,
    `tracking_url` VARCHAR(512) NULL,
    `instructions` TEXT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `source_name` VARCHAR(255) NULL,
    `source_url` VARCHAR(512) NULL,
    `last_verified_at` DATE NULL,

    INDEX `authority_services_authority_id_idx`(`authority_id`),
    UNIQUE INDEX `authority_services_authority_id_service_key_key`(`authority_id`, `service_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `authority_service_fields` (
    `id` CHAR(36) NOT NULL,
    `service_id` CHAR(36) NOT NULL,
    `field_key` VARCHAR(128) NOT NULL,
    `label` VARCHAR(255) NOT NULL,
    `field_type` VARCHAR(64) NOT NULL DEFAULT 'text',
    `required` BOOLEAN NOT NULL DEFAULT false,
    `help_text` TEXT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `placeholder` VARCHAR(255) NULL,

    INDEX `authority_service_fields_service_id_idx`(`service_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `official_services` (
    `id` CHAR(36) NOT NULL,
    `slug` VARCHAR(128) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `url` VARCHAR(512) NULL,
    `phone` VARCHAR(64) NULL,
    `category_slug` VARCHAR(64) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `official_services_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `citizen_rights` (
    `id` CHAR(36) NOT NULL,
    `slug` VARCHAR(128) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `body` TEXT NULL,
    `category_slug` VARCHAR(64) NULL,
    `source_url` VARCHAR(512) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `citizen_rights_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reports` (
    `id` CHAR(36) NOT NULL,
    `case_id` VARCHAR(32) NOT NULL,
    `category_slug` VARCHAR(64) NULL,
    `issue_type_slug` VARCHAR(128) NULL,
    `emergency_result` VARCHAR(64) NULL,
    `user_status` VARCHAR(64) NOT NULL DEFAULT 'draft',
    `selected_authority_slug` VARCHAR(128) NULL,
    `status_source_type` VARCHAR(32) NULL DEFAULT 'user',
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `reports_case_id_key`(`case_id`),
    INDEX `reports_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_locations` (
    `id` CHAR(36) NOT NULL,
    `report_id` CHAR(36) NULL,
    `draft_key` VARCHAR(128) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `address_text` TEXT NULL,
    `landmark` TEXT NULL,
    `accuracy_meters` DOUBLE NULL,
    `jurisdiction_status` VARCHAR(64) NOT NULL DEFAULT 'unknown',
    `jurisdiction_id` CHAR(36) NULL,
    `add_location_on_photo` BOOLEAN NOT NULL DEFAULT true,
    `source` VARCHAR(64) NOT NULL DEFAULT 'user',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `report_locations_report_id_idx`(`report_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_evidence` (
    `id` CHAR(36) NOT NULL,
    `report_id` CHAR(36) NULL,
    `draft_key` VARCHAR(128) NULL,
    `media_type` VARCHAR(32) NULL,
    `storage_path` VARCHAR(512) NULL,
    `local_uri` TEXT NULL,
    `mime_type` VARCHAR(128) NULL,
    `file_size_bytes` BIGINT NULL,
    `duration_seconds` DOUBLE NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `location_on_media` BOOLEAN NOT NULL DEFAULT false,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `report_evidence_report_id_idx`(`report_id`),
    INDEX `report_evidence_draft_key_idx`(`draft_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `official_complaints` (
    `id` CHAR(36) NOT NULL,
    `report_id` CHAR(36) NULL,
    `authority_id` CHAR(36) NULL,
    `authority_slug` VARCHAR(128) NULL,
    `service_id` CHAR(36) NULL,
    `channel_type` VARCHAR(64) NULL,
    `channel_value` TEXT NULL,
    `official_reference` VARCHAR(255) NULL,
    `has_official_reference` BOOLEAN NULL,
    `filed_by_user_at` DATETIME(3) NULL,
    `user_notes` TEXT NULL,
    `recorded_by` VARCHAR(64) NOT NULL DEFAULT 'user',
    `user_confirmed_filed` BOOLEAN NULL,
    `official_submission_url` VARCHAR(512) NULL,
    `official_tracking_url` VARCHAR(512) NULL,
    `official_filed_on` DATE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `official_complaints_report_id_idx`(`report_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `case_updates` (
    `id` CHAR(36) NOT NULL,
    `report_id` CHAR(36) NULL,
    `status` VARCHAR(64) NULL,
    `message` TEXT NULL,
    `recorded_by` VARCHAR(64) NOT NULL DEFAULT 'user',
    `status_source_type` VARCHAR(32) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `case_updates_report_id_idx`(`report_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `community_tips` (
    `id` CHAR(36) NOT NULL,
    `category_slug` VARCHAR(64) NOT NULL,
    `title` VARCHAR(120) NOT NULL,
    `body` TEXT NOT NULL,
    `when_to_act` TEXT NULL,
    `suggested_channel_label` VARCHAR(255) NULL,
    `suggested_channel_url` VARCHAR(512) NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'pending',
    `agree_count` INTEGER NOT NULL DEFAULT 0,
    `disagree_count` INTEGER NOT NULL DEFAULT 0,
    `contributor_device_hash` VARCHAR(128) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `reviewed_at` DATETIME(3) NULL,
    `review_note` TEXT NULL,

    INDEX `community_tips_status_created_at_idx`(`status`, `created_at`),
    INDEX `community_tips_category_slug_status_idx`(`category_slug`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `community_tip_votes` (
    `id` CHAR(36) NOT NULL,
    `tip_id` CHAR(36) NOT NULL,
    `device_hash` VARCHAR(128) NOT NULL,
    `vote` VARCHAR(16) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `community_tip_votes_tip_id_idx`(`tip_id`),
    UNIQUE INDEX `community_tip_votes_tip_id_device_hash_key`(`tip_id`, `device_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `issue_types` ADD CONSTRAINT `issue_types_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `issue_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `emergency_rules` ADD CONSTRAINT `emergency_rules_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `issue_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `emergency_rules` ADD CONSTRAINT `emergency_rules_issue_type_id_fkey` FOREIGN KEY (`issue_type_id`) REFERENCES `issue_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `authority_channels` ADD CONSTRAINT `authority_channels_authority_id_fkey` FOREIGN KEY (`authority_id`) REFERENCES `authorities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `routing_rules` ADD CONSTRAINT `routing_rules_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `issue_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `routing_rules` ADD CONSTRAINT `routing_rules_issue_type_id_fkey` FOREIGN KEY (`issue_type_id`) REFERENCES `issue_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `routing_rules` ADD CONSTRAINT `routing_rules_authority_id_fkey` FOREIGN KEY (`authority_id`) REFERENCES `authorities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `authority_services` ADD CONSTRAINT `authority_services_authority_id_fkey` FOREIGN KEY (`authority_id`) REFERENCES `authorities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `authority_service_fields` ADD CONSTRAINT `authority_service_fields_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `authority_services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_locations` ADD CONSTRAINT `report_locations_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_evidence` ADD CONSTRAINT `report_evidence_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `official_complaints` ADD CONSTRAINT `official_complaints_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `case_updates` ADD CONSTRAINT `case_updates_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `community_tip_votes` ADD CONSTRAINT `community_tip_votes_tip_id_fkey` FOREIGN KEY (`tip_id`) REFERENCES `community_tips`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

