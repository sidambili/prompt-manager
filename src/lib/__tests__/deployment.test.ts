import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDeploymentMode, getPublicDeploymentMode } from '../deployment';

describe('deployment module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getDeploymentMode', () => {
    it('defaults to self-hosted when no env vars are set', () => {
      delete process.env.DEPLOYMENT_MODE;
      delete process.env.NEXT_PUBLIC_DEPLOYMENT_MODE;
      expect(getDeploymentMode()).toBe('self-hosted');
    });

    it('uses DEPLOYMENT_MODE if set', () => {
      process.env.DEPLOYMENT_MODE = 'cloud';
      process.env.NEXT_PUBLIC_DEPLOYMENT_MODE = 'self-hosted';
      expect(getDeploymentMode()).toBe('cloud');
    });

    it('falls back to NEXT_PUBLIC_DEPLOYMENT_MODE if DEPLOYMENT_MODE is not set', () => {
      delete process.env.DEPLOYMENT_MODE;
      process.env.NEXT_PUBLIC_DEPLOYMENT_MODE = 'local';
      expect(getDeploymentMode()).toBe('local');
    });

    it('ignores invalid values and falls back', () => {
      process.env.DEPLOYMENT_MODE = 'invalid-mode';
      process.env.NEXT_PUBLIC_DEPLOYMENT_MODE = 'cloud';
      expect(getDeploymentMode()).toBe('cloud');
    });

    it('ignores invalid values and uses default if both are invalid', () => {
      process.env.DEPLOYMENT_MODE = 'invalid';
      process.env.NEXT_PUBLIC_DEPLOYMENT_MODE = 'also-invalid';
      expect(getDeploymentMode()).toBe('self-hosted');
    });
  });

  describe('getPublicDeploymentMode', () => {
    it('defaults to self-hosted when no env vars are set', () => {
      delete process.env.NEXT_PUBLIC_DEPLOYMENT_MODE;
      expect(getPublicDeploymentMode()).toBe('self-hosted');
    });

    it('uses NEXT_PUBLIC_DEPLOYMENT_MODE if set', () => {
      process.env.NEXT_PUBLIC_DEPLOYMENT_MODE = 'cloud';
      expect(getPublicDeploymentMode()).toBe('cloud');
    });

    it('ignores invalid values and uses default', () => {
      process.env.NEXT_PUBLIC_DEPLOYMENT_MODE = 'invalid';
      expect(getPublicDeploymentMode()).toBe('self-hosted');
    });
  });
});
