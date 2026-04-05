import { Elysia, t } from "elysia";
import jwt from "@elysiajs/jwt";

export const JwtSchema = t.Object({
  userId: t.String(),
  steamId: t.String(),
  sub: t.String(),
});

export const jwtPlugin = (secret: string) => {
  return new Elysia({ name: "jwt-plugin" }).use(
    jwt({ name: "jwt", secret, schema: JwtSchema }),
  );
};
