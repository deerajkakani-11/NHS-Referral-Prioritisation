import { Router, type IRouter } from "express";
import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { db, appointmentSlotsTable, referralsTable } from "@workspace/db";
import {
  BookReferralBody,
  BookReferralParams,
  BookReferralResponse,
  CreateReferralBody,
  CreateReferralResponse,
  GetDashboardSummaryResponse,
  GetReferralParams,
  GetReferralResponse,
  ListAppointmentSlotsQueryParams,
  ListAppointmentSlotsResponse,
  ListReferralsQueryParams,
  ListReferralsResponse,
  ReviewReferralBody,
  ReviewReferralParams,
  ReviewReferralResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

type Evidence = {
  label: string;
  detail: string;
  contribution: number;
  type: "clinical" | "waiting_time" | "safety_net";
};

const seedReferrals = [
  {
    id: "REF-1048",
    patientReference: "PAT-204871",
    patientName: "Amira Khan",
    dateOfBirth: "1978-04-22",
    postcode: "LS6 2AB",
    specialty: "Respiratory",
    referrer: "Oakfield Medical Centre",
    receivedAt: new Date("2026-09-02T08:45:00.000Z"),
    status: "needs_review",
    priority: "urgent",
    priorityScore: 88,
    confidence: 94,
    summary: "Progressive breathlessness with haemoptysis and unintentional weight loss over eight weeks.",
    symptoms: ["Progressive breathlessness", "Haemoptysis", "Weight loss"],
    evidence: [
      { label: "Red flag symptoms", detail: "Haemoptysis and unexplained weight loss detected", contribution: 42, type: "clinical" },
      { label: "Clinical trajectory", detail: "Symptoms worsening over the last 8 weeks", contribution: 26, type: "clinical" },
      { label: "Waiting time", detail: "3 days of the 14-day target elapsed", contribution: 14, type: "waiting_time" },
      { label: "Safety net", detail: "Urgent review recommended if symptoms worsen", contribution: 6, type: "safety_net" },
    ] satisfies Evidence[],
    waitingDays: 3,
    targetDays: 14,
    clinicianPriority: null,
    clinicianNote: null,
    bookedSlotId: null,
    updatedAt: new Date("2026-09-02T08:45:00.000Z"),
  },
  {
    id: "REF-1046",
    patientReference: "PAT-513902",
    patientName: "Daniel Okafor",
    dateOfBirth: "1952-11-08",
    postcode: "M20 4JR",
    specialty: "Cardiology",
    referrer: "Riverside GP Practice",
    receivedAt: new Date("2026-08-29T14:20:00.000Z"),
    status: "needs_review",
    priority: "soon",
    priorityScore: 71,
    confidence: 89,
    summary: "New exertional chest discomfort with reduced exercise tolerance and a history of hypertension.",
    symptoms: ["Exertional chest discomfort", "Reduced exercise tolerance", "Hypertension"],
    evidence: [
      { label: "Clinical presentation", detail: "New exertional symptoms in a higher-risk patient", contribution: 34, type: "clinical" },
      { label: "Waiting time", detail: "7 days of the 28-day target elapsed", contribution: 25, type: "waiting_time" },
      { label: "Safety net", detail: "Escalate for symptoms at rest or acute deterioration", contribution: 12, type: "safety_net" },
    ] satisfies Evidence[],
    waitingDays: 7,
    targetDays: 28,
    clinicianPriority: null,
    clinicianNote: null,
    bookedSlotId: null,
    updatedAt: new Date("2026-08-29T14:20:00.000Z"),
  },
  {
    id: "REF-1042",
    patientReference: "PAT-779144",
    patientName: "Sophie Williams",
    dateOfBirth: "1991-03-17",
    postcode: "BD3 7HN",
    specialty: "Musculoskeletal",
    referrer: "Moorland Health Partnership",
    receivedAt: new Date("2026-08-21T09:10:00.000Z"),
    status: "reviewed",
    priority: "routine",
    priorityScore: 46,
    confidence: 91,
    summary: "Persistent shoulder pain affecting sleep and work despite six weeks of conservative management.",
    symptoms: ["Persistent shoulder pain", "Sleep disturbance", "Reduced function"],
    evidence: [
      { label: "Duration", detail: "Symptoms present for more than 6 weeks", contribution: 18, type: "clinical" },
      { label: "Functional impact", detail: "Sleep and work affected", contribution: 16, type: "clinical" },
      { label: "Waiting time", detail: "15 days of the 42-day target elapsed", contribution: 12, type: "waiting_time" },
    ] satisfies Evidence[],
    waitingDays: 15,
    targetDays: 42,
    clinicianPriority: "routine",
    clinicianNote: "Suitable for routine pathway with physiotherapy-first assessment.",
    bookedSlotId: null,
    updatedAt: new Date("2026-08-22T10:35:00.000Z"),
  },
  {
    id: "REF-1039",
    patientReference: "PAT-640218",
    patientName: "Tom Bradley",
    dateOfBirth: "1985-07-04",
    postcode: "S10 3PQ",
    specialty: "Dermatology",
    referrer: "Westbrook Surgery",
    receivedAt: new Date("2026-08-12T16:00:00.000Z"),
    status: "booked",
    priority: "soon",
    priorityScore: 63,
    confidence: 86,
    summary: "Changing pigmented lesion on upper back with recent asymmetry and colour variation.",
    symptoms: ["Changing lesion", "Asymmetry", "Colour variation"],
    evidence: [
      { label: "Change observed", detail: "Recent change in size and colour", contribution: 31, type: "clinical" },
      { label: "Waiting time", detail: "24 days of the 28-day target elapsed", contribution: 24, type: "waiting_time" },
      { label: "Safety net", detail: "Patient advised to report bleeding or rapid change", contribution: 8, type: "safety_net" },
    ] satisfies Evidence[],
    waitingDays: 24,
    targetDays: 28,
    clinicianPriority: "soon",
    clinicianNote: "Booked following clinician review.",
    bookedSlotId: "SLOT-0912",
    updatedAt: new Date("2026-08-13T09:00:00.000Z"),
  },
  {
    id: "REF-1036",
    patientReference: "PAT-350611",
    patientName: "Margaret Lewis",
    dateOfBirth: "1946-12-19",
    postcode: "YO1 8RT",
    specialty: "Ophthalmology",
    referrer: "City Gate Practice",
    receivedAt: new Date("2026-08-04T11:30:00.000Z"),
    status: "needs_review",
    priority: "soon",
    priorityScore: 59,
    confidence: 82,
    summary: "Gradual visual disturbance with difficulty reading and glare while driving at night.",
    symptoms: ["Visual disturbance", "Reading difficulty", "Night glare"],
    evidence: [
      { label: "Functional impact", detail: "Driving and reading affected", contribution: 27, type: "clinical" },
      { label: "Waiting time", detail: "32 days of the 56-day target elapsed", contribution: 22, type: "waiting_time" },
      { label: "Safety net", detail: "Immediate assessment if sudden visual loss occurs", contribution: 10, type: "safety_net" },
    ] satisfies Evidence[],
    waitingDays: 32,
    targetDays: 56,
    clinicianPriority: null,
    clinicianNote: null,
    bookedSlotId: null,
    updatedAt: new Date("2026-08-04T11:30:00.000Z"),
  },
];

const seedSlots = [
  { id: "SLOT-0912", specialty: "Dermatology", clinician: "Dr. Priya Shah", location: "St James's Hospital · Clinic 4", startsAt: new Date("2026-09-08T09:00:00.000Z"), durationMinutes: 30, available: "false" },
  { id: "SLOT-0913", specialty: "Respiratory", clinician: "Dr. Helen Morris", location: "Leeds General Infirmary · Outpatients 2", startsAt: new Date("2026-09-08T10:30:00.000Z"), durationMinutes: 45, available: "true" },
  { id: "SLOT-0914", specialty: "Cardiology", clinician: "Dr. Michael Chen", location: "Seacroft Hospital · Cardiology", startsAt: new Date("2026-09-09T13:00:00.000Z"), durationMinutes: 30, available: "true" },
  { id: "SLOT-0915", specialty: "Ophthalmology", clinician: "Dr. Aisha Rahman", location: "York Hospital · Eye Clinic", startsAt: new Date("2026-09-10T15:15:00.000Z"), durationMinutes: 30, available: "true" },
  { id: "SLOT-0916", specialty: "Musculoskeletal", clinician: "Alex Green, ACP", location: "Chapel Allerton Hospital · MSK", startsAt: new Date("2026-09-11T11:45:00.000Z"), durationMinutes: 30, available: "true" },
];

async function ensureSeeded(): Promise<void> {
  const [{ referralCount }] = await db.select({ referralCount: count() }).from(referralsTable);
  if (referralCount === 0) {
    await db.insert(referralsTable).values(seedReferrals);
  }
  const [{ slotCount }] = await db.select({ slotCount: count() }).from(appointmentSlotsTable);
  if (slotCount === 0) {
    await db.insert(appointmentSlotsTable).values(seedSlots);
  }
}

function toReferral(row: typeof referralsTable.$inferSelect) {
  return {
    ...row,
    priorityScore: Number(row.priorityScore),
    confidence: Number(row.confidence) / 100,
    waitingDays: Number(row.waitingDays),
    targetDays: Number(row.targetDays),
    evidence: row.evidence as Evidence[],
  };
}

function toSlot(row: typeof appointmentSlotsTable.$inferSelect) {
  return {
    ...row,
    durationMinutes: Number(row.durationMinutes),
    available: row.available === "true",
  };
}

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  await ensureSeeded();
  const referrals = await db.select().from(referralsTable);
  const today = new Date("2026-09-05T00:00:00.000Z");
  const dueThisWeek = referrals.filter((referral) => referral.targetDays - referral.waitingDays <= 7 && referral.status !== "booked").length;
  const specialtyMap = new Map<string, number>();
  for (const referral of referrals) specialtyMap.set(referral.specialty, (specialtyMap.get(referral.specialty) ?? 0) + 1);
  const summary = {
    totalReferrals: referrals.length,
    needsReview: referrals.filter((referral) => referral.status === "needs_review").length,
    urgent: referrals.filter((referral) => referral.priority === "urgent").length,
    dueThisWeek,
    bookedToday: referrals.filter((referral) => referral.status === "booked" && referral.updatedAt >= today).length,
    averageReviewHours: 2.6,
    lastUpdated: new Date(),
    specialtyBreakdown: Array.from(specialtyMap, ([specialty, count]) => ({ specialty, count })),
  };
  res.json(GetDashboardSummaryResponse.parse(summary));
});

