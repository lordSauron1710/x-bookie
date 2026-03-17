create table if not exists app_users (
  user_id uuid primary key,
  x_user_id text not null unique,
  x_handle text not null,
  x_name text not null,
  x_profile_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_sessions (
  session_id uuid primary key,
  user_id uuid not null references app_users(user_id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists user_sessions_user_id_idx on user_sessions (user_id);
create index if not exists user_sessions_expires_at_idx on user_sessions (expires_at);

create table if not exists x_connections (
  user_id uuid primary key references app_users(user_id) on delete cascade,
  access_token_ciphertext text not null,
  refresh_token_ciphertext text,
  scope text[] not null default '{}',
  token_type text not null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_bookmarks (
  user_id uuid not null references app_users(user_id) on delete cascade,
  x_post_id text not null,
  text text not null,
  author_name text not null,
  author_handle text not null,
  url text not null,
  tweet_created_at timestamptz,
  raw_payload jsonb not null,
  synced_at timestamptz not null default now(),
  primary key (user_id, x_post_id)
);

create index if not exists user_bookmarks_user_id_idx on user_bookmarks (user_id);
create index if not exists user_bookmarks_synced_at_idx on user_bookmarks (synced_at desc);

create table if not exists bookmark_sync_runs (
  sync_run_id uuid primary key,
  user_id uuid not null references app_users(user_id) on delete cascade,
  status text not null,
  imported_count integer not null default 0,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists bookmark_sync_runs_user_id_idx on bookmark_sync_runs (user_id, started_at desc);

create table if not exists oauth_transactions (
  state uuid primary key,
  verifier text not null,
  created_at timestamptz not null default now()
);

create index if not exists oauth_transactions_created_at_idx on oauth_transactions (created_at);

create table if not exists rate_limit_buckets (
  bucket_key text primary key,
  count integer not null,
  reset_at timestamptz not null
);

create index if not exists rate_limit_buckets_reset_at_idx on rate_limit_buckets (reset_at);
