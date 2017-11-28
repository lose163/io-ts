import { HKT } from 'fp-ts/lib/HKT'
import { URI, Either, left, right, map, of, ap, chain } from 'fp-ts/lib/Either'
import { MonadType, Type, ValidationError } from './core'

export type Validation<A> = Either<Array<ValidationError>, A>

export const zipEither = <A, B, C>(f: (a: A, b: B) => C, fa: Validation<A>, fb: Validation<B>): Validation<C> =>
  fa.fold(la => fb.fold(lb => left(la.concat(lb)), () => left(la)), a => fb.fold(lb => left(lb), b => right(f(a, b))))

/** Synchronous validation, all errors */
export const monadTypeEitherAll: MonadType<URI> = {
  URI: URI,
  map,
  of,
  ap,
  chain,
  throwError: e => left(e),
  zipWith: <A, B, C>(f: (a: A, b: B) => C) => (fa: HKT<URI, A>, lazyfb: () => HKT<URI, B>) => {
    const fa_: Validation<A> = fa as any
    const lazyfb_: () => Validation<B> = lazyfb as any
    return zipEither(f, fa_, lazyfb_())
  },
  attempt: <A>(fx: HKT<URI, A>, lazyfy: () => HKT<URI, A>): HKT<URI, A> => {
    const fx_: Validation<A> = fx as any
    const lazyfy_: () => Validation<A> = lazyfy as any
    return fx_.fold(lx => lazyfy_().fold(ly => left(lx.concat(ly)), a => right(a)), () => fx_)
  }
}

/** Synchronous validation, first error only */
export const monadTypeEitherFirst: MonadType<URI> = {
  URI: URI,
  map,
  of,
  ap,
  chain,
  throwError: e => left(e),
  zipWith: <A, B, C>(f: (a: A, b: B) => C) => (fa: HKT<URI, A>, lazyfb: () => HKT<URI, B>) => {
    const fa_: Validation<A> = fa as any
    const lazyfb_: () => Validation<B> = lazyfb as any
    return fa_.chain(a => lazyfb_().map(b => f(a, b)))
  },
  attempt: <A>(fx: HKT<URI, A>, lazyfy: () => HKT<URI, A>): HKT<URI, A> => {
    const fx_: Validation<A> = fx as any
    const lazyfy_: () => Validation<A> = lazyfy as any
    return fx_.fold(() => lazyfy_(), () => fx)
  }
}

export const validate = <A>(value: any, type: Type<URI, any, A>): Validation<A> =>
  type.validate(value, [{ key: '', type }]) as any
