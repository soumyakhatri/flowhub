import { badRequest } from '../errors/AppError.js';
export function routeParam(req, name) {
    const value = req.params[name];
    if (!value) {
        throw badRequest('Missing route parameter: ' + name);
    }
    return value;
}
