const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const CREATOR = "APIs by Silent Wolf | A tech explorer";

async function fetchJSON(url: string, headers: Record<string, string> = {}): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, ...headers },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchHTML(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function githubStalk(username: string) {
  const data = await fetchJSON(`https://api.github.com/users/${encodeURIComponent(username)}`);
  if (!data || data.message) {
    return { success: false, creator: CREATOR, error: data?.message || `GitHub user "${username}" not found` };
  }
  return {
    success: true,
    creator: CREATOR,
    platform: "GitHub",
    username: data.login,
    name: data.name,
    bio: data.bio,
    avatar: data.avatar_url,
    profileUrl: data.html_url,
    publicRepos: data.public_repos,
    publicGists: data.public_gists,
    followers: data.followers,
    following: data.following,
    company: data.company,
    location: data.location,
    blog: data.blog,
    twitterUsername: data.twitter_username,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function ipStalk(ip: string) {
  const data = await fetchJSON(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,continent,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`);
  if (!data || data.status === "fail") {
    return { success: false, creator: CREATOR, error: data?.message || `IP lookup failed for "${ip}"` };
  }
  return {
    success: true,
    creator: CREATOR,
    platform: "IP Lookup",
    ip: data.query,
    continent: data.continent,
    country: data.country,
    countryCode: data.countryCode,
    region: data.regionName,
    regionCode: data.region,
    city: data.city,
    zip: data.zip,
    latitude: data.lat,
    longitude: data.lon,
    timezone: data.timezone,
    isp: data.isp,
    org: data.org,
    as: data.as,
  };
}

export async function npmStalk(packageName: string) {
  const data = await fetchJSON(`https://registry.npmjs.org/${encodeURIComponent(packageName)}`);
  if (!data || data.error) {
    return { success: false, creator: CREATOR, error: data?.error || `NPM package "${packageName}" not found` };
  }
  const latest = data["dist-tags"]?.latest;
  const latestVersion = latest ? data.versions?.[latest] : null;
  return {
    success: true,
    creator: CREATOR,
    platform: "NPM",
    name: data.name,
    description: data.description,
    latestVersion: latest,
    license: data.license || latestVersion?.license,
    homepage: data.homepage,
    repository: typeof data.repository === "object" ? data.repository?.url : data.repository,
    author: data.author,
    maintainers: data.maintainers?.map((m: any) => m.name || m.email),
    keywords: data.keywords,
    distTags: data["dist-tags"],
    createdAt: data.time?.created,
    lastModified: data.time?.modified,
    npmUrl: `https://www.npmjs.com/package/${data.name}`,
  };
}

export async function tiktokStalk(username: string) {
  const cleanUsername = username.replace(/^@/, "");
  const html = await fetchHTML(`https://www.tiktok.com/@${encodeURIComponent(cleanUsername)}`);
  if (!html) {
    return { success: false, creator: CREATOR, error: `Could not fetch TikTok profile for "${cleanUsername}"` };
  }

  const scriptMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
  if (scriptMatch) {
    try {
      const jsonData = JSON.parse(scriptMatch[1]);
      const userInfo = jsonData?.["__DEFAULT_SCOPE__"]?.["webapp.user-detail"]?.userInfo;
      if (userInfo) {
        return {
          success: true,
          creator: CREATOR,
          platform: "TikTok",
          username: userInfo.user?.uniqueId,
          nickname: userInfo.user?.nickname,
          bio: userInfo.user?.signature,
          avatar: userInfo.user?.avatarLarger,
          verified: userInfo.user?.verified,
          privateAccount: userInfo.user?.privateAccount,
          followers: userInfo.stats?.followerCount,
          following: userInfo.stats?.followingCount,
          likes: userInfo.stats?.heartCount,
          videos: userInfo.stats?.videoCount,
          profileUrl: `https://www.tiktok.com/@${userInfo.user?.uniqueId}`,
        };
      }
    } catch {}
  }

  const nicknameMatch = html.match(/"nickname":"([^"]+)"/);
  const followerMatch = html.match(/"followerCount":(\d+)/);
  const followingMatch = html.match(/"followingCount":(\d+)/);
  const heartMatch = html.match(/"heartCount":(\d+)/);
  const videoMatch = html.match(/"videoCount":(\d+)/);
  const bioMatch = html.match(/"signature":"([^"]*?)"/);
  const avatarMatch = html.match(/"avatarLarger":"([^"]+)"/);

  if (nicknameMatch) {
    return {
      success: true,
      creator: CREATOR,
      platform: "TikTok",
      username: cleanUsername,
      nickname: nicknameMatch?.[1],
      bio: bioMatch?.[1]?.replace(/\\n/g, "\n"),
      avatar: avatarMatch?.[1]?.replace(/\\u002F/g, "/"),
      followers: followerMatch ? parseInt(followerMatch[1]) : null,
      following: followingMatch ? parseInt(followingMatch[1]) : null,
      likes: heartMatch ? parseInt(heartMatch[1]) : null,
      videos: videoMatch ? parseInt(videoMatch[1]) : null,
      profileUrl: `https://www.tiktok.com/@${cleanUsername}`,
    };
  }

  return { success: false, creator: CREATOR, error: `Could not extract TikTok profile data for "${cleanUsername}". The profile may be private or doesn't exist.` };
}

export async function instagramStalk(username: string) {
  const cleanUsername = username.replace(/^@/, "");
  const html = await fetchHTML(`https://www.instagram.com/${encodeURIComponent(cleanUsername)}/`);
  if (!html) {
    return { success: false, creator: CREATOR, error: `Could not fetch Instagram profile for "${cleanUsername}"` };
  }

  const descMatch = html.match(/<meta\s+(?:property="og:description"|name="description")\s+content="([^"]*?)"/i);
  const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]*?)"/i);
  const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]*?)"/i);

  let followers: string | null = null;
  let following: string | null = null;
  let posts: string | null = null;
  if (descMatch) {
    const desc = descMatch[1];
    const statsMatch = desc.match(/([\d,.]+[KkMm]?)\s*Followers.*?([\d,.]+[KkMm]?)\s*Following.*?([\d,.]+[KkMm]?)\s*Posts/i);
    if (statsMatch) {
      followers = statsMatch[1];
      following = statsMatch[2];
      posts = statsMatch[3];
    }
  }

  if (titleMatch || descMatch) {
    return {
      success: true,
      creator: CREATOR,
      platform: "Instagram",
      username: cleanUsername,
      name: titleMatch?.[1]?.replace(/ \(@.*/, "") || cleanUsername,
      bio: descMatch?.[1] || null,
      avatar: imageMatch?.[1] || null,
      followers,
      following,
      posts,
      profileUrl: `https://www.instagram.com/${cleanUsername}/`,
    };
  }

  return { success: false, creator: CREATOR, error: `Could not extract Instagram profile data for "${cleanUsername}". The profile may be private or doesn't exist.` };
}

