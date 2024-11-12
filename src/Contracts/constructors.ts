import type { Args } from './types';
// biome-ignore lint/complexity/noBannedTypes: i had not any solution
export type Mixable<T = {}> = new (...args: Args) => T;
// biome-ignore lint/complexity/noBannedTypes: i had not any solution
export type AbstractMixable<T = {}> = abstract new (...args: Args) => T;
