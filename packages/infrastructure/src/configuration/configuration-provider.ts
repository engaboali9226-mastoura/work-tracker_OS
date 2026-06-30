export interface ConfigurationProvider {

    get<T>(key:string):T;

}
