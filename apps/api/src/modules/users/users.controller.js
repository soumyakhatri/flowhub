import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { requireUser } from '../../common/middleware/authenticate.js';
import * as usersService from './users.service.js';
export const getMe = asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const data = await usersService.getMe(user.id);
    res.json({ data });
});
