import type { AbstractMixable, Mixable, UnaryFunction } from '../Contracts';

/**
 * Compose a class by applying mixins to it.
 * The code is inspired by https://justinfagnani.com/2015/12/21/real-mixins-with-javascript-classes/, its
 * just that I have added the support for static types too.
 */
export function mixin<T extends AbstractMixable | Mixable, A>(
  superclass: T,
  mixin: UnaryFunction<T, A>,
): A;
export function mixin<T extends AbstractMixable | Mixable, A, B>(
  superclass: T,
  mixin: UnaryFunction<T, A>,
  mixinB: UnaryFunction<A, B>,
): B;
export function mixin<T extends AbstractMixable | Mixable, A, B, C>(
  superclass: T,
  mixin: UnaryFunction<T, A>,
  mixinB: UnaryFunction<A, B>,
  mixinC: UnaryFunction<B, C>,
): C;
export function mixin<T extends AbstractMixable | Mixable, A, B, C, D>(
  superclass: T,
  mixin: UnaryFunction<T, A>,
  mixinB: UnaryFunction<A, B>,
  mixinC: UnaryFunction<B, C>,
  mixinD: UnaryFunction<C, D>,
): D;
export function mixin<T extends AbstractMixable | Mixable, A, B, C, D, E>(
  superclass: T,
  mixin: UnaryFunction<T, A>,
  mixinB: UnaryFunction<A, B>,
  mixinC: UnaryFunction<B, C>,
  mixinD: UnaryFunction<C, D>,
  mixinE: UnaryFunction<D, E>,
): E;
export function mixin<T extends AbstractMixable | Mixable, A, B, C, D, E, F>(
  superclass: T,
  mixin: UnaryFunction<T, A>,
  mixinB: UnaryFunction<A, B>,
  mixinC: UnaryFunction<B, C>,
  mixinD: UnaryFunction<C, D>,
  mixinE: UnaryFunction<D, E>,
  mixinF: UnaryFunction<E, F>,
): F;
export function mixin<T extends AbstractMixable | Mixable, A, B, C, D, E, F, G>(
  superclass: T,
  mixin: UnaryFunction<T, A>,
  mixinB: UnaryFunction<A, B>,
  mixinC: UnaryFunction<B, C>,
  mixinD: UnaryFunction<C, D>,
  mixinE: UnaryFunction<D, E>,
  mixinF: UnaryFunction<E, F>,
  mixinG: UnaryFunction<F, G>,
): G;

export function mixin<
  T extends AbstractMixable | Mixable,
  A,
  B,
  C,
  D,
  E,
  F,
  G,
  H,
>(
  superclass: T,
  mixin: UnaryFunction<T, A>,
  mixinB: UnaryFunction<A, B>,
  mixinC: UnaryFunction<B, C>,
  mixinD: UnaryFunction<C, D>,
  mixinE: UnaryFunction<D, E>,
  mixinF: UnaryFunction<E, F>,
  mixinG: UnaryFunction<F, G>,
  mixinH: UnaryFunction<G, H>,
): H;

export function mixin<
  T extends AbstractMixable | Mixable,
  A,
  B,
  C,
  D,
  E,
  F,
  G,
  H,
  I,
>(
  superclass: T,
  mixin: UnaryFunction<T, A>,
  mixinB: UnaryFunction<A, B>,
  mixinC: UnaryFunction<B, C>,
  mixinD: UnaryFunction<C, D>,
  mixinE: UnaryFunction<D, E>,
  mixinF: UnaryFunction<E, F>,
  mixinG: UnaryFunction<F, G>,
  mixinH: UnaryFunction<G, H>,
  mixinI: UnaryFunction<H, I>,
): I;

export function mixin<
  T extends AbstractMixable | Mixable,
  A,
  B,
  C,
  D,
  E,
  F,
  G,
  H,
  I,
  J,
>(
  superclass: T,
  mixin: UnaryFunction<T, A>,
  mixinB: UnaryFunction<A, B>,
  mixinC: UnaryFunction<B, C>,
  mixinD: UnaryFunction<C, D>,
  mixinE: UnaryFunction<D, E>,
  mixinF: UnaryFunction<E, F>,
  mixinG: UnaryFunction<F, G>,
  mixinH: UnaryFunction<G, H>,
  mixinI: UnaryFunction<H, I>,
  mixinJ: UnaryFunction<I, J>,
): J;

export function mixin<
  T extends AbstractMixable | Mixable,
  A,
  B,
  C,
  D,
  E,
  F,
  G,
  H,
  I,
  J,
  K,
>(
  superclass: T,
  mixin: UnaryFunction<T, A>,
  mixinB: UnaryFunction<A, B>,
  mixinC: UnaryFunction<B, C>,
  mixinD: UnaryFunction<C, D>,
  mixinE: UnaryFunction<D, E>,
  mixinF: UnaryFunction<E, F>,
  mixinG: UnaryFunction<F, G>,
  mixinH: UnaryFunction<G, H>,
  mixinI: UnaryFunction<H, I>,
  mixinJ: UnaryFunction<I, J>,
  mixinK: UnaryFunction<J, K>,
): K;

export function mixin<
  T extends AbstractMixable | Mixable,
  Mixins extends UnaryFunction<T, T>,
>(superclass: T, ...mixins: Mixins[]) {
  return mixins.reduce((c, mixin) => mixin(c), superclass);
}
