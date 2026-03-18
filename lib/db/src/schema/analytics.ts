import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  real,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const analyticsProjects = pgTable("analytics_projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  domain: text("domain").notNull(),
  ownerEmail: text("owner_email").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const analyticsApiKeys = pgTable("analytics_api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => analyticsProjects.id, { onDelete: "cascade" }),
  publicKey: text("public_key").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const analyticsVisitors = pgTable(
  "analytics_visitors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => analyticsProjects.id, { onDelete: "cascade" }),
    visitorId: text("visitor_id").notNull(),
    firstSeen: timestamp("first_seen").notNull().defaultNow(),
    lastSeen: timestamp("last_seen").notNull().defaultNow(),
    totalSessions: integer("total_sessions").notNull().default(1),
    country: text("country"),
    city: text("city"),
  },
  (t) => [uniqueIndex("analytics_visitors_project_visitor_idx").on(t.projectId, t.visitorId)]
);

export const analyticsSessions = pgTable(
  "analytics_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: text("session_id").notNull(),
    visitorId: text("visitor_id").notNull(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => analyticsProjects.id, { onDelete: "cascade" }),
    startTime: timestamp("start_time").notNull().defaultNow(),
    lastActivity: timestamp("last_activity").notNull().defaultNow(),
    durationSeconds: integer("duration_seconds").notNull().default(0),
    pageCount: integer("page_count").notNull().default(1),
    isBounce: boolean("is_bounce").notNull().default(true),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    utmContent: text("utm_content"),
    utmTerm: text("utm_term"),
    entryPage: text("entry_page"),
    exitPage: text("exit_page"),
    deviceType: text("device_type"),
    browser: text("browser"),
    os: text("os"),
    country: text("country"),
    screenWidth: integer("screen_width"),
    screenHeight: integer("screen_height"),
  },
  (t) => [
    index("analytics_sessions_project_idx").on(t.projectId),
    index("analytics_sessions_session_id_idx").on(t.sessionId),
  ]
);

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => analyticsProjects.id, { onDelete: "cascade" }),
    sessionId: text("session_id").notNull(),
    visitorId: text("visitor_id").notNull(),
    eventType: text("event_type").notNull(),
    eventName: text("event_name").notNull(),
    pageUrl: text("page_url"),
    referrer: text("referrer"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    utmContent: text("utm_content"),
    utmTerm: text("utm_term"),
    elementX: real("element_x"),
    elementY: real("element_y"),
    scrollDepth: integer("scroll_depth"),
    userAgent: text("user_agent"),
    deviceType: text("device_type"),
    browser: text("browser"),
    os: text("os"),
    screenWidth: integer("screen_width"),
    screenHeight: integer("screen_height"),
    timezone: text("timezone"),
    language: text("language"),
    isBot: boolean("is_bot").notNull().default(false),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
  },
  (t) => [
    index("analytics_events_project_ts_idx").on(t.projectId, t.timestamp),
    index("analytics_events_session_idx").on(t.sessionId),
    index("analytics_events_type_idx").on(t.eventType),
  ]
);

export const analyticsHeatmapEvents = pgTable(
  "analytics_heatmap_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => analyticsProjects.id, { onDelete: "cascade" }),
    pageUrl: text("page_url").notNull(),
    clickX: real("click_x").notNull(),
    clickY: real("click_y").notNull(),
    viewportWidth: integer("viewport_width"),
    viewportHeight: integer("viewport_height"),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
  },
  (t) => [index("analytics_heatmap_project_url_idx").on(t.projectId, t.pageUrl)]
);

export const analyticsSessionRecordings = pgTable(
  "analytics_session_recordings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: text("session_id").notNull(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => analyticsProjects.id, { onDelete: "cascade" }),
    events: jsonb("events").notNull().default([]),
    duration: integer("duration").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("analytics_recordings_session_idx").on(t.sessionId)]
);

export const insertAnalyticsProjectSchema = createInsertSchema(analyticsProjects).omit({ id: true, createdAt: true });
export type InsertAnalyticsProject = z.infer<typeof insertAnalyticsProjectSchema>;
export type AnalyticsProject = typeof analyticsProjects.$inferSelect;

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({ id: true, timestamp: true });
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
