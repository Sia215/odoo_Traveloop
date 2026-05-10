const API_KEY = import.meta.env.VITE_PEXELS_API_KEY
const cache = {}

export async function fetchPlacePhoto(query) {
  if (!query) return null
  const key = query.toLowerCase().trim()
  if (cache[key]) return cache[key]

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query + ' travel')}&per_page=1&orientation=landscape`,
      { headers: { Authorization: API_KEY } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const url = data.photos?.[0]?.src?.large ?? null
    if (url) cache[key] = url
    return url
  } catch {
    return null
  }
}
