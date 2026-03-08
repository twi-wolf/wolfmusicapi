# WolfApis

## Overview
A multi-provider API hub (branded as WOLFAPIS v4.0) that provides unified access to 35+ AI chat models (including WormGPT, Replit AI), AI tools (translate, summarize, code, AI scanner, humanizer), AI image endpoints (7 providers: Unsplash, Lorem Picsum, LoremFlickr, Dog CEO, CATAAS, Bing Image Creator), music/media downloaders, social media downloaders (YouTube, TikTok, Instagram, Facebook, Twitter/X, Snapchat — combined into one "Social Media" category with 15 endpoints), Spotify search/download, Shazam music recognition, Ephoto360 text effect generation (108 effects across 13 categories), PhotoFunia image effects (154 effects, 19 text-only), Text Effects (109 effects via CoolText), movie data (13 endpoints via OMDb/YTS), anime images (30 types), fun text content (37 categories), URL services (7 shorteners + ImgBB + Catbox image hosting), developer tools (21 utilities), security/ethical hacking tools (38 endpoints), sports data (24 endpoints via TheSportsDB), search APIs (10 endpoints), media converters (6 converter endpoints for WhatsApp bots), and audio effects (25 effects: bass, bassboost, robot, echo, nightcore, 8D, reverb, etc.). 640+ total endpoints across 21 categories. Features a cyberpunk-themed sidebar navigation UI with popup-based API testing, search bar with autocomplete for effect categories, and a documentation page with clickable expandable endpoint docs.

## Architecture
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui components
- **Backend**: Express.js server in `server/`
- **AI Proxy**: `server/ai-routes.ts` - 35 AI chat endpoints via chateverywhere.app + OpenAI (GPT-4/4o), plus translate/summarize/code/scanner/humanizer tools and 7 image endpoints (including Bing Image Creator)
- **Music Scraping**: `lib/scraper.ts` - YouTube music search via yt-dlp, download via yt-dlp + y2mate/cobalt/vevioz/savefrom/cnvmp3 fallbacks
- **Social Media Downloaders**: `lib/downloaders/` - YouTube, TikTok (ssstik.io), Instagram, Facebook, Twitter/X, Snapchat (snapmate.io) video downloaders (15 endpoints combined)
- **Snapchat Downloader**: `lib/downloaders/snapchat.ts` - Snapchat stories/spotlights/profiles via snapmate.io scraper
- **Spotify**: `lib/downloaders/spotify.ts` - Search and download via spotdown.org API with iTunes fallback
- **Shazam**: `lib/downloaders/shazam.ts` - Shazam search + song recognition via reverse-engineered API
- **Ephoto360**: `lib/downloaders/ephoto360.ts` - 108 text/neon/3D effect generators via ephoto360.com (13 categories: text-effects, 3d-effect, halloween, cover-facebook, game-effect, christmas, happy-birthday, fire-effects, love, animations, new-year, tattoo-effects, technology)
- **PhotoFunia**: `lib/downloaders/photofunia.ts` - 338 photo effects via photofunia.com (18 categories: filters 31, billboards 62, lab 88, christmas 33, halloween 21, easter 9, valentine 6, faces 15, misc 16, posters 16, galleries 9, drawings 8, magazines 6, frames 5, celebrities 4, photography 3, vintage 2, tv 1, books 3)
- **TextPro**: `lib/downloaders/textpro.ts` - 109 text effects via CoolText API (neon, 3D, chrome, fire, glitter, graffiti, etc.)
- **Movie**: `lib/downloaders/movie.ts` - 13 movie data endpoints via OMDb/YTS APIs
- **Anime**: `lib/downloaders/anime.ts` - 30 anime image types via waifu.pics & nekos.best
- **Fun**: `lib/downloaders/fun.ts` - 37 fun text content categories with built-in arrays + external API fallbacks
- **URL Shortener**: `lib/downloaders/urlshortener.ts` - 7 shortener services (TinyURL, is.gd, v.gd, CleanURI, etc.)
- **Tools**: `lib/downloaders/tools.ts` - 21 utility endpoints (QR, dictionary, weather, password, hash, etc.)
- **Security**: `lib/downloaders/security.ts` - 38 security/ethical hacking endpoints (DNS, WHOIS, port scan, SSL, WAF, etc.)
- **Sports**: `lib/downloaders/sports.ts` - 24 sports data endpoints via TheSportsDB free API
- **Search**: 10 search endpoints in `server/routes.ts` (Wikipedia, GNews, GitHub, NPM, PyPI, StackOverflow, Reddit, Urban Dictionary, Emoji, REST Countries)
- **Converter**: `lib/downloaders/converter.ts` - 6 media converter endpoints for WhatsApp bots (image↔sticker, video↔sticker, video↔GIF)
- **Lyrics**: Uses lrclib.net API for song lyrics (with synced lyrics support)
- **Provider Health System**: Automatic tracking of provider failures with cooldown periods
- **Stalker**: `lib/downloaders/stalker.ts` - OSINT profile lookup tools (GitHub, IP, NPM, TikTok, Instagram, Twitter, WhatsApp)

## Key Files
- `shared/schema.ts` - All 626 endpoint definitions, 21 categories, and TypeScript types
- `server/ai-routes.ts` - AI proxy endpoints (35 chat + 5 tools + 7 image)
- `server/routes.ts` - Express API endpoint definitions (all categories + registers AI routes + 10 search routes)
- `lib/scraper.ts` - Shared scraping logic (search, check, download info)
- `lib/downloaders/` - All downloader/module implementations
- `client/src/pages/home.tsx` - Main UI with sidebar navigation, popup API tester, and docs page
- `client/src/index.css` - Neon cyberpunk theme styles
- `client/src/assets/wolf-logo.png` - Wolf logo

## API Categories (626 endpoints across 21 categories)

### AI Chat (35 endpoints)
GPT, GPT-4, GPT-4o, Claude, Mistral, Gemini, DeepSeek, Venice, Groq, Cohere, LLaMA, Mixtral, Phi, Qwen, Falcon, Vicuna, OpenChat, WizardLM, Zephyr, CodeLlama, StarCoder, Dolphin, Nous Hermes, OpenHermes, NeuralChat, Solar, Yi, TinyLlama, Orca, Command R, Nemotron, InternLM, ChatGLM, WormGPT, Replit AI

### AI Tools (5 endpoints)
translate, summarize, code, scanner, humanizer

### AI Image (7 endpoints)
Unsplash+Picsum, Lorem Picsum, LoremFlickr, Dog CEO, CATAAS, image search, Bing Image Creator

### Music & Media (15 endpoints)
Search, MP3/MP4 download, lyrics (lrclib.net), trending

### Spotify (2 endpoints)
Search and download via spotdown.org

### Shazam (3 endpoints)
Search, recognize, track details

### Ephoto360 (2 endpoints, 108 effects)
List effects, generate text effect image - card grid view. 13 categories: text-effects (44), 3d-effect (18), halloween (9), cover-facebook (7), happy-birthday (10), game-effect (6), christmas (5), fire-effects (2), love (3), animations (1), new-year (1), tattoo-effects (1), technology (1)

### PhotoFunia (2 endpoints, 154 effects)
List effects, generate photo effect - card grid view

### Social Media (14 endpoints)
YouTube (download, MP3, MP4, info, search), TikTok (download, audio, info), Instagram (download, story), Facebook (download, reel), Twitter/X (download, info)

### Stalker (7 endpoints)
GitHub, IP, NPM, TikTok, Instagram, Twitter/X, WhatsApp

### Anime (30 endpoints)
waifu, neko, shinobu, megumin, cuddle, hug, kiss, pat, smug, bonk, blush, smile, wave, dance, cry, slap, bite, poke, happy, wink, highfive, sleep, laugh, thumbsup, stare, baka, facepalm, yawn, nervous, punch

### Fun (37 endpoints)
jokes, advice, quotes, motivation, flirt, pickuplines, truth, dares, riddles, trivia, funfacts, puns, roasts, compliments, wouldyourather, goodmorning, goodnight, valentines, birthday, love, friendship, shayari, humor, wisdom, success, heartbreak, sorry, halloween, christmas, newyear, thankyou, gratitude, roseday, fathersday, mothersday, girlfriendsday, boyfriendsday

### URL (9 endpoints)
7 shorteners (TinyURL, is.gd, v.gd, CleanURI, Chilp.it, clck.ru, da.gd) + ImgBB + Catbox image hosting

### Tools (21 endpoints)
QR code, Bible verse, dictionary, Wikipedia, weather, Base64 encode/decode, text stats, password generator, Lorem Ipsum, color generator, timestamp, URL encode/decode, JSON formatter, email validation, IP validation, hash, UUID, password strength, screenshot

### Security (38 endpoints)
WHOIS, DNS lookup, subdomain scan, reverse IP, GeoIP, port scan, HTTP headers, SSL check, TLS info, ping, latency, traceroute, ASN lookup, MAC lookup, security headers, WAF detection, firewall check, robots.txt, sitemap, CMS detection, tech stack, cookies scan, redirect chain, XSS check, SQL injection check, CSRF check, clickjacking check, directory scan, exposed files, misconfig check, hash identify, hash generate, password strength, open ports, IP info, URL scan, phishing check, metadata extract

### Sports (24 endpoints)
Live scores, fixtures, standings, team/player/league search, event stats, lineups, highlights via TheSportsDB

### Search (10 endpoints)
Wikipedia, GNews, GitHub repos, NPM packages, PyPI, Stack Overflow, Reddit, Urban Dictionary, Emoji search, REST Countries

### Movie (13 endpoints)
Search, info, trailer, trending, popular, upcoming, top rated, cast, reviews, similar, genre list, discover, now playing

### Text Effects (109 endpoints)
CoolText-based effects: neon, 3D, chrome, fire, glitter, graffiti, vintage, and 100+ more

### Converter (6 endpoints)
Image↔Sticker, Video↔Sticker, Video↔GIF for WhatsApp bot media conversion

### Audio Effects (26 endpoints: 1 list + 25 effects)
bass, bassboost, robot, chipmunk, deep, echo, reverb, nightcore, slowed, 8d, vaporwave, karaoke, treble, distortion, flanger, phaser, chorus, vibrato, tremolo, reverse, speed2x, slow05x, telephone, underwater, megaphone

## Security (`server/security.ts`)
- **Helmet**: Full security headers in production (CSP with frame-ancestors, CORS, referrer policy); disabled in dev for Vite compatibility
- **No Rate Limiting**: APIs are fully open — no request limits per IP (users may chain requests for other users)
- **Anti-Scraping**: Blocks suspicious UAs (curl, wget, python-requests, scrapy, etc.), tracks IP request counts, auto-blocks IPs making clone-like requests
- **Anti-Clone**: Protects `/api/endpoints/list` and `/api/all-endpoints` — only accessible from own site referer + browser UA
- **Source Protection**: Blocks direct access to .ts/.tsx/.map/.env/.lock/.toml files and server/lib/shared directories (production only)
- **Response Fingerprint**: Adds `X-Powered-By: WolfAPIs` and creator metadata to API responses

## Environment Variables
- `OPENAI_API_KEY` - Required for GPT-4/GPT-4o endpoints only (optional, other AI endpoints work without it)
- `SPOTDOWN_API_KEY` - Spotify download API key (has fallback default)
- `YOUTUBE_API_KEY` - YouTube trending API key (optional, falls back to search)

