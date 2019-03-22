import { hash, compare } from "bcrypt";

const saltRounds = 10;

export function hashPassword(plain: string): Promise<string> {
  return new Promise((resolve, reject) => {
    hash(plain, saltRounds, (err, hashed) => {
      if (err) {
        reject(err);
      } else {
        resolve(hashed);
      }
    });
  });
}

export function comparePassword(
  plain: string,
  hashed: string
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    compare(plain, hashed, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}
