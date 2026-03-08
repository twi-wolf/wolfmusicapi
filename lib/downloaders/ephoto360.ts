const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export interface EphotoEffect {
  id: string;
  name: string;
  slug: string;
  category: string;
  params: { name: string; type: "text" | "image"; placeholder?: string }[];
}

export interface EphotoResult {
  success: boolean;
  creator: string;
  effectName?: string;
  imageUrl?: string;
  error?: string;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 20000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export const EPHOTO_SUBCATEGORIES = [
  { id: "text-effects", name: "Text Effects" },
  { id: "3d-effect", name: "3D Effect" },
  { id: "christmas", name: "Merry Christmas" },
  { id: "new-year", name: "Happy New Year" },
  { id: "game-effect", name: "Game Effect" },
  { id: "love", name: "Love" },
  { id: "happy-birthday", name: "Happy Birthday" },
  { id: "fire-effects", name: "Fire Effects" },
  { id: "halloween", name: "Halloween" },
  { id: "tattoo-effects", name: "Tattoo Effects" },
  { id: "artistic-effect", name: "Artistic Effect" },
  { id: "drawing-effects", name: "Drawing Effects" },
  { id: "cup-effects", name: "Cup Effects" },
  { id: "coins-effects", name: "Coins Effects" },
  { id: "festival", name: "Festival" },
  { id: "shirt-effect", name: "Shirt Effect" },
  { id: "glass-effect", name: "Glass Effect" },
  { id: "cover-facebook", name: "Cover Facebook" },
  { id: "technology", name: "Technology" },
  { id: "animations", name: "Animations" },
  { id: "sport-effects", name: "Sport Effects" },
  { id: "video-effect", name: "Video Effect" },
];

export const EPHOTO_EFFECTS: EphotoEffect[] = [
  { id: "neon", name: "Anonymous Hacker Cyan Neon", slug: "create-anonymous-hacker-avatar-cyan-neon-803", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Hacker text" }] },
  { id: "colorfulglow", name: "Colorful Glow Neon", slug: "create-colorful-neon-light-text-effects-online-797", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Glow text" }] },
  { id: "advancedglow", name: "Advanced Glow Neon", slug: "create-advanced-glow-text-effects-online-804", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Glow text" }] },
  { id: "neononline", name: "Neon Text Online", slug: "neon-text-effect-68", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Neon text" }] },
  { id: "blueneon", name: "Blue Neon Light", slug: "create-blue-neon-light-text-effects-online-795", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Blue neon text" }] },
  { id: "neontext", name: "Neon Text Effect", slug: "create-neon-text-effect-online-785", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Neon text" }] },
  { id: "neonlight", name: "Neon Light Effect", slug: "create-a-neon-light-text-effect-793", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Light text" }] },
  { id: "greenneon", name: "Green Neon Text", slug: "create-green-neon-text-effects-online-801", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Green neon" }] },
  { id: "greenlightneon", name: "Green Light Neon", slug: "create-green-light-neon-text-effects-online-796", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Green light" }] },
  { id: "blueneonlogo", name: "Blue Neon Logo", slug: "create-blue-neon-light-logo-text-effects-online-794", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Logo text" }] },
  { id: "galaxyneon", name: "Galaxy Neon Style", slug: "create-galaxy-style-text-effect-91", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Galaxy text" }] },
  { id: "retroneon", name: "80s Retro Neon", slug: "create-80s-retro-neon-text-effect-online-798", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Retro text" }] },
  { id: "multicolorneon", name: "Multicolor Neon Light", slug: "create-multicolor-neon-light-text-effect-online-800", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Multi text" }] },
  { id: "hackerneon", name: "Hacker Neon Text", slug: "create-anonymous-hacker-neon-text-effect-online-806", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Hack text" }] },
  { id: "devilwings", name: "Devil Wings Neon", slug: "create-neon-devil-wings-text-effect-online-799", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Devil text" }] },
  { id: "glowtext", name: "Glow Text Effect", slug: "create-glow-text-effects-online-805", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Glow text" }] },
  { id: "neonglitch", name: "Digital Glitch Neon", slug: "create-digital-glitch-text-effects-online-767", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Glitch text" }] },
  { id: "neonwall", name: "Neon Writing on Wall", slug: "neon-writing-on-wall-360", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Wall text" }] },
  { id: "led", name: "LED Text Effect", slug: "led-text-effect-504", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "LED text" }] },
  { id: "writeonwetglass", name: "Write on Wet Glass", slug: "write-text-on-wet-glass-online-688", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Wet glass text" }] },
  { id: "deadpool", name: "Deadpool Logo Style", slug: "create-text-effects-in-the-style-of-the-deadpool-logo-818", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Logo text" }] },
  { id: "dragonball", name: "Dragon Ball Style", slug: "create-dragon-ball-style-text-effects-online-809", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "DB text" }] },
  { id: "typographypavement", name: "Typography Pavement", slug: "create-typography-text-effect-on-pavement-online-774", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Pavement text" }] },
  { id: "blackpinklogo", name: "Blackpink Style Logo", slug: "create-a-blackpink-style-logo-with-members-signatures-810", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Logo text" }] },
  { id: "bornpink", name: "Born Pink Album Logo", slug: "create-blackpink-s-born-pink-album-logo-online-779", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Album text" }] },
  { id: "frozen", name: "Frozen Text", slug: "frozen-text-effect-114", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Frozen text" }] },
  { id: "gold", name: "Gold Text", slug: "gold-text-effect-170", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Gold text" }] },
  { id: "horror", name: "Horror Text", slug: "horror-text-effect-239", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Horror text" }] },
  { id: "blood", name: "Blood Text", slug: "blood-text-effect-374", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Blood text" }] },
  { id: "lava", name: "Lava Text", slug: "lava-text-effect-386", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Lava text" }] },
  { id: "thunder", name: "Thunder Text", slug: "thunder-text-effect-393", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Thunder text" }] },
  { id: "matrix", name: "Matrix Text", slug: "matrix-text-effect-405", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Matrix text" }] },
  { id: "smoke", name: "Smoke Text", slug: "smoke-text-effect-428", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Smoke text" }] },
  { id: "naruto", name: "Naruto Shippuden Style", slug: "naruto-shippuden-logo-style-text-effect-online-808", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Naruto text" }] },
  { id: "avengers3d", name: "Avengers Text Style", slug: "create-avengers-text-effect-online-775", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Avengers text" }] },
  { id: "americanflag3d", name: "American Flag Text", slug: "create-american-flag-3d-text-effects-online-778", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "USA text" }] },

  { id: "wooden3d", name: "Wooden 3D Text", slug: "create-a-3d-wooden-text-effect-online-815", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Wood text" }] },
  { id: "cubic3d", name: "Cubic 3D Text", slug: "create-3d-cubic-text-effects-online-813", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Cubic text" }] },
  { id: "wooden3donline", name: "Wooden 3D Online", slug: "create-3d-wooden-text-effects-online-816", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Wood text" }] },
  { id: "water3d", name: "Water 3D Text", slug: "create-3d-water-text-effect-online-814", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Water text" }] },
  { id: "text3d", name: "3D Text Effect", slug: "create-3d-text-effect-online-812", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "3D text" }] },
  { id: "graffiti3d", name: "3D Graffiti Text", slug: "3d-graffiti-text-effect-194", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Graffiti text" }] },
  { id: "silver3d", name: "Glossy Silver 3D", slug: "create-glossy-silver-3d-text-effect-online-802", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Silver text" }] },
  { id: "style3d", name: "3D Style Text", slug: "create-3d-style-text-effects-online-811", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Style text" }] },
  { id: "metal3d", name: "Metallic 3D Text", slug: "create-metallic-text-effect-93", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Metal text" }] },
  { id: "comic3d", name: "3D Comic Style Text", slug: "create-online-3d-comic-style-text-effects-817", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Comic text" }] },
  { id: "hologram3d", name: "Hologram 3D Text", slug: "create-3d-hologram-text-effect-online-770", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Holo text" }] },
  { id: "gradient3d", name: "Gradient 3D Text", slug: "create-3d-gradient-text-effect-online-769", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Gradient text" }] },
  { id: "stone3d", name: "Stone 3D Text", slug: "create-stone-3d-text-effects-online-773", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Stone text" }] },
  { id: "space3d", name: "Space 3D Text", slug: "create-3d-space-text-effect-online-768", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Space text" }] },
  { id: "sand3d", name: "Sand 3D Text", slug: "create-3d-sand-text-effects-online-771", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Sand text" }] },
  { id: "snow3d", name: "Snow 3D Text", slug: "create-3d-snow-text-effects-online-772", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Snow text" }] },
  { id: "papercut3d", name: "Paper Cut 3D Text", slug: "create-paper-cut-3d-text-effects-online-766", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Paper text" }] },
  { id: "balloon3d", name: "Balloon 3D Text", slug: "create-balloon-3d-text-effects-online-765", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Balloon text" }] },

  { id: "christmas3d", name: "Christmas 3D Text", slug: "create-christmas-3d-text-effects-online-780", category: "christmas", params: [{ name: "text", type: "text", placeholder: "Merry Xmas" }] },
  { id: "christmas-sparkles", name: "Sparkles Christmas Text", slug: "create-sparkles-3d-christmas-text-effect-online-727", category: "christmas", params: [{ name: "text", type: "text", placeholder: "Christmas text" }] },
  { id: "christmas-snow3d", name: "Christmas Snow 3D Text", slug: "create-a-beautiful-3d-christmas-snow-text-effect-793", category: "christmas", params: [{ name: "text", type: "text", placeholder: "Christmas text" }] },
  { id: "christmas-frozen", name: "Frozen Christmas Text", slug: "create-a-frozen-christmas-text-effect-online-792", category: "christmas", params: [{ name: "text", type: "text", placeholder: "Frozen Xmas" }] },
  { id: "christmas-gold", name: "Christmas Gold Glitter", slug: "christmas-and-new-year-glittering-3d-golden-text-effect-794", category: "christmas", params: [{ name: "text", type: "text", placeholder: "Gold text" }] },

  { id: "newyear-gold", name: "New Year Gold Text", slug: "christmas-and-new-year-glittering-3d-golden-text-effect-794", category: "new-year", params: [{ name: "text", type: "text", placeholder: "Happy New Year" }] },

  { id: "pubglogo", name: "PUBG Logo Maker", slug: "pubg-logo-maker-cute-character-online-617", category: "game-effect", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
  { id: "valorantbanner", name: "Valorant YouTube Banner", slug: "create-valorant-banner-youtube-online-588", category: "game-effect", params: [{ name: "text", type: "text", placeholder: "Channel name" }] },

  { id: "birthday3d", name: "Birthday 3D Text", slug: "create-happy-birthday-3d-text-effects-online-777", category: "happy-birthday", params: [{ name: "text", type: "text", placeholder: "Happy Birthday" }] },
  { id: "pubgbirthday", name: "PUBG Birthday Cake", slug: "write-name-on-pubg-birthday-cake-images-522", category: "happy-birthday", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
  { id: "flowerbirthday", name: "Flower Birthday Cake", slug: "write-name-on-flower-birthday-cake-pics-472", category: "happy-birthday", params: [{ name: "text", type: "text", placeholder: "Your name" }] },

  { id: "fire", name: "Fire Text Effect", slug: "fire-text-effect-144", category: "fire-effects", params: [{ name: "text", type: "text", placeholder: "Fire text" }] },
  { id: "flamelettering", name: "Flame Lettering", slug: "flame-lettering-effect-372", category: "fire-effects", params: [{ name: "text", type: "text", placeholder: "Flame text" }] },

  { id: "horrorcemetery", name: "Horror Cemetery Name", slug: "write-your-name-on-horror-cemetery-gate-597", category: "halloween", params: [{ name: "text", type: "text", placeholder: "Your name" }] },

  { id: "nametattoo", name: "Name Tattoo Online", slug: "make-tattoos-online-by-your-name-309", category: "tattoo-effects", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
];

export async function generateEphoto(effectSlug: string, texts: string[]): Promise<EphotoResult> {
  const effect = EPHOTO_EFFECTS.find(e => e.slug === effectSlug || e.id === effectSlug);
  const effectName = effect?.name || effectSlug;
  const slug = effect?.slug || effectSlug;

  try {
    const pageUrl = `https://en.ephoto360.com/${slug}.html`;
    const pageRes = await fetchWithTimeout(pageUrl, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
    });

    if (!pageRes.ok) {
      return { success: false, creator: "APIs by Silent Wolf | A tech explorer", error: `Effect page not found (${pageRes.status})` };
    }

    const pageHtml = await pageRes.text();
    const cookies = pageRes.headers.get("set-cookie") || "";

    const tokenMatch = pageHtml.match(/name="token"\s+value="([^"]+)"/);
    const buildServerMatch = pageHtml.match(/name="build_server"\s+value="([^"]+)"/);
    const buildServerIdMatch = pageHtml.match(/name="build_server_id"\s+value="([^"]+)"/);

    if (!tokenMatch || !buildServerMatch) {
      return { success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Could not extract form tokens" };
    }

    const token = tokenMatch[1];
    const buildServer = buildServerMatch[1];
    const buildServerId = buildServerIdMatch?.[1] || "1";

    const formData = new URLSearchParams();
    for (const t of texts) {
      formData.append("text[]", t);
    }
    formData.append("token", token);
    formData.append("build_server", buildServer);
    formData.append("build_server_id", buildServerId);
    formData.append("submit", "GO");

    const cookieHeader = cookies.split(",").map(c => c.split(";")[0].trim()).filter(Boolean).join("; ");

    const postRes = await fetchWithTimeout(pageUrl, {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
        "Referer": pageUrl,
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      body: formData.toString(),
    });

    const postHtml = await postRes.text();
    const postCookies = postRes.headers.get("set-cookie") || "";
    const allCookies = [cookieHeader, ...postCookies.split(",").map(c => c.split(";")[0].trim())].filter(Boolean).join("; ");

    const formValueMatch = postHtml.match(/form_value_input"\s+value="([^"]+)"/);
    if (!formValueMatch) {
      return { success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Could not extract form value for image generation" };
    }

    const formValueRaw = formValueMatch[1]
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#039;/g, "'");

    let formValue: any;
    try {
      formValue = JSON.parse(formValueRaw);
    } catch {
      return { success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Invalid form value data" };
    }

    const createData = new URLSearchParams();
    createData.append("id", formValue.id || "");
    if (Array.isArray(formValue.text)) {
      for (const t of formValue.text) {
        createData.append("text[]", t);
      }
    }
    createData.append("token", formValue.token || "");
    createData.append("build_server", formValue.build_server || "");
    createData.append("build_server_id", formValue.build_server_id || "");

    let imageResult: any = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const createRes = await fetchWithTimeout("https://en.ephoto360.com/effect/create-image", {
        method: "POST",
        headers: {
          "User-Agent": USER_AGENT,
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Requested-With": "XMLHttpRequest",
          "Referer": pageUrl,
          ...(allCookies ? { Cookie: allCookies } : {}),
        },
        body: createData.toString(),
      });

      const createText = await createRes.text();
      try {
        imageResult = JSON.parse(createText);
        if (imageResult.success === true && imageResult.image) {
          break;
        }
      } catch {
        // retry
      }
      await new Promise(r => setTimeout(r, 2000));
    }

    if (!imageResult || !imageResult.success || !imageResult.image) {
      return { success: false, creator: "APIs by Silent Wolf | A tech explorer", error: "Image generation failed after multiple attempts" };
    }

    const imageUrl = `${formValue.build_server}${imageResult.image}`;

    return {
      success: true,
      creator: "APIs by Silent Wolf | A tech explorer",
      effectName,
      imageUrl,
    };
  } catch (err: any) {
    return { success: false, creator: "APIs by Silent Wolf | A tech explorer", error: err.message || "Ephoto360 generation failed" };
  }
}

export function listEphotoEffects() {
  return EPHOTO_EFFECTS.map(e => ({
    id: e.id,
    name: e.name,
    slug: e.slug,
    category: e.category,
    endpoint: `/api/ephoto/${e.slug}`,
    params: e.params.map(p => ({ name: p.name, type: p.type, placeholder: p.placeholder })),
  }));
}
