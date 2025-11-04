import { query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").collect();
    return tasks.map((task) => ({
      _id: task._id,
      _creationTime: task._creationTime,
      text: task.text,
      completed: task.completed ?? task.isCompleted ?? false,
    }));
  },
});
