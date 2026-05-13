import { Elysia } from "elysia";
import { jwtPlugin } from "./jwtPlugin";
import { ForbiddenError, UnauthorizedError } from "../../errors/AppErrors";

export const userPlugin = (secret: string) => {
  return new Elysia({ name: "user-plugin" })
    .use(jwtPlugin(secret))
    .derive(
      { as: "scoped" },
      async ({ jwt, cookie: { auth }, params }) => {
        const data = await jwt.verify(auth.value as any);
        if (!data) throw new UnauthorizedError();
        if (params !== null && typeof params === "object" && "id" in params && params.id !== data.sub) {
          throw new ForbiddenError();
        }
        return { sub: data.sub };
      },
    );
};
