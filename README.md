# MC Bot — Open Source Minecraft Bot with Dashboard

A Minecraft 1.21.11 bot with a Next.js control dashboard. Made by TerrorAqua.

## Features

- Connects to any Minecraft 1.21.11 server (offline auth)
- Auto-reconnects every 10 minutes
- Sends a welcome/hourly message every 60 minutes
- Runs `/register` and `/login` on spawn (if password is set)
- Next.js dashboard with login protection
- Guest mode: shows nickname, IP, and connection status without a password
- Full mode: live logs, chat sender, force reconnect, bot config

## Project Structure

```
mc-bot/
  bot/                          — Mineflayer bot + Express API (port 3001)
  dashboard/                    — Next.js frontend (port 3000)
  Dockerfile                    — Single container
  fly.toml                      — fly.io config
  .github/workflows/deploy.yml  — Auto-deploy on push to main
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|---|---|
| `BOT_HOST` | Minecraft server IP |
| `BOT_PORT` | Minecraft server port (default 25565) |
| `BOT_USERNAME` | Bot's in-game username |
| `BOT_PASSWORD_INGAME` | Password used for `/register` and `/login` |
| `DASHBOARD_PASSWORD` | Password to access the dashboard |
| `API_PORT` | Port for the Express API (default 3001) |
| `DASHBOARD_URL` | Public URL of the app shown in chat (e.g. https://mc-bot.fly.dev) |
| `REPO_URL` | GitHub repo URL shown in chat |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` (bot and dashboard run in same container) |

## Running Locally

```bash
cp .env.example .env
npm install
npm run build
npm start
```

Dashboard: http://localhost:3000

## Deploying to fly.io via GitHub Actions

### One-time setup (only needed once)

1. Install flyctl: https://fly.io/docs/hands-on/install-flyctl/

2. Login and create the app:
   ```bash
   fly auth login
   fly launch --no-deploy
   ```

3. Set secrets on fly.io (these are your env vars):
   ```bash
   fly secrets set BOT_HOST=your.server.ip
   fly secrets set BOT_USERNAME=YourBotName
   fly secrets set BOT_PASSWORD_INGAME=ingamepass
   fly secrets set DASHBOARD_PASSWORD=dashpass
   fly secrets set REPO_URL=https://github.com/YOUR_USERNAME/mc-bot
   fly secrets set DASHBOARD_URL=https://mc-bot.fly.dev
   fly secrets set NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

4. Get your fly.io API token:
   ```bash
   fly tokens create deploy
   ```
   Copy the printed token.

5. Add the token to GitHub:
   - Go to your repo → **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `FLY_API_TOKEN`
   - Value: paste the token from step 4

### Auto-deploy

After setup, every push to the `main` branch will automatically deploy to fly.io.
You can watch the progress in the **Actions** tab of your GitHub repo.

## License

MIT
