using Beamable.Arena;
using Xunit;

namespace Beamable.Arena.Tests;

public class ArenaValidationTests
{
	[Fact]
	public void ValidateRecordXpEvent_RejectsInvalidXpAmount()
	{
		var request = ValidRecordRequest();
		request.xpAmount = 0;

		var error = ArenaValidation.ValidateRecordXpEvent(request);

		Assert.Equal("XP amount must be greater than zero.", error);
	}

	[Fact]
	public void ValidateGetProgress_RejectsMissingPlayerKey()
	{
		var error = ArenaValidation.ValidateGetProgress(new GetArenaProgressRequest { playerKey = " " });

		Assert.Equal("Player key is required.", error);
	}

	[Fact]
	public void FromProgress_CanRepresentDuplicateEventWithoutGrantingXpAgain()
	{
		var response = GetArenaProgressResponse.FromProgress(new ArenaPlayerProgressDocument
		{
			playerKey = "hashed-player",
			totalXp = 100,
			level = 2,
			currentLevelXp = 100,
			nextLevelXp = 250,
			xpToNextLevel = 150,
			lastEventId = "event-1"
		}, true);

		Assert.True(response.success);
		Assert.True(response.duplicateEvent);
		Assert.False(response.didLevelUp);
		Assert.Equal(0, response.xpGranted);
		Assert.Equal(100, response.totalXp);
	}

	[Fact]
	public void DefaultProgressState_IsLevelOneWithZeroXp()
	{
		var levelState = ArenaProgressionRules.Calculate(0);

		Assert.Equal(1, levelState.level);
		Assert.Equal(0, levelState.currentLevelXp);
		Assert.Equal(100, levelState.nextLevelXp);
		Assert.Equal(100, levelState.xpToNextLevel);
	}

	private static RecordArenaXpRequest ValidRecordRequest()
	{
		return new RecordArenaXpRequest
		{
			eventId = "event-1",
			playerKey = "hashed-player",
			sourceCid = "cid",
			sourcePid = "pid",
			eventType = "match_completed",
			xpAmount = 25
		};
	}
}