router.get("/referrals", async (req, res): Promise<void> => {
  await ensureSeeded();
  const parsed = ListReferralsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { status, priority, search } = parsed.data;
  const filters = [];
  if (status) filters.push(eq(referralsTable.status, status));
  if (priority) filters.push(eq(referralsTable.priority, priority));
  if (search) {
    filters.push(or(ilike(referralsTable.patientName, `%${search}%`), ilike(referralsTable.patientReference, `%${search}%`), ilike(referralsTable.specialty, `%${search}%`)));
  }
  const rows = await db.select().from(referralsTable).where(filters.length ? and(...filters) : undefined).orderBy(desc(referralsTable.priorityScore), asc(referralsTable.receivedAt));
  res.json(ListReferralsResponse.parse(rows.map(toReferral)));
});

router.post("/referrals", async (req, res): Promise<void> => {
  const parsed = CreateReferralBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { data } = parsed;
  const id = `REF-${Math.floor(1000 + Math.random() * 8999)}`;
  const row = {
    id,
    patientReference: data.patientReference,
    patientName: data.patientName,
    dateOfBirth: data.dateOfBirth,
    postcode: data.postcode,
    specialty: data.specialty,
    referrer: data.referrer,
    receivedAt: new Date(),
    status: "needs_review",
    priority: "routine",
    priorityScore: 32,
    confidence: 70,
    summary: data.summary,
    symptoms: data.symptoms,
    evidence: [{ label: "Initial triage", detail: "Awaiting clinician review of referral information", contribution: 32, type: "clinical" }] satisfies Evidence[],
    waitingDays: 0,
    targetDays: 42,
    clinicianPriority: null,
    clinicianNote: null,
    bookedSlotId: null,
    updatedAt: new Date(),
  };
  const [created] = await db.insert(referralsTable).values(row).returning();
  res.status(201).json(CreateReferralResponse.parse(toReferral(created)));
});

