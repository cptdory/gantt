import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getPhases = query({
  handler: async (ctx) => {
    return await ctx.db.query("phases").collect();
  },
});

export const createPhase = mutation({
  args: {
    id: v.string(),
    label: v.string(),
    color: v.string(),
    light: v.string(),
    start: v.string(),
    end: v.string(),
    durationDays: v.number(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const phaseId = await ctx.db.insert("phases", {
      id: args.id,
      label: args.label,
      color: args.color,
      light: args.light,
      start: args.start,
      end: args.end,
      durationDays: args.durationDays,
      order: args.order,
    });
    return phaseId;
  },
});

export const updatePhase = mutation({
  args: {
    id: v.string(),
    label: v.optional(v.string()),
    color: v.optional(v.string()),
    light: v.optional(v.string()),
    start: v.optional(v.string()),
    end: v.optional(v.string()),
    durationDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const phase = await ctx.db
      .query("phases")
      .filter((q) => q.eq(q.field("id"), args.id))
      .first();

    if (!phase) {
      throw new Error(`Phase with id ${args.id} not found`);
    }

    const updates: any = {};
    if (args.label !== undefined) updates.label = args.label;
    if (args.color !== undefined) updates.color = args.color;
    if (args.light !== undefined) updates.light = args.light;
    if (args.start !== undefined) updates.start = args.start;
    if (args.end !== undefined) updates.end = args.end;
    if (args.durationDays !== undefined) updates.durationDays = args.durationDays;

    await ctx.db.patch(phase._id, updates);
  },
});

export const updatePhases = mutation({
  args: {
    phases: v.array(
      v.object({
        id: v.string(),
        label: v.string(),
        color: v.string(),
        light: v.string(),
        start: v.string(),
        end: v.string(),
        durationDays: v.number(),
        order: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Get all existing phases
    const existingPhases = await ctx.db.query("phases").collect();
    const existingMap = new Map(existingPhases.map((p) => [p.id, p]));

    // Update or create phases
    for (let i = 0; i < args.phases.length; i++) {
      const phaseData = args.phases[i];
      const existing = existingMap.get(phaseData.id);

      if (existing) {
        await ctx.db.patch(existing._id, phaseData);
      } else {
        await ctx.db.insert("phases", phaseData);
      }
    }

    // Delete phases that are no longer in the list
    const newIds = new Set(args.phases.map((p) => p.id));
    for (const phase of existingPhases) {
      if (!newIds.has(phase.id)) {
        await ctx.db.delete(phase._id);
      }
    }
  },
});

export const deletePhase = mutation({
  args: {
    id: v.string(),
  },
  handler: async (ctx, args) => {
    const phase = await ctx.db
      .query("phases")
      .filter((q) => q.eq(q.field("id"), args.id))
      .first();

    if (!phase) {
      throw new Error(`Phase with id ${args.id} not found`);
    }

    await ctx.db.delete(phase._id);
  },
});
