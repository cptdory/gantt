import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getTasks = query({
  handler: async (ctx) => {
    return await ctx.db.query("tasks").collect();
  },
});

export const getTasksByPhase = query({
  args: {
    phaseId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("phaseId"), args.phaseId))
      .collect();
  },
});

export const createTask = mutation({
  args: {
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
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("tasks", {
      id: args.id,
      phaseId: args.phaseId,
      epic: args.epic,
      task: args.task,
      description: args.description,
      owner: args.owner,
      color: args.color,
      status: args.status,
      start: args.start,
      end: args.end,
      so: args.so,
      eo: args.eo,
      order: args.order,
    });
    return taskId;
  },
});

export const updateTask = mutation({
  args: {
    id: v.string(),
    phaseId: v.optional(v.string()),
    epic: v.optional(v.string()),
    task: v.optional(v.string()),
    description: v.optional(v.string()),
    owner: v.optional(v.string()),
    color: v.optional(v.string()),
    status: v.optional(v.string()),
    start: v.optional(v.string()),
    end: v.optional(v.string()),
    so: v.optional(v.number()),
    eo: v.optional(v.number()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existingTask = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("id"), args.id))
      .first();

    if (!existingTask) {
      throw new Error(`Task with id ${args.id} not found`);
    }

    const updates: any = {};
    if (args.phaseId !== undefined) updates.phaseId = args.phaseId;
    if (args.epic !== undefined) updates.epic = args.epic;
    if (args.task !== undefined) updates.task = args.task;
    if (args.description !== undefined) updates.description = args.description;
    if (args.owner !== undefined) updates.owner = args.owner;
    if (args.color !== undefined) updates.color = args.color;
    if (args.status !== undefined) updates.status = args.status;
    if (args.start !== undefined) updates.start = args.start;
    if (args.end !== undefined) updates.end = args.end;
    if (args.so !== undefined) updates.so = args.so;
    if (args.eo !== undefined) updates.eo = args.eo;
    if (args.order !== undefined) updates.order = args.order;

    await ctx.db.patch(existingTask._id, updates);
  },
});

export const bulkCreateTasks = mutation({
  args: {
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
        order: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = [];
    for (const task of args.tasks) {
      const taskId = await ctx.db.insert("tasks", task);
      results.push(taskId);
    }
    return results;
  },
});

export const deleteTask = mutation({
  args: {
    id: v.string(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("id"), args.id))
      .first();

    if (!task) {
      throw new Error(`Task with id ${args.id} not found`);
    }

    await ctx.db.delete(task._id);
  },
});

export const deleteTasksByPhase = mutation({
  args: {
    phaseId: v.string(),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("phaseId"), args.phaseId))
      .collect();

    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }
  },
});

export const updateTaskOrder = mutation({
  args: {
    updates: v.array(
      v.object({
        id: v.string(),
        order: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const { id, order } of args.updates) {
      const task = await ctx.db
        .query("tasks")
        .filter((q) => q.eq(q.field("id"), id))
        .first();

      if (task) {
        await ctx.db.patch(task._id, { order });
      }
    }
  },
});
