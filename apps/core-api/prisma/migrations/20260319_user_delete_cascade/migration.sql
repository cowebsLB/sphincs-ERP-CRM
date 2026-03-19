-- Align user-child FK behavior to allow hard user deletes when needed.
-- Soft delete remains the default app behavior; this only controls FK cleanup
-- when a physical delete is executed from SQL/Supabase UI.

ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_user_id_fkey";
ALTER TABLE "refresh_tokens"
  ADD CONSTRAINT "refresh_tokens_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_user_id_fkey";
ALTER TABLE "user_roles"
  ADD CONSTRAINT "user_roles_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
