# Infrastructure Source Audit


========================================
/workspaces/work-tracker_OS/packages/infrastructure/src/cache/cache-provider.ts
========================================
export interface CacheProvider {

    get<T>(key:string):Promise<T | undefined>;

    set<T>(key:string,value:T):Promise<void>;

}


========================================
/workspaces/work-tracker_OS/packages/infrastructure/src/clock/clock.ts
========================================
export interface Clock {

    now():Date;

}


========================================
/workspaces/work-tracker_OS/packages/infrastructure/src/configuration/configuration-provider.ts
========================================
export interface ConfigurationProvider {

    get<T>(key:string):T;

}


========================================
/workspaces/work-tracker_OS/packages/infrastructure/src/database/database-provider.ts
========================================
export interface DatabaseProvider {

    connect():Promise<void>;

}


========================================
/workspaces/work-tracker_OS/packages/infrastructure/src/filesystem/file-system.ts
========================================
export interface FileSystem {

    exists(path:string):boolean;

}


========================================
/workspaces/work-tracker_OS/packages/infrastructure/src/http/http-client.ts
========================================
export interface HttpClient {

    get<T>(url:string):Promise<T>;

    post<T>(url:string,body:unknown):Promise<T>;

}


========================================
/workspaces/work-tracker_OS/packages/infrastructure/src/id/id-generator.ts
========================================
export interface IdGenerator {

    generate():string;

}


========================================
/workspaces/work-tracker_OS/packages/infrastructure/src/index.ts
========================================
export * from "./configuration/configuration-provider.js";
export * from "./storage/storage-provider.js";
export * from "./database/database-provider.js";
export * from "./http/http-client.js";
export * from "./filesystem/file-system.js";
export * from "./cache/cache-provider.js";
export * from "./clock/clock.js";
export * from "./id/id-generator.js";


========================================
/workspaces/work-tracker_OS/packages/infrastructure/src/storage/storage-provider.ts
========================================
export interface StorageProvider {

    exists(path:string):Promise<boolean>;

}

