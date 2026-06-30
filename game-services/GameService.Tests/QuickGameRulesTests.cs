using Beamable.GameService;

namespace GameService.Tests;

public class QuickGameRulesTests
{
	[Fact]
	public void ValidateCompletion_RejectsInvalidRequest()
	{
		var request = ValidRequest();
		request.durationSeconds = 0;

		var error = QuickGameRules.ValidateCompletion(request);

		Assert.Equal("Duration must be greater than zero seconds.", error);
	}

	[Fact]
	public void CreateArenaXpRequest_UsesServerOwnedXpAndEventType()
	{
		var request = QuickGameRules.CreateArenaXpRequest(
			"event-1",
			"player-key",
			"cid",
			"pid",
			"sample-game",
			ValidRequest());

		Assert.Equal(25, request.xpAmount);
		Assert.Equal("quick_game_completed", request.eventType);
		Assert.Equal("quick-1", request.matchId);
		Assert.Equal("session-1", request.sessionId);
		Assert.Contains("\"score\":1200", request.metadataJson);
	}

	[Fact]
	public void CreateEventId_IsDeterministicForSameSubmission()
	{
		var first = QuickGameRules.CreateEventId("pid", "player-key", "quick-1", "session-1");
		var second = QuickGameRules.CreateEventId("pid", "player-key", "quick-1", "session-1");
		var differentSession = QuickGameRules.CreateEventId("pid", "player-key", "quick-1", "session-2");

		Assert.Equal(first, second);
		Assert.NotEqual(first, differentSession);
		Assert.StartsWith("quick-game-", first);
	}

	private static CompleteQuickGameRequest ValidRequest()
	{
		return new CompleteQuickGameRequest
		{
			quickGameId = "quick-1",
			sessionId = "session-1",
			score = 1200,
			durationSeconds = 90
		};
	}
}
