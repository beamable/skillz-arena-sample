using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Beamable.Common.Api;
using Beamable.Common.Api.Stats;
using Beamable.Common.Content;
using Beamable.Server;
using Beamable.Server.Api.RealmConfig;

namespace Beamable.GameService
{
	public partial class GameService : Microservice
	{
		private const string ServiceVersion = "0.1.0";

		[ConfigureServices]
		public static void Configure(IServiceBuilder builder)
		{
			var cache = new ArenaBridgeConfigCache();
			builder.AddSingleton(_ => cache);
		}

		[InitializeServices]
		public static async Task Initialize(IServiceInitializer initializer)
		{
			var cache = initializer.GetServiceAsCache<ArenaBridgeConfigCache>();
			var realmConfig = initializer.GetService<IMicroserviceRealmConfigService>();
			var signedRequester = initializer.GetService<ISignedRequester>();
			await cache.Initialize(realmConfig, signedRequester);
		}

		[Callable]
		public HealthCheckResponse HealthCheck()
		{
			return new HealthCheckResponse
			{
				status = "healthy",
				version = ServiceVersion,
				timestamp = DateTime.UtcNow
			};
		}

		[ClientCallable]
		public async Task<PlayerProfileResponse> GetPlayerProfile()
		{
			var identity = await GetCurrentEmailIdentity();
			if (!identity.success)
			{
				return PlayerProfileResponse.Invalid(identity.error);
			}

			return new PlayerProfileResponse
			{
				success = true,
				error = string.Empty,
				playerId = identity.playerId,
				arenaPlayerKey = identity.playerKey
			};
		}

		[ClientCallable]
		public async Task<GetGameArenaProgressResponse> GetArenaProgress()
		{
			var identity = await GetCurrentEmailIdentity();
			if (!identity.success)
			{
				return GetGameArenaProgressResponse.Invalid(identity.error);
			}

			var progress = await CreateArenaBridge().GetProgress(identity.playerKey);
			return GetGameArenaProgressResponse.FromArena(progress);
		}

		[ClientCallable]
		public async Task<GetMerchantPlayerStateResponse> GetMerchantPlayerState()
		{
			var identity = await GetCurrentEmailIdentity();
			if (!identity.success)
			{
				return GetMerchantPlayerStateResponse.Invalid(identity.error);
			}

			var progression = await LoadContent<MerchantProgressionContent>("merchant_progression.default");
			var state = await GetMerchantPlayerState(progression);
			var arenaProgress = await CreateArenaBridge().GetProgress(identity.playerKey);

			return new GetMerchantPlayerStateResponse
			{
				success = arenaProgress.success,
				error = arenaProgress.error,
				gameXp = state.gameXp,
				gameLevel = state.gameLevel,
				equippedWeaponId = state.equippedWeaponId,
				startingWeaponId = state.startingWeaponId,
				arenaProgress = GetMerchantPlayerStateArenaProgressResponse.FromArena(arenaProgress)
			};
		}

		[ClientCallable]
		public async Task<ResolveBossEncounterResponse> ResolveBossEncounter(ResolveBossEncounterRequest request)
		{
			var validationError = MerchantEncounterRules.ValidateResolveRequest(request);
			if (validationError != null)
			{
				return ResolveBossEncounterResponse.Invalid(validationError);
			}

			var identity = await GetCurrentEmailIdentity();
			if (!identity.success)
			{
				return ResolveBossEncounterResponse.Invalid(identity.error);
			}

			var caveId = request.caveId.Trim();
			var sessionId = request.sessionId.Trim();
			var progression = await LoadContent<MerchantProgressionContent>("merchant_progression.default");
			var state = await GetMerchantPlayerState(progression);
			var cave = await LoadContent<MerchantCaveContent>(caveId);
			var unlockError = MerchantEncounterRules.ValidateCaveUnlock(cave, state.gameLevel);
			if (unlockError != null)
			{
				return ResolveBossEncounterResponse.Invalid(unlockError);
			}

			var boss = await LoadContent<MerchantBossContent>(cave.bossId);
			var dropTable = await LoadContent<MerchantDropTableContent>(boss.dropTableId);
			var arenaConfig = GetArenaBridgeConfig();
			var eventId = MerchantEncounterRules.CreateEventId(arenaConfig.sourcePid, identity.playerKey, caveId, sessionId);
			var arenaRequest = MerchantEncounterRules.CreateArenaXpRequest(
				eventId,
				identity.playerKey,
				arenaConfig.sourceCid,
				arenaConfig.sourcePid,
				arenaConfig.sourceGame,
				caveId,
				sessionId,
				cave.bossId,
				boss.arenaXpOnDefeat);
			var arenaProgress = await CreateArenaBridge().RecordXpEvent(arenaRequest);

			if (!arenaProgress.success)
			{
				return ResolveBossEncounterResponse.Invalid(arenaProgress.error);
			}

			var gameXpAwarded = arenaProgress.duplicateEvent ? 0 : boss.baseGameXp;
			if (gameXpAwarded > 0)
			{
				state = await ApplyGameXp(progression, state, gameXpAwarded);
			}

			return new ResolveBossEncounterResponse
			{
				success = true,
				error = string.Empty,
				eventId = eventId,
				caveId = caveId,
				caveName = cave.displayName,
				bossId = cave.bossId,
				bossName = boss.displayName,
				defeated = true,
				gameXpAwarded = gameXpAwarded,
				arenaXpAwarded = arenaProgress.xpGranted,
				playerState = state.ToResponse(),
				loot = MerchantEncounterRules.RollLoot(dropTable.entries, eventId),
				arenaProgress = ResolveBossEncounterArenaProgressResponse.FromArena(arenaProgress)
			};
		}

