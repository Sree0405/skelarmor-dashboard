import type { User } from "../../dashboard/types";
import usersData from "../../dashboard/data/users.json";

const users = usersData as User[];

export const authService = {
  getAll: (): User[] => users,
  getById: (id: string): User | undefined => users.find((u) => u.id === id),
};
