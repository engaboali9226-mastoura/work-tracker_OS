// Public browser transport only. Never inspects or stores HTTP-only session cookies.
export type NoorBrowserLogoutFetchR269 =
 (input:RequestInfo|URL,init?:RequestInit)=>Promise<Readonly<{status:number}>>;
export async function revokeNoorBrowserSessionR269(
 fetcher:NoorBrowserLogoutFetchR269=(input,init)=>globalThis.fetch(input,init),
):Promise<boolean>{
 try{
  const response=await fetcher("/api/noor/session/logout",{
   method:"POST",credentials:"same-origin",cache:"no-store",
  });
  return response.status===204;
 }catch{return false;}
}
