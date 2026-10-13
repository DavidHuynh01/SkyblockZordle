// Player-facing update log, newest first. Shown in the "What's new" dialog.
//
// Add an entry here whenever a release changes something players would
// notice. Versions are MAJOR.MINOR and must go up; CI checks the shape and
// order (server/test/frontend.test.js). Behind-the-scenes work like
// deployment changes doesn't belong here.

export const CHANGELOG = [
  {
    version: "1.0",
    date: "2026-10-12",
    title: "Launch",
    changes: [
      "Background music: a calm piano track, with its own volume slider",
      "Separate volume sliders for music and sound effects",
      "This update log",
      "The logo now bobs as one block",
    ],
  },
  {
    version: "0.7",
    date: "2026-10-09",
    title: "Streaks",
    changes: [
      "All-time longest streak leaderboard",
      "Your current streak shows when you solve the daily",
    ],
  },
  {
    version: "0.5",
    date: "2026-10-08",
    title: "Sound and polish",
    changes: [
      "Sound effects for guesses, wins and losses",
      "Animated logo",
      "Giving up now asks you to confirm first",
      "See how many players solved today's puzzle",
      "Total player count on the leaderboard",
    ],
  },
  {
    version: "0.3",
    date: "2026-10-08",
    title: "Global leaderboard",
    changes: [
      "Daily leaderboard of the fastest solves",
      "Log in with Discord to get ranked. Playing without an account still works",
      "Global stats: win rate and guess distribution",
    ],
  },
  {
    version: "0.1",
    date: "2026-09-16",
    title: "First release",
    changes: [
      "Guess the daily Hypixel SkyBlock item in 8 tries",
      "Unlimited mode: play random items as often as you like",
      "Collections: browse every item in the game",
      "Share your result as an emoji grid",
      "Real item textures from the Hypixel SkyBlock pack",
    ],
  },
];

export const CURRENT_VERSION = CHANGELOG[0].version;
