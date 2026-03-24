-- Seed analytics data spread over the past 30 days
-- Project: 350bc6fc-93a6-498c-959d-bbcd34d53a6c

DO $$
DECLARE
  project_id UUID := '350bc6fc-93a6-498c-959d-bbcd34d53a6c';

  pages TEXT[] := ARRAY[
    'https://app.guardiiantrading.com/',
    'https://app.guardiiantrading.com/dashboard',
    'https://app.guardiiantrading.com/trading',
    'https://app.guardiiantrading.com/portfolio',
    'https://app.guardiiantrading.com/markets',
    'https://app.guardiiantrading.com/signals',
    'https://app.guardiiantrading.com/pricing',
    'https://app.guardiiantrading.com/docs',
    'https://app.guardiiantrading.com/blog',
    'https://app.guardiiantrading.com/about'
  ];

  referrers TEXT[] := ARRAY[
    'https://google.com/search?q=trading+platform',
    'https://google.com/search?q=algorithmic+trading',
    'https://twitter.com',
    'https://reddit.com/r/algotrading',
    'https://linkedin.com',
    'https://hackernews.com',
    NULL, NULL, NULL, NULL
  ];

  browsers TEXT[] := ARRAY['Chrome','Chrome','Chrome','Firefox','Safari','Edge'];
  os_list  TEXT[] := ARRAY['Windows','macOS','macOS','iOS','Linux','Windows'];
  devices  TEXT[] := ARRAY['desktop','desktop','desktop','mobile','tablet','desktop'];

  utm_sources   TEXT[] := ARRAY['google','twitter','email','linkedin','reddit',NULL,NULL,NULL];
  utm_mediums   TEXT[] := ARRAY['cpc','social','email','social','cpc',NULL,NULL,NULL];
  utm_campaigns TEXT[] := ARRAY['brand-q1-2026','launch-promo','weekly-digest','b2b-outreach','algo-community',NULL,NULL,NULL];

  visitor_id TEXT;
  session_id TEXT;
  evt_time   TIMESTAMPTZ;
  page_url   TEXT;
  referrer   TEXT;
  browser    TEXT;
  os_val     TEXT;
  device     TEXT;
  src_idx    INT;
  utm_src    TEXT;
  utm_med    TEXT;
  utm_cmp    TEXT;
  extra_pages INT;
  i INT;
  j INT;
  clicks INT;
  day_offset INT;
  sessions_today INT;
