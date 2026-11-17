/**
 * Prefix covered by the Cloudflare Access rule.
 * Everything below it — page and API alike — is behind the same login.
 * Changing it here is enough: the router and the services follow.
 */
export const PRIVATE_PREFIX = '/_'
