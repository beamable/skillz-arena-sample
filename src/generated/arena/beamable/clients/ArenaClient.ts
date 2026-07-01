/**
 * ⚠️ THIS FILE IS AUTO-GENERATED. DO NOT EDIT MANUALLY.
 * All manual edits will be lost when this file is regenerated.
 */

import { BeamMicroServiceClient, type BeamBase } from '@beamable/sdk';
import type * as Types from './types';

declare module '@beamable/sdk' {
  interface BeamBase {
    /**
     * Access the Arena microservice.
     * @remarks Before accessing this property, register it first via the `use` method.
     * @example
     * ```ts
     * // client-side:
     * beam.use(ArenaClient);
     * beam.arenaClient.serviceName;
     * // server-side:
     * beamServer.use(ArenaClient);
     * beamServer.arenaClient.serviceName;
     * ```
     */
    arenaClient: ArenaClient;
  }
}

export class ArenaClient extends BeamMicroServiceClient {
  constructor(
    beam: BeamBase
  ) {
    super(beam);
  }
  
  get serviceName(): string {
    return "Arena";
  }
  
  async healthCheck(): Promise<Types.HealthCheckResponse> {
    return this.request({
      endpoint: "HealthCheck",
      withAuth: true
    });
  }
  
  async recordXpEvent(params: Types.RecordXpEventRequestArgs): Promise<Types.RecordArenaXpResponse> {
    return this.request({
      endpoint: "RecordXpEvent",
      payload: params,
      withAuth: true
    });
  }
  
  async getProgress(params: Types.GetProgressRequestArgs): Promise<Types.GetArenaProgressResponse> {
    return this.request({
      endpoint: "GetProgress",
      payload: params,
      withAuth: true
    });
  }
}
