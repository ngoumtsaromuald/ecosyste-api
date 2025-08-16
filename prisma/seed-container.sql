-- Seed data for ROMAPI Core database
-- This script populates the database with test data

-- Insert Categories
INSERT INTO categories (id, name, slug, description, icon, parent_id, created_at) VALUES
  (gen_random_uuid(), 'Restaurants & Alimentation', 'restaurants-alimentation', 'Restaurants, bars, cafés et commerces alimentaires', '🍽️', NULL, NOW()),
  (gen_random_uuid(), 'Services Professionnels', 'services-professionnels', 'Avocats, comptables, consultants et autres services professionnels', '💼', NULL, NOW()),
  (gen_random_uuid(), 'Santé & Bien-être', 'sante-bien-etre', 'Médecins, pharmacies, centres de bien-être', '🏥', NULL, NOW()),
  (gen_random_uuid(), 'Commerce & Retail', 'commerce-retail', 'Magasins, boutiques et centres commerciaux', '🛍️', NULL, NOW()),
  (gen_random_uuid(), 'Technologies & IT', 'technologies-it', 'Services informatiques, développement, support technique', '💻', NULL, NOW());

-- Get category IDs for subcategories
WITH restaurant_cat AS (SELECT id FROM categories WHERE slug = 'restaurants-alimentation'),
     tech_cat AS (SELECT id FROM categories WHERE slug = 'technologies-it')
INSERT INTO categories (id, name, slug, description, icon, parent_id, created_at) VALUES
  (gen_random_uuid(), 'Restaurants Traditionnels', 'restaurants-traditionnels', 'Cuisine locale et traditionnelle', '🍲', (SELECT id FROM restaurant_cat), NOW()),
  (gen_random_uuid(), 'Fast Food', 'fast-food', 'Restauration rapide', '🍔', (SELECT id FROM restaurant_cat), NOW()),
  (gen_random_uuid(), 'Développement Web', 'developpement-web', 'Création de sites web et applications', '🌐', (SELECT id FROM tech_cat), NOW());

-- Insert Users
INSERT INTO users (id, email, password_hash, name, user_type, plan, api_quota, api_usage, pricing_tier, created_at, updated_at) VALUES
  (gen_random_uuid(), 'admin@romapi.com', '$2b$10$rOzJqQqQqQqQqQqQqQqQqO', 'Admin ROMAPI', 'ADMIN', 'ENTERPRISE', 100000, 0, 'STANDARD', NOW(), NOW()),
  (gen_random_uuid(), 'business@example.com', '$2b$10$rOzJqQqQqQqQqQqQqQqQqO', 'Restaurant Le Cameroun', 'BUSINESS', 'PRO', 10000, 150, 'STANDARD', NOW(), NOW()),
  (gen_random_uuid(), 'developer@example.com', '$2b$10$rOzJqQqQqQqQqQqQqQqQqO', 'Jean Dupont', 'INDIVIDUAL', 'FREE', 1000, 45, 'STANDARD', NOW(), NOW()),
  (gen_random_uuid(), 'premium@example.com', '$2b$10$rOzJqQqQqQqQqQqQqQqQqO', 'TechCorp Solutions', 'BUSINESS', 'PREMIUM', 50000, 2340, 'STANDARD', NOW(), NOW());

-- Insert API Resources
WITH business_user AS (SELECT id FROM users WHERE email = 'business@example.com'),
     dev_user AS (SELECT id FROM users WHERE email = 'developer@example.com'),
     premium_user AS (SELECT id FROM users WHERE email = 'premium@example.com'),
     restaurant_cat AS (SELECT id FROM categories WHERE slug = 'restaurants-traditionnels'),
     fastfood_cat AS (SELECT id FROM categories WHERE slug = 'fast-food'),
     web_dev_cat AS (SELECT id FROM categories WHERE slug = 'developpement-web'),
     tech_cat AS (SELECT id FROM categories WHERE slug = 'technologies-it')
