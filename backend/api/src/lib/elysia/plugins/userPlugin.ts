import { Elysia } from "elysia";
import { jwtPlugin } from "./jwtPlugin";

export const userPlugin = (secret: string) => {
  return new Elysia({ name: "user-plugin" })
    .use(jwtPlugin(secret))
    .derive(
      { as: "scoped" },
      async ({ jwt, cookie: { auth }, params, status }) => {
        const data = await jwt.verify(auth.value as any);
        if (!data) {
          return status(401, "Unauthorized");
        }
        if ("id" in params && params.id !== data.sub) {
          return status(403, "Forbidden");
        }
        return data;
      },
    );
};
