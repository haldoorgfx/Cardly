// Mock data + nav configuration for the Karta dashboard prototype.

const PLAN_LEVEL = { free: 0, pro: 1, studio: 2 };
const PLAN_LABEL = { free: "Free", pro: "Pro", studio: "Studio" };

// Does the user's plan satisfy a feature's minimum plan?
function planMeets(userPlan, minPlan) {
  if (!minPlan) return true;
  return PLAN_LEVEL[userPlan] >= PLAN_LEVEL[minPlan];
}

// ── Platform-level navigation (Level 1) ──────────────────────────────
const PLATFORM_NAV = [
  {
    title: "Platform",
    items: [
      { id: "events", label: "Events", icon: "Calendar", screen: "home" },
      { id: "p-analytics", label: "Analytics", icon: "Chart", screen: "stub" },
      { id: "templates", label: "Templates", icon: "Grid", screen: "stub" },
    ],
  },
  {
    title: "Workspace",
    items: [
      { id: "brand-kit", label: "Brand Kit", icon: "Palette", screen: "stub" },
      { id: "team", label: "Team", icon: "Users", minPlan: "pro", screen: "stub" },
      { id: "billing", label: "Billing", icon: "CreditCard", screen: "stub" },
      { id: "settings", label: "Settings", icon: "Gear", screen: "stub" },
    ],
  },
  {
    title: "Developer",
    requirePlan: "studio",
    items: [
      { id: "api-keys", label: "API Keys", icon: "Key", screen: "stub" },
      { id: "webhooks", label: "Webhooks", icon: "Plug", screen: "stub" },
      { id: "integrations", label: "Integrations", icon: "Puzzle", screen: "stub" },
      { id: "white-label", label: "White Label", icon: "Tag", screen: "stub" },
    ],
  },
  {
    title: "Admin",
    requireRole: "admin",
    items: [
      { id: "admin-users", label: "Users", icon: "Users", screen: "page" },
      { id: "admin-events", label: "All Events", icon: "Calendar", screen: "page" },
      { id: "admin-moderation", label: "Moderation", icon: "Shield", screen: "page" },
      { id: "admin-support", label: "Support", icon: "Chat", screen: "page" },
      { id: "admin-analytics", label: "Platform Analytics", icon: "Chart", screen: "page" },
    ],
  },
  {
    title: "Operations",
    requireRole: "admin",
    items: [
      { id: "admin-finance", label: "Finance & Payouts", icon: "Dollar", screen: "page" },
      { id: "admin-refunds", label: "Refunds & Disputes", icon: "CreditCard", screen: "page" },
      { id: "admin-flags", label: "Plans & Flags", icon: "Puzzle", screen: "page" },
      { id: "admin-health", label: "System Health", icon: "Bolt", screen: "page" },
      { id: "admin-changelog", label: "Changelog", icon: "ListChecks", screen: "page" },
      { id: "admin-audit", label: "Audit Log", icon: "Lock", screen: "page" },
    ],
  },
];

// ── Event-level navigation (Level 2) ─────────────────────────────────
const EVENT_NAV = [
  {
    title: "Manage",
    items: [
      { id: "overview", label: "Overview", icon: "Home", screen: "event" },
      { id: "event-page", label: "Event Page", icon: "Layout", screen: "page" },
      { id: "tickets", label: "Tickets", icon: "Ticket", screen: "page" },
      { id: "registrations", label: "Registrations", icon: "Users", screen: "page" },
      { id: "check-in", label: "Check-in", icon: "Scan", screen: "page" },
      { id: "communications", label: "Communications", icon: "Bell", screen: "page" },
    ],
  },
  {
    title: "Programme",
    items: [
      { id: "agenda", label: "Agenda", icon: "Grid", screen: "agenda" },
      { id: "speakers", label: "Speakers", icon: "User", screen: "stub" },
      { id: "sessions", label: "Sessions", icon: "Calendar", screen: "stub" },
    ],
  },
  {
    title: "Engagement",
    items: [
      { id: "networking", label: "Networking", icon: "Network", minPlan: "pro", screen: "stub" },
      { id: "q-and-a", label: "Q&A & Polls", icon: "Chat", minPlan: "pro", screen: "stub" },
      { id: "gamification", label: "Gamification", icon: "Trophy", minPlan: "pro", screen: "stub" },
    ],
  },
  {
    title: "Partners",
    items: [
      { id: "sponsors", label: "Sponsors", icon: "Briefcase", minPlan: "studio", screen: "stub" },
      { id: "virtual", label: "Virtual", icon: "Video", minPlan: "studio", screen: "stub" },
    ],
  },
  {
    title: "Insights",
    items: [
      { id: "e-analytics", label: "Analytics", icon: "Chart", screen: "page" },
    ],
  },
  {
    title: "Configure",
    items: [
      { id: "event-settings", label: "Settings", icon: "Gear", screen: "page" },
    ],
  },
];

