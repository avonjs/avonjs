import type { ParsedUrlQuery } from 'node:querystring';
import type { MatchesQueryParameters } from '../../Contracts';
import type QueryParameter from './QueryParameter';

export default class QueryParser<T extends QueryParameter> {
  constructor(
    protected query: ParsedUrlQuery,
    protected handlers: T[],
  ) {}

  /**
   * Get pair of handlers and matched values.
   */
  matches(): MatchesQueryParameters<T> {
    return this.handlers
      .filter((handler) => this.query[handler.key()] !== undefined)
      .map((handler) => {
        const value = this.query[handler.key()];

        return {
          handler,
          value: handler.isValidNullValue(value) ? null : value,
        };
      });
  }
}
