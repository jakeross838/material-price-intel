-- Enable pg_net extension for HTTP calls from PostgreSQL
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Trigger function: calls process-document Edge Function via pg_net
-- Uses service role key for auth (SECURITY DEFINER = only visible to postgres role)
CREATE OR REPLACE FUNCTION public.trigger_document_extraction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    PERFORM net.http_post(
      url := 'https://xgpjwpwhtfmbvoqtvete.supabase.co/functions/v1/process-document',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhncGp3cHdodGZtYnZvcXR2ZXRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDY0Mjc2NywiZXhwIjoyMDg2MjE4NzY3fQ.iSxBuZ_sXiVB5frP8SOur3_U2_GSzHfTDTEQEStl8Fs"}'::jsonb,
      body := jsonb_build_object('document_id', NEW.id::text)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fire trigger on every INSERT to documents
CREATE TRIGGER on_document_insert_trigger_extraction
  AFTER INSERT ON documents
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_document_extraction();
