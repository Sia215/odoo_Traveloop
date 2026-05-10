const ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY
const cache = {}

/**
 * Fetch a travel photo URL for a given city/place name from Unsplash.
 * Results are cached in memory to avoid duplicate API calls.
 */
export async function fetchPlacePhoto(query) {
  if (!query) return null
  const key = query.toLowerCase().trim()
  if (cache[key]) return cache[key]

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query + ' city travel')}&per_page=1&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${ACCESS_KEY}` } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const url = data.results?.[0]?.urls?.regular ?? null
    if (url) cache[key] = url
    return url
  } catch {
    return null
  }
}
