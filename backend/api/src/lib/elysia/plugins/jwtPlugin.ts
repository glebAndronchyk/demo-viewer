import { Elysia } from "elysia";
import jwt from "@elysiajs/jwt";

export const jwtPlugin = (secret: string) => {
  return new Elysia({ name: "jwt-plugin" }).use(jwt({ name: "jwt", secret }));
};
