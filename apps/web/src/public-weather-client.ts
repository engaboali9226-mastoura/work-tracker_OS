function isRecord(value:unknown):value is Record<string,unknown>{return value!==null&&typeof value==="object"&&!Array.isArray(value);}
export async function loadCurrentTemperature(location: Readonly<{latitude:number;longitude:number}>): Promise<number | null> {
  // No city-location authority means no weather request, never silently use Riyadh.
  if (!Number.isFinite(location.latitude) || Math.abs(location.latitude)>90
      || !Number.isFinite(location.longitude) || Math.abs(location.longitude)>180) return null;
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude",String(location.latitude));
    url.searchParams.set("longitude",String(location.longitude));
    url.searchParams.set("current","temperature_2m");
    url.searchParams.set("temperature_unit","celsius");
    const response = await fetch(url.toString(),{ cache:"no-store",credentials:"omit" });
    if (!response.ok) return null;
    const payload = await response.json() as unknown;
    if (!isRecord(payload) || !isRecord(payload.current)) return null;
    const temperature = payload.current.temperature_2m;
    return typeof temperature === "number" && Number.isFinite(temperature) ? temperature : null;
  } catch {
    return null;
  }
}

