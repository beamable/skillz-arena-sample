using System;

namespace Beamable.GameService
{
	[Serializable]
	public class HealthCheckResponse
	{
		public string status;
		public string version;
		public DateTime timestamp;
	}

	[Serializable]
	public class PlayerProfileResponse
	{
		public bool success;
		public string error;
		public long playerId;
		public string arenaPlayerKey;

		public static PlayerProfileResponse Invalid(string error)
		{
			return new PlayerProfileResponse
			{
				success = false,
				error = error,
				arenaPlayerKey = string.Empty
			};
		}
	}

	[Serializable]
	public class CompleteQuickGameRequest
	{
		public string quickGameId;
		public string sessionId;
		public int score;
		public int durationSeconds;
	}

	[Serializable]
	public class CompleteQuickGameResponse
	{
		public bool success;
		public string error;
		public string eventId;
		public int xpAwarded;
		public ArenaProgressResponse progress;

		public static CompleteQuickGameResponse Invalid(string error)
		{
			return new CompleteQuickGameResponse
			{
				success = false,
				error = error,
				eventId = string.Empty,
				xpAwarded = 0,
				progress = ArenaProgressResponse.Invalid(error)
			};
		}
	}

	internal class PlayerEmailIdentity
	{
		public bool success;
		public string error;
		public long playerId;
		public string playerKey;

		public static PlayerEmailIdentity Invalid(string error)
		{
			return new PlayerEmailIdentity
			{
				success = false,
				error = error,
				playerKey = string.Empty
			};
		}
	}
}