export async function twitterStalk(username: string) {
  const cleanUsername = username.replace(/^@/, "");

  const instances = ["https://nitter.net", "https://nitter.privacydev.net"];
  for (const instance of instances) {
    const html = await fetchHTML(`${instance}/${encodeURIComponent(cleanUsername)}`);
    if (html && !html.includes("User \"") && !html.includes("not found")) {
      const nameMatch = html.match(/<a[^>]*class="profile-card-fullname"[^>]*>([^<]+)</);
      const bioMatch = html.match(/<p[^>]*class="profile-bio"[^>]*>([\s\S]*?)<\/p>/);
      const statsMatch = html.match(/<li[^>]*class="posts"[^>]*>[\s\S]*?<span[^>]*class="profile-stat-num"[^>]*>([\s\S]*?)<\/span>/);
      const followingMatch = html.match(/<li[^>]*class="following"[^>]*>[\s\S]*?<span[^>]*class="profile-stat-num"[^>]*>([\s\S]*?)<\/span>/);
      const followersMatch = html.match(/<li[^>]*class="followers"[^>]*>[\s\S]*?<span[^>]*class="profile-stat-num"[^>]*>([\s\S]*?)<\/span>/);
      const avatarMatch = html.match(/<a[^>]*class="profile-card-avatar"[^>]*>\s*<img[^>]*src="([^"]+)"/);

      if (nameMatch) {
        return {
          success: true,
          creator: CREATOR,
          platform: "Twitter/X",
          username: cleanUsername,
          name: nameMatch[1].trim(),
          bio: bioMatch?.[1]?.replace(/<[^>]+>/g, "").trim() || null,
          avatar: avatarMatch?.[1] || null,
          tweets: statsMatch?.[1]?.trim().replace(/,/g, "") || null,
          following: followingMatch?.[1]?.trim().replace(/,/g, "") || null,
          followers: followersMatch?.[1]?.trim().replace(/,/g, "") || null,
          profileUrl: `https://twitter.com/${cleanUsername}`,
        };
      }
    }
  }

  return {
    success: true,
    creator: CREATOR,
    platform: "Twitter/X",
    username: cleanUsername,
    profileUrl: `https://twitter.com/${cleanUsername}`,
    note: "Twitter/X profile scraping is limited. Visit the profile URL directly for full details.",
  };
}

export async function waChannelStalk(query: string) {
  return {
    success: true,
    creator: CREATOR,
    platform: "WhatsApp Channel",
    query,
    note: "WhatsApp Channel lookup requires the full channel URL. WhatsApp does not provide a public search API.",
    searchUrl: `https://www.whatsapp.com/channel`,
    tip: "Share your WhatsApp Channel link and we can extract its metadata.",
  };
}
