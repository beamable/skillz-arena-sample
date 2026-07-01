using Beamable.GameService;

namespace GameService.Tests;

public class MerchantEncounterRulesTests
{
	[Fact]
	public void CreateEventId_IsDeterministicForSameEncounterSession()
	{
		var first = MerchantEncounterRules.CreateEventId("pid", "player-key", "merchant_caves.echo_cave", "session-1");
		var second = MerchantEncounterRules.CreateEventId("pid", "player-key", "merchant_caves.echo_cave", "session-1");
		var different = MerchantEncounterRules.CreateEventId("pid", "player-key", "merchant_caves.echo_cave", "session-2");

		Assert.Equal(first, second);
		Assert.NotEqual(first, different);
		Assert.StartsWith("boss-defeat-", first);
	}

	[Fact]
	public void ValidateCaveUnlock_RejectsLowGameLevel()
	{
		var cave = new MerchantCaveContent
		{
			displayName = "Crystal Grotto",
			requiredGameLevel = 2
		};

		var error = MerchantEncounterRules.ValidateCaveUnlock(cave, 1);

		Assert.Equal("Crystal Grotto requires game level 2.", error);
	}

	[Fact]
	public void RollLoot_IsDeterministicForEventId()
	{
		var entries = new[]
		{
			new MerchantDropEntry { itemContentId = "items.loot.glowcap_ore", weight = 75, minQuantity = 1, maxQuantity = 2 },
			new MerchantDropEntry { itemContentId = "items.loot.siren_glass", weight = 25, minQuantity = 1, maxQuantity = 1 }
		};

		var first = MerchantEncounterRules.RollLoot(entries, "event-1");
		var second = MerchantEncounterRules.RollLoot(entries, "event-1");

		Assert.Single(first);
		Assert.Equal(first[0].itemContentId, second[0].itemContentId);
		Assert.Equal(first[0].quantity, second[0].quantity);
		Assert.InRange(first[0].quantity, 1, 2);
	}

	[Fact]
	public void CreateArenaXpRequest_UsesBossDefeatEventType()
	{
		var request = MerchantEncounterRules.CreateArenaXpRequest(
			"event-1",
			"player-key",
			"cid",
			"pid",
			"merchant-game",
			"merchant_caves.echo_cave",
			"session-1",
			"merchant_bosses.mossback_ogre",
			10);

		Assert.Equal("merchant_boss_defeated", request.eventType);
		Assert.Equal(10, request.xpAmount);
		Assert.Equal("merchant_caves.echo_cave", request.matchId);
		Assert.Equal("session-1", request.sessionId);
		Assert.Contains("merchant_bosses.mossback_ogre", request.metadataJson);
	}
}
