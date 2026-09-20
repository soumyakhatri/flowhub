import { z } from 'zod';
import { objectIdSchema } from '../../common/schemas/objectId';
import { paginationQuerySchema } from '../../common/utils/pagination';
import { TASK_PRIORITIES, TASK_STATUSES } from './tasks.types';

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(8000).optional(),
  status: z.enum(TASK_STATUSES).default('todo'),
  priority: z.enum(TASK_PRIORITIES).default('medium'),
  assigneeId: objectIdSchema.optional(),
  dueDate: z.coerce.date().optional(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(8000).nullable(),
    status: z.enum(TASK_STATUSES),
    priority: z.enum(TASK_PRIORITIES),
    assigneeId: objectIdSchema.nullable(),
    dueDate: z.coerce.date().nullable(),
  })
  .partial();

export const listTasksQuerySchema = paginationQuerySchema.extend({
  status: z.enum(TASK_STATUSES).optional(),
  sort: z.enum(['createdAt', 'updatedAt', 'dueDate', 'priority']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const taskIdParamsSchema = z.object({
  id: objectIdSchema,
});

export const projectTaskParamsSchema = z.object({
  projectId: objectIdSchema,
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;