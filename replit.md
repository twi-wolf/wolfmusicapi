# WolfApis

## Overview
WOLFAPIS v1.0.0 is a multi-provider API hub offering unified access to over 880 endpoints across 21 categories. It integrates 35+ AI chat models, AI tools (translate, summarize, code, AI scanner, humanizer), 7 AI image endpoints (including Bing Image Creator), music/media downloaders, social media downloaders (YouTube, TikTok, Instagram, Facebook, Twitter/X, Snapchat), Spotify search/download, Shazam music recognition, and various photo and text effect generators (Ephoto360, PhotoFunia, CoolText). The platform also includes movie data APIs, anime images, fun text content, URL services, developer utilities, security/ethical hacking tools, sports data, search APIs, media converters, and audio effects. The project aims to be a comprehensive and unified API solution, catering to a wide range of application development needs.

## User Preferences
I prefer detailed explanations of the changes made. I want iterative development with clear communication at each step. Ask before making any major architectural changes or introducing new external dependencies.

## System Architecture
The application uses a React, Vite, TailwindCSS, and shadcn/ui frontend for a cyberpunk-themed UI with a sidebar navigation, popup API testing, and a search bar with autocomplete for effect categories. The backend is an Express.js server. Key architectural components include:

-   **AI Proxy**: `server/ai-routes.ts` manages 35 AI chat endpoints and AI tools.
-   **Music Scraping**: `lib/scraper.ts` handles YouTube music search and downloads, utilizing a multi-provider download chain to ensure high availability and bypass IP locks.
-   **Social Media Downloaders**: `lib/downloaders/` contains modules for various social media platforms, with Instagram downloads handled via a robust provider chain (Cobalt, yt-dlp, GraphQL API). Snapchat downloads use `snapmate.io`.
-   **Specialized Downloaders**: Dedicated modules in `lib/downloaders/` for Spotify, Shazam, Ephoto360, PhotoFunia, TextPro, Movie, Anime, Fun, URL Shortener, Tools, Security, and Sports functionalities.
-   **Search**: 10 search endpoints are defined in `server/routes.ts`.
-   **Converter**: `lib/downloaders/converter.ts` provides media conversion endpoints for WhatsApp bots.
-   **Lyrics**: Integrates with `lrclib.net` for song lyrics.
-   **Provider Health System**: Automatically tracks provider failures and implements cooldown periods to maintain service reliability.
-   **Media Provider Status API**: `/api/media/status` provides lightweight live probes of all music/media providers, cached for 2 minutes and auto-refreshing in the UI to display real-time status.
-   **OSINT Tools**: `lib/downloaders/stalker.ts` offers OSINT profile lookup functionalities.
-   **Security**: `server/security.ts` implements Helmet for security headers in production (CSP, CORS, referrer policy), anti-scraping measures (blocking suspicious UAs, IP tracking), anti-clone protection for sensitive API listings, and source file protection. APIs are designed without rate limiting.
-   **Branding**: WOLFAPIS uses a distinct dark theme with neon green accents, featuring a "WOLF" in green and "APIS" in white.

## External Dependencies
-   **AI Services**: chateverywhere.app, OpenAI (GPT-4/4o), Bing Image Creator
-   **Music/Media**: yt-dlp, ytdown.to (reverse-engineered), invidious, y2mate, fabdl, cobalt, piped
-   **Social Media**: ssstik.io (TikTok), snapmate.io (Snapchat), TwitSave, SSSTwitter, TWDL (Twitter/X)
-   **Spotify**: spotdown.org API, iTunes (fallback)
-   **Shazam**: Reverse-engineered Shazam API
-   **Effect Generators**: ephoto360.com, photofunia.com, CoolText API
-   **Movie Data**: OMDb, YTS, TMDB, XCasper
-   **Anime Images**: waifu.pics, nekos.best
-   **URL Shorteners**: TinyURL, is.gd, v.gd, CleanURI, Chilp.it, clck.ru, da.gd
-   **Image Hosting**: ImgBB, Catbox
-   **Lyrics**: lrclib.net API
-   **Sports Data**: TheSportsDB API
-   **Search**: Wikipedia, GNews, GitHub, NPM, PyPI, Stack Overflow, Reddit, Urban Dictionary, Emoji, REST Countries
-   **Environment Variables (Optional/Configurable)**: `OPENAI_API_KEY`, `SPOTDOWN_API_KEY`, `YOUTUBE_API_KEY`, `DVLA_API_KEY`, `REMOVE_BG_API_KEY`