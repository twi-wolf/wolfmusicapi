const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const XFF_IPS = ["8.8.8.8", "1.1.1.1", "9.9.9.9", "208.67.222.222", "8.8.4.4", "4.2.2.2"];
const getXffIp = () => XFF_IPS[Math.floor(Math.random() * XFF_IPS.length)];

const BROWSER_HEADERS = {
  "User-Agent": USER_AGENT,
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Connection": "keep-alive",
  "Upgrade-Insecure-Requests": "1",
  "sec-ch-ua": '"Not A(Brand";v="99", "Google Chrome";v="131", "Chromium";v="131"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "Sec-Fetch-Site": "same-origin",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-User": "?1",
  "Sec-Fetch-Dest": "document",
};

export interface PhotoFuniaEffect {
  id: string;
  name: string;
  slug: string;
  category: string;
  inputType: "txt" | "img" | "both";
  fields: { name: string; type: "text" | "image" | "hidden"; label?: string; maxLength?: number; placeholder?: string; default?: string }[];
}

export interface PhotoFuniaResult {
  success: boolean;
  creator: string;
  effectName?: string;
  imageUrl?: string;
  error?: string;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 25000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export const PHOTOFUNIA_EFFECTS: PhotoFuniaEffect[] = [
  { id: "smokeflare", name: "Smoke Flare", slug: "smoke-flare", category: "halloween", inputType: "img", fields: [{ name: "image", type: "image", label: "Face Photo" }] },
  { id: "nightmarewriting", name: "Nightmare Writing", slug: "nightmare-writing", category: "halloween", inputType: "txt", fields: [{ name: "text", type: "text", label: "Text", placeholder: "Nightmare" }] },
  { id: "lightning", name: "Lightning", slug: "lightning", category: "halloween", inputType: "img", fields: [{ name: "image", type: "image", label: "Face Photo" }] },
  { id: "cemeterygates", name: "Cemetery Gates", slug: "cemetery-gates", category: "halloween", inputType: "txt", fields: [{ name: "text", type: "text", label: "Text", placeholder: "RIP" }] },
  { id: "summoningspirits", name: "Summoning Spirits", slug: "summoning-spirits", category: "halloween", inputType: "img", fields: [{ name: "image", type: "image", label: "Face Photo" }] },
  { id: "ghostwood", name: "Ghost Wood", slug: "ghostwood", category: "halloween", inputType: "img", fields: [{ name: "image", type: "image", label: "Face Photo" }] },

  { id: "autumn", name: "Autumn", slug: "autumn", category: "filters", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "jade", name: "Jade", slug: "jade", category: "filters", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "romantic", name: "Romantic", slug: "romantic", category: "filters", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "mystical", name: "Mystical", slug: "mystical", category: "filters", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "lomography", name: "Lomography", slug: "lomography", category: "filters", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "sepia", name: "Sepia", slug: "sepia", category: "filters", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },

  { id: "watercolourtext", name: "Watercolour Text", slug: "watercolour-text", category: "lab", inputType: "txt", fields: [{ name: "text", type: "text", label: "Text", placeholder: "Hello" }] },
  { id: "denimemdroidery", name: "Denim Embroidery", slug: "denim-emdroidery", category: "lab", inputType: "txt", fields: [{ name: "text", type: "text", label: "Text", placeholder: "Hello" }] },
  { id: "cinematicket", name: "Cinema Ticket", slug: "cinema-ticket", category: "lab", inputType: "txt", fields: [{ name: "text", type: "text", label: "Text", placeholder: "Movie" }] },
  { id: "arrowsigns", name: "Arrow Signs", slug: "arrow-signs", category: "lab", inputType: "txt", fields: [{ name: "text", type: "text", label: "Text", placeholder: "This way" }] },
  { id: "yacht", name: "Yacht", slug: "yacht", category: "lab", inputType: "txt", fields: [{ name: "text", type: "text", label: "Text", placeholder: "Name" }] },
  { id: "cloudyfilter", name: "Cloudy Filter", slug: "cloudy-filter", category: "filters", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "lightgraffiti", name: "Light Graffiti", slug: "light-graffiti", category: "lab", inputType: "txt", fields: [{ name: "text", type: "text", label: "Text", placeholder: "Hello" }] },
  { id: "chalkboard", name: "Chalkboard", slug: "chalkboard", category: "lab", inputType: "txt", fields: [{ name: "text", type: "text", label: "Title", placeholder: "Hello" }, { name: "symbol", type: "hidden", default: "star" }, { name: "text2", type: "text", label: "Body Text", placeholder: "Your message" }] },
  { id: "rustywriting", name: "Rusty Writing", slug: "rusty-writing", category: "lab", inputType: "txt", fields: [{ name: "text", type: "text", label: "Text", placeholder: "Rusty" }] },
  { id: "streetsign", name: "Street Sign", slug: "street-sign", category: "lab", inputType: "txt", fields: [{ name: "text", type: "text", label: "Text", placeholder: "Street" }] },
  { id: "floralwreath", name: "Floral Wreath", slug: "floral-wreath", category: "lab", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "retrowave", name: "Retrowave", slug: "retro-wave", category: "lab", inputType: "txt", fields: [{ name: "text", type: "text", label: "Text", placeholder: "Retro" }] },
  { id: "youaremyuniverse", name: "You Are My Universe", slug: "you-are-my-universe", category: "lab", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "einstein", name: "Einstein", slug: "einstein", category: "lab", inputType: "txt", fields: [{ name: "text", type: "text", label: "Text", maxLength: 15, placeholder: "E=mc²" }] },
  { id: "rugbyball", name: "Rugby Ball", slug: "rugby-ball", category: "lab", inputType: "txt", fields: [{ name: "text", type: "text", label: "Text", placeholder: "Team" }] },
  { id: "redandblue", name: "Red and Blue", slug: "red-and-blue", category: "lab", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "vhs", name: "VHS", slug: "vhs", category: "lab", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "typewriter", name: "Typewriter", slug: "typewriter", category: "lab", inputType: "txt", fields: [{ name: "text", type: "text", label: "Text", placeholder: "Type" }] },
  { id: "diptych", name: "Diptych", slug: "diptych", category: "lab", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "badges", name: "Badges", slug: "badges", category: "lab", inputType: "both", fields: [{ name: "image", type: "image", label: "Photo" }, { name: "text", type: "text", label: "Text", placeholder: "Badge" }] },
  { id: "wanted", name: "Wanted", slug: "wanted", category: "lab", inputType: "both", fields: [{ name: "image", type: "image", label: "Photo" }, { name: "text", type: "text", label: "Name", placeholder: "Name" }] },
  { id: "crown", name: "Crown", slug: "crown", category: "lab", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "anime", name: "Anime", slug: "anime", category: "lab", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "popart", name: "Pop Art", slug: "popart", category: "lab", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "puzzle", name: "Puzzle", slug: "puzzle", category: "lab", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "glass", name: "Glass", slug: "glass", category: "lab", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "animator", name: "Animator", slug: "animator", category: "lab", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },

  { id: "postersonthewall", name: "Posters on the Wall", slug: "posters-on-the-wall", category: "posters", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "posterwall", name: "Poster Wall", slug: "poster-wall", category: "posters", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "trainstationposter", name: "Train Station Poster", slug: "train-station-poster", category: "posters", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "rainynight", name: "Rainy Night", slug: "rainy-night", category: "posters", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "nightmotion", name: "Night Motion", slug: "night-motion", category: "posters", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "campaign", name: "Campaign", slug: "campaign", category: "posters", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "bicycle", name: "Bicycle", slug: "bicycle", category: "posters", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "citylight", name: "City Light", slug: "citylight", category: "posters", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "affiche", name: "Affiche", slug: "affiche", category: "posters", inputType: "both", fields: [{ name: "image", type: "image", label: "Photo" }, { name: "text", type: "text", label: "Text", placeholder: "Title" }] },
  { id: "sidewalk", name: "Sidewalk", slug: "sidewalk", category: "posters", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "cyclist", name: "Cyclist", slug: "cyclist", category: "posters", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "tulips", name: "Tulips", slug: "tulips", category: "posters", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "cafe", name: "Cafe", slug: "cafe", category: "posters", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "underground", name: "Underground", slug: "underground", category: "posters", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "reconstruction", name: "Reconstruction", slug: "reconstruction", category: "posters", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "posters", name: "Posters", slug: "posters", category: "posters", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },

  { id: "melbournegallery", name: "Melbourne Gallery", slug: "melbourne-gallery", category: "galleries", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "artadmirer", name: "Art Admirer", slug: "art-admirer", category: "galleries", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "nationalgalleryinlondon", name: "National Gallery London", slug: "national-gallery-in-london", category: "galleries", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "blackwhitegallery", name: "B&W Gallery", slug: "black-white-gallery", category: "galleries", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "galleryvisitor", name: "Gallery Visitor", slug: "gallery-visitor", category: "galleries", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "paintingandsketches", name: "Painting & Sketches", slug: "painting-and-sketches", category: "galleries", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "passingbythepainting", name: "Passing by the Painting", slug: "passing-by-the-painting", category: "galleries", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "silhouettes", name: "Silhouettes", slug: "silhouettes", category: "galleries", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "rijskmuseum", name: "Rijks Museum", slug: "rijskmuseum", category: "galleries", inputType: "both", fields: [{ name: "image", type: "image", label: "Photo" }, { name: "text", type: "text", label: "Text", placeholder: "Art" }] },

  { id: "oldcamera", name: "Old Camera", slug: "old-camera", category: "photography", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "kittyandframe", name: "Kitty and Frame", slug: "kitty-and-frame", category: "photography", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "frame", name: "Frame", slug: "frame", category: "photography", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },

  { id: "mirror", name: "Mirror", slug: "mirror", category: "faces", inputType: "img", fields: [{ name: "image", type: "image", label: "Face Photo" }] },
  { id: "formulaoneracer", name: "Formula One Racer", slug: "formula-one-racer", category: "faces", inputType: "img", fields: [{ name: "image", type: "image", label: "Face Photo" }] },
  { id: "warrior", name: "Warrior", slug: "warrior", category: "faces", inputType: "img", fields: [{ name: "image", type: "image", label: "Face Photo" }] },
  { id: "knight", name: "Knight", slug: "knight", category: "faces", inputType: "img", fields: [{ name: "image", type: "image", label: "Face Photo" }] },
  { id: "biker", name: "Biker", slug: "biker", category: "faces", inputType: "img", fields: [{ name: "image", type: "image", label: "Face Photo" }] },
  { id: "surfer", name: "Surfer", slug: "surfer", category: "faces", inputType: "img", fields: [{ name: "image", type: "image", label: "Face Photo" }] },
  { id: "snowboard", name: "Snowboard", slug: "snowboard", category: "faces", inputType: "img", fields: [{ name: "image", type: "image", label: "Face Photo" }] },
  { id: "dj", name: "DJ", slug: "dj", category: "faces", inputType: "img", fields: [{ name: "image", type: "image", label: "Face Photo" }] },
  { id: "bodybuilder", name: "Bodybuilder", slug: "bodybuilder", category: "faces", inputType: "img", fields: [{ name: "image", type: "image", label: "Face Photo" }] },
  { id: "lulu", name: "Lulu", slug: "lulu", category: "faces", inputType: "img", fields: [{ name: "image", type: "image", label: "Face Photo" }] },
  { id: "hockey", name: "Hockey", slug: "hockey", category: "faces", inputType: "img", fields: [{ name: "image", type: "image", label: "Face Photo" }] },
  { id: "ethanol", name: "Ethanol", slug: "ethanol", category: "faces", inputType: "img", fields: [{ name: "image", type: "image", label: "Face Photo" }] },
  { id: "godfather", name: "Godfather", slug: "godfather", category: "faces", inputType: "img", fields: [{ name: "image", type: "image", label: "Face Photo" }] },
  { id: "pirates", name: "Pirates", slug: "pirates", category: "faces", inputType: "img", fields: [{ name: "image", type: "image", label: "Face Photo" }] },
  { id: "miss", name: "Miss", slug: "miss", category: "faces", inputType: "both", fields: [{ name: "image", type: "image", label: "Face Photo" }, { name: "text", type: "text", label: "Name", placeholder: "Name" }] },

  { id: "concretejungle", name: "Concrete Jungle", slug: "concrete-jungle", category: "billboards", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "broadwayatnight", name: "Broadway at Night", slug: "broadway-at-night", category: "billboards", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "newyorkatnight", name: "New York at Night", slug: "new-york-at-night", category: "billboards", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "shoppingarcade", name: "Shopping Arcade", slug: "shopping-arcade", category: "billboards", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "oldtram", name: "Old Tram", slug: "old-tram", category: "billboards", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "workerbythebillboard", name: "Worker by Billboard", slug: "worker-by-the-billboard", category: "billboards", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "eveningbillboard", name: "Evening Billboard", slug: "evening-billboard", category: "billboards", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "pedestriancrossing", name: "Pedestrian Crossing", slug: "pedestrian-crossing", category: "billboards", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "cube", name: "Cube", slug: "cube", category: "billboards", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "nyc", name: "NYC", slug: "nyc", category: "billboards", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "city", name: "City", slug: "city", category: "billboards", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "ax", name: "AX", slug: "ax", category: "billboards", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },

  { id: "trump", name: "Trump", slug: "trump", category: "celebrities", inputType: "both", fields: [{ name: "image", type: "image", label: "Photo" }, { name: "text", type: "text", label: "Text", placeholder: "Great!" }] },
  { id: "obama", name: "Obama", slug: "obama", category: "celebrities", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "madonna", name: "Madonna", slug: "madonna", category: "celebrities", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "putin", name: "Putin", slug: "putin", category: "celebrities", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },

  { id: "theframe", name: "The Frame", slug: "the-frame", category: "frames", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "atthebeach", name: "At the Beach", slug: "at-the-beach", category: "frames", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "lavander", name: "Lavender", slug: "lavander", category: "frames", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "reproduction", name: "Reproduction", slug: "reproduction", category: "frames", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "daffodils", name: "Daffodils", slug: "daffodils", category: "frames", inputType: "both", fields: [{ name: "image", type: "image", label: "Photo" }, { name: "text", type: "text", label: "Text", placeholder: "Spring" }] },

  { id: "painter", name: "Painter", slug: "painter", category: "drawings", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "explorerdrawing", name: "Explorer Drawing", slug: "explorer-drawing", category: "drawings", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "artistinahat", name: "Artist in a Hat", slug: "artist-in-a-hat", category: "drawings", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "drawinglesson", name: "Drawing Lesson", slug: "drawing-lesson", category: "drawings", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "brugge", name: "Brugge", slug: "brugge", category: "drawings", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "watercolours", name: "Watercolours", slug: "watercolours", category: "drawings", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "truck", name: "Truck", slug: "truck", category: "drawings", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "portrait", name: "Portrait", slug: "portrait", category: "drawings", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },

  { id: "quill", name: "Quill", slug: "quill", category: "vintage", inputType: "both", fields: [{ name: "image", type: "image", label: "Photo" }, { name: "text", type: "text", label: "Text", placeholder: "Dear..." }] },
  { id: "stamps", name: "Stamps", slug: "stamps", category: "vintage", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },

  { id: "magiccard", name: "Magic Card", slug: "magic-card", category: "misc", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "postagestamp", name: "Postage Stamp", slug: "postage-stamp", category: "misc", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "truckadvert", name: "Truck Advert", slug: "truck-advert", category: "misc", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "tablet", name: "Tablet", slug: "tablet", category: "misc", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "artonthebrickwall", name: "Art on Brick Wall", slug: "art-on-the-brick-wall", category: "misc", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "toasts", name: "Toasts", slug: "toasts", category: "misc", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "photowall", name: "Photo Wall", slug: "photowall", category: "misc", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "lego", name: "Lego", slug: "lego", category: "misc", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "wall", name: "Wall", slug: "wall", category: "misc", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "eye", name: "Eye", slug: "eye", category: "misc", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "morningmug", name: "Morning Mug", slug: "morning-mug", category: "misc", inputType: "both", fields: [{ name: "image", type: "image", label: "Photo" }, { name: "text", type: "text", label: "Text", placeholder: "Good morning" }] },
  { id: "topsecret", name: "Top Secret", slug: "top-secret", category: "misc", inputType: "both", fields: [{ name: "image", type: "image", label: "Photo" }, { name: "text", type: "text", label: "Text", placeholder: "Classified" }] },
  { id: "breakingnews", name: "Breaking News", slug: "breaking-news", category: "misc", inputType: "both", fields: [{ name: "image", type: "image", label: "Photo" }, { name: "channel", type: "text", label: "Channel", maxLength: 10, placeholder: "CNN" }, { name: "title1", type: "text", label: "Title", maxLength: 30, placeholder: "Breaking News" }, { name: "title2", type: "text", label: "Headline", maxLength: 50, placeholder: "Big event happened" }] },
  { id: "vinylrecord", name: "Vinyl Record", slug: "vinyl-record", category: "misc", inputType: "both", fields: [{ name: "image", type: "image", label: "Photo" }, { name: "text", type: "text", label: "Text", placeholder: "Album" }] },
  { id: "beer", name: "Beer", slug: "beer", category: "misc", inputType: "both", fields: [{ name: "image", type: "image", label: "Photo" }, { name: "text", type: "text", label: "Text", placeholder: "Cheers" }] },
  { id: "coin", name: "Coin", slug: "coin", category: "misc", inputType: "both", fields: [{ name: "image", type: "image", label: "Photo" }, { name: "text", type: "text", label: "Text", placeholder: "2024" }] },

  { id: "readingmagazine", name: "Reading Magazine", slug: "reading-magazine", category: "magazines", inputType: "both", fields: [{ name: "image", type: "image", label: "Photo" }, { name: "text", type: "text", label: "Text", placeholder: "Title" }] },
  { id: "rosesandmarshmallows", name: "Roses & Marshmallows", slug: "roses-and-marshmallows", category: "magazines", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "interview", name: "Interview", slug: "interview", category: "magazines", inputType: "both", fields: [{ name: "image", type: "image", label: "Photo" }, { name: "text", type: "text", label: "Text", placeholder: "Star" }] },
  { id: "reading", name: "Reading", slug: "reading", category: "magazines", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "esquire", name: "Esquire", slug: "esquire", category: "magazines", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "vogue", name: "Vogue", slug: "vogue", category: "magazines", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },

  { id: "analoguetv", name: "Analogue TV", slug: "analogue-tv", category: "tv", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },

  { id: "festivereading", name: "Festive Reading", slug: "festive-reading", category: "books", inputType: "both", fields: [{ name: "image", type: "image", label: "Photo" }, { name: "text", type: "text", label: "Text", placeholder: "Title" }] },
  { id: "thebook", name: "The Book", slug: "the-book", category: "books", inputType: "both", fields: [{ name: "image", type: "image", label: "Photo" }, { name: "text", type: "text", label: "Text", placeholder: "Title" }] },
  { id: "veryoldbook", name: "Very Old Book", slug: "very-old-book", category: "books", inputType: "both", fields: [{ name: "image", type: "image", label: "Photo" }, { name: "text", type: "text", label: "Text", placeholder: "Title" }] },

  { id: "rosevine", name: "Rose Vine", slug: "rose-vine", category: "valentine", inputType: "both", fields: [{ name: "image", type: "image", label: "Photo" }, { name: "text", type: "text", label: "Text", placeholder: "Love" }] },
  { id: "loveletter", name: "Love Letter", slug: "love-letter", category: "valentine", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "lovelock", name: "Love Lock", slug: "love-lock", category: "valentine", inputType: "txt", fields: [{ name: "text", type: "text", label: "Text", placeholder: "Names" }] },
  { id: "weddingday", name: "Wedding Day", slug: "wedding-day", category: "valentine", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "brooches", name: "Brooches", slug: "brooches", category: "valentine", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "valentine", name: "Valentine", slug: "valentine", category: "valentine", inputType: "both", fields: [{ name: "image", type: "image", label: "Photo" }, { name: "text", type: "text", label: "Text", placeholder: "Love" }] },

  { id: "eastercard", name: "Easter Card", slug: "easter-card", category: "easter", inputType: "both", fields: [{ name: "image", type: "image", label: "Photo" }, { name: "text", type: "text", label: "Text", placeholder: "Happy Easter" }] },
  { id: "bunnies", name: "Bunnies", slug: "bunnies", category: "easter", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "easterflowers", name: "Easter Flowers", slug: "easter-flowers", category: "easter", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "easterframe", name: "Easter Frame", slug: "easter-frame", category: "easter", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "easternest", name: "Easter Nest", slug: "easter-nest", category: "easter", inputType: "both", fields: [{ name: "image", type: "image", label: "Photo" }, { name: "text", type: "text", label: "Text", placeholder: "Happy Easter" }] },
  { id: "easteregg", name: "Easter Egg", slug: "easter_egg", category: "easter", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }, { name: "colour", type: "hidden", default: "blue" }, { name: "style", type: "hidden", default: "style1" }] },
  { id: "easterpostcard", name: "Easter Postcard", slug: "easter_postcard", category: "easter", inputType: "both", fields: [{ name: "image", type: "image", label: "Photo" }, { name: "text", type: "text", label: "Text", placeholder: "Happy Easter" }] },
  { id: "bunnyears", name: "Bunny Ears", slug: "bunny_ears", category: "easter", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "eastereffect", name: "Easter", slug: "easter", category: "easter", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },

  { id: "snowsign", name: "Snow Sign", slug: "snow-sign", category: "christmas", inputType: "txt", fields: [{ name: "text", type: "text", label: "Text", placeholder: "Merry Christmas" }] },
  { id: "christmaswriting", name: "Christmas Writing", slug: "christmas-writing", category: "christmas", inputType: "txt", fields: [{ name: "text", type: "text", label: "Text", placeholder: "Merry Christmas" }] },
  { id: "snowglobe", name: "Snow Globe", slug: "snow-globe", category: "christmas", inputType: "both", fields: [{ name: "image", type: "image", label: "Photo" }, { name: "text", type: "text", label: "Text", placeholder: "Winter" }] },
  { id: "frostywindowwriting", name: "Frosty Window Writing", slug: "frosty-window-writing", category: "christmas", inputType: "txt", fields: [{ name: "text", type: "text", label: "Text", placeholder: "Winter" }] },
  { id: "santasnowangel", name: "Santa Snow Angel", slug: "santa-snow-angel", category: "christmas", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
  { id: "santasparcelpicture", name: "Santa's Parcel", slug: "santas-parcel-picture", category: "christmas", inputType: "both", fields: [{ name: "image", type: "image", label: "Photo" }, { name: "text", type: "text", label: "Text", placeholder: "Merry Xmas" }] },
  { id: "newyearframes", name: "New Year Frames", slug: "new-year-frames", category: "christmas", inputType: "img", fields: [{ name: "image", type: "image", label: "Photo" }] },
];

