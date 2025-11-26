import { queryOptions } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { User } from "tt-shared/types";

export const usersQueryOptions = queryOptions({
  queryKey: ["users"],
  queryFn: async () => {
    const res = await apiFetch("/users");
    return (await res.json()) as User[];
  },
});