INSERT INTO api_resources (
  id, user_id, name, slug, description, resource_type, category_id,
  address_line1, city, region, postal_code, country, latitude, longitude,
  phone, email, website, status, plan, verified,
  meta_title, meta_description, created_at, updated_at, published_at
) VALUES
  (
    gen_random_uuid(), (SELECT id FROM business_user), 'Restaurant Le Cameroun', 'restaurant-le-cameroun',
    'Restaurant traditionnel camerounais au cœur de Douala. Spécialités locales et ambiance authentique.',
    'BUSINESS', (SELECT id FROM restaurant_cat),
    '123 Avenue de la Liberté', 'Douala', 'Littoral', '1234', 'CM', 4.0511, 9.7679,
    '+237 233 42 12 34', 'contact@lecameroun.cm', 'https://lecameroun.cm',
    'ACTIVE', 'PREMIUM', true,
    'Restaurant Le Cameroun - Cuisine Traditionnelle à Douala',
    'Découvrez la cuisine camerounaise authentique au Restaurant Le Cameroun. Plats traditionnels, ambiance chaleureuse.',
    NOW(), NOW(), NOW()
  ),
  (
    gen_random_uuid(), (SELECT id FROM dev_user), 'DevCorp Solutions', 'devcorp-solutions',
    'Agence de développement web et mobile spécialisée dans les solutions sur mesure pour entreprises.',
    'SERVICE', (SELECT id FROM web_dev_cat),
    '456 Rue des Développeurs', 'Yaoundé', 'Centre', '5678', 'CM', 3.8480, 11.5021,
    '+237 222 33 44 55', 'hello@devcorp.cm', 'https://devcorp.cm',
    'ACTIVE', 'FREE', true,
    'DevCorp Solutions - Développement Web & Mobile',
    'Agence de développement web et mobile au Cameroun. Solutions sur mesure pour votre entreprise.',
    NOW(), NOW(), NOW()
  ),
  (
    gen_random_uuid(), (SELECT id FROM premium_user), 'TechCorp API Gateway', 'techcorp-api-gateway',
    'API Gateway haute performance pour la gestion et la sécurisation de vos APIs.',
    'API', (SELECT id FROM tech_cat),
    '789 Tech Boulevard', 'Douala', 'Littoral', '9012', 'CM', NULL, NULL,
    '+237 233 55 66 77', 'api@techcorp.cm', 'https://api.techcorp.cm',
    'ACTIVE', 'FEATURED', true,
    'TechCorp API Gateway - Gestion d''APIs',
    'Solution complète de gestion d''APIs avec sécurité avancée et monitoring en temps réel.',
    NOW(), NOW(), NOW()
  ),
  (
    gen_random_uuid(), (SELECT id FROM business_user), 'Quick Burger Douala', 'quick-burger-douala',
    'Fast food moderne avec burgers artisanaux et service rapide.',
    'BUSINESS', (SELECT id FROM fastfood_cat),
    '321 Avenue du Commerce', 'Douala', 'Littoral', '3456', 'CM', 4.0611, 9.7779,
    '+237 233 88 99 00', 'info@quickburger.cm', NULL,
    'PENDING', 'FREE', false,
    'Quick Burger Douala - Fast Food Artisanal',
    'Burgers artisanaux et service rapide au cœur de Douala.',
    NOW(), NOW(), NULL
  );

-- Insert Business Hours for restaurants
WITH restaurant AS (SELECT id FROM api_resources WHERE slug = 'restaurant-le-cameroun'),
     quick_burger AS (SELECT id FROM api_resources WHERE slug = 'quick-burger-douala')
INSERT INTO business_hours (id, resource_id, day_of_week, open_time, close_time, is_closed) VALUES
  -- Restaurant Le Cameroun (closed on Sunday)
  (gen_random_uuid(), (SELECT id FROM restaurant), 1, '11:00', '23:00', false),
  (gen_random_uuid(), (SELECT id FROM restaurant), 2, '11:00', '23:00', false),
  (gen_random_uuid(), (SELECT id FROM restaurant), 3, '11:00', '23:00', false),
  (gen_random_uuid(), (SELECT id FROM restaurant), 4, '11:00', '23:00', false),
  (gen_random_uuid(), (SELECT id FROM restaurant), 5, '11:00', '23:00', false),
  (gen_random_uuid(), (SELECT id FROM restaurant), 6, '11:00', '23:00', false),
  (gen_random_uuid(), (SELECT id FROM restaurant), 7, NULL, NULL, true),
  -- Quick Burger (open every day)
  (gen_random_uuid(), (SELECT id FROM quick_burger), 1, '10:00', '22:00', false),
  (gen_random_uuid(), (SELECT id FROM quick_burger), 2, '10:00', '22:00', false),
  (gen_random_uuid(), (SELECT id FROM quick_burger), 3, '10:00', '22:00', false),
  (gen_random_uuid(), (SELECT id FROM quick_burger), 4, '10:00', '22:00', false),
  (gen_random_uuid(), (SELECT id FROM quick_burger), 5, '10:00', '22:00', false),
  (gen_random_uuid(), (SELECT id FROM quick_burger), 6, '10:00', '22:00', false),
  (gen_random_uuid(), (SELECT id FROM quick_burger), 7, '10:00', '22:00', false);

-- Insert Resource Images
WITH restaurant AS (SELECT id FROM api_resources WHERE slug = 'restaurant-le-cameroun'),
     devcorp AS (SELECT id FROM api_resources WHERE slug = 'devcorp-solutions'),
     quick_burger AS (SELECT id FROM api_resources WHERE slug = 'quick-burger-douala')
