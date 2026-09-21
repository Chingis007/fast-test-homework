import type { Book } from "./Book";

export interface BookDto {
  /** Absent for records created without one — the API does not assign ids. */
  id?: number;
  name: string;
  author: string;
  ownerId: string;
}

export interface AddBookResponseDto {
  status: string;
}

export const toBook = (dto: BookDto): Book => ({
  id: dto.id ?? null,
  name: dto.name ?? "",
  author: dto.author ?? ""
});
