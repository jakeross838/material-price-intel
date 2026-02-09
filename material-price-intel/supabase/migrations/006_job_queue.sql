-- ===========================================
-- Migration 006: Job Queue Functions + Realtime
-- ===========================================
-- Sets up the job queue infrastructure for processing pending documents.
-- Phase 3's AI extraction pipeline will call these functions from Edge
-- Functions to claim, complete, and fail documents atomically.
-- ===========================================


-- ===========================================
-- JOB QUEUE: Claim next pending document for processing
-- ===========================================
-- Atomically claims the oldest pending document by setting its status
-- to 'processing' and recording the start time. Returns the claimed
-- document row, or an empty set if no pending documents exist.
--
-- Usage (from Edge Function or cron job):
--   SELECT * FROM claim_pending_document();
--
-- The atomic UPDATE ... RETURNING prevents race conditions when
-- multiple workers poll simultaneously. FOR UPDATE SKIP LOCKED
-- ensures concurrent callers never double-claim.
-- ===========================================

CREATE OR REPLACE FUNCTION claim_pending_document()
RETURNS SETOF documents AS $$
  UPDATE documents
  SET status = 'processing',
      started_at = NOW()
  WHERE id = (
    SELECT id FROM documents
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
$$ LANGUAGE sql VOLATILE SECURITY DEFINER;


-- ===========================================
-- JOB QUEUE: Mark document as completed
-- ===========================================
-- Called by the processing pipeline after successful extraction.
-- Optionally links the document to the created quote via p_quote_id.
-- ===========================================

CREATE OR REPLACE FUNCTION complete_document(
  p_document_id UUID,
  p_quote_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
  UPDATE documents
  SET status = 'completed',
      completed_at = NOW(),
      quote_id = COALESCE(p_quote_id, quote_id)
  WHERE id = p_document_id;
$$ LANGUAGE sql VOLATILE SECURITY DEFINER;


-- ===========================================
-- JOB QUEUE: Mark document as failed
-- ===========================================
-- Called by the processing pipeline when extraction fails.
-- Records the error message for debugging and user display.
-- ===========================================

CREATE OR REPLACE FUNCTION fail_document(
  p_document_id UUID,
  p_error_message TEXT
)
RETURNS VOID AS $$
  UPDATE documents
  SET status = 'failed',
      error_message = p_error_message,
      completed_at = NOW()
  WHERE id = p_document_id;
$$ LANGUAGE sql VOLATILE SECURITY DEFINER;


-- ===========================================
-- ENABLE REALTIME for documents table
-- ===========================================
-- Required for Supabase Realtime subscriptions to receive
-- postgres_changes events on the documents table. The frontend
-- hooks (useDocumentStatus, useRecentDocuments) subscribe to
-- these changes for live status updates.
-- ===========================================

ALTER PUBLICATION supabase_realtime ADD TABLE documents;
