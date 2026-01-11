Starter web app built on Next.js 15. It includes:
- Better Auth handler at `app/api/auth/[...all]/route.ts`
- tRPC handler at `app/api/trpc/[trpc]/route.ts`
- Auth pages (`/auth/sign-in`, `/auth/sign-up`) with minimal UI
- Onboarding shell and dashboard shell

## Running locally
```bash
pnpm install
pnpm dev
```
Open https://localhost:3000

## Customize
- Update auth UI in `app/auth/*`
- Extend tRPC routers in `packages/core-web/src/trpc/routers`
- Add pages under `app/`
