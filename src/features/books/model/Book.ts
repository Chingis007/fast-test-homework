export interface Book {
  /**
   * The API assigns no ids, so the client mints them on create. Records stored
   * without one exist, hence `null` on read.
   */
  id: number | null;
  name: string;
  author: string;
}

export interface BookDraft {
  name: string;
  author: string;
}
