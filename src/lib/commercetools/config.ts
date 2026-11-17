const projectKey = process.env.NEXT_PUBLIC_CT_PROJECT_KEY ?? process.env.CT_PROJECT_KEY ?? "";
const region = process.env.NEXT_PUBLIC_CT_REGION ?? "";
const sessionId = process.env.NEXT_PUBLIC_CT_SESSION_ID ?? "";

export const CHECKOUT_PROJECT_KEY = projectKey;
export const CHECKOUT_REGION = region;
export const CHECKOUT_SESSION_ID = sessionId;

export const IS_CHECKOUT_CONFIGURED = Boolean(projectKey && region);

export const SCOPES = [
  `manage_project:${projectKey}`,
].filter(Boolean);
export const DEFAULT_LOCALE = "en-AU";
