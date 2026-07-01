/**
 * ⚠️ THIS FILE IS AUTO-GENERATED. DO NOT EDIT MANUALLY.
 * All manual edits will be lost when this file is regenerated.
 */

import { BeamMicroServiceClient, type BeamBase } from '@beamable/sdk';
import type * as Types from './types';

declare module '@beamable/sdk' {
  interface BeamBase {
    /**
     * Access the GameService microservice.
     * @remarks Before accessing this property, register it first via the `use` method.
     * @example
     * ```ts
     * // client-side:
     * beam.use(GameServiceClient);
     * beam.gameServiceClient.serviceName;
     * // server-side:
     * beamServer.use(GameServiceClient);
     * beamServer.gameServiceClient.serviceName;
     * ```
     */
    gameServiceClient: GameServiceClient;
  }
}

export class GameServiceClient extends BeamMicroServiceClient {
  constructor(
    beam: BeamBase
  ) {
    super(beam);
  }
  
  get serviceName(): string {
    return "GameService";
  }
  
  async healthCheck(): Promise<Types.HealthCheckResponse> {
    return this.request({
      endpoint: "HealthCheck",
      withAuth: true
    });
  }
  
  async getPlayerProfile(): Promise<Types.PlayerProfileResponse> {
    return this.request({
      endpoint: "GetPlayerProfile",
      withAuth: true
    });
  }
  
  async getArenaProgress(): Promise<Types.GetGameArenaProgressResponse> {
    return this.request({
      endpoint: "GetArenaProgress",
      withAuth: true
    });
  }
  
  async getMerchantPlayerState(): Promise<Types.GetMerchantPlayerStateResponse> {
    return this.request({
      endpoint: "GetMerchantPlayerState",
      withAuth: true
    });
  }
  
  async resolveBossEncounter(params: Types.ResolveBossEncounterRequestArgs): Promise<Types.ResolveBossEncounterResponse> {
    return this.request({
      endpoint: "ResolveBossEncounter",
      payload: params,
      withAuth: true
    });
  }
  
  async completeQuickGame(params: Types.CompleteQuickGameRequestArgs): Promise<Types.CompleteQuickGameResponse> {
    return this.request({
      endpoint: "CompleteQuickGame",
      payload: params,
      withAuth: true
    });
  }
}
