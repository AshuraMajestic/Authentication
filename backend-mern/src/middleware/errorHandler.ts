import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { isProd } from "../config/env";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
    next(ApiError.notFound(`No route for ${req.method} ${req.path}`));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
    if (err instanceof ApiError) {
        return res.status(err.status).json({ error: err.message, code: err.code });
    }


    if (typeof err === "object" && err !== null && "code" in err && (err as { code: unknown }).code === 11000) {
        return res.status(409).json({ error: "That value is already in use." });
    }

    console.error(err);
    res.status(500).json({
        error: "Something went wrong.",
        ...(isProd ? {} : { detail: err instanceof Error ? err.message : String(err) }),
    });
}