		[ClientCallable]
		public async Task<CompleteQuickGameResponse> CompleteQuickGame(CompleteQuickGameRequest request)
		{
			var validationError = QuickGameRules.ValidateCompletion(request);
			if (validationError != null)
			{
				return CompleteQuickGameResponse.Invalid(validationError);
			}

			var identity = await GetCurrentEmailIdentity();
			if (!identity.success)
			{
				return CompleteQuickGameResponse.Invalid(identity.error);
			}

			var arenaConfig = GetArenaBridgeConfig();
			var eventId = QuickGameRules.CreateEventId(arenaConfig.sourcePid, identity.playerKey, request.quickGameId, request.sessionId);
			var arenaRequest = QuickGameRules.CreateArenaXpRequest(
				eventId,
				identity.playerKey,
				arenaConfig.sourceCid,
				arenaConfig.sourcePid,
				arenaConfig.sourceGame,
				request);

			var progress = await CreateArenaBridge().RecordXpEvent(arenaRequest);

			return new CompleteQuickGameResponse
			{
				success = progress.success,
				error = progress.error,
				eventId = eventId,
				xpAwarded = progress.success ? QuickGameRules.XpAward : 0,
				progress = CompleteQuickGameArenaProgressResponse.FromArena(progress)
			};
		}

		private async Task<PlayerEmailIdentity> GetCurrentEmailIdentity()
		{
			var user = await Services.Auth.GetUser(Context.UserId);
			if (user == null || string.IsNullOrWhiteSpace(user.email))
			{
				return PlayerEmailIdentity.Invalid("Email credentials are required. Complete email signup or link an email before using Arena progression.");
			}

			return new PlayerEmailIdentity
			{
				success = true,
				error = string.Empty,
				playerId = user.id,
				playerKey = PlayerKeyHasher.HashEmail(user.email)
			};
		}

		private ArenaBridgeConfig GetArenaBridgeConfig()
		{
			return Provider.GetService<ArenaBridgeConfigCache>().Value;
		}

		private ArenaBridge CreateArenaBridge()
		{
			return new ArenaBridge(SignedRequester, GetArenaBridgeConfig());
		}

		private async Task<TContent> LoadContent<TContent>(string contentId) where TContent : ContentObject, new()
		{
			var content = await Services.Content.GetContent(contentId, typeof(TContent), "global");
			return (TContent)content;
		}

		private async Task<MerchantPlayerState> GetMerchantPlayerState(MerchantProgressionContent progression)
		{
			var stats = await Services.Stats.GetFilteredStats(
				StatsDomainType.Game,
				StatsAccessType.Private,
				Context.UserId,
				new[] { MerchantProgressionRules.GameXpStat, MerchantProgressionRules.GameLevelStat });
			var gameXp = MerchantProgressionRules.ParseStatInt(stats, MerchantProgressionRules.GameXpStat);
			return MerchantProgressionRules.CalculateState(progression.gameXpThresholds, gameXp, progression.startingWeaponId);
		}

		private async Task<MerchantPlayerState> ApplyGameXp(
			MerchantProgressionContent progression,
			MerchantPlayerState currentState,
			int gameXpAwarded)
		{
			var nextState = MerchantProgressionRules.CalculateState(
				progression.gameXpThresholds,
				currentState.gameXp + Math.Max(0, gameXpAwarded),
				progression.startingWeaponId);

			await Services.Stats.SetStats(
				StatsDomainType.Game,
				StatsAccessType.Private,
				Context.UserId,
				new Dictionary<string, string>
				{
					{ MerchantProgressionRules.GameXpStat, nextState.gameXp.ToString() },
					{ MerchantProgressionRules.GameLevelStat, nextState.gameLevel.ToString() }
				});

			return nextState;
		}
	}
}
