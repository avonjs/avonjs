import type { Request } from 'express';
import Collection from '../../Collections/Collection';
import type { AnyRecord, AnyValue } from '../../Contracts';

export default abstract class FormRequest {
  constructor(protected request: Request) {}

  /**
   * Get params from route.
   */
  public segments() {
    return new Collection(this.request.params);
  }

  /**
   * Get param from route.
   */
  public segment<T = AnyValue>(key: string, callback?: AnyValue): T {
    return this.segments().get(key, callback) as T;
  }

  /**
   * Get params from route for the given key.
   */
  public route<T = AnyValue>(key: string, callback?: AnyValue): T {
    return this.segment<T>(key, callback);
  }

  /**
   * Get collection of request attributes.
   */
  public collect(): Collection<AnyRecord> {
    return new Collection(this.request.query ?? {}).merge(
      this.request.body ?? {},
    );
  }

  /**
   * Get value from request.
   */
  public get<T = AnyValue>(key: string, callback?: AnyValue): T {
    return this.collect().get(key, callback) as T;
  }

  /**
   * Get all attributes from request body and query.
   */
  public all(keys: string[] = []): AnyRecord {
    return keys.length > 0 ? this.only(keys) : this.collect().all();
  }

  /**
   * Get only given keys from request body and query.
   */
  public only<T = AnyValue>(keys: string | string[] = []): Record<string, T> {
    return this.collect()
      .only(Array.isArray(keys) ? keys : [keys])
      .all() as unknown as Record<string, T>;
  }

  /**
   * Get value from request body.
   */
  public input<T = AnyValue>(key: string, callback?: AnyValue): T {
    return new Collection(this.request?.body).get(key, callback) as T;
  }

  /**
   * Get value from query strings.
   */
  public query<T = AnyValue>(key: string, callback?: AnyValue): T {
    return new Collection(this.request?.query).get(key, callback) as T;
  }

  /**
   * Get value from request body and query as string.
   */
  public string(key: string, callback?: string): string {
    return this.exists(key)
      ? String(this.get<string>(key))
      : this.get<string>(key, callback);
  }

  /**
   * Get value from request body and query as string.
   */
  public number(key: string, callback?: number): number {
    return this.exists(key)
      ? Number(this.get<number>(key))
      : this.get<number>(key, callback);
  }

  /**
   * Get value from request body and query as boolean.
   */
  public boolean(key: string, callback?: boolean): boolean {
    return Boolean(this.get<boolean>(key, callback));
  }

  /**
   * Get value from request body and query as array.
   */
  public array<T = AnyValue>(key: string, callback?: []): T[] {
    if (!this.exists(key)) {
      return this.get<T[]>(key, callback);
    }

    const value = this.get<T[]>(key, callback);

    return Array.isArray(value) ? value : [value];
  }

  /**
   * Check if given key exists in request body or query parameters and has valid value.
   */
  filled(keys: string | string[]): boolean {
    if (!this.exists(keys)) {
      return false;
    }

    return new Collection(this.only(keys))
      .filter(
        (value: AnyValue) => ![null, undefined, '', [], {}].includes(value),
      )
      .isNotEmpty();
  }

  /**
   * Check if given key exists in request body or query parameters.
   */
  public exists(keys: string | string[]): boolean {
    return this.collect().has<string | string[]>(keys);
  }

  /**
   * Get the real request instance.
   */
  public getRequest(): Request {
    return this.request;
  }
}