function extractCookies(res: Response): string {
  const cookies: string[] = [];
  const setCookieHeaders = res.headers.getSetCookie?.() || [];
  for (const h of setCookieHeaders) {
    const parts = h.split(";")[0];
    if (parts) cookies.push(parts);
  }
  return cookies.join("; ");
}

async function getPhotofuniaSession(effectSlug: string): Promise<string> {
  try {
    const res = await fetchWithTimeout(`https://photofunia.com/categories/all_effects`, {
      headers: {
        ...BROWSER_HEADERS,
        "Referer": "https://photofunia.com/",
      },
    });
    const cookies = extractCookies(res);

    if (!cookies) {
      const res2 = await fetchWithTimeout(`https://photofunia.com/`, {
        headers: BROWSER_HEADERS,
      });
      return extractCookies(res2);
    }

    return cookies;
  } catch {
    return "";
  }
}

async function uploadImageToPhotofunia(imageUrl: string, cookies: string, effectSlug: string): Promise<{ key: string | null; cookies: string; error?: string }> {
  try {
    const imgRes = await fetchWithTimeout(imageUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "image/*,*/*",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });
    if (!imgRes.ok) {
      console.log(`[photofunia] Failed to fetch image: ${imgRes.status} ${imgRes.statusText}`);
      return { key: null, cookies, error: `Could not download the image (HTTP ${imgRes.status}). Make sure the URL is publicly accessible.` };
    }

    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());

    const ext = contentType.includes("png") ? "png" : contentType.includes("gif") ? "gif" : contentType.includes("webp") ? "webp" : "jpg";
    const mimeType = contentType.includes("image/") ? contentType.split(";")[0] : "image/jpeg";

    const boundary = "----WebKitFormBoundary" + Math.random().toString(36).slice(2);
    const parts: Buffer[] = [];

    parts.push(Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="photo"; filename="image.${ext}"\r\n` +
      `Content-Type: ${mimeType}\r\n\r\n`
    ));
    parts.push(imgBuffer);
    parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    const body = Buffer.concat(parts);

    const uploadRes = await fetchWithTimeout("https://photofunia.com/images?server=1", {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Referer": `https://photofunia.com/categories/all_effects`,
        "Origin": "https://photofunia.com",
        "sec-ch-ua": '"Not A(Brand";v="99", "Google Chrome";v="131", "Chromium";v="131"',
        "sec-ch-ua-mobile": "?0",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Dest": "empty",
        "X-Requested-With": "XMLHttpRequest",
        "X-Forwarded-For": getXffIp(),
        ...(cookies ? { "Cookie": cookies } : {}),
      },
      body: body,
    });

    const newCookies = extractCookies(uploadRes);
    const mergedCookies = newCookies ? `${cookies}; ${newCookies}` : cookies;

    if (!uploadRes.ok) {
      console.log(`[photofunia] Upload response: ${uploadRes.status}`);
      if (uploadRes.status === 403) {
        return { key: null, cookies: mergedCookies, error: "PhotoFunia is temporarily unavailable or rate-limited. Please try again in a moment." };
      }
      return { key: null, cookies: mergedCookies, error: `PhotoFunia image upload failed (HTTP ${uploadRes.status}). Please try again.` };
    }

    const uploadData = await uploadRes.json() as any;
    if (uploadData?.error) {
      const pfErr = uploadData.error?.description || uploadData.error?.key || "Unknown upload error";
      return { key: null, cookies: mergedCookies, error: `PhotoFunia rejected the image: ${pfErr}` };
    }
    const key = uploadData?.response?.key || uploadData?.key || null;
    return { key, cookies: mergedCookies };
  } catch (err: any) {
    console.log(`[photofunia] Image upload failed: ${err.message}`);
    return { key: null, cookies, error: `Image upload failed: ${err.message}` };
  }
}

