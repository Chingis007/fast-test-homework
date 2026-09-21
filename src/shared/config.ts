const API_HOST = "https://tdd.demo.reaktivate.com";

const DEFAULT_API_USER = "user";

export const API_USER = import.meta.env.VITE_API_USER || DEFAULT_API_USER;

export const API_BASE = `${API_HOST}/v1/books/${API_USER}`;
