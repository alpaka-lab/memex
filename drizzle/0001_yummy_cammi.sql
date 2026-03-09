ALTER TABLE `accounts` ADD `accessTokenExpiresAt` integer;--> statement-breakpoint
ALTER TABLE `accounts` ADD `refreshTokenExpiresAt` integer;--> statement-breakpoint
ALTER TABLE `accounts` ADD `scope` text;--> statement-breakpoint
ALTER TABLE `accounts` ADD `idToken` text;--> statement-breakpoint
ALTER TABLE `accounts` ADD `password` text;