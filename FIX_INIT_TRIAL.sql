-- 4. Trigger to create user_usage on signup (if not exists)
CREATE OR REPLACE FUNCTION handle_new_user_usage()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_usage (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_usage ON auth.users;
CREATE TRIGGER on_auth_user_created_usage
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_usage();
