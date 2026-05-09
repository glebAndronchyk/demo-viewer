import { type LoaderFunctionArgs, redirect } from "react-router";
import type { AuthUser } from "../../../modules/auth";
import { endOfMonth, format, subMonths } from "date-fns";

/**
 * Prepares steamId and date for querying the stats
 * @param args
 * @param user
 */
export const basicStatsLoader = (
  args: LoaderFunctionArgs,
  user: AuthUser | null,
) => {
  const { request } = args;
  const url = new URL(request.url);
  const steamId = url.searchParams.get("steamId") ?? user?.steamId;
  const startDate =
    url.searchParams.get("startDate") ??
    format(subMonths(endOfMonth(new Date()), 1), "yyyy-MM-dd"); // 1 month back from now

  if (!steamId) throw redirect("/");

  return {
    steamId,
    startDate,
  };
};
