import { createInsertSchema } from "drizzle-zod";
import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const referralsTable = pgTable("referrals", {
  id: text("id").primaryKey(),
  patientReference: text("patient_reference").notNull(),
  patientName: text("patient_name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  postcode: text("postcode").notNull(),
  specialty: text("specialty").notNull(),
  referrer: text("referrer").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("needs_review"),
  priority: text("priority").notNull(),
  priorityScore: integer("priority_score").notNull(),
  confidence: integer("confidence").notNull(),
  summary: text("summary").notNull(),
  symptoms: text("symptoms").array().notNull(),
  evidence: jsonb("evidence").notNull(),
  waitingDays: integer("waiting_days").notNull(),
  targetDays: integer("target_days").notNull(),
  clinicianPriority: text("clinician_priority"),
  clinicianNote: text("clinician_note"),
  bookedSlotId: text("booked_slot_id"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const appointmentSlotsTable = pgTable("appointment_slots", {
  id: text("id").primaryKey(),
  specialty: text("specialty").notNull(),
  clinician: text("clinician").notNull(),
  location: text("location").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  available: text("available").notNull().default("true"),
});

export const insertReferralSchema = createInsertSchema(referralsTable);
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referralsTable.$inferSelect;
export type AppointmentSlot = typeof appointmentSlotsTable.$inferSelect;