using System;
using System.Security.Cryptography;
using System.Text;

namespace Beamable.GameService
{
	public static class QuickGameRules
	{
		public const int XpAward = 25;
		public const string EventType = "quick_game_completed";

		public static string ValidateCompletion(CompleteQuickGameRequest request)
		{
			if (request == null)
			{
				return "Quick game completion request is required.";
			}

			if (string.IsNullOrWhiteSpace(request.quickGameId))
			{
				return "Quick game id is required.";
			}

			if (string.IsNullOrWhiteSpace(request.sessionId))
			{
				return "Session id is required.";
			}

			if (request.score < 0)
			{
				return "Score cannot be negative.";
			}

			if (request.durationSeconds <= 0)
			{
				return "Duration must be greater than zero seconds.";
			}

			return null;
		}

		public static string CreateEventId(string sourcePid, string playerKey, string quickGameId, string sessionId)
		{
			var value = string.Join("|",
				NormalizeSegment(sourcePid),
				NormalizeSegment(playerKey),
				NormalizeSegment(quickGameId),
				NormalizeSegment(sessionId));
			var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
			return $"quick-game-{Convert.ToHexString(bytes).ToLowerInvariant()}";
		}

		public static RecordArenaXpRequest CreateArenaXpRequest(
			string eventId,
			string playerKey,
			string sourceCid,
			string sourcePid,
			string sourceGame,
			CompleteQuickGameRequest request)
		{
			return new RecordArenaXpRequest
			{
				eventId = eventId,
				playerKey = playerKey,
				sourceCid = sourceCid,
				sourcePid = sourcePid,
				sourceGame = sourceGame,
				eventType = EventType,
				xpAmount = XpAward,
				occurredAt = DateTime.UtcNow,
				matchId = request.quickGameId.Trim(),
				sessionId = request.sessionId.Trim(),
				metadataJson = $"{{\"score\":{request.score},\"durationSeconds\":{request.durationSeconds}}}"
			};
		}

		private static string NormalizeSegment(string value)
		{
			return string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();
		}
	}
}
