-- Remove the last "nivvy" strings: the internal placeholder email domain used
-- for phone logins, and the stale placeholder check in handle_new_user (it
-- still looked for the pre-0003 `.invalid` domain, so new phone signups never
-- got their phone number written to profiles). account.accountId is the user
-- id, so changing the email domain does not affect login.

update "user"
set email = replace(email, '@phone.nivvyusers.com', '@phone.stocksusers.com')
where email like '%@phone.nivvyusers.com';

update profiles
set email = null
where email like '%nivvy%';

create or replace function handle_new_user()
returns trigger language plpgsql as $$
declare
  is_phone boolean := new."email" like '%@phone.stocksusers.com';
begin
  insert into profiles (id, email, full_name, phone)
  values (
    new."id",
    case when is_phone then null else new."email" end,
    new."name",
    case when is_phone then '+' || split_part(new."email", '@', 1) end
  );
  insert into portfolios (user_id) values (new."id");
  insert into login_rewards (user_id) values (new."id");
  insert into welcome_bonuses (user_id, status) values (new."id", 'pending');
  insert into share_earnings (user_id) values (new."id");
  return new;
end $$;
