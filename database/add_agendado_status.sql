-- Add 'agendado' status to experts_benefits table
-- This creates a clearer workflow: processando_pagamento → agendado → pago

-- First, let's check the current enum values
DO $$
BEGIN
    -- Add the new 'agendado' value to the benefit_status enum if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'agendado'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'benefit_status')
    ) THEN
        ALTER TYPE benefit_status ADD VALUE 'agendado';
        RAISE NOTICE 'Added "agendado" status to benefit_status enum';
    ELSE
        RAISE NOTICE '"agendado" status already exists';
    END IF;
END $$;

-- Display current enum values to confirm
SELECT enumlabel as status_values
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'benefit_status')
ORDER BY enumsortorder;
