import { Router } from 'express';
import { authenticate } from '../../common/middleware/authenticate';
import { validateBody, validateParams, validateQuery } from '../../common/middleware/validate';
import { createTask, deleteTask, getTask, listTasks, updateTask } from './tasks.controller';
import {
  createTaskSchema,
  listTasksQuerySchema,
  projectTaskParamsSchema,
  taskIdParamsSchema,
  updateTaskSchema,
} from './tasks.schemas';

export const taskNestedRouter = Router({ mergeParams: true });
taskNestedRouter.get(
  '/',
  authenticate,
  validateParams(projectTaskParamsSchema),
  validateQuery(listTasksQuerySchema),
  listTasks,
);
taskNestedRouter.post(
  '/',
  authenticate,
  validateParams(projectTaskParamsSchema),
  validateBody(createTaskSchema),
  createTask,
);

export const tasksRouter = Router();
tasksRouter.get('/:id', authenticate, validateParams(taskIdParamsSchema), getTask);
tasksRouter.patch(
  '/:id',
  authenticate,
  validateParams(taskIdParamsSchema),
  validateBody(updateTaskSchema),
  updateTask,
);
tasksRouter.delete('/:id', authenticate, validateParams(taskIdParamsSchema), deleteTask);