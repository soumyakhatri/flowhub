import { requireUser } from '../../common/middleware/authenticate.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { routeParam } from '../../common/utils/params.js';
import * as tasksService from './tasks.service.js';
export const createTask = asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const data = await tasksService.createTask(user.id, routeParam(req, 'projectId'), req.body);
    res.status(201).json({ data });
});
export const listTasks = asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const result = await tasksService.listTasks(user.id, routeParam(req, 'projectId'), req.query);
    res.json(result);
});
export const getTask = asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const data = await tasksService.getTask(user.id, routeParam(req, 'id'));
    res.json({ data });
});
export const updateTask = asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const data = await tasksService.updateTask(user.id, routeParam(req, 'id'), req.body);
    res.json({ data });
});
export const deleteTask = asyncHandler(async (req, res) => {
    const user = requireUser(req);
    await tasksService.deleteTask(user.id, routeParam(req, 'id'));
    res.status(204).send();
});
