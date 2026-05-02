import { getSettings } from "../../server/admin-settings";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

function getTmdbKey(): string {
  const fromSettings = getSettings().tmdbApiKey;
  if (fromSettings && fromSettings.trim()) return fromSettings.trim();
  const fromEnv = process.env.TMDB_API_KEY;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  throw new Error("TMDB API key is not configured. Set it in the Admin Dashboard → API Keys.");
}

async function tmdbFetch(path: string, params: Record<string, string> = {}): Promise<any> {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", getTmdbKey());
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, v);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`TMDB API error: ${res.status} ${res.statusText}`);
    return await res.json();
  } catch (e: any) {
    clearTimeout(timeout);
    throw e;
  }
}

function img(path: string | null | undefined, size = "w500"): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

function formatMovie(m: any) {
  return {
    id: m.id,
    title: m.title || m.name,
    originalTitle: m.original_title || m.original_name,
    overview: m.overview,
    releaseDate: m.release_date || m.first_air_date,
    year: (m.release_date || m.first_air_date || "").slice(0, 4),
    voteAverage: m.vote_average,
    voteCount: m.vote_count,
    popularity: m.popularity,
    poster: img(m.poster_path),
    posterLarge: img(m.poster_path, "w780"),
    backdrop: img(m.backdrop_path, "w1280"),
    genres: (m.genre_ids || []),
    adult: m.adult,
    language: m.original_language,
    mediaType: m.media_type || "movie",
  };
}

function formatMovieDetail(m: any) {
  return {
    id: m.id,
    title: m.title,
    originalTitle: m.original_title,
    tagline: m.tagline,
    overview: m.overview,
    releaseDate: m.release_date,
    year: (m.release_date || "").slice(0, 4),
    runtime: m.runtime,
    status: m.status,
    budget: m.budget,
    revenue: m.revenue,
    voteAverage: m.vote_average,
    voteCount: m.vote_count,
    popularity: m.popularity,
    poster: img(m.poster_path),
    posterLarge: img(m.poster_path, "w780"),
    backdrop: img(m.backdrop_path, "w1280"),
    genres: m.genres?.map((g: any) => ({ id: g.id, name: g.name })),
    language: m.original_language,
    languages: m.spoken_languages?.map((l: any) => l.english_name),
    productionCompanies: m.production_companies?.map((c: any) => ({
      id: c.id,
      name: c.name,
      logo: img(c.logo_path, "w200"),
      country: c.origin_country,
    })),
    productionCountries: m.production_countries?.map((c: any) => c.name),
    imdbId: m.imdb_id,
    homepage: m.homepage,
    adult: m.adult,
    belongsToCollection: m.belongs_to_collection ? {
      id: m.belongs_to_collection.id,
      name: m.belongs_to_collection.name,
      poster: img(m.belongs_to_collection.poster_path),
      backdrop: img(m.belongs_to_collection.backdrop_path, "w1280"),
    } : null,
  };
}

function formatVideo(v: any) {
  return {
    id: v.id,
    name: v.name,
    key: v.key,
    site: v.site,
    type: v.type,
    official: v.official,
    publishedAt: v.published_at,
    url: v.site === "YouTube" ? `https://www.youtube.com/watch?v=${v.key}` : null,
    thumbnail: v.site === "YouTube" ? `https://img.youtube.com/vi/${v.key}/hqdefault.jpg` : null,
  };
}

export async function searchMovies(query: string, page?: string) {
  const data = await tmdbFetch("/search/movie", { query, page: page || "1", include_adult: "false" });
  return {
    page: data.page,
    totalResults: data.total_results,
    totalPages: data.total_pages,
    movies: (data.results || []).map(formatMovie),
  };
}

export async function getMovieInfo(id: string) {
  const data = await tmdbFetch(`/movie/${id}`, { append_to_response: "external_ids" });
  return formatMovieDetail(data);
}

export async function getMovieTrailer(id: string) {
  const [detail, videos] = await Promise.all([
    tmdbFetch(`/movie/${id}`),
    tmdbFetch(`/movie/${id}/videos`),
  ]);

  const allVideos = (videos.results || []).map(formatVideo);

  const trailers = allVideos.filter((v: any) => v.type === "Trailer" && v.site === "YouTube");
  const teasers = allVideos.filter((v: any) => v.type === "Teaser" && v.site === "YouTube");
  const clips = allVideos.filter((v: any) => v.type === "Clip" && v.site === "YouTube");
  const featurettes = allVideos.filter((v: any) => v.type === "Featurette" && v.site === "YouTube");
  const behindScenes = allVideos.filter((v: any) => v.type === "Behind the Scenes" && v.site === "YouTube");

  const officialTrailer = trailers.find((v: any) => v.official) || trailers[0] || teasers[0] || allVideos[0] || null;

  return {
    movieId: detail.id,
    title: detail.title,
    year: (detail.release_date || "").slice(0, 4),
    poster: img(detail.poster_path),
    backdrop: img(detail.backdrop_path, "w1280"),
    officialTrailer,
    trailers,
    teasers,
    clips,
    featurettes,
    behindScenes,
    allVideos,
    totalVideos: allVideos.length,
  };
}

export async function getTrendingMovies(timeWindow?: string) {
  const window = timeWindow === "week" ? "week" : "day";
  const data = await tmdbFetch(`/trending/movie/${window}`);
  return {
    timeWindow: window,
    page: data.page,
    totalResults: data.total_results,
    movies: (data.results || []).map(formatMovie),
  };
}

