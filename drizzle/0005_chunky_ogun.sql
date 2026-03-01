CREATE TABLE `categorization_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`noteId` int NOT NULL,
	`originalCategory` varchar(50) NOT NULL,
	`suggestedCategory` varchar(50) NOT NULL,
	`userFeedback` enum('correct','incorrect','partial','unclear') NOT NULL,
	`userCorrection` text,
	`confidenceScore` decimal(3,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categorization_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`recordingId` int,
	`title` varchar(255),
	`content` text NOT NULL,
	`category` enum('raw','processed') NOT NULL DEFAULT 'raw',
	`status` enum('unprocessed','processing','processed','review') NOT NULL DEFAULT 'unprocessed',
	`extractedTasks` int NOT NULL DEFAULT 0,
	`extractedProjects` int NOT NULL DEFAULT 0,
	`confidenceScore` varchar(5),
	`lastProcessedAt` timestamp,
	`tags` varchar(500),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`noteId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('idea','planning','active','paused','completed') NOT NULL DEFAULT 'idea',
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`effortLevel` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`potentialImpact` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`skillsNeeded` varchar(500),
	`estimatedTimeline` varchar(100),
	`startDate` timestamp,
	`endDate` timestamp,
	`confidenceScore` varchar(5),
	`tags` varchar(500),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scheduler_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`categorizationInterval` int NOT NULL DEFAULT 3600000,
	`deepAnalysisDay` int NOT NULL DEFAULT 5,
	`deepAnalysisTime` varchar(5) NOT NULL DEFAULT '09:00',
	`autoTranscribe` boolean NOT NULL DEFAULT true,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduler_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `scheduler_config_userId_unique` UNIQUE(`userId`)
);
