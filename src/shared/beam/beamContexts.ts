import {
  AccountService,
  AuthService,
  Beam,
  ContentService,
  defaultTokenStorage,
  type TokenStorage,
} from "@beamable/sdk";

import { ArenaClient } from "../../generated/arena/beamable/clients/ArenaClient";
import { GameServiceClient } from "../../generated/game/beamable/clients/GameServiceClient";

import { getBeamRealmConfig } from "./beamConfig";

let gameBeamPromise: Promise<Beam> | undefined;
let arenaBeamPromise: Promise<Beam> | undefined;
let gameTokenStorage: TokenStorage | undefined;
let arenaTokenStorage: TokenStorage | undefined;

function createTokenStorage(pid: string, tag: string): TokenStorage {
  return defaultTokenStorage({ pid, tag });
}

export async function getGameBeam(): Promise<Beam> {
  if (!gameBeamPromise) {
    const config = getBeamRealmConfig();
    gameTokenStorage = createTokenStorage(config.gamePid, "skillz-arena-sample-game");
    gameBeamPromise = Beam.init({
      cid: config.cid,
      pid: config.gamePid,
      instanceTag: "skillz-arena-sample-game",
      tokenStorage: gameTokenStorage,
      services: (beam) => {
        beam.use([AuthService, AccountService, ContentService]);
        beam.use(GameServiceClient);
      },
    });
  }

  return gameBeamPromise;
}

export async function getArenaBeam(): Promise<Beam> {
  if (!arenaBeamPromise) {
    const config = getBeamRealmConfig();
    arenaTokenStorage = createTokenStorage(config.arenaPid, "skillz-arena-sample-arena");
    arenaBeamPromise = Beam.init({
      cid: config.cid,
      pid: config.arenaPid,
      instanceTag: "skillz-arena-sample-arena",
      tokenStorage: arenaTokenStorage,
      services: (beam) => {
        beam.use([AuthService, AccountService, ContentService]);
        beam.use(ArenaClient);
      },
    });
  }

  return arenaBeamPromise;
}

export function getRegisteredGameServiceClient(beam: Beam): GameServiceClient {
  const client = (beam as Beam & { gameServiceClient?: GameServiceClient }).gameServiceClient;
  if (!client) {
    throw new Error("GameService client is not registered on the game Beam context.");
  }

  return client;
}

export function getRegisteredArenaServiceClient(beam: Beam): ArenaClient {
  const client = (beam as Beam & { arenaClient?: ArenaClient }).arenaClient;
  if (!client) {
    throw new Error("Arena service client is not registered on the Arena Beam context.");
  }

  return client;
}

export function clearBeamContextsOnLogout(): void {
  gameTokenStorage?.clear();
  arenaTokenStorage?.clear();
  gameTokenStorage?.dispose();
  arenaTokenStorage?.dispose();
  gameTokenStorage = undefined;
  arenaTokenStorage = undefined;
  gameBeamPromise = undefined;
  arenaBeamPromise = undefined;
}