// ── Event overview navigation cards ──────────────────────────────────
const EVENT_CARDS = [
  { id: "event-page", label: "Event Page", icon: "Layout", desc: "Edit your public event page", status: "Published", screen: "stub" },
  { id: "tickets", label: "Tickets", icon: "Ticket", desc: "Manage ticket types and pricing", status: "3 ticket types", screen: "stub" },
  { id: "registrations", label: "Registrations", icon: "Users", desc: "View and manage attendees", status: "247 registered", screen: "registrations" },
  { id: "agenda", label: "Agenda", icon: "Grid", desc: "Build your event schedule", status: "12 sessions · 3 days", screen: "agenda" },
  { id: "speakers", label: "Speakers", icon: "User", desc: "Manage speakers and sessions", status: "8 speakers", screen: "stub" },
  { id: "check-in", label: "Check-in", icon: "Scan", desc: "Scan attendees at the door", status: "Go live →", screen: "stub" },
  { id: "networking", label: "Networking", icon: "Network", desc: "Attendee connections and matchmaking", minPlan: "pro", screen: "stub" },
  { id: "q-and-a", label: "Q&A & Polls", icon: "Chat", desc: "Live session engagement", minPlan: "pro", screen: "stub" },
  { id: "sponsors", label: "Sponsors", icon: "Briefcase", desc: "Manage sponsors and exhibitors", minPlan: "studio", screen: "stub" },
  { id: "e-analytics", label: "Analytics", icon: "Chart", desc: "Registration funnel and engagement data", status: "View →", screen: "stub" },
  { id: "karta-card", label: "Karta Card", icon: "IdCard", desc: "The personalized card every attendee gets", status: "201 downloaded", gold: true, screen: "page" },
  { id: "communications", label: "Communications", icon: "Bell", desc: "Email your attendees and send updates", status: "4 campaigns", screen: "page" },
  { id: "virtual", label: "Virtual", icon: "Video", desc: "Stream sessions online", minPlan: "studio", screen: "page" },
];

// ── Events ───────────────────────────────────────────────────────────
const GRAD = {
  forest: "linear-gradient(135deg, #163828 0%, #1F4D3A 55%, #2A6A50 100%)",
  gold: "linear-gradient(135deg, #1F4D3A 0%, #2A6A50 45%, #C9A45E 120%)",
  deep: "linear-gradient(150deg, #122e21 0%, #1F4D3A 70%, #2A6A50 100%)",
  sage: "linear-gradient(160deg, #1F4D3A 0%, #3E7E5E 100%)",
};

const EVENTS = [
  {
    id: "atf26", name: "Africa Tech Festival 2026", slug: "africa-tech-fest", status: "live",
    date: "12 Mar 2026", venue: "Lagos, Nigeria", grad: GRAD.forest, primary: true,
    stats: { registered: 247, revenue: "$4,200", checkin: 77, checkinN: 189, cards: 201 },
    attention: [],
  },
  {
    id: "climate", name: "Pan-African Climate Summit", slug: "climate-summit", status: "draft",
    date: "22 Apr 2026", venue: "Nairobi, Kenya", grad: GRAD.sage,
    stats: { registered: 38, revenue: "$0", checkin: 0, checkinN: 0, cards: 12 },
    attention: ["agenda", "publish"],
  },
  {
    id: "halal", name: "Global Halal Summit", slug: "halal-summit", status: "draft",
    date: "18 Jul 2026", venue: "Istanbul, Türkiye", grad: GRAD.gold,
    stats: { registered: 0, revenue: "$0", checkin: 0, checkinN: 0, cards: 0 },
    attention: ["tickets", "agenda", "publish"],
  },
  {
    id: "nairobi", name: "University of Nairobi · Class of 2026", slug: "uon-2026", status: "ended",
    date: "Dec 2025", venue: "Nairobi, Kenya", grad: GRAD.deep,
    stats: { registered: 612, revenue: "$0", checkin: 94, checkinN: 575, cards: 540 },
    attention: [],
  },
];

const STATUS_STYLE = {
  live: { label: "Live", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "#2D7A4F", live: true },
  draft: { label: "Draft", cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "#C9A45E" },
  ended: { label: "Ended", cls: "bg-ink/5 text-ink-soft border-border", dot: "#6B7A72" },
};

Object.assign(window, {
  PLAN_LEVEL, PLAN_LABEL, planMeets,
  PLATFORM_NAV, EVENT_NAV, EVENT_CARDS,
  EVENTS, STATUS_STYLE, GRAD,
});
