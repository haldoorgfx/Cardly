// Mock data for the UNIFIED role-based dashboard demo.
// Mirrors the real shape returned by getUserRoles()/getVisibleSections() in the
// cardly codebase: one account, many event-scoped hats, resolved server-side.

const HAT_DEFAULT = { tickets: true, speaking: true, sponsoring: true, organizing: true, admin: false };

const MY_TICKETS = [
  {
    id: "t1", event: "Africa Tech Festival 2026", date: "12 Mar 2026", venue: "Lagos, Nigeria",
    ticket: "General Admission", status: "confirmed", card: true, grad: "linear-gradient(135deg,#163828,#1F4D3A 55%,#2A6A50)",
  },
  {
    id: "t2", event: "Pan-African Climate Summit", date: "22 Apr 2026", venue: "Nairobi, Kenya",
    ticket: "Delegate Pass", status: "confirmed", card: true, grad: "linear-gradient(160deg,#1F4D3A,#3E7E5E)",
  },
];
const PAST_TICKETS = [
  { id: "t3", event: "University of Nairobi · Class of 2026", date: "Dec 2025", venue: "Nairobi, Kenya", ticket: "Graduate", status: "checked_in", card: true, grad: "linear-gradient(150deg,#122e21,#1F4D3A 70%,#2A6A50)" },
];

const MY_AGENDA = [
  { id: "a1", time: "09:30", day: "Day 1", title: "Opening keynote: The next decade of African tech", room: "Auditorium A", event: "Africa Tech Festival 2026" },
  { id: "a2", time: "11:15", day: "Day 1", title: "Fundraising in a down market", room: "Room 2B", event: "Africa Tech Festival 2026" },
  { id: "a3", time: "14:00", day: "Day 2", title: "Panel: Climate finance across the continent", room: "Main Stage", event: "Pan-African Climate Summit" },
];

const SPEAKING_GROUPS = [
  {
    event: "Africa Tech Festival 2026", eventSlug: "africa-tech-fest",
    sessions: [
      { id: "s1", title: "Building fintech rails for 1B people", time: "Day 1 · 11:00", room: "Main Stage" },
      { id: "s2", title: "Workshop: Product-market fit in emerging markets", time: "Day 2 · 15:30", room: "Room 4" },
    ],
  },
];
const OPEN_CFPS = [
  { event: "Global Halal Summit", eventSlug: "halal-summit", deadline: "18 Aug 2026", daysLeft: 44 },
];
const MY_SUBMISSIONS = [
  { id: "sub1", title: "Designing for offline-first check-in", event: "Pan-African Climate Summit", status: "accept", submitted: "2 Jun 2026" },
];
const SUB_STATUS = {
  pending: { label: "Pending", tone: "amber" },
  accept: { label: "Accepted", tone: "green" },
  reject: { label: "Declined", tone: "red" },
  revision: { label: "Revision", tone: "amber" },
  waitlist: { label: "Waitlisted", tone: "neutral" },
};

const SPONSOR_BOOTHS = [
  {
    id: "b1", company: "Paystack", tier: "Platinum", booth: "A1", event: "Africa Tech Festival 2026",
    leads: 142, hot: 58, warm: 51, cold: 33, resources: 4,
    grad: "linear-gradient(135deg,#1F4D3A,#2A6A50)",
  },
];
const SPONSOR_LEADS = [
  ["Amara Okeke", "Investor · TLcom Capital", "Hot", "green"],
  ["David Mwangi", "Founder · Twiga Foods", "Warm", "gold"],
  ["Zainab Bello", "Product Lead · Flutterwave", "Hot", "green"],
  ["Thabo Nkosi", "Engineer · Yoco", "Cold", "neutral"],
];
const SPONSOR_RESOURCES = [
  ["Product one-pager", "PDF · 2.1 MB", "84 opens"],
  ["API documentation", "Link", "62 opens"],
  ["Case study · Bolt", "PDF · 4.4 MB", "38 opens"],
];
const SPONSOR_TEAM = [
  ["Samuel Adeyemi", "Booth lead", "linear-gradient(135deg,#1F4D3A,#2A6A50)"],
  ["Chioma Eze", "Sales", "linear-gradient(135deg,#3E7E5E,#C9A45E)"],
];

Object.assign(window, {
  HAT_DEFAULT, MY_TICKETS, PAST_TICKETS, MY_AGENDA,
  SPEAKING_GROUPS, OPEN_CFPS, MY_SUBMISSIONS, SUB_STATUS,
  SPONSOR_BOOTHS, SPONSOR_LEADS, SPONSOR_RESOURCES, SPONSOR_TEAM,
});
