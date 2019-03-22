import { serialize, parse } from "cookie";

const ACCESS_TOKEN = "access_token";

export function writeAccessToken(value: string): string {
  return serialize(ACCESS_TOKEN, value, {
    maxAge: 60 * 60,
  });
}

export function readAccessToken(
  header: string | null | undefined
): string | null {
  if (header == null) {
    return null;
  }
  const result = parse(header);
  const value = result[ACCESS_TOKEN];
  if (typeof value === "string") {
    return value;
  }
  return null;
}
