import { Type, type Static } from "@sinclair/typebox";

export const TasksJobSchema = Type.Object({
  taskId: Type.String(),
});

export type TasksJobData = Static<typeof TasksJobSchema>;

export const TasksJobResponseSchema = Type.Object({
  jobId: Type.String(),
});