BEGIN
  -- Insert ~15-30 sessions per day for the past 30 days
  FOR day_offset IN 1..30 LOOP
    sessions_today := 10 + (RANDOM() * 20)::INT;

    FOR i IN 1..sessions_today LOOP
      visitor_id   := gen_random_uuid()::TEXT;
      session_id   := gen_random_uuid()::TEXT;
      evt_time     := NOW() - (day_offset || ' days')::INTERVAL
                         + (RANDOM() * 86400 || ' seconds')::INTERVAL;
      page_url     := pages[1 + (RANDOM() * 9)::INT];
      referrer     := referrers[1 + (RANDOM() * 9)::INT];
      browser      := browsers[1 + (RANDOM() * 5)::INT];
      os_val       := os_list[1 + (RANDOM() * 5)::INT];
      device       := devices[1 + (RANDOM() * 5)::INT];
      src_idx      := 1 + (RANDOM() * 7)::INT;
      utm_src      := utm_sources[src_idx];
      utm_med      := utm_mediums[src_idx];
      utm_cmp      := utm_campaigns[src_idx];

      -- Insert visitor
      INSERT INTO analytics_visitors
        (id, project_id, visitor_id, first_seen, last_seen, total_sessions)
      VALUES
        (gen_random_uuid(), project_id, visitor_id, evt_time, evt_time, 1)
      ON CONFLICT DO NOTHING;

      -- Insert session
      INSERT INTO analytics_sessions
        (id, session_id, visitor_id, project_id, start_time, last_activity,
         utm_source, utm_medium, utm_campaign, entry_page,
         device_type, browser, os, page_count, is_bounce,
         duration_seconds, screen_width, screen_height)
      VALUES (
        gen_random_uuid(), session_id, visitor_id, project_id,
        evt_time, evt_time + ((30 + RANDOM() * 600) || ' seconds')::INTERVAL,
        utm_src, utm_med, utm_cmp, page_url,
        device, browser, os_val,
        1 + (RANDOM() * 5)::INT,
        RANDOM() < 0.35,
        (30 + RANDOM() * 600)::INT,
        CASE device WHEN 'mobile' THEN 390 ELSE 1280 + (RANDOM() * 640)::INT END,
        CASE device WHEN 'mobile' THEN 844 ELSE 720 + (RANDOM() * 360)::INT END
      )
      ON CONFLICT DO NOTHING;

      -- Pageview event
      INSERT INTO analytics_events
        (id, project_id, session_id, visitor_id, event_type, event_name,
         page_url, referrer, utm_source, utm_medium, utm_campaign,
         device_type, browser, os, screen_width, screen_height,
         scroll_depth, is_bot, timestamp)
      VALUES (
        gen_random_uuid(), project_id, session_id, visitor_id,
        'pageview', 'pageview', page_url, referrer,
        utm_src, utm_med, utm_cmp,
        device, browser, os_val,
        CASE device WHEN 'mobile' THEN 390 ELSE 1280 + (RANDOM() * 640)::INT END,
        CASE device WHEN 'mobile' THEN 844 ELSE 720 + (RANDOM() * 360)::INT END,
        (20 + RANDOM() * 75)::INT,
        false, evt_time
      );

      -- Extra pageviews
      extra_pages := (RANDOM() * 4)::INT;
      FOR j IN 1..extra_pages LOOP
        INSERT INTO analytics_events
          (id, project_id, session_id, visitor_id, event_type, event_name,
           page_url, referrer, utm_source, utm_medium, utm_campaign,
           device_type, browser, os, screen_width, screen_height,
           scroll_depth, is_bot, timestamp)
        VALUES (
          gen_random_uuid(), project_id, session_id, visitor_id,
          'pageview', 'pageview', pages[1 + (RANDOM() * 9)::INT],
          referrer, utm_src, utm_med, utm_cmp,
          device, browser, os_val,
          CASE device WHEN 'mobile' THEN 390 ELSE 1280 + (RANDOM() * 640)::INT END,
          CASE device WHEN 'mobile' THEN 844 ELSE 720 + (RANDOM() * 360)::INT END,
          (20 + RANDOM() * 75)::INT,
          false, evt_time + (j * 45 || ' seconds')::INTERVAL
        );
      END LOOP;

      -- Click events + heatmap
      clicks := (RANDOM() * 5)::INT;
      FOR j IN 1..clicks LOOP
        INSERT INTO analytics_events
          (id, project_id, session_id, visitor_id, event_type, event_name,
           page_url, device_type, browser, os,
           element_x, element_y, screen_width, screen_height,
           is_bot, timestamp)
        VALUES (
          gen_random_uuid(), project_id, session_id, visitor_id,
          'click', 'button_click', page_url, device, browser, os_val,
          50 + (RANDOM() * 1200)::INT, 50 + (RANDOM() * 700)::INT,
          1280, 800,
          false, evt_time + (j * 20 || ' seconds')::INTERVAL
        );

        INSERT INTO analytics_heatmap_events
          (id, project_id, page_url, click_x, click_y,
           viewport_width, viewport_height, timestamp)
        VALUES (
          gen_random_uuid(), project_id, page_url,
          50 + (RANDOM() * 1200)::FLOAT,
          50 + (RANDOM() * 700)::FLOAT,
          1280, 800,
          evt_time + (j * 20 || ' seconds')::INTERVAL
        );
      END LOOP;

      -- Occasional custom events
      IF RANDOM() < 0.25 THEN
        INSERT INTO analytics_events
          (id, project_id, session_id, visitor_id, event_type, event_name,
           page_url, device_type, browser, os, is_bot, timestamp)
        VALUES (
          gen_random_uuid(), project_id, session_id, visitor_id,
          'custom', 'signup_started', page_url, device, browser, os_val,
          false, evt_time + '120 seconds'::INTERVAL
        );
      END IF;

      IF RANDOM() < 0.10 THEN
        INSERT INTO analytics_events
          (id, project_id, session_id, visitor_id, event_type, event_name,
           page_url, device_type, browser, os, is_bot, timestamp)
        VALUES (
          gen_random_uuid(), project_id, session_id, visitor_id,
          'custom', 'trial_activated', page_url, device, browser, os_val,
          false, evt_time + '180 seconds'::INTERVAL
        );
      END IF;

    END LOOP; -- sessions
  END LOOP; -- days

  RAISE NOTICE 'Seed complete.';
END $$;
