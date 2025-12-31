export type DeploymentMode = 'cloud' | 'self-hosted' | 'local';

/**
 * Returns the authoritative deployment mode.
 * Should primarily be used in server-side code (Middleware, Server Components, API routes).
 * 
 * Priority:
 * 1. DEPLOYMENT_MODE (Server-only authoritative flag)
 * 2. NEXT_PUBLIC_DEPLOYMENT_MODE (Legacy/Client-shared flag)
 * 3. 'self-hosted' (Default)
 */
export function getDeploymentMode(): DeploymentMode {
  const serverMode = process.env.DEPLOYMENT_MODE;
  if (serverMode === 'cloud' || serverMode === 'self-hosted' || serverMode === 'local') {
    return serverMode;
  }

  const publicMode = process.env.NEXT_PUBLIC_DEPLOYMENT_MODE;
  if (publicMode === 'cloud' || publicMode === 'self-hosted' || publicMode === 'local') {
    return publicMode;
  }

  return 'self-hosted';
}

/**
 * Returns the deployment mode for client-side code.
 * Only reads the public environment variable.
 */
export function getPublicDeploymentMode(): DeploymentMode {
  const publicMode = process.env.NEXT_PUBLIC_DEPLOYMENT_MODE;
  if (publicMode === 'cloud' || publicMode === 'self-hosted' || publicMode === 'local') {
    return publicMode;
  }
  
  return 'self-hosted';
}