export async function getTrendingAll(timeWindow?: string) {
  const window = timeWindow === "week" ? "week" : "day";
  const data = await tmdbFetch(`/trending/all/${window}`);
  return {
    timeWindow: window,
    page: data.page,
    totalResults: data.total_results,
    results: (data.results || []).map(formatMovie),
  };
}

export async function getPopularMovies(page?: string) {
  const data = await tmdbFetch("/movie/popular", { page: page || "1" });
  return {
    page: data.page,
    totalResults: data.total_results,
    totalPages: data.total_pages,
    movies: (data.results || []).map(formatMovie),
  };
}

export async function getUpcomingMovies(page?: string) {
  const data = await tmdbFetch("/movie/upcoming", { page: page || "1" });
  return {
    page: data.page,
    totalResults: data.total_results,
    totalPages: data.total_pages,
    dates: data.dates,
    movies: (data.results || []).map(formatMovie),
  };
}

export async function getTopRatedMovies(page?: string) {
  const data = await tmdbFetch("/movie/top_rated", { page: page || "1" });
  return {
    page: data.page,
    totalResults: data.total_results,
    totalPages: data.total_pages,
    movies: (data.results || []).map(formatMovie),
  };
}

export async function getNowPlayingMovies(page?: string) {
  const data = await tmdbFetch("/movie/now_playing", { page: page || "1" });
  return {
    page: data.page,
    totalResults: data.total_results,
    totalPages: data.total_pages,
    dates: data.dates,
    movies: (data.results || []).map(formatMovie),
  };
}

export async function getSimilarMovies(id: string) {
  const [similar, recommendations] = await Promise.all([
    tmdbFetch(`/movie/${id}/similar`),
    tmdbFetch(`/movie/${id}/recommendations`),
  ]);
  return {
    similar: (similar.results || []).map(formatMovie),
    recommendations: (recommendations.results || []).map(formatMovie),
  };
}

export async function getMovieCredits(id: string) {
  const data = await tmdbFetch(`/movie/${id}/credits`);
  return {
    cast: (data.cast || []).slice(0, 20).map((p: any) => ({
      id: p.id,
      name: p.name,
      character: p.character,
      order: p.order,
      photo: img(p.profile_path, "w185"),
      popularity: p.popularity,
    })),
    crew: (data.crew || [])
      .filter((p: any) => ["Director", "Producer", "Screenplay", "Writer", "Story", "Music", "Cinematography"].includes(p.job))
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        job: p.job,
        department: p.department,
        photo: img(p.profile_path, "w185"),
      })),
  };
}

export async function getMovieReviews(id: string) {
  const data = await tmdbFetch(`/movie/${id}/reviews`);
  return {
    page: data.page,
    totalResults: data.total_results,
    reviews: (data.results || []).map((r: any) => ({
      id: r.id,
      author: r.author,
      authorDetails: {
        name: r.author_details?.name,
        username: r.author_details?.username,
        avatar: r.author_details?.avatar_path ? img(r.author_details.avatar_path, "w92") : null,
        rating: r.author_details?.rating,
      },
      content: r.content,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      url: r.url,
    })),
  };
}

export async function getMovieGenres() {
  const data = await tmdbFetch("/genre/movie/list");
  return {
    genres: (data.genres || []).map((g: any) => ({ id: g.id, name: g.name })),
  };
}

export async function discoverMovies(genreId?: string, year?: string, sortBy?: string) {
  const params: Record<string, string> = {
    sort_by: sortBy || "popularity.desc",
    include_adult: "false",
    include_video: "false",
    page: "1",
  };
  if (genreId) params.with_genres = genreId;
  if (year) params.primary_release_year = year;

  const data = await tmdbFetch("/discover/movie", params);
  return {
    page: data.page,
    totalResults: data.total_results,
    totalPages: data.total_pages,
    movies: (data.results || []).map(formatMovie),
  };
}

export async function getMovieImages(id: string) {
  const data = await tmdbFetch(`/movie/${id}/images`);
  return {
    backdrops: (data.backdrops || []).slice(0, 10).map((i: any) => ({
      url: img(i.file_path, "w1280"),
      width: i.width,
      height: i.height,
      aspectRatio: i.aspect_ratio,
      voteAverage: i.vote_average,
    })),
    posters: (data.posters || []).slice(0, 10).map((i: any) => ({
      url: img(i.file_path, "w500"),
      width: i.width,
      height: i.height,
      language: i.iso_639_1,
      voteAverage: i.vote_average,
    })),
    logos: (data.logos || []).slice(0, 5).map((i: any) => ({
      url: img(i.file_path, "w500"),
      language: i.iso_639_1,
    })),
  };
}

export async function getPersonInfo(id: string) {
  const [person, credits] = await Promise.all([
    tmdbFetch(`/person/${id}`),
    tmdbFetch(`/person/${id}/movie_credits`),
  ]);
  return {
    id: person.id,
    name: person.name,
    biography: person.biography,
    birthday: person.birthday,
    deathday: person.deathday,
    placeOfBirth: person.place_of_birth,
    popularity: person.popularity,
    photo: img(person.profile_path, "w500"),
    homepage: person.homepage,
    imdbId: person.imdb_id,
    knownForDepartment: person.known_for_department,
    knownFor: (credits.cast || []).slice(0, 10).map(formatMovie),
    directed: (credits.crew || []).filter((c: any) => c.job === "Director").slice(0, 10).map(formatMovie),
  };
}
