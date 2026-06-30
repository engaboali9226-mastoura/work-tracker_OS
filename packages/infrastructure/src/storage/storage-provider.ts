export interface StorageProvider {

    exists(path:string):Promise<boolean>;

}
