using System;
using System.Threading.Tasks;
using Beamable.Common.Api;
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
	}
}
