-- ─────────────────────────────────────────────────────────────────────
-- SHARE PACKAGES SEED. Run with:  npm run db:seed
-- Idempotent (keyed on symbol): edit a price here and re-run to update it.
--
-- tier:   'standard' | 'premium' | 'vip'
-- status: 'available' | 'sold_out' | 'coming_soon' | 'hidden'
-- badge:  optional short label shown next to the name, e.g. 'Popular'
--
-- Each plan runs for 38 days (see PLAN_DURATION_DAYS in src/lib/config.ts).
-- Tiers below are a default split and can be changed freely.
-- ─────────────────────────────────────────────────────────────────────

insert into public.shares (name, symbol, description, price, daily_earning, tier, badge, status, display_order)
values
  ('Stock 1', 'STK1', 'Stocks Plan', 3000, 870, 'standard', null, 'available', 1),
  ('Stock 2', 'STK2', 'Stocks Plan', 5000, 1450, 'standard', null, 'available', 2),
  ('Stock 3', 'STK3', 'Stocks Plan', 10000, 2900, 'standard', null, 'available', 3),
  ('Stock 4', 'STK4', 'Stocks Plan', 20000, 5800, 'standard', null, 'available', 4),
  ('Stock 5', 'STK5', 'Stocks Plan', 30000, 8700, 'standard', null, 'available', 5),
  ('Stock 6', 'STK6', 'Stocks Plan', 50000, 14500, 'premium', null, 'available', 6),
  ('Stock 7', 'STK7', 'Stocks Plan', 70000, 20800, 'premium', null, 'available', 7),
  ('Stock 8', 'STK8', 'Stocks Plan', 100000, 29000, 'premium', null, 'available', 8),
  ('Stock 9', 'STK9', 'Stocks Plan', 300000, 87000, 'premium', null, 'available', 9),
  ('Stock 10','STK10','Stocks Plan', 500000, 145000, 'premium', null, 'available', 10),
  ('Stock 11','STK11','Stocks VIP Plan', 1000000, 290000, 'vip', null, 'available', 11)
on conflict (symbol) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  daily_earning = excluded.daily_earning,
  tier = excluded.tier,
  badge = excluded.badge,
  status = excluded.status,
  display_order = excluded.display_order;
