CREATE TABLE "user" (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

CREATE TABLE "post" (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES "user"(id),
  content TEXT NOT NULL
);
