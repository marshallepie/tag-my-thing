-- Add MTN MOMO payment support for Cameroon market
-- This migration creates tables and functions for MTN Mobile Money integration

-- Table to track MTN MOMO transactions
CREATE TABLE IF NOT EXISTS mtn_momo_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- MTN MOMO specific fields
    reference_id VARCHAR(255) UNIQUE NOT NULL, -- Our internal reference
    mtn_transaction_id VARCHAR(255), -- MTN's transaction ID (from callback)
    phone_number VARCHAR(20) NOT NULL, -- Customer's MTN MOMO number

    -- Transaction details
    amount DECIMAL(10, 2) NOT NULL, -- Amount in XAF (Central African Franc)
    currency VARCHAR(3) DEFAULT 'XAF' NOT NULL,
    tmt_tokens_amount INTEGER NOT NULL, -- TMT tokens to be credited

    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    -- Status values: pending, processing, successful, failed, cancelled, timeout

    -- Metadata
    payment_url TEXT, -- URL for user to complete payment (if applicable)
    error_message TEXT, -- Error details if transaction failed
    callback_data JSONB, -- Raw callback data from MTN

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ, -- When payment was confirmed
    expires_at TIMESTAMPTZ -- Payment request expiration (typically 5 minutes)
);

-- Indexes for performance
CREATE INDEX idx_mtn_momo_transactions_user_id ON mtn_momo_transactions(user_id);
CREATE INDEX idx_mtn_momo_transactions_reference_id ON mtn_momo_transactions(reference_id);
CREATE INDEX idx_mtn_momo_transactions_mtn_transaction_id ON mtn_momo_transactions(mtn_transaction_id);
CREATE INDEX idx_mtn_momo_transactions_status ON mtn_momo_transactions(status);
CREATE INDEX idx_mtn_momo_transactions_created_at ON mtn_momo_transactions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE mtn_momo_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own MTN MOMO transactions
CREATE POLICY "Users can view own MTN MOMO transactions"
    ON mtn_momo_transactions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own MTN MOMO transactions (via Edge Functions)
CREATE POLICY "Users can create own MTN MOMO transactions"
    ON mtn_momo_transactions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Only system (service role) can update transaction status
CREATE POLICY "Service role can update MTN MOMO transactions"
    ON mtn_momo_transactions
    FOR UPDATE
    USING (auth.role() = 'service_role');

-- Admins can view all transactions
CREATE POLICY "Admins can view all MTN MOMO transactions"
    ON mtn_momo_transactions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_mtn_momo_transaction_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER set_mtn_momo_transaction_updated_at
    BEFORE UPDATE ON mtn_momo_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_mtn_momo_transaction_updated_at();

-- Function to clean up expired pending transactions (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_expired_mtn_momo_transactions()
RETURNS void AS $$
BEGIN
    UPDATE mtn_momo_transactions
    SET
        status = 'timeout',
        updated_at = NOW()
    WHERE
        status = 'pending'
        AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT ON mtn_momo_transactions TO authenticated;
GRANT ALL ON mtn_momo_transactions TO service_role;

-- Comment on table
COMMENT ON TABLE mtn_momo_transactions IS 'Tracks MTN Mobile Money payment transactions for Cameroon market. Links payment requests to TMT token purchases.';
