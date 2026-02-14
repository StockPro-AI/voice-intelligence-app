CREATE TABLE `user_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`globalHotkey` varchar(64) NOT NULL DEFAULT 'Alt+Shift+V',
	`transcriptionLanguage` varchar(10) NOT NULL DEFAULT 'en',
	`enrichmentMode` enum('summary','structure','format','context') NOT NULL DEFAULT 'summary',
	`autoEnrich` boolean NOT NULL DEFAULT false,
	`darkMode` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_settings_userId_unique` UNIQUE(`userId`)
);
