/**
 * Contract for a local (per-view) controller.
 * `mount` is called once the view is on screen, `dispose` when it leaves, so a
 * controller can own reactions, timers or subscriptions and release them.
 */
export interface Controller {
  mount?(): void;
  dispose?(): void;
}
