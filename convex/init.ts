import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const initializeData = mutation({
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
    tasks: v.array(
      v.object({
        id: v.string(),
        phaseId: v.string(),
        epic: v.string(),
        task: v.string(),
        description: v.optional(v.string()),
        owner: v.string(),
        color: v.string(),
        status: v.string(),
        start: v.string(),
        end: v.string(),
        so: v.number(),
        eo: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Check if data already exists
    const existingPhases = await ctx.db.query("phases").collect();
    if (existingPhases.length > 0) {
      return { message: "Data already initialized" };
    }

    // Insert phases
    for (const phase of args.phases) {
      await ctx.db.insert("phases", phase);
    }

    // Insert tasks
    for (const task of args.tasks) {
      await ctx.db.insert("tasks", task);
    }

    return { message: "Data initialized successfully", phasesCount: args.phases.length, tasksCount: args.tasks.length };
  },
});
