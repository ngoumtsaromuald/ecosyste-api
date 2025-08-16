-- Initialize database for ROMAPI Core
-- This script runs when the PostgreSQL container starts

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS extension for geographical data (if needed)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- Create database if it doesn't exist (handled by POSTGRES_DB env var)
-- The database is automatically created by the PostgreSQL Docker image

-- Set timezone
SET timezone = 'UTC';

-- Create initial admin user (will be handled by Prisma migrations)
-- This is just a placeholder for any initial setup needed