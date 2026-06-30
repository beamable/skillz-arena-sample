using System;
using System.Threading.Tasks;
using Beamable.Common.Api;
using Beamable.Server.Api.RealmConfig;

namespace Beamable.GameService
{
	public class ArenaBridgeConfig
	{
		public string arenaCid;
		public string arenaPid;
		public string arenaSecret;
		public string sourceCid;
		public string sourcePid;
		public string sourceGame;

		public void Validate()
		{
			if (string.IsNullOrWhiteSpace(arenaCid))
			{
				throw new InvalidOperationException("Arena bridge config is missing arena CID.");
			}

			if (string.IsNullOrWhiteSpace(arenaPid))
			{
				throw new InvalidOperationException("Arena bridge config is missing arena PID.");
			}

			if (string.IsNullOrWhiteSpace(arenaSecret))
			{
				throw new InvalidOperationException("Arena bridge config is missing arena project secret.");
			}

			if (string.IsNullOrWhiteSpace(sourceCid))
			{
				throw new InvalidOperationException("Arena bridge config is missing source CID.");
			}

			if (string.IsNullOrWhiteSpace(sourcePid))
			{
				throw new InvalidOperationException("Arena bridge config is missing source PID.");
			}
		}
	}

	public class ArenaBridgeConfigCache
	{
		private ArenaBridgeConfig _value;

		public ArenaBridgeConfig Value => _value ?? throw new InvalidOperationException("Arena bridge config has not been initialized.");

		public async Task Initialize(IMicroserviceRealmConfigService realmConfigService, ISignedRequester signedRequester)
		{
			if (realmConfigService == null)
			{
				throw new ArgumentNullException(nameof(realmConfigService));
			}

			var realmConfig = await realmConfigService.GetRealmConfigSettings();
			var sourceRealm = BeamRequesterRealmResolver.Resolve(signedRequester);
			_value = ArenaBridgeConfigResolver.Resolve(realmConfig, sourceRealm);
		}
	}

	public static class ArenaBridgeConfigResolver
	{
		private const string ArenaNamespace = "arena";
		private const string LegacyNamespace = "arena_bridge";
		private const string DefaultSourceGame = "skillz-arena-sample-game";

		public static ArenaBridgeConfig Resolve(RealmConfig realmConfig, BeamRequesterRealm sourceRealm)
		{
			if (realmConfig == null)
			{
				throw new ArgumentNullException(nameof(realmConfig));
			}

			if (sourceRealm == null)
			{
				throw new ArgumentNullException(nameof(sourceRealm));
			}

			var arena = realmConfig.GetNamespace(ArenaNamespace);
			var legacy = realmConfig.GetNamespace(LegacyNamespace);
			var config = new ArenaBridgeConfig
			{
				arenaCid = FirstValue(
					arena.GetSetting("ARENA_CID"),
					legacy.GetSetting("cid"),
					Environment.GetEnvironmentVariable("BEAMABLE_ARENA_CID"),
					Environment.GetEnvironmentVariable("BEAMABLE_CID")),
				arenaPid = FirstValue(
					arena.GetSetting("ARENA_PID"),
					legacy.GetSetting("pid"),
					Environment.GetEnvironmentVariable("BEAMABLE_ARENA_PID")),
				arenaSecret = FirstValue(
					arena.GetSetting("ARENA_PROJECT_SECRET"),
					legacy.GetSetting("secret"),
					Environment.GetEnvironmentVariable("BEAMABLE_ARENA_PROJECT_SECRET")),
				sourceCid = sourceRealm.cid,
				sourcePid = sourceRealm.pid,
				sourceGame = FirstValue(
					arena.GetSetting("SOURCE_GAME"),
					legacy.GetSetting("source_game"),
					Environment.GetEnvironmentVariable("BEAMABLE_SAMPLE_GAME_NAME"),
					DefaultSourceGame)
			};
			config.Validate();
			return config;
		}

		private static string FirstValue(params string[] values)
		{
			foreach (var value in values)
			{
				if (!string.IsNullOrWhiteSpace(value))
				{
					return value.Trim();
				}
			}

			return string.Empty;
		}
	}
}