INSERT INTO resource_images (id, resource_id, url, alt_text, is_primary, order_index, created_at) VALUES
  (gen_random_uuid(), (SELECT id FROM restaurant), 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', 'Restaurant Le Cameroun - Vue intérieure', true, 0, NOW()),
  (gen_random_uuid(), (SELECT id FROM restaurant), 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', 'Restaurant Le Cameroun - Plat traditionnel', false, 1, NOW()),
  (gen_random_uuid(), (SELECT id FROM devcorp), 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800', 'DevCorp Solutions - Bureau moderne', true, 0, NOW()),
  (gen_random_uuid(), (SELECT id FROM quick_burger), 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800', 'Quick Burger - Burger artisanal', true, 0, NOW());

-- Insert API Keys
WITH admin_user AS (SELECT id FROM users WHERE email = 'admin@romapi.com'),
     business_user AS (SELECT id FROM users WHERE email = 'business@example.com'),
     dev_user AS (SELECT id FROM users WHERE email = 'developer@example.com')
INSERT INTO api_keys (id, user_id, name, key_hash, key_prefix, permissions, rate_limit, is_active, created_at) VALUES
  (gen_random_uuid(), (SELECT id FROM admin_user), 'Admin Master Key', 'hashed_admin_key_123', 'rk_admin', '["read", "write", "delete", "admin"]', 10000, true, NOW()),
  (gen_random_uuid(), (SELECT id FROM business_user), 'Business API Key', 'hashed_business_key_456', 'rk_biz', '["read", "write"]', 1000, true, NOW()),
  (gen_random_uuid(), (SELECT id FROM dev_user), 'Developer Test Key', 'hashed_dev_key_789', 'rk_dev', '["read"]', 100, true, NOW());

-- Insert Subscriptions
WITH business_user AS (SELECT id FROM users WHERE email = 'business@example.com'),
     premium_user AS (SELECT id FROM users WHERE email = 'premium@example.com')
INSERT INTO subscriptions (id, user_id, plan, status, start_date, end_date, created_at, updated_at) VALUES
  (gen_random_uuid(), (SELECT id FROM business_user), 'PRO', 'ACTIVE', NOW(), NOW() + INTERVAL '1 year', NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM premium_user), 'PREMIUM', 'ACTIVE', NOW(), NOW() + INTERVAL '1 year', NOW(), NOW());

-- Insert Analytics Events
WITH restaurant AS (SELECT id FROM api_resources WHERE slug = 'restaurant-le-cameroun'),
     devcorp AS (SELECT id FROM api_resources WHERE slug = 'devcorp-solutions'),
     techcorp AS (SELECT id FROM api_resources WHERE slug = 'techcorp-api-gateway')
INSERT INTO analytics_events (id, resource_id, event_type, user_agent, ip_address, referrer, metadata, created_at) VALUES
  -- Restaurant events
  (gen_random_uuid(), (SELECT id FROM restaurant), 'view', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '192.168.1.100', 'https://google.com', '{"source": "web", "campaign": "organic"}', NOW() - INTERVAL '1 day'),
  (gen_random_uuid(), (SELECT id FROM restaurant), 'click', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '192.168.1.101', 'https://google.com', '{"source": "web", "campaign": "organic"}', NOW() - INTERVAL '2 days'),
  (gen_random_uuid(), (SELECT id FROM restaurant), 'contact', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)', '192.168.1.102', 'https://facebook.com', '{"source": "mobile", "campaign": "social"}', NOW() - INTERVAL '3 days'),
  -- DevCorp events
  (gen_random_uuid(), (SELECT id FROM devcorp), 'view', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '192.168.1.103', 'https://linkedin.com', '{"source": "web", "campaign": "social"}', NOW() - INTERVAL '1 day'),
  (gen_random_uuid(), (SELECT id FROM devcorp), 'share', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '192.168.1.104', 'https://twitter.com', '{"source": "web", "campaign": "social"}', NOW() - INTERVAL '2 days'),
  -- TechCorp events
  (gen_random_uuid(), (SELECT id FROM techcorp), 'view', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', '192.168.1.105', 'https://github.com', '{"source": "web", "campaign": "referral"}', NOW() - INTERVAL '1 day'),
  (gen_random_uuid(), (SELECT id FROM techcorp), 'click', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '192.168.1.106', 'https://stackoverflow.com', '{"source": "web", "campaign": "referral"}', NOW() - INTERVAL '2 days');

-- Display summary
SELECT 'Database seeded successfully!' as message;
SELECT 'Categories: ' || COUNT(*) as summary FROM categories
UNION ALL
SELECT 'Users: ' || COUNT(*) FROM users
UNION ALL
SELECT 'API Resources: ' || COUNT(*) FROM api_resources
UNION ALL
SELECT 'Business Hours: ' || COUNT(*) FROM business_hours
UNION ALL
SELECT 'Resource Images: ' || COUNT(*) FROM resource_images
UNION ALL
SELECT 'API Keys: ' || COUNT(*) FROM api_keys
UNION ALL
SELECT 'Subscriptions: ' || COUNT(*) FROM subscriptions
UNION ALL
SELECT 'Analytics Events: ' || COUNT(*) FROM analytics_events;