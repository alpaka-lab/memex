CREATE TABLE `user_ai_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`provider` text,
	`apiKeyEncrypted` text,
	`autoTagEnabled` integer DEFAULT 0,
	`autoSummaryEnabled` integer DEFAULT 0,
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_ai_settings_userId_unique` ON `user_ai_settings` (`userId`);--> statement-breakpoint
ALTER TABLE `bookmark_tags` ADD `isAiGenerated` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `bookmarks` ADD `summary` text;