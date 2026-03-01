import { z } from "zod";

export const searchResultSchema = z.object({
  title: z.string(),
  id: z.string(),
  size: z.string().optional(),
  duration: z.string().optional(),
  channelTitle: z.string().optional(),
  source: z.string().optional(),
});

export const searchResponseSchema = z.object({
  query: z.string(),
  items: z.array(searchResultSchema),
});

export const downloadResponseSchema = z.object({
  success: z.boolean(),
  title: z.string().optional(),
  videoId: z.string().optional(),
  channelTitle: z.string().optional(),
  downloadUrl: z.string().optional(),
  format: z.enum(["mp3", "mp4"]).optional(),
  error: z.string().optional(),
});

export type SearchResult = z.infer<typeof searchResultSchema>;
export type SearchResponse = z.infer<typeof searchResponseSchema>;
export type DownloadResponse = z.infer<typeof downloadResponseSchema>;

export interface ApiParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface ApiEndpoint {
  path: string;
  method: string;
  description: string;
  params: ApiParam[];
  format: string;
  category: string;
  provider?: string;
}

export const apiCategories = [
  { id: "ai-chat", name: "AI Chat", description: "Free AI chat completion APIs", icon: "MessageSquare" },
  { id: "ai-tools", name: "AI Tools", description: "AI-powered utility tools (translate, summarize, code)", icon: "Wand2" },
  { id: "ai-image", name: "AI Image", description: "Image search APIs", icon: "Image" },
  { id: "music", name: "Music & Media", description: "YouTube search, MP3, and MP4 download endpoints", icon: "Music" },
  { id: "tiktok", name: "TikTok", description: "Download TikTok videos without watermark", icon: "Video" },
  { id: "instagram", name: "Instagram", description: "Download Instagram videos, photos, reels", icon: "Camera" },
  { id: "youtube-dl", name: "YouTube Downloader", description: "Download YouTube videos in multiple formats", icon: "Youtube" },
  { id: "facebook", name: "Facebook", description: "Download Facebook videos", icon: "Facebook" },
  { id: "spotify", name: "Spotify", description: "Search and download Spotify tracks as MP3", icon: "Music2" },
  { id: "shazam", name: "Shazam", description: "Search songs and recognize music from audio", icon: "AudioLines" },
  { id: "ephoto", name: "Ephoto360", description: "Generate text effects and artistic images", icon: "Sparkles" },
  { id: "photofunia", name: "PhotoFunia", description: "100+ photo effects, frames, filters and text art", icon: "ImagePlus" },
  { id: "stalker", name: "Stalker", description: "Profile lookup and OSINT tools", icon: "Eye" },
];

const aiChatEndpoints: ApiEndpoint[] = [
  { path: "/api/ai/gpt", method: "POST", description: "Chat with GPT - general purpose AI assistant", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/gpt4", method: "POST", description: "Chat with GPT-4 - advanced reasoning AI", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "OpenAI" },
  { path: "/api/ai/gpt4o", method: "POST", description: "Chat with GPT-4o - OpenAI's most capable model", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "OpenAI" },
  { path: "/api/ai/claude", method: "POST", description: "Chat with Claude-style AI assistant", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/mistral", method: "POST", description: "Chat with Mistral AI assistant", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/gemini", method: "POST", description: "Chat with Gemini AI assistant", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/deepseek", method: "POST", description: "Chat with DeepSeek AI assistant", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/venice", method: "POST", description: "Chat with Venice AI assistant", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/groq", method: "POST", description: "Chat with Groq AI - fast inference", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/cohere", method: "POST", description: "Chat with Cohere AI assistant", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/llama", method: "POST", description: "Chat with LLaMA - Meta's open model", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/mixtral", method: "POST", description: "Chat with Mixtral - mixture of experts model", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/phi", method: "POST", description: "Chat with Phi - Microsoft's efficient model", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/qwen", method: "POST", description: "Chat with Qwen - Alibaba's language model", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/falcon", method: "POST", description: "Chat with Falcon - TII's open model", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/vicuna", method: "POST", description: "Chat with Vicuna - open-source chatbot", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/openchat", method: "POST", description: "Chat with OpenChat model", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/wizard", method: "POST", description: "Chat with WizardLM - instruction-following AI", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/zephyr", method: "POST", description: "Chat with Zephyr - chat-tuned AI", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/codellama", method: "POST", description: "Chat with CodeLlama - code-specialized AI", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/starcoder", method: "POST", description: "Chat with StarCoder - code generation AI", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/dolphin", method: "POST", description: "Chat with Dolphin - uncensored AI model", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/nous", method: "POST", description: "Chat with Nous Hermes AI", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/openhermes", method: "POST", description: "Chat with OpenHermes AI", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/neural", method: "POST", description: "Chat with NeuralChat - Intel's AI model", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/solar", method: "POST", description: "Chat with Solar AI model", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/yi", method: "POST", description: "Chat with Yi - bilingual language model", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/tinyllama", method: "POST", description: "Chat with TinyLlama - compact AI model", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/orca", method: "POST", description: "Chat with Orca - reasoning-focused AI", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/command", method: "POST", description: "Chat with Command R by Cohere", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/nemotron", method: "POST", description: "Chat with Nemotron - NVIDIA's AI model", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/internlm", method: "POST", description: "Chat with InternLM - multilingual AI", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
  { path: "/api/ai/chatglm", method: "POST", description: "Chat with ChatGLM - bilingual model", params: [{ name: "prompt", type: "string", required: true, description: "The message/prompt to send" }, { name: "system", type: "string", required: false, description: "Custom system prompt" }], format: "json", category: "ai-chat", provider: "ChatEverywhere" },
];

const aiToolEndpoints: ApiEndpoint[] = [
  { path: "/api/ai/translate", method: "POST", description: "AI-powered text translation", params: [{ name: "text", type: "string", required: true, description: "Text to translate" }, { name: "to", type: "string", required: false, description: "Target language (default: en)" }, { name: "from", type: "string", required: false, description: "Source language (default: auto)" }], format: "json", category: "ai-tools", provider: "ChatEverywhere" },
  { path: "/api/ai/summarize", method: "POST", description: "AI-powered text summarization", params: [{ name: "text", type: "string", required: true, description: "Text to summarize" }], format: "json", category: "ai-tools", provider: "ChatEverywhere" },
  { path: "/api/ai/code", method: "POST", description: "AI code generation assistant", params: [{ name: "prompt", type: "string", required: true, description: "Code task description" }, { name: "language", type: "string", required: false, description: "Programming language (e.g. python, javascript)" }], format: "json", category: "ai-tools", provider: "ChatEverywhere" },
];

const aiImageEndpoints: ApiEndpoint[] = [
  { path: "/api/ai/image/dall-e", method: "POST", description: "Search for images by prompt (Unsplash-powered)", params: [{ name: "prompt", type: "string", required: true, description: "Image search description" }], format: "json", category: "ai-image", provider: "ChatEverywhere" },
];

const musicEndpoints: ApiEndpoint[] = [
  { path: "/api/search", method: "GET", description: "Search for songs by keyword", params: [{ name: "q", type: "string", required: true, description: "Search query (song name, artist, etc.)" }], format: "json", category: "music" },
  { path: "/download/mp3", method: "GET", description: "Download audio as MP3 - supports YouTube URL or song name", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL" }, { name: "q", type: "string", required: false, description: "Song name to search" }], format: "mp3", category: "music" },
  { path: "/download/mp4", method: "GET", description: "Download video as MP4 - supports YouTube URL or song name", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL" }, { name: "q", type: "string", required: false, description: "Song name to search" }], format: "mp4", category: "music" },
  { path: "/download/audio", method: "GET", description: "Extract audio from YouTube", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL" }, { name: "q", type: "string", required: false, description: "Song name to search" }], format: "mp3", category: "music" },
  { path: "/download/ytmp3", method: "GET", description: "Convert YouTube video to MP3", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL" }, { name: "q", type: "string", required: false, description: "Song name to search" }], format: "mp3", category: "music" },
  { path: "/download/dlmp3", method: "GET", description: "Direct MP3 download", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL" }, { name: "q", type: "string", required: false, description: "Song name to search" }], format: "mp3", category: "music" },
  { path: "/download/yta", method: "GET", description: "YouTube Audio extractor (primary)", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL" }, { name: "q", type: "string", required: false, description: "Song name to search" }], format: "mp3", category: "music" },
  { path: "/download/yta2", method: "GET", description: "YouTube Audio extractor (secondary)", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL" }, { name: "q", type: "string", required: false, description: "Song name to search" }], format: "mp3", category: "music" },
  { path: "/download/yta3", method: "GET", description: "YouTube Audio extractor (tertiary)", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL" }, { name: "q", type: "string", required: false, description: "Song name to search" }], format: "mp3", category: "music" },
  { path: "/download/ytmp4", method: "GET", description: "Convert YouTube video to MP4", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL" }, { name: "q", type: "string", required: false, description: "Song name to search" }], format: "mp4", category: "music" },
  { path: "/download/dlmp4", method: "GET", description: "Direct MP4 download", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL" }, { name: "q", type: "string", required: false, description: "Song name to search" }], format: "mp4", category: "music" },
  { path: "/download/video", method: "GET", description: "Extract video from YouTube", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL" }, { name: "q", type: "string", required: false, description: "Song name to search" }], format: "mp4", category: "music" },
  { path: "/download/hd", method: "GET", description: "Download YouTube video in HD quality", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL" }, { name: "q", type: "string", required: false, description: "Song name to search" }], format: "mp4", category: "music" },
  { path: "/download/lyrics", method: "GET", description: "Get song lyrics by name", params: [{ name: "q", type: "string", required: true, description: "Song name and artist" }], format: "json", category: "music" },
  { path: "/api/trending", method: "GET", description: "Get trending music from YouTube", params: [{ name: "country", type: "string", required: false, description: "Country code (default: US)" }], format: "json", category: "music" },
];

const tiktokEndpoints: ApiEndpoint[] = [
  { path: "/api/download/tiktok", method: "GET", description: "Download TikTok video without watermark", params: [{ name: "url", type: "string", required: true, description: "TikTok video URL" }], format: "json", category: "tiktok", provider: "ssstik.io" },
];

const instagramEndpoints: ApiEndpoint[] = [
  { path: "/api/download/instagram", method: "GET", description: "Download Instagram videos, photos, reels", params: [{ name: "url", type: "string", required: true, description: "Instagram post/reel URL" }], format: "json", category: "instagram", provider: "Multi-provider" },
];

const youtubeEndpoints: ApiEndpoint[] = [
  { path: "/api/download/youtube", method: "GET", description: "Download YouTube videos in multiple qualities", params: [{ name: "url", type: "string", required: false, description: "YouTube video URL" }, { name: "q", type: "string", required: false, description: "Video name to search" }], format: "json", category: "youtube-dl", provider: "y2mate.nu" },
];

const facebookEndpoints: ApiEndpoint[] = [
  { path: "/api/download/facebook", method: "GET", description: "Download Facebook videos in SD and HD quality", params: [{ name: "url", type: "string", required: true, description: "Facebook video URL" }], format: "json", category: "facebook", provider: "fdownloader.net" },
];

const spotifyEndpoints: ApiEndpoint[] = [
  { path: "/api/spotify/search", method: "GET", description: "Search for songs on Spotify", params: [{ name: "q", type: "string", required: true, description: "Search query (song name, artist)" }], format: "json", category: "spotify", provider: "Spotdown" },
  { path: "/api/spotify/download", method: "GET", description: "Download a Spotify track as MP3", params: [{ name: "url", type: "string", required: false, description: "Spotify track URL" }, { name: "q", type: "string", required: false, description: "Song name to search" }], format: "json", category: "spotify", provider: "Spotdown" },
];

const shazamEndpoints: ApiEndpoint[] = [
  { path: "/api/shazam/search", method: "GET", description: "Search for songs on Shazam", params: [{ name: "q", type: "string", required: true, description: "Search query (song name, artist)" }], format: "json", category: "shazam", provider: "Shazam" },
  { path: "/api/shazam/recognize", method: "POST", description: "Identify a song from audio", params: [{ name: "audio", type: "string", required: false, description: "Base64-encoded raw PCM audio" }, { name: "url", type: "string", required: false, description: "URL to an audio file" }], format: "json", category: "shazam", provider: "Shazam" },
  { path: "/api/shazam/track/:id", method: "GET", description: "Get details about a Shazam track by ID", params: [{ name: "id", type: "string", required: true, description: "Shazam track ID" }], format: "json", category: "shazam", provider: "Shazam" },
];

export interface EffectEntry {
  id: string;
  name: string;
  category: string;
  inputType: string;
  required: string;
}

export const ephotoEffectsList: EffectEntry[] = [
  { id: "neon", name: "Anonymous Hacker Cyan Neon", category: "neon", inputType: "text", required: "text" },
  { id: "colorfulglow", name: "Colorful Glow", category: "neon", inputType: "text", required: "text" },
  { id: "advancedglow", name: "Advanced Glow", category: "neon", inputType: "text", required: "text" },
  { id: "neononline", name: "Neon Online", category: "neon", inputType: "text", required: "text" },
  { id: "blueneon", name: "Blue Neon", category: "neon", inputType: "text", required: "text" },
  { id: "neontext", name: "Neon Text", category: "neon", inputType: "text", required: "text" },
  { id: "neonlight", name: "Neon Light", category: "neon", inputType: "text", required: "text" },
  { id: "greenneon", name: "Green Neon", category: "neon", inputType: "text", required: "text" },
  { id: "greenlightneon", name: "Green Light Neon", category: "neon", inputType: "text", required: "text" },
  { id: "blueneonlogo", name: "Blue Neon Logo", category: "neon", inputType: "text", required: "text" },
  { id: "galaxyneon", name: "Galaxy Neon", category: "neon", inputType: "text", required: "text" },
  { id: "retroneon", name: "Retro Neon", category: "neon", inputType: "text", required: "text" },
  { id: "multicolorneon", name: "Multicolor Neon", category: "neon", inputType: "text", required: "text" },
  { id: "hackerneon", name: "Hacker Neon", category: "neon", inputType: "text", required: "text" },
  { id: "devilwings", name: "Devil Wings", category: "neon", inputType: "text", required: "text" },
  { id: "glowtext", name: "Glow Text", category: "neon", inputType: "text", required: "text" },
  { id: "blackpinkneon", name: "Blackpink Neon", category: "neon", inputType: "text", required: "text" },
  { id: "neonglitch", name: "Neon Glitch", category: "neon", inputType: "text", required: "text" },
  { id: "neonwall", name: "Neon Writing on Wall", category: "neon", inputType: "text", required: "text" },
  { id: "wooden3d", name: "Wooden 3D", category: "3d", inputType: "text", required: "text" },
  { id: "cubic3d", name: "Cubic 3D", category: "3d", inputType: "text", required: "text" },
  { id: "wooden3donline", name: "Wooden 3D Online", category: "3d", inputType: "text", required: "text" },
  { id: "water3d", name: "Water 3D", category: "3d", inputType: "text", required: "text" },
  { id: "text3d", name: "3D Text", category: "3d", inputType: "text", required: "text" },
  { id: "graffiti3d", name: "3D Graffiti", category: "3d", inputType: "text", required: "text" },
  { id: "silver3d", name: "Silver 3D", category: "3d", inputType: "text", required: "text" },
  { id: "style3d", name: "Style 3D", category: "3d", inputType: "text", required: "text" },
  { id: "metal3d", name: "Metal 3D", category: "3d", inputType: "text", required: "text" },
  { id: "comic3d", name: "Comic 3D", category: "3d", inputType: "text", required: "text" },
  { id: "hologram3d", name: "Hologram 3D", category: "3d", inputType: "text", required: "text" },
  { id: "gradient3d", name: "Gradient 3D", category: "3d", inputType: "text", required: "text" },
  { id: "stone3d", name: "Stone 3D", category: "3d", inputType: "text", required: "text" },
  { id: "space3d", name: "Space 3D", category: "3d", inputType: "text", required: "text" },
  { id: "sand3d", name: "Sand 3D", category: "3d", inputType: "text", required: "text" },
  { id: "snow3d", name: "Snow 3D", category: "3d", inputType: "text", required: "text" },
  { id: "papercut3d", name: "Paper Cut 3D", category: "3d", inputType: "text", required: "text" },
  { id: "balloon3d", name: "Balloon 3D", category: "3d", inputType: "text", required: "text" },
  { id: "writeonwetglass", name: "Write on Wet Glass", category: "text", inputType: "text", required: "text" },
  { id: "digitalglitch", name: "Digital Glitch", category: "text", inputType: "text", required: "text" },
  { id: "deadpool", name: "Deadpool Logo", category: "text", inputType: "text", required: "text" },
  { id: "dragonball", name: "Dragon Ball", category: "text", inputType: "text", required: "text" },
  { id: "typographypavement", name: "Typography Pavement", category: "text", inputType: "text", required: "text" },
  { id: "blackpinklogo", name: "Blackpink Logo", category: "text", inputType: "text", required: "text" },
  { id: "bornpink", name: "Born Pink Album", category: "text", inputType: "text", required: "text" },
  { id: "frozen", name: "Frozen Text", category: "text", inputType: "text", required: "text" },
  { id: "fire", name: "Fire Text", category: "fire", inputType: "text", required: "text" },
  { id: "gold", name: "Gold Text", category: "text", inputType: "text", required: "text" },
  { id: "horror", name: "Horror Text", category: "text", inputType: "text", required: "text" },
  { id: "blood", name: "Blood Text", category: "text", inputType: "text", required: "text" },
  { id: "lava", name: "Lava Text", category: "fire", inputType: "text", required: "text" },
  { id: "thunder", name: "Thunder Text", category: "text", inputType: "text", required: "text" },
  { id: "matrix", name: "Matrix Text", category: "text", inputType: "text", required: "text" },
  { id: "smoke", name: "Smoke Text", category: "text", inputType: "text", required: "text" },
  { id: "naruto", name: "Naruto Text", category: "text", inputType: "text", required: "text" },
  { id: "led", name: "LED Text", category: "neon", inputType: "text", required: "text" },
  { id: "avengers3d", name: "Avengers 3D", category: "3d", inputType: "text", required: "text" },
  { id: "birthday3d", name: "Birthday 3D", category: "3d", inputType: "text", required: "text" },
  { id: "americanflag3d", name: "American Flag 3D", category: "3d", inputType: "text", required: "text" },
  { id: "christmas3d", name: "Christmas 3D", category: "3d", inputType: "text", required: "text" },
];

export const photofuniaEffectsList: EffectEntry[] = [
  { id: "smokeflare", name: "Smoke Flare", category: "halloween", inputType: "img", required: "imageUrl" },
  { id: "nightmarewriting", name: "Nightmare Writing", category: "halloween", inputType: "txt", required: "text" },
  { id: "lightning", name: "Lightning", category: "halloween", inputType: "img", required: "imageUrl" },
  { id: "cemeterygates", name: "Cemetery Gates", category: "halloween", inputType: "txt", required: "text" },
  { id: "summoningspirits", name: "Summoning Spirits", category: "halloween", inputType: "img", required: "imageUrl" },
  { id: "ghostwood", name: "Ghost Wood", category: "halloween", inputType: "img", required: "imageUrl" },
  { id: "autumn", name: "Autumn", category: "filters", inputType: "img", required: "imageUrl" },
  { id: "jade", name: "Jade", category: "filters", inputType: "img", required: "imageUrl" },
  { id: "romantic", name: "Romantic", category: "filters", inputType: "img", required: "imageUrl" },
  { id: "mystical", name: "Mystical", category: "filters", inputType: "img", required: "imageUrl" },
  { id: "lomography", name: "Lomography", category: "filters", inputType: "img", required: "imageUrl" },
  { id: "sepia", name: "Sepia", category: "filters", inputType: "img", required: "imageUrl" },
  { id: "cloudyfilter", name: "Cloudy Filter", category: "filters", inputType: "img", required: "imageUrl" },
  { id: "watercolourtext", name: "Watercolour Text", category: "lab", inputType: "txt", required: "text" },
  { id: "denimemdroidery", name: "Denim Embroidery", category: "lab", inputType: "txt", required: "text" },
  { id: "cinematicket", name: "Cinema Ticket", category: "lab", inputType: "txt", required: "text" },
  { id: "arrowsigns", name: "Arrow Signs", category: "lab", inputType: "txt", required: "text" },
  { id: "yacht", name: "Yacht", category: "lab", inputType: "txt", required: "text" },
  { id: "lightgraffiti", name: "Light Graffiti", category: "lab", inputType: "txt", required: "text" },
  { id: "chalkboard", name: "Chalkboard", category: "lab", inputType: "txt", required: "text" },
  { id: "rustywriting", name: "Rusty Writing", category: "lab", inputType: "txt", required: "text" },
  { id: "streetsign", name: "Street Sign", category: "lab", inputType: "txt", required: "text" },
  { id: "floralwreath", name: "Floral Wreath", category: "lab", inputType: "img", required: "imageUrl" },
  { id: "retrowave", name: "Retrowave", category: "lab", inputType: "txt", required: "text" },
  { id: "youaremyuniverse", name: "You Are My Universe", category: "lab", inputType: "img", required: "imageUrl" },
  { id: "einstein", name: "Einstein", category: "lab", inputType: "txt", required: "text" },
  { id: "rugbyball", name: "Rugby Ball", category: "lab", inputType: "txt", required: "text" },
  { id: "redandblue", name: "Red and Blue", category: "lab", inputType: "img", required: "imageUrl" },
  { id: "vhs", name: "VHS", category: "lab", inputType: "img", required: "imageUrl" },
  { id: "typewriter", name: "Typewriter", category: "lab", inputType: "txt", required: "text" },
  { id: "diptych", name: "Diptych", category: "lab", inputType: "img", required: "imageUrl" },
  { id: "badges", name: "Badges", category: "lab", inputType: "both", required: "imageUrl, text" },
  { id: "wanted", name: "Wanted", category: "lab", inputType: "both", required: "imageUrl, text" },
  { id: "crown", name: "Crown", category: "lab", inputType: "img", required: "imageUrl" },
  { id: "anime", name: "Anime", category: "lab", inputType: "img", required: "imageUrl" },
  { id: "popart", name: "Pop Art", category: "lab", inputType: "img", required: "imageUrl" },
  { id: "puzzle", name: "Puzzle", category: "lab", inputType: "img", required: "imageUrl" },
  { id: "glass", name: "Glass", category: "lab", inputType: "img", required: "imageUrl" },
  { id: "animator", name: "Animator", category: "lab", inputType: "img", required: "imageUrl" },
  { id: "postersonthewall", name: "Posters on the Wall", category: "posters", inputType: "img", required: "imageUrl" },
  { id: "posterwall", name: "Poster Wall", category: "posters", inputType: "img", required: "imageUrl" },
  { id: "trainstationposter", name: "Train Station Poster", category: "posters", inputType: "img", required: "imageUrl" },
  { id: "rainynight", name: "Rainy Night", category: "posters", inputType: "img", required: "imageUrl" },
  { id: "nightmotion", name: "Night Motion", category: "posters", inputType: "img", required: "imageUrl" },
  { id: "campaign", name: "Campaign", category: "posters", inputType: "img", required: "imageUrl" },
  { id: "bicycle", name: "Bicycle", category: "posters", inputType: "img", required: "imageUrl" },
  { id: "citylight", name: "City Light", category: "posters", inputType: "img", required: "imageUrl" },
  { id: "affiche", name: "Affiche", category: "posters", inputType: "both", required: "imageUrl, text" },
  { id: "sidewalk", name: "Sidewalk", category: "posters", inputType: "img", required: "imageUrl" },
  { id: "cyclist", name: "Cyclist", category: "posters", inputType: "img", required: "imageUrl" },
  { id: "tulips", name: "Tulips", category: "posters", inputType: "img", required: "imageUrl" },
  { id: "cafe", name: "Cafe", category: "posters", inputType: "img", required: "imageUrl" },
  { id: "underground", name: "Underground", category: "posters", inputType: "img", required: "imageUrl" },
  { id: "reconstruction", name: "Reconstruction", category: "posters", inputType: "img", required: "imageUrl" },
  { id: "posters", name: "Posters", category: "posters", inputType: "img", required: "imageUrl" },
  { id: "melbournegallery", name: "Melbourne Gallery", category: "galleries", inputType: "img", required: "imageUrl" },
  { id: "artadmirer", name: "Art Admirer", category: "galleries", inputType: "img", required: "imageUrl" },
  { id: "nationalgalleryinlondon", name: "National Gallery London", category: "galleries", inputType: "img", required: "imageUrl" },
  { id: "blackwhitegallery", name: "B&W Gallery", category: "galleries", inputType: "img", required: "imageUrl" },
  { id: "galleryvisitor", name: "Gallery Visitor", category: "galleries", inputType: "img", required: "imageUrl" },
  { id: "paintingandsketches", name: "Painting & Sketches", category: "galleries", inputType: "img", required: "imageUrl" },
  { id: "passingbythepainting", name: "Passing by the Painting", category: "galleries", inputType: "img", required: "imageUrl" },
  { id: "silhouettes", name: "Silhouettes", category: "galleries", inputType: "img", required: "imageUrl" },
  { id: "rijskmuseum", name: "Rijks Museum", category: "galleries", inputType: "both", required: "imageUrl, text" },
  { id: "oldcamera", name: "Old Camera", category: "photography", inputType: "img", required: "imageUrl" },
  { id: "kittyandframe", name: "Kitty and Frame", category: "photography", inputType: "img", required: "imageUrl" },
  { id: "frame", name: "Frame", category: "photography", inputType: "img", required: "imageUrl" },
  { id: "mirror", name: "Mirror", category: "faces", inputType: "img", required: "imageUrl" },
  { id: "formulaoneracer", name: "Formula One Racer", category: "faces", inputType: "img", required: "imageUrl" },
  { id: "warrior", name: "Warrior", category: "faces", inputType: "img", required: "imageUrl" },
  { id: "knight", name: "Knight", category: "faces", inputType: "img", required: "imageUrl" },
  { id: "biker", name: "Biker", category: "faces", inputType: "img", required: "imageUrl" },
  { id: "surfer", name: "Surfer", category: "faces", inputType: "img", required: "imageUrl" },
  { id: "snowboard", name: "Snowboard", category: "faces", inputType: "img", required: "imageUrl" },
  { id: "dj", name: "DJ", category: "faces", inputType: "img", required: "imageUrl" },
  { id: "bodybuilder", name: "Bodybuilder", category: "faces", inputType: "img", required: "imageUrl" },
  { id: "lulu", name: "Lulu", category: "faces", inputType: "img", required: "imageUrl" },
  { id: "hockey", name: "Hockey", category: "faces", inputType: "img", required: "imageUrl" },
  { id: "ethanol", name: "Ethanol", category: "faces", inputType: "img", required: "imageUrl" },
  { id: "godfather", name: "Godfather", category: "faces", inputType: "img", required: "imageUrl" },
  { id: "pirates", name: "Pirates", category: "faces", inputType: "img", required: "imageUrl" },
  { id: "miss", name: "Miss", category: "faces", inputType: "both", required: "imageUrl, text" },
  { id: "concretejungle", name: "Concrete Jungle", category: "billboards", inputType: "img", required: "imageUrl" },
  { id: "broadwayatnight", name: "Broadway at Night", category: "billboards", inputType: "img", required: "imageUrl" },
  { id: "newyorkatnight", name: "New York at Night", category: "billboards", inputType: "img", required: "imageUrl" },
  { id: "shoppingarcade", name: "Shopping Arcade", category: "billboards", inputType: "img", required: "imageUrl" },
  { id: "oldtram", name: "Old Tram", category: "billboards", inputType: "img", required: "imageUrl" },
  { id: "workerbythebillboard", name: "Worker by Billboard", category: "billboards", inputType: "img", required: "imageUrl" },
  { id: "eveningbillboard", name: "Evening Billboard", category: "billboards", inputType: "img", required: "imageUrl" },
  { id: "pedestriancrossing", name: "Pedestrian Crossing", category: "billboards", inputType: "img", required: "imageUrl" },
  { id: "cube", name: "Cube", category: "billboards", inputType: "img", required: "imageUrl" },
  { id: "nyc", name: "NYC", category: "billboards", inputType: "img", required: "imageUrl" },
  { id: "city", name: "City", category: "billboards", inputType: "img", required: "imageUrl" },
  { id: "ax", name: "AX", category: "billboards", inputType: "img", required: "imageUrl" },
  { id: "trump", name: "Trump", category: "celebrities", inputType: "both", required: "imageUrl, text" },
  { id: "obama", name: "Obama", category: "celebrities", inputType: "img", required: "imageUrl" },
  { id: "madonna", name: "Madonna", category: "celebrities", inputType: "img", required: "imageUrl" },
  { id: "putin", name: "Putin", category: "celebrities", inputType: "img", required: "imageUrl" },
  { id: "theframe", name: "The Frame", category: "frames", inputType: "img", required: "imageUrl" },
  { id: "atthebeach", name: "At the Beach", category: "frames", inputType: "img", required: "imageUrl" },
  { id: "lavander", name: "Lavender", category: "frames", inputType: "img", required: "imageUrl" },
  { id: "reproduction", name: "Reproduction", category: "frames", inputType: "img", required: "imageUrl" },
  { id: "daffodils", name: "Daffodils", category: "frames", inputType: "both", required: "imageUrl, text" },
  { id: "painter", name: "Painter", category: "drawings", inputType: "img", required: "imageUrl" },
  { id: "explorerdrawing", name: "Explorer Drawing", category: "drawings", inputType: "img", required: "imageUrl" },
  { id: "artistinahat", name: "Artist in a Hat", category: "drawings", inputType: "img", required: "imageUrl" },
  { id: "drawinglesson", name: "Drawing Lesson", category: "drawings", inputType: "img", required: "imageUrl" },
  { id: "brugge", name: "Brugge", category: "drawings", inputType: "img", required: "imageUrl" },
  { id: "watercolours", name: "Watercolours", category: "drawings", inputType: "img", required: "imageUrl" },
  { id: "truck", name: "Truck", category: "drawings", inputType: "img", required: "imageUrl" },
  { id: "portrait", name: "Portrait", category: "drawings", inputType: "img", required: "imageUrl" },
  { id: "quill", name: "Quill", category: "vintage", inputType: "both", required: "imageUrl, text" },
  { id: "stamps", name: "Stamps", category: "vintage", inputType: "img", required: "imageUrl" },
  { id: "magiccard", name: "Magic Card", category: "misc", inputType: "img", required: "imageUrl" },
  { id: "postagestamp", name: "Postage Stamp", category: "misc", inputType: "img", required: "imageUrl" },
  { id: "truckadvert", name: "Truck Advert", category: "misc", inputType: "img", required: "imageUrl" },
  { id: "tablet", name: "Tablet", category: "misc", inputType: "img", required: "imageUrl" },
  { id: "artonthebrickwall", name: "Art on Brick Wall", category: "misc", inputType: "img", required: "imageUrl" },
  { id: "toasts", name: "Toasts", category: "misc", inputType: "img", required: "imageUrl" },
  { id: "photowall", name: "Photo Wall", category: "misc", inputType: "img", required: "imageUrl" },
  { id: "lego", name: "Lego", category: "misc", inputType: "img", required: "imageUrl" },
  { id: "wall", name: "Wall", category: "misc", inputType: "img", required: "imageUrl" },
  { id: "eye", name: "Eye", category: "misc", inputType: "img", required: "imageUrl" },
  { id: "morningmug", name: "Morning Mug", category: "misc", inputType: "both", required: "imageUrl, text" },
  { id: "topsecret", name: "Top Secret", category: "misc", inputType: "both", required: "imageUrl, text" },
  { id: "breakingnews", name: "Breaking News", category: "misc", inputType: "both", required: "imageUrl, channel, title1, title2" },
  { id: "vinylrecord", name: "Vinyl Record", category: "misc", inputType: "both", required: "imageUrl, text" },
  { id: "beer", name: "Beer", category: "misc", inputType: "both", required: "imageUrl, text" },
  { id: "coin", name: "Coin", category: "misc", inputType: "both", required: "imageUrl, text" },
  { id: "readingmagazine", name: "Reading Magazine", category: "magazines", inputType: "both", required: "imageUrl, text" },
  { id: "rosesandmarshmallows", name: "Roses & Marshmallows", category: "magazines", inputType: "img", required: "imageUrl" },
  { id: "interview", name: "Interview", category: "magazines", inputType: "both", required: "imageUrl, text" },
  { id: "reading", name: "Reading", category: "magazines", inputType: "img", required: "imageUrl" },
  { id: "esquire", name: "Esquire", category: "magazines", inputType: "img", required: "imageUrl" },
  { id: "vogue", name: "Vogue", category: "magazines", inputType: "img", required: "imageUrl" },
  { id: "analoguetv", name: "Analogue TV", category: "tv", inputType: "img", required: "imageUrl" },
  { id: "festivereading", name: "Festive Reading", category: "books", inputType: "both", required: "imageUrl, text" },
  { id: "thebook", name: "The Book", category: "books", inputType: "both", required: "imageUrl, text" },
  { id: "veryoldbook", name: "Very Old Book", category: "books", inputType: "both", required: "imageUrl, text" },
  { id: "rosevine", name: "Rose Vine", category: "valentine", inputType: "both", required: "imageUrl, text" },
  { id: "loveletter", name: "Love Letter", category: "valentine", inputType: "img", required: "imageUrl" },
  { id: "lovelock", name: "Love Lock", category: "valentine", inputType: "txt", required: "text" },
  { id: "weddingday", name: "Wedding Day", category: "valentine", inputType: "img", required: "imageUrl" },
  { id: "brooches", name: "Brooches", category: "valentine", inputType: "img", required: "imageUrl" },
  { id: "valentine", name: "Valentine", category: "valentine", inputType: "both", required: "imageUrl, text" },
  { id: "eastercard", name: "Easter Card", category: "easter", inputType: "both", required: "imageUrl, text" },
  { id: "bunnies", name: "Bunnies", category: "easter", inputType: "img", required: "imageUrl" },
  { id: "snowsign", name: "Snow Sign", category: "christmas", inputType: "txt", required: "text" },
  { id: "christmaswriting", name: "Christmas Writing", category: "christmas", inputType: "txt", required: "text" },
  { id: "snowglobe", name: "Snow Globe", category: "christmas", inputType: "both", required: "imageUrl, text" },
  { id: "frostywindowwriting", name: "Frosty Window Writing", category: "christmas", inputType: "txt", required: "text" },
  { id: "santasnowangel", name: "Santa Snow Angel", category: "christmas", inputType: "img", required: "imageUrl" },
  { id: "santasparcelpicture", name: "Santa's Parcel", category: "christmas", inputType: "both", required: "imageUrl, text" },
  { id: "newyearframes", name: "New Year Frames", category: "christmas", inputType: "img", required: "imageUrl" },
];

const ephotoEndpoints: ApiEndpoint[] = ephotoEffectsList.map(e => ({
  path: `/api/ephoto/${e.id}`,
  method: "GET" as const,
  description: `Generate ${e.name} via Ephoto360.com`,
  params: [{ name: "text", type: "string", required: true, description: "Text to render" }],
  format: "json",
  category: "ephoto",
  provider: "Ephoto360",
}));

const photofuniaEndpoints: ApiEndpoint[] = photofuniaEffectsList.map(e => {
  const params: ApiParam[] = [];
  if (e.required.includes("text")) params.push({ name: "text", type: "string", required: true, description: "Text input" });
  if (e.required.includes("imageUrl")) params.push({ name: "imageUrl", type: "string", required: true, description: "Image URL" });
  if (e.required.includes("channel")) params.push({ name: "channel", type: "string", required: false, description: "Channel name" });
  if (e.required.includes("title1")) params.push({ name: "title1", type: "string", required: false, description: "Title" });
  if (e.required.includes("title2")) params.push({ name: "title2", type: "string", required: false, description: "Headline" });
  return {
    path: `/api/photofunia/${e.id}`,
    method: "GET" as const,
    description: `Generate ${e.name} via PhotoFunia.com`,
    params,
    format: "json",
    category: "photofunia",
    provider: "PhotoFunia",
  };
});

const stalkerEndpoints: ApiEndpoint[] = [
  { path: "/api/stalk/github", method: "GET", description: "Lookup GitHub user profile and stats", params: [{ name: "username", type: "string", required: true, description: "GitHub username" }], format: "json", category: "stalker", provider: "GitHub" },
  { path: "/api/stalk/ip", method: "GET", description: "Lookup IP address geolocation and ISP info", params: [{ name: "ip", type: "string", required: true, description: "IP address to lookup" }], format: "json", category: "stalker", provider: "IP-API" },
  { path: "/api/stalk/npm", method: "GET", description: "Lookup NPM package details and stats", params: [{ name: "package", type: "string", required: true, description: "NPM package name" }], format: "json", category: "stalker", provider: "NPM Registry" },
  { path: "/api/stalk/tiktok", method: "GET", description: "Lookup TikTok user profile and stats", params: [{ name: "username", type: "string", required: true, description: "TikTok username" }], format: "json", category: "stalker", provider: "TikTok" },
  { path: "/api/stalk/instagram", method: "GET", description: "Lookup Instagram user profile info", params: [{ name: "username", type: "string", required: true, description: "Instagram username" }], format: "json", category: "stalker", provider: "Instagram" },
  { path: "/api/stalk/twitter", method: "GET", description: "Lookup Twitter/X user profile info", params: [{ name: "username", type: "string", required: true, description: "Twitter username" }], format: "json", category: "stalker", provider: "Twitter/X" },
  { path: "/api/stalk/whatsapp", method: "GET", description: "WhatsApp Channel lookup", params: [{ name: "query", type: "string", required: true, description: "WhatsApp channel query" }], format: "json", category: "stalker", provider: "WhatsApp" },
];

export const allEndpoints: ApiEndpoint[] = [
  ...aiChatEndpoints,
  ...aiToolEndpoints,
  ...aiImageEndpoints,
  ...musicEndpoints,
  ...tiktokEndpoints,
  ...instagramEndpoints,
  ...youtubeEndpoints,
  ...facebookEndpoints,
  ...spotifyEndpoints,
  ...shazamEndpoints,
  ...ephotoEndpoints,
  ...photofuniaEndpoints,
  ...stalkerEndpoints,
];

export const endpointInfo = allEndpoints.filter(e => e.category === "music");

export type EndpointInfo = typeof endpointInfo[number];
export type ApiCategory = typeof apiCategories[number];
