import { Request, Response } from "express";

export interface Context {
  req: Request;
  res: Response;
}

export interface SignupInput {
  username: string;
  password: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface SelfUser {
  id: string;
  username: string;
}

export interface User {
  id: string;
}

export interface CreatePostInput {
  content: string;
}

export interface Post {
  id: string;
  author: () => Promise<User>;
  content: string;
}
