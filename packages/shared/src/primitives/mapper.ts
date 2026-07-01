/**
 * Shared Mapper primitive.
 */

export interface Mapper<TSource, TDestination> {
  map(source: TSource): TDestination;
}

export interface AsyncMapper<TSource, TDestination> {
  map(
    source: TSource,
  ): Promise<TDestination>;
}

export type MappingFunction<
  TSource,
  TDestination,
> = (
  source: TSource,
) => TDestination;

export type AsyncMappingFunction<
  TSource,
  TDestination,
> = (
  source: TSource,
) => Promise<TDestination>;
