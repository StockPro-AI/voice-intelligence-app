ALTER TABLE `user_settings` ADD `ttsEnabled` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `user_settings` ADD `ttsVoiceIndex` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_settings` ADD `ttsRate` decimal(3,2) DEFAULT '1' NOT NULL;--> statement-breakpoint
ALTER TABLE `user_settings` ADD `ttsPitch` decimal(3,2) DEFAULT '1' NOT NULL;--> statement-breakpoint
ALTER TABLE `user_settings` ADD `ttsVolume` decimal(3,2) DEFAULT '1' NOT NULL;