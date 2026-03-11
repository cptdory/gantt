import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  phases: defineTable({
    id: v.string(),
    label: v.string(),
    color: v.string(),
    light: v.string(),
    start: v.string(),
    end: v.string(),
    durationDays: v.number(),
    order: v.number(),
  }),
  
  tasks: defineTable({
    id: v.string(),
    phaseId: v.string(),
    epic: v.string(),
    task: v.string(),
    description: v.optional(v.string()), // Task description
    owner: v.string(),
    color: v.string(),
    status: v.string(),
    start: v.string(),
    end: v.string(),
    so: v.number(), // startOffset within phase
    eo: v.number(), // endOffset within phase
    order: v.optional(v.number()), // Task display order
  }),
});