# SkyblockZordle

### ▶ Play it: **[skyblockzordle.com](https://skyblockzordle.com)**

A daily guessing game for **Hypixel Skyblock** items — like Wordle, but instead
of five-letter words you're guessing swords, wands, bows, and tools.

## How it works

Every day there's one secret Skyblock item, and you get 10 guesses to find it.
Each guess is scored against the answer attribute by attribute:

- 🟩 **Green** — that attribute matches the answer
- 🟥 **Red** — it doesn't match
- ▲ / ▼ — the answer's **Rarity**, **Damage** or **Strength** is higher / lower

So guessing *Hyperion* might tell you the answer is also **Legendary**, also
crafted, but hits **harder** and isn't from Dungeons — and you narrow it down
from there. The seven attributes compared are **Rarity, Category, Damage,
Strength, Source, Location,** and **Tradeable**. Damage and Strength come from
Hypixel's own item data.

Everyone in the world gets the same item each day, so you can compare results
with friends.

## Features

- **Daily puzzle** — one shared item per day, with your progress saved
- **Unlimited mode** — endless random rounds, play as much as you want
- **Collections** — browse all the items and their stats
- **Stats & streaks** — games played, win rate, current and max streak
- **Share** — copy a spoiler-free emoji grid of your result
- **Global leaderboard** — the day's fastest solves, sign in with Discord to compete

## Screenshots

<p align="center">
  <img width="400" height="225" alt="Main menu" src="docs/screenshots/menu.png" />
  <img width="400" height="225" alt="Daily game in progress" src="docs/screenshots/daily.png" />
  <img width="400" height="225" alt="Solved daily puzzle" src="docs/screenshots/win.png" />
  <img width="400" height="225" alt="How to play" src="docs/screenshots/how-to-play.png" />
  <img width="400" height="225" alt="Leaderboard" src="docs/screenshots/leaderboard.png" />
  <img width="400" height="225" alt="Collections" src="docs/screenshots/collections.png" />
</p>

## Built with

- **Frontend** — React · Vite · Tailwind CSS
- **Backend** — AWS Lambda · DynamoDB · CloudFront + S3 · AWS SAM (infrastructure as code)

It runs entirely serverless: a Lambda Function URL for the API, DynamoDB for
scores and sessions, and the site itself served from a private S3 bucket through
CloudFront. The whole stack is defined in [`infra/template.yaml`](infra/template.yaml),
so it deploys from a single command.

---

Item art is from the official Hypixel SkyBlock Resource Pack (© Hypixel Inc.),
used under its license. A free, fan-made project — not affiliated with or
endorsed by Hypixel or Mojang.
