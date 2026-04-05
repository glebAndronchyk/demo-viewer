// todo: rework with proper di and controllers

const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";

export function buildSteamLoginUrl(callbackUrl: string): string {
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": callbackUrl,
    "openid.realm": new URL(callbackUrl).origin,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });

  return `${STEAM_OPENID_URL}?${params.toString()}`;
}

export async function verifySteamOpenId(
  params: Record<string, string>,
): Promise<string | null> {
  const verifyParams = new URLSearchParams(params as Record<string, string>);
  verifyParams.set("openid.mode", "check_authentication");

  const response = await fetch(STEAM_OPENID_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: verifyParams.toString(),
  });

  const text = await response.text();

  if (!text.includes("is_valid:true")) {
    return null;
  }

  const claimedId = params["openid.claimed_id"] ?? "";
  const match = claimedId.match(/\/id\/(\d+)$/);
  return match ? match[1] : null;
}
