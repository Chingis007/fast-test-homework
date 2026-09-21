import { useEffect, useState } from "react";
import type { Controller } from "./Controller";

/**
 * Creates the controller exactly once per view instance and ties its lifecycle
 * to the view's. Safe under StrictMode: `mount` may run again after `dispose`,
 * so controllers rebuild their disposers on every `mount`.
 */
export function useController<T>(factory: () => T): T {
  const [controller] = useState(factory);

  useEffect(() => {
    const lifecycle = controller as Controller;
    lifecycle.mount?.();
    return () => lifecycle.dispose?.();
  }, [controller]);

  return controller;
}
