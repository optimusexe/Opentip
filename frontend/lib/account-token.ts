export type OAuthTokenInput = {
  access_token?: string | null;
  refresh_token?: string | null;
  expires_at?: number | null;
  token_type?: string | null;
  scope?: string | null;
  id_token?: string | null;
  session_state?: string | null;
};

// Fields worth writing when a GitHub account row already exists.
// Empty values are left alone so a partial payload cannot wipe a token.
export type OAuthTokenUpdate = {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
};

export function oauthTokenUpdate(data: OAuthTokenInput): OAuthTokenUpdate {
  const out: OAuthTokenUpdate = {};
  if (typeof data.access_token === "string" && data.access_token) out.access_token = data.access_token;
  if (typeof data.refresh_token === "string" && data.refresh_token) out.refresh_token = data.refresh_token;
  if (typeof data.expires_at === "number") out.expires_at = data.expires_at;
  if (typeof data.token_type === "string" && data.token_type) out.token_type = data.token_type;
  if (typeof data.scope === "string" && data.scope) out.scope = data.scope;
  if (typeof data.id_token === "string" && data.id_token) out.id_token = data.id_token;
  if (typeof data.session_state === "string" && data.session_state) out.session_state = data.session_state;
  return out;
}
