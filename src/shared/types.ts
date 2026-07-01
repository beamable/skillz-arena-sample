import type {
  GetGameArenaProgressResponse,
  PlayerProfileResponse,
} from "../generated/game/beamable/clients/types";

export type AppRoute = "arena" | "town";

export type AuthMode = "login" | "signup";

export type ServiceHealthState = {
  game: string;
  arena: string;
};

export type PlayerSession = {
  email: string;
  profile: PlayerProfileResponse;
  arenaProgress: GetGameArenaProgressResponse;
  health: ServiceHealthState;
};
