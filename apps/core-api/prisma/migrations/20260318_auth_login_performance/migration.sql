-- Improve auth login lookup for active, non-deleted users by email
CREATE INDEX IF NOT EXISTS "idx_users_email_deleted_status"
ON "users"("email", "deleted_at", "status");
