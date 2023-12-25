export type Mixable<T = {}> = new (...args: any[]) => T;

export type AbstractMixable<T = {}> = abstract new (...args: any[]) => T;