router.get("/referrals/:id", async (req, res): Promise<void> => {
  const params = GetReferralParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await ensureSeeded();
  const [row] = await db.select().from(referralsTable).where(eq(referralsTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Referral not found" });
    return;
  }
  res.json(GetReferralResponse.parse(toReferral(row)));
});

router.patch("/referrals/:id", async (req, res): Promise<void> => {
  const params = ReviewReferralParams.safeParse(req.params);
  const body = ReviewReferralBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const { decision, note, reviewer } = body.data;
  const [row] = await db.update(referralsTable).set({
    status: decision === "decline" ? "declined" : "reviewed",
    priority: decision === "decline" ? "routine" : decision,
    clinicianPriority: decision === "decline" ? null : decision,
    clinicianNote: note ?? `Reviewed by ${reviewer}`,
    updatedAt: new Date(),
  }).where(eq(referralsTable.id, params.data.id)).returning();
  if (!row) {
    res.status(404).json({ error: "Referral not found" });
    return;
  }
  res.json(ReviewReferralResponse.parse(toReferral(row)));
});

router.get("/appointment-slots", async (req, res): Promise<void> => {
  await ensureSeeded();
  const parsed = ListAppointmentSlotsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const filters = [eq(appointmentSlotsTable.available, "true")];
  if (parsed.data.specialty) filters.push(eq(appointmentSlotsTable.specialty, parsed.data.specialty));
  const rows = await db.select().from(appointmentSlotsTable).where(and(...filters)).orderBy(asc(appointmentSlotsTable.startsAt));
  res.json(ListAppointmentSlotsResponse.parse(rows.map(toSlot)));
});

router.post("/referrals/:id/book", async (req, res): Promise<void> => {
  const params = BookReferralParams.safeParse(req.params);
  const body = BookReferralBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [slot] = await db.select().from(appointmentSlotsTable).where(eq(appointmentSlotsTable.id, body.data.slotId));
  if (!slot || slot.available !== "true") {
    res.status(404).json({ error: "Appointment slot not found or already booked" });
    return;
  }
  const [row] = await db.update(referralsTable).set({
    status: "booked",
    bookedSlotId: slot.id,
    updatedAt: new Date(),
  }).where(eq(referralsTable.id, params.data.id)).returning();
  if (!row) {
    res.status(404).json({ error: "Referral not found" });
    return;
  }
  await db.update(appointmentSlotsTable).set({ available: "false" }).where(eq(appointmentSlotsTable.id, slot.id));
  res.json(BookReferralResponse.parse(toReferral(row)));
});

export default router;