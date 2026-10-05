-- Rebrand to Stocks and move to the new plan table (38-day plans).
-- Rows are updated in place by their old symbol so existing holdings keep working.
update shares set name = v.name, symbol = v.symbol, description = v.descr,
       price = v.price, daily_earning = v.daily, tier = v.tier
  from (values
    ('NVVY1', 'Stock 1', 'STK1', 'Stocks Plan', 3000, 870, 'standard'),
    ('NVVY2', 'Stock 2', 'STK2', 'Stocks Plan', 5000, 1450, 'standard'),
    ('NVVY3', 'Stock 3', 'STK3', 'Stocks Plan', 10000, 2900, 'standard'),
    ('NVVY4', 'Stock 4', 'STK4', 'Stocks Plan', 20000, 5800, 'standard'),
    ('NVVY5', 'Stock 5', 'STK5', 'Stocks Plan', 30000, 8700, 'standard'),
    ('NVVY6', 'Stock 6', 'STK6', 'Stocks Plan', 50000, 14500, 'premium'),
    ('NVVY7', 'Stock 7', 'STK7', 'Stocks Plan', 70000, 20800, 'premium'),
    ('NVVY8', 'Stock 8', 'STK8', 'Stocks Plan', 100000, 29000, 'premium'),
    ('NVVY9', 'Stock 9', 'STK9', 'Stocks Plan', 300000, 87000, 'premium'),
    ('NVVY10', 'Stock 10', 'STK10', 'Stocks Plan', 500000, 145000, 'premium'),
    ('NVVY11', 'Stock 11', 'STK11', 'Stocks VIP Plan', 1000000, 290000, 'vip')
  ) as v(old_symbol, name, symbol, descr, price, daily, tier)
 where shares.symbol = v.old_symbol;
