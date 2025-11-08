// utils/geocode.ts
export async function getCoordinates(locationName: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}`;
  const res = await fetch(url, { headers: { "User-Agent": "Hack4Safety-App" } });
  const data = await res.json();

  if (data.length === 0) return null;

  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
  };
}
