# PromptManager

An open-source, self-hostable prompt management platform for automation engineers and developers.

## Features

- **Prompt Management**: Create, edit, and organize AI prompts
- **Version Control**: Track revisions and history
- **Forking & Remixing**: Fork prompts with attribution
- **Variable Support**: Use variables in prompts with live preview
- **Public & Private**: Control visibility of your prompts
- **Self-Hostable**: Deploy on your own infrastructure

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (cloud or self-hosted)

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/your-org/prompt-manager.git
cd prompt-manager
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_DEPLOYMENT_MODE=cloud
```

4. Set up Supabase:
```bash
# Start local Supabase (requires Docker)
# Uses config.toml with email confirmation disabled for local dev
npx supabase start

# Or link to cloud project
npx supabase link --project-ref your-project-ref

# Run migrations
npx supabase db push

# Seed data (optional)
npx supabase db seed
```

**Note:** For production deployment with Supabase Cloud, configure authentication settings via the Supabase Dashboard. See [Self-Hosting Guide](docs/SELF_HOSTING.md).

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Testing

This project uses `vitest` for unit and component integration tests.

Run the test suite:

```bash
npm test
```

Watch mode (reruns tests on file changes):

```bash
npm run test:watch
```

Vitest UI:

```bash
npm run test:ui
```

## Authentication

PromptManager supports multiple authentication methods:

- **Email/Password**: Always available, works out of the box
- **OAuth Providers** (Google, GitHub): Requires configuration in self-hosted environments

For self-hosted deployments, OAuth providers need to be configured in your Supabase instance. The application automatically detects OAuth availability and shows/hides OAuth buttons accordingly.

See the [Self-Hosting Guide](docs/SELF_HOSTING.md) for detailed authentication setup instructions.

## Self-Hosting

PromptManager is designed to be self-hostable. For detailed self-hosting instructions, including OAuth configuration, see the [Self-Hosting Guide](docs/SELF_HOSTING.md).

### Quick Self-Hosting Steps

1. Clone the repository
2. Set up Supabase (self-hosted or cloud)
3. Configure environment variables
4. Run database migrations
5. Build and deploy

See [docs/SELF_HOSTING.md](docs/SELF_HOSTING.md) for complete instructions.

## Documentation

- [Product Requirements Document](docs/PRD.md)
- [Architecture Documentation](docs/ARCHITECTURE.md)
- [Self-Hosting Guide](docs/SELF_HOSTING.md)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
