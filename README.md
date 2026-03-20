# MC Bot — Open Source Minecraft Bot with Dashboard

A Minecraft 1.21.1 bot with a Next.js control dashboard. Made by TerrorAqua.

## Features

- Connects to any Minecraft 1.21.1 server (offline auth)
- Auto-reconnects every 10 minutes
- Sends a welcome/hourly message every 60 minutes
- Runs `/register` and `/login` on spawn (if password is set)
- Next.js dashboard with login protection
- Guest mode: shows nickname, IP, and connection status without a password
- Full mode: live logs, chat sender, force reconnect, bot config

## Project Structure

```
mc-bot/
  bot/          — Mineflayer bot + Express API (port 3001)
  dashboard/    — Next.js frontend (port 3000)
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
| `DASHBOARD_URL` | Public URL of the dashboard (shown in chat) |
| `REPO_URL` | GitHub repo URL (shown in chat) |
| `NEXT_PUBLIC_API_URL` | Public URL of the bot API (used by dashboard) |

## Running Locally

**Bot:**
```bash
npm install
npm start
```

**Dashboard:**
```bash
cd dashboard
npm install
npm run dev
```

## Deploying to Render

1. Push the project to GitHub.
2. On [render.com](https://render.com), create two **Web Services** from the repo:
   - Service 1 — **Bot API**: root dir `/`, build `npm install`, start `npm start`
   - Service 2 — **Dashboard**: root dir `/dashboard`, build `npm install && npm run build`, start `npm start`
3. Set all environment variables from `.env.example` in each service.
4. Set `NEXT_PUBLIC_API_URL` in the dashboard service to the public URL of the bot API (e.g. `https://mc-bot-api.onrender.com`).

## License

MIT
