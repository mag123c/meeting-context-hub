/**
 * Input handler interfaces
 */

/**
 * Generic input handler interface
 * @template TOutput The type of output the handler produces
 */
export interface InputHandler<TOutput> {
  handle(input: string): TOutput | Promise<TOutput>;
}