## Branding
- Name: WOLFAPIS (WOLF in green #00ff00, APIS in white)
- Creator tag: "APIs by Silent Wolf | A tech explorer"
- Dark theme: main #050505, sidebar #080808, cards #000000, neon green accents
- Sidebar navigation with popup-based API testing, collapsible sidebar

## Recent Changes
- 2026-03-01: Merged YouTube, TikTok, Instagram, Facebook into one "Social Media" category, added Twitter/X downloader (multi-provider: TwitSave, SSSTwitter, TWDL), expanded to 14 social media endpoints (YouTube: download/mp3/mp4/info/search, TikTok: download/audio/info, Instagram: download/story, Facebook: download/reel, Twitter: download/info). Total now 626 endpoints across 21 categories.
- 2026-03-01: Added Audio Effects category (25 effects: bass, bassboost, robot, echo, nightcore, 8D, reverb, etc.), removed italic text styling from all headings, made "Multi-Provider API Hub" title vertical on welcome page.
- 2026-03-01: Added WormGPT and Replit AI to AI Chat (now 35 models), Bing Image Creator to AI Image (now 7 endpoints), Converter category with 6 media conversion endpoints (image↔sticker, video↔sticker, video↔GIF) for WhatsApp bots.
- 2026-03-01: Added Search category (10 endpoints: Wikipedia, GNews, GitHub, NPM, PyPI, StackOverflow, Reddit, Urban Dictionary, Emoji, Countries). Changed Ephoto360 & PhotoFunia from table view to card grid view. Made Docs page API Categories clickable/expandable showing endpoint docs with method, path, params, and example requests.
- 2026-03-01: v4.0 major expansion - Added 5 new categories: Anime (30 endpoints via waifu.pics/nekos.best), Fun (37 text content endpoints), URL Shortener (7 services), Tools (21 utility endpoints), Security (38 ethical hacking endpoints).
- 2026-03-08: PhotoFunia lab category completed (26→88 effects, +62 new): oldtvset, balloon, surfingboard, beachsign, neonwriting, waterwriting, bracelet, frostedfilter, sparklers, neonsign, ledroadsign, airline, leprechaunhat, noir, spydossier, artisticfilter, planebanner, fortunecookie, pendant, lipstickwriting, lightwriting, numberplate, doubleexposure, blinkinglights, lifebuoy, hearttattoo, nightvision, books, tvinterference, footballfan, treecarving, soupletters, foggywindowwriting, quadriptych, moviemarquee, cookieswriting, triptych, graffititext, woodensign, chalkwriting, sandwriting, spaceromance, filmscan, keepcalm, hogwartsletter, instantcamera, clown, alien, oilpainting, fatmaker, photobooth, labembroidery, diploma, legoportrait, pencildrawing, vintagephoto, watercolor, classicframe, motivator, faceswap, filmeffect, engravement + more. Architecture fix: getPhotofuniaSession now fetches session from effect's own category page instead of all_effects. Multi-image support added (quadriptych 4x, triptych 3x, photobooth 4x, faceswap with donor field). Also removed 9 duplicate/dead effects (snowsign, christmaswriting, christmaslist, frostywindowwriting, snowwriting, crossstitchtext, xmascap from lab + birthdayparty). PhotoFunia total: 154→338 effects.
- 2026-03-08: Massive Ephoto360 expansion (60→108 effects): added text-effects (foilballoon3d, colorfulpaint3d, blackpinksignature, dragonballtext, glossysilver3d, typographyart, foggyglass, narutologo + more), halloween (8 horror effects), birthday (7 cake effects), love (3), cover-facebook (7), game-effect (4 more), technology (youtubebutton), animations (examcrank). Fixed listEphotoEffects() bug (was returning 0). PhotoFunia XFF bypass (getXffIp() rotation): all 19 text effects + all image effects now working. Fixed chalkboard slug (blackboard→chalkboard), added hidden symbol field + required text2 field.
- 2026-03-01: v4.0 initial - Added PhotoFunia (154 effects), expanded Ephoto360 (60 effects), fixed lyrics endpoint, fixed AI model names, updated schema
- 2026-03-01: Major v3.0 expansion - 33 AI chat models, Spotify rewrite (spotdown.org), Ephoto360 text effects, sidebar UI + popup tester
