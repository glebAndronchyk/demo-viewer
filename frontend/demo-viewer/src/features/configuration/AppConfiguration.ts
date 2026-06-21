export class AppConfiguration {
  static get apiUrl(): string {
    return import.meta.env.API_URL || "http://localhost:3000";
  }
}
