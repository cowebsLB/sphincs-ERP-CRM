-- Remove POS sale tables (scope no longer includes a dedicated POS module; retail is modeled under Sales / Ecommerce per system design).
DROP TABLE IF EXISTS "pos_sale_lines";
DROP TABLE IF EXISTS "pos_sales";
DROP TYPE IF EXISTS "PosSaleStatus";
