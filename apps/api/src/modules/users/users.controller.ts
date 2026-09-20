import { asyncHandler } from '../../common/utils/asyncHandler';
import { requireUser } from '../../common/middleware/authenticate';
import * as usersService from './users.service';

export const getMe = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const data = await usersService.getMe(user.id);
  res.json({ data });
});