CREATE TABLE `recording_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`audioUrl` varchar(512) NOT NULL,
	`transcription` text NOT NULL,
	`enrichedResult` text,
	`enrichmentMode` enum('summary','structure','format','context'),
	`transcriptionLanguage` varchar(10) NOT NULL,
	`duration` int,
	`isFavorite` boolean NOT NULL DEFAULT false,
	`title` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recording_history_id` PRIMARY KEY(`id`)
);
