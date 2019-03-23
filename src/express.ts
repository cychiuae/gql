import { Request, Response, RequestHandler, NextFunction } from "express";

const ACCESS_TOKEN = "access_token";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  res.status(400).json({
    message: err.message,
  });
}

export function asyncHandler(
  f: (req: Request, res: Response) => Promise<unknown>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    f(req, res)
      .then(result => {
        if (typeof result === "string") {
          res.status(200).send(result);
        } else if (
          typeof result === "object" &&
          result != null &&
          !Array.isArray(result)
        ) {
          res.status(200).json(result);
        } else {
          res.end();
        }
        next();
      })
      .catch(next);
  };
}

export function readAccessTokenFromRequest(req: Request): string | null {
  const accessToken = req.cookies[ACCESS_TOKEN];
  if (typeof accessToken === "string") {
    return accessToken;
  }
  return null;
}

export function writeAccessToken(res: Response, token: string) {
  res.cookie(ACCESS_TOKEN, token, {
    httpOnly: true,
    maxAge: 60 * 60 * 1000,
  });
}

export function ensureNoAccessToken(req: Request, res: Response) {
  const accessToken = readAccessTokenFromRequest(req);
  if (accessToken != null) {
    res.cookie(ACCESS_TOKEN, "", {
      expires: new Date("1970-01-01T00:00:00Z"),
    });
    throw new Error("unexpected access token");
  }
}
