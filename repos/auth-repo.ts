import { SessionStore, StateStore } from '@/repos/storage';
import {
  NodeOAuthClient,
  OAuthClientMetadataInput,
} from '@atproto/oauth-client-node';

export const blueskyClientMetadata = (): OAuthClientMetadataInput => {
  const baseUrl: string = process.env.NEXT_PUBLIC_URL as string;

  return {
    client_name: `${baseUrl}`,
    client_id: `${baseUrl}/oauth/client-metadata.json`,
    client_uri: `${baseUrl}`,
    redirect_uris: [`${baseUrl}/oauth/callback`],
    policy_uri: `${baseUrl}/policy`,
    tos_uri: `${baseUrl}/tos`,
    scope: 'atproto transition:generic',
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    application_type: 'web',
    token_endpoint_auth_method: 'none',
    dpop_bound_access_tokens: true,
  };
};

export const createBlueskyOAuthClient = async () => {
  console.log('Bluesky Client Metadata:', blueskyClientMetadata());

  return new NodeOAuthClient({
    clientMetadata: blueskyClientMetadata(),
    stateStore: new StateStore(),
    sessionStore: new SessionStore(),
  });
};
