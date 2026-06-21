export class AppConfiguration {
  static get apiUrl(): string {
    return import.meta.env.VITE_API_URL || "http://localhost:3000";
  }
}