export async function generatePhotofunia(
  effectId: string,
  textInputs: Record<string, string>,
  imageUrl?: string
): Promise<PhotoFuniaResult> {
  const CREATOR = "APIs by Silent Wolf | A tech explorer";
  const effect = PHOTOFUNIA_EFFECTS.find(e => e.id === effectId || e.slug === effectId);
  if (!effect) {
    return { success: false, creator: CREATOR, error: `Effect "${effectId}" not found. Use /api/photofunia/list to see available effects.` };
  }

  const needsImage = effect.fields.some(f => f.type === "image");
  const needsText = effect.fields.some(f => f.type === "text");

  if (needsImage && !imageUrl) {
    return { success: false, creator: CREATOR, error: `Effect "${effect.name}" requires an image. Provide 'imageUrl' parameter with a valid image URL.` };
  }

  if (needsText) {
    const hasAnyText = effect.fields.filter(f => f.type === "text").some(f => textInputs[f.name] || textInputs["text"]);
    if (!hasAnyText) {
      const textFields = effect.fields.filter(f => f.type === "text").map(f => f.name);
      return { success: false, creator: CREATOR, error: `Effect "${effect.name}" requires text input. Provide '${textFields.join("' or '")}' parameter.` };
    }
  }

  try {
    let sessionCookies = await getPhotofuniaSession(effect.slug);
    let imageKey: string | null = null;

    if (needsImage && imageUrl) {
      const uploadResult = await uploadImageToPhotofunia(imageUrl, sessionCookies, effect.slug);
      imageKey = uploadResult.key;
      sessionCookies = uploadResult.cookies;
      if (!imageKey) {
        return { success: false, creator: CREATOR, error: uploadResult.error || "Failed to upload image to PhotoFunia. Make sure the image URL is accessible and points to a valid image." };
      }
    }

    const boundary = "----WebKitFormBoundary" + Math.random().toString(36).slice(2);
    const parts: string[] = [];

    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="current-category"\r\n\r\nall_effects`);

    for (const field of effect.fields) {
      if (field.type === "hidden" && field.default) {
        parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${field.name}"\r\n\r\n${field.default}`);
      } else if (field.type === "text") {
        const value = textInputs[field.name] || textInputs["text"] || "";
        if (value) {
          parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${field.name}"\r\n\r\n${value}`);
        }
      } else if (field.type === "image" && imageKey) {
        parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${field.name}"\r\n\r\n${imageKey}`);
        parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${field.name}:crop"\r\n\r\n`);
      }
    }

    const bodyStr = parts.join("\r\n") + `\r\n--${boundary}--\r\n`;

    const postUrl = `https://photofunia.com/categories/all_effects/${effect.slug}?server=1`;
    const postRes = await fetchWithTimeout(postUrl, {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Referer": `https://photofunia.com/categories/all_effects`,
        "Origin": "https://photofunia.com",
        "sec-ch-ua": '"Not A(Brand";v="99", "Google Chrome";v="131", "Chromium";v="131"',
        "sec-ch-ua-mobile": "?0",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-User": "?1",
        "Sec-Fetch-Dest": "document",
        "X-Forwarded-For": getXffIp(),
        ...(sessionCookies ? { "Cookie": sessionCookies } : {}),
      },
      body: bodyStr,
      redirect: "manual",
    });

    let resultPageUrl: string;
    if (postRes.status === 302 || postRes.status === 301) {
      const location = postRes.headers.get("location");
      if (!location) {
        return { success: false, creator: CREATOR, error: "No redirect location from PhotoFunia." };
      }
      const locationFull = location.startsWith("http") ? location : `https://photofunia.com${location}`;

      const errorMatch = locationFull.match(/[?&]e=([^&#]+)/);
      if (errorMatch) {
        const errorCode = decodeURIComponent(errorMatch[1]);
        const errorMessages: Record<string, string> = {
          "no_faces": "No face detected in the image. This effect requires a photo with a clearly visible face.",
          "wrong_size": "The image size is not suitable. Please try a larger or higher quality image.",
          "upload_error": "Failed to process the uploaded image. Please try a different image.",
          "error": "PhotoFunia could not process this effect. Please try again.",
          "too_small": "The image is too small. Please use a larger image.",
          "bad_image": "The image could not be processed. Please use a different image format or URL.",
        };
        return { success: false, creator: CREATOR, error: errorMessages[errorCode] || `PhotoFunia returned an error: ${errorCode}` };
      }

      resultPageUrl = locationFull;
    } else if (postRes.status === 403) {
      return { success: false, creator: CREATOR, error: "PhotoFunia is temporarily unavailable or rate-limited. Please try again in a moment." };
    } else {
      return { success: false, creator: CREATOR, error: `PhotoFunia returned unexpected status ${postRes.status}. Please try again.` };
    }

    const resultRes = await fetchWithTimeout(resultPageUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        "X-Forwarded-For": getXffIp(),
        ...(sessionCookies ? { "Cookie": sessionCookies } : {}),
      },
    });
    const resultHtml = await resultRes.text();

    const resultImageMatch = resultHtml.match(/https:\/\/u\.photofunia\.com\/[^"'\s<>]+_r\.[a-z]{3,4}/i);
    if (resultImageMatch) {
      return { success: true, creator: CREATOR, effectName: effect.name, imageUrl: resultImageMatch[0] };
    }

    const anyResultImage = resultHtml.match(/https:\/\/u\.photofunia\.com\/[^"'\s<>]+\/results\/[^"'\s<>]+\.[a-z]{3,4}/i);
    if (anyResultImage) {
      return { success: true, creator: CREATOR, effectName: effect.name, imageUrl: anyResultImage[0] };
    }

    const anyImage = resultHtml.match(/https:\/\/u\.photofunia\.com\/[^"'\s<>]+\.[a-z]{3,4}/i);
    if (anyImage) {
      return { success: true, creator: CREATOR, effectName: effect.name, imageUrl: anyImage[0] };
    }

    return { success: false, creator: CREATOR, error: "Could not extract result image from PhotoFunia. The effect may have changed or is temporarily unavailable." };
  } catch (err: any) {
    return { success: false, creator: CREATOR, error: err.message || "PhotoFunia generation failed" };
  }
}

export function listPhotofuniaEffects() {
  return PHOTOFUNIA_EFFECTS.map(e => ({
    id: e.id,
    name: e.name,
    slug: e.slug,
    category: e.category,
    inputType: e.inputType,
    fields: e.fields.map(f => ({ name: f.name, type: f.type, label: f.label, placeholder: f.placeholder })),
  }));
}
