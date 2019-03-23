CREATE TABLE "user" (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL
);

CREATE TABLE "post" (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES "user"(id),
  content TEXT NOT NULL
);

CREATE TABLE "user_likes_post" (
  user_id TEXT NOT NULL REFERENCES "user"(id),
  post_id TEXT NOT NULL REFERENCES post(id),
  PRIMARY KEY(user_id, post_id)
);
