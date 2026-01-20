-- Add frequency and canal columns to comunicaciones table
ALTER TABLE comunicaciones ADD COLUMN IF NOT EXISTS frecuencia DOUBLE PRECISION;
ALTER TABLE comunicaciones ADD COLUMN IF NOT EXISTS canal VARCHAR(255);
