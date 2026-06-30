using Beamable.GameService;
using Beamable.Server.Api.RealmConfig;

namespace GameService.Tests;

public class ArenaBridgeTests
{
	[Fact]
	public void CreateArenaRoute_UsesExplicitCrossPidMicroservicePath()
	{
		var route = ArenaBridge.CreateArenaRoute("1689160644344843", "DE_ARENA", "RecordXpEvent");

		Assert.Equal("/basic/1689160644344843.DE_ARENA.micro_Arena/RecordXpEvent", route);
	}

	[Fact]
	public void ArenaBridgeConfig_RejectsMissingSecret()
	{
		var config = new ArenaBridgeConfig
		{
			arenaCid = "cid",
			arenaPid = "arena-pid",
			sourceCid = "cid",
			sourcePid = "game-pid"
		};

		var error = Assert.Throws<InvalidOperationException>(() => config.Validate());

		Assert.Equal("Arena bridge config is missing arena project secret.", error.Message);
	}

	[Fact]
	public void Resolve_ReadsArenaNamespaceFromRealmConfig()
	{
		var realmConfig = RealmConfig.From(new Dictionary<string, Dictionary<string, string>>
		{
			{
				"arena",
				new Dictionary<string, string>
				{
					{ "ARENA_CID", " arena-cid " },
					{ "ARENA_PID", " arena-pid " },
					{ "ARENA_PROJECT_SECRET", " arena-secret " }
				}
			}
		});

		var config = ArenaBridgeConfigResolver.Resolve(realmConfig, new BeamRequesterRealm
		{
			cid = "game-cid",
			pid = "game-pid"
		});

		Assert.Equal("arena-cid", config.arenaCid);
		Assert.Equal("arena-pid", config.arenaPid);
		Assert.Equal("arena-secret", config.arenaSecret);
		Assert.Equal("game-cid", config.sourceCid);
		Assert.Equal("game-pid", config.sourcePid);
		Assert.Equal("skillz-arena-sample-game", config.sourceGame);
	}
}
