import { createContext, useContext, type ReactNode } from "react";
import type { Services } from "./services";

const ServicesContext = createContext<Services | null>(null);

export const ServicesProvider = ({
  services,
  children
}: {
  services: Services;
  children: ReactNode;
}) => <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;

export const useServices = (): Services => {
  const services = useContext(ServicesContext);

  if (!services) {
    throw new Error("useServices must be used inside <ServicesProvider>");
  }

  return services;
};
