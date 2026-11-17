import { ClientBuilder } from "@commercetools/sdk-client-v2";
import { createApiBuilderFromCtpClient } from "@commercetools/platform-sdk";

const projectKey = process.env.CT_PROJECT_KEY;
const authUrl = process.env.CT_AUTH_URL;
const apiUrl = process.env.CT_API_URL;
const clientId = process.env.CT_CLIENT_ID;
const clientSecret = process.env.CT_CLIENT_SECRET;

export const hasCtpCredentials = Boolean(projectKey && authUrl && apiUrl && clientId && clientSecret);

const ctpClient = hasCtpCredentials
  ? new ClientBuilder()
      .withClientCredentialsFlow({
        host: authUrl!,
        projectKey: projectKey!,
        credentials: {
          clientId: clientId!,
          clientSecret: clientSecret!,
        },
        scopes: [
          `manage_project:${projectKey}`,
        ],
      })
      .withHttpMiddleware({
        host: apiUrl!,
      })
      .build()
  : null;

export const apiRoot = hasCtpCredentials
  ? createApiBuilderFromCtpClient(ctpClient!).withProjectKey({
      projectKey: projectKey!,
    })
  : null;
