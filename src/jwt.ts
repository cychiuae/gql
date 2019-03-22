import { sign, verify } from "jsonwebtoken";

const SECRET = "secret";

export function makeToken(userId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    sign(
      {
        sub: userId,
      },
      SECRET,
      (err: Error | null, token: string | null) => {
        if (err) {
          reject(err);
        } else if (token) {
          resolve(token);
        }
      }
    );
  });
}

export function extractUserId(token: string): Promise<string> {
  return new Promise((resolve, reject) => {
    verify(token, SECRET, (err: Error, payload: any) => {
      if (err) {
        reject(err);
      } else if (payload) {
        resolve(payload.sub);
      }
    });
  });
}
