import type { RootState } from "../../store";
import type { UserProfile } from "./types/user";

// Only keep selectors that are actually being used
export const selectFetchedUser = (state: RootState): UserProfile | null =>
  state.user.fetchedUser;
