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
  username: string;
}
