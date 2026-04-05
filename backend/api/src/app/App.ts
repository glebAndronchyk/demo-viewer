import { Elysia } from "elysia";
import openapi from "@elysiajs/openapi";

export class App {
  constructor() {
    return new Elysia().use(openapi()).get("/health", () => "up");
  }

  static getTypedConstructor() {
    return App as never as typeof Elysia;
  }
}
