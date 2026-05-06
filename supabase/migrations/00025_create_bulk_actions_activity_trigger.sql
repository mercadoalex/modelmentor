-- Create trigger function to log bulk action activities
CREATE OR REPLACE FUNCTION log_bulk_action_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log rollback activity
  IF NEW.rollback_at IS NOT NULL AND (OLD.rollback_at IS NULL OR OLD.rollback_at IS DISTINCT FROM NEW.rollback_at) THEN
    INSERT INTO public.activity_logs (admin_id, organization_id, activity_type, metadata)
    VALUES (
      NEW.rollback_by,
      NEW.organization_id,
      'rollback'::activity_type,
      jsonb_build_object('bulk_action_id', NEW.id, 'action_type', NEW.action_type)
    );
  END IF;

  -- Log note activity
  IF NEW.notes IS NOT NULL AND NEW.notes != '' AND (OLD.notes IS NULL OR OLD.notes IS DISTINCT FROM NEW.notes) THEN
    INSERT INTO public.activity_logs (admin_id, organization_id, activity_type, metadata)
    VALUES (
      NEW.admin_id,
      NEW.organization_id,
      'note'::activity_type,
      jsonb_build_object('bulk_action_id', NEW.id, 'action_type', NEW.action_type)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on bulk_actions table
CREATE TRIGGER bulk_actions_activity_trigger
AFTER INSERT OR UPDATE ON public.bulk_actions
FOR EACH ROW
EXECUTE FUNCTION log_bulk_action_activity();

-- Add comment
COMMENT ON FUNCTION log_bulk_action_activity() IS 'Automatically logs rollback and note activities on bulk_actions table';