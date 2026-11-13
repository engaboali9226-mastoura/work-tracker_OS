/**
 * Supabase auth-js mfa.enroll() ALREADY prefixes SVG with
 * "data:image/svg+xml;utf-8,". Never prepend a second data URI.
 *
 * Treat the QR SVG as a private authenticator credential: keep it in
 * transient component state, render only in an inert <img>, and never log it.
 */
export function noorTotpQrImageSourceR318(value:string):string|null{
 if(typeof value!=="string"||value.length===0||value.length>250_000)return null;
 const match=/^data:image\/svg\+xml(?:;utf-8|;charset=utf-8)?,/iu.exec(value);
 const body=match?value.slice(match[0].length):value;
 if(/^\s*(?:<\?xml[^>]*>\s*)?<svg(?:\s|>)/iu.test(body))
  return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(body);
 // Already percent-encoded SVG data body, still constrain to SVG payloads.
 if(match&&/^(?:%3C%3Fxml[^]*?%3E\s*)?%3Csvg(?:%20|%09|%0A|%0D|%3E)/iu.test(body))
  return "data:image/svg+xml;charset=utf-8,"+body;
 return null;
}
