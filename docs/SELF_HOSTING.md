# Self-Hosting Guide

This guide explains how to deploy PromptManager, either locally for development or in production with Supabase Cloud.

## Deployment Architecture

PromptManager uses a split architecture:

| Component                | Local Development          | Production                      |
| ------------------------ | -------------------------- | ------------------------------- |
| **Next.js App**          | `npm run dev` on localhost | Your VPS, Vercel, Railway, etc. |
| **Supabase (DB + Auth)** | `supabase start` (Docker)  | Supabase Cloud (Managed)        |
| **Configuration**        | `supabase/config.toml`     | Supabase Dashboard (web UI)     |

> [!IMPORTANT]
> The `supabase/config.toml` file is **only used for local development** with `supabase start`. When connecting to Supabase Cloud, all configuration is done via the Supabase Dashboard.

---

## Local Development Setup

### Prerequisites

- Node.js 18+
- Docker (for local Supabase)
- Supabase CLI (`npm install -g supabase`)

### Steps

1.  **Clone and install:**
    ```bash
    git clone https://github.com/your-org/prompt-manager.git
    cd prompt-manager
    npm install
    ```

2.  **Start local Supabase:**
    ```bash
    npx supabase start
    ```
    This uses `supabase/config.toml` which has email confirmation **disabled** for fast iteration.

3.  **Create `.env.local`:**
    ```bash
    cp .env.local.example .env.local
    ```
    The `supabase start` command outputs the URL and anon key. Add them:
    ```
    NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key
    ```

4.  **Run the app:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000).

**Local Email Testing:** Emails are captured by InBucket at `http://localhost:54324`.

---

## Production Deployment (Supabase Cloud)

### 1. Create a Supabase Project

Go to [supabase.com](https://supabase.com) and create a new project.

### 2. Configure Authentication in the Dashboard

All auth settings are configured in the Supabase Dashboard, **not** `config.toml`.

#### Site URL & Redirect URLs

In **Authentication > URL Configuration**:

-   **Site URL**: `https://your-production-domain.com`
-   **Redirect URLs**: Add `https://your-production-domain.com/**` (or specific paths like `/auth/callback`)

#### Email Confirmation

In **Authentication > Email**:

-   **Confirm email**: Toggle ON for production security.
-   **SMTP Provider**: Configure your SMTP provider (SendGrid, Resend, etc.) for sending confirmation emails.

#### OAuth Providers (Optional)

In **Authentication > Providers**:

1.  Enable Google and/or GitHub.
2.  Add Client ID and Secret from your OAuth app registrations.
3.  Use the redirect URL shown by Supabase: `https://<your-project>.supabase.co/auth/v1/callback`.

### 3. Run Database Migrations

Link your local project to the cloud project:

```bash
npx supabase link --project-ref your-project-ref
npx supabase db push
```

### 4. Deploy Your Next.js App

Set environment variables on your hosting platform (Vercel, Railway, VPS, etc.):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
```

Build and start:

```bash
npm run build
npm start
```

---

## Environment Variables Reference

### Required

| Variable                        | Description                                   |
| ------------------------------- | --------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL.                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key (safe to expose). |

### Optional

| Variable                          | Description                                                   |
| --------------------------------- | ------------------------------------------------------------- |
| `NEXT_PUBLIC_DEPLOYMENT_MODE`     | `cloud`, `self-hosted`, or `local`. Sets defaults for OAuth.  |
| `NEXT_PUBLIC_ENABLE_OAUTH_GOOGLE` | `true` / `false`. Explicitly show/hide Google OAuth button.   |
| `NEXT_PUBLIC_ENABLE_OAUTH_GITHUB` | `true` / `false`. Explicitly show/hide GitHub OAuth button.   |
| `SUPABASE_SERVICE_ROLE_KEY`       | For server-side admin operations. **NEVER expose to client.** |

---

## Security Best Practices

1.  **Never commit `.env.local`**: This file contains secrets for your specific environment.
2.  **Use Docker secrets or runtime injection**: Do not bake secrets into container images.
3.  **`SUPABASE_SERVICE_ROLE_KEY` bypasses RLS**: Only use in server-side code if absolutely required.
4.  **Validate RLS policies**: Test that non-owners cannot access other users' data.
5.  **Use HTTPS in production**: OAuth and session cookies require a secure context.

---

## Deployment Modes

The `NEXT_PUBLIC_DEPLOYMENT_MODE` variable provides sensible defaults for different environments:

| Mode              | OAuth Default | Logic                                                                                      |
| ----------------- | ------------- | ------------------------------------------------------------------------------------------ |
| `cloud` (default) | **Enabled**   | Assumes a managed Supabase project where OAuth is likely already configured.               |
| `self-hosted`     | **Disabled**  | Recommended for VPS deployments. Prevents broken buttons until you explicitly enable them. |
| `local`           | **Disabled**  | Standard local docker development.                                                         |

> [!TIP]
> Explicit variables like `NEXT_PUBLIC_ENABLE_OAUTH_GOOGLE` always take precedence over the deployment mode default.

---

## Troubleshooting

### OAuth Buttons Missing or Disabled

-   **Cause**: The deployment mode is set to `self-hosted` or `local` (which defaults OAuth to disabled), or the variable is not set.
-   **Fix**: 
    1. Set `NEXT_PUBLIC_DEPLOYMENT_MODE=cloud` if using managed Supabase.
    2. Or, explicitly enable a provider: `NEXT_PUBLIC_ENABLE_OAUTH_GOOGLE=true`.

### "auth-code-error" After Email Confirmation

-   **Cause**: The confirmation link expired, or the Supabase Dashboard redirect URLs are misconfigured.
-   **Fix**:
    1.  Check **Authentication > URL Configuration** in your Supabase Dashboard.
    2.  Ensure `Site URL` and `Redirect URLs` match your production domain.
    3.  Re-send the confirmation email or sign up again.

### Email Confirmations Not Sending

-   **Cause**: SMTP is not configured in Supabase Dashboard.
-   **Fix**: Go to **Authentication > Email > SMTP Settings** and configure your provider.

---

## Additional Resources

-   [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
-   [Supabase OAuth Setup](https://supabase.com/docs/guides/auth/social-login)
-   [Next.js Deployment Guide](https://nextjs.org/docs/app/building-your-application/deploying)
