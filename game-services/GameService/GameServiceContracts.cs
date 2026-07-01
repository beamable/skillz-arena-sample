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
		public CompleteQuickGameArenaProgressResponse progress;

		public static CompleteQuickGameResponse Invalid(string error)
		{
			return new CompleteQuickGameResponse
			{
				success = false,
				error = error,
				eventId = string.Empty,
				xpAwarded = 0,
				progress = CompleteQuickGameArenaProgressResponse.Invalid(error)
			};
		}
	}

	[Serializable]
	public class GetGameArenaProgressResponse
	{
		public bool success;
		public string error;
		public string playerKey;
		public int totalXp;
		public int level;
		public int currentLevelXp;
		public int nextLevelXp;
		public int xpToNextLevel;
		public bool duplicateEvent;
		public bool didLevelUp;
		public int xpGranted;
		public string lastEventId;
		public DateTime updatedAt;

		public static GetGameArenaProgressResponse Invalid(string error)
		{
			return new GetGameArenaProgressResponse
			{
				success = false,
				error = error,
				playerKey = string.Empty,
				lastEventId = string.Empty
			};
		}

		public static GetGameArenaProgressResponse FromArena(ArenaProgressResponse progress)
		{
			return new GetGameArenaProgressResponse
			{
				success = progress.success,
				error = progress.error,
				playerKey = progress.playerKey,
				totalXp = progress.totalXp,
				level = progress.level,
				currentLevelXp = progress.currentLevelXp,
				nextLevelXp = progress.nextLevelXp,
				xpToNextLevel = progress.xpToNextLevel,
				duplicateEvent = progress.duplicateEvent,
				didLevelUp = progress.didLevelUp,
				xpGranted = progress.xpGranted,
				lastEventId = progress.lastEventId,
				updatedAt = progress.updatedAt
			};
		}
	}

	[Serializable]
	public class CompleteQuickGameArenaProgressResponse
	{
		public bool success;
		public string error;
		public string playerKey;
		public int totalXp;
		public int level;
		public int currentLevelXp;
		public int nextLevelXp;
		public int xpToNextLevel;
		public bool duplicateEvent;
		public bool didLevelUp;
		public int xpGranted;
		public string lastEventId;
		public DateTime updatedAt;

		public static CompleteQuickGameArenaProgressResponse Invalid(string error)
		{
			return new CompleteQuickGameArenaProgressResponse
			{
				success = false,
				error = error,
				playerKey = string.Empty,
				lastEventId = string.Empty
			};
		}

		public static CompleteQuickGameArenaProgressResponse FromArena(ArenaProgressResponse progress)
		{
			return new CompleteQuickGameArenaProgressResponse
			{
				success = progress.success,
				error = progress.error,
				playerKey = progress.playerKey,
				totalXp = progress.totalXp,
				level = progress.level,
				currentLevelXp = progress.currentLevelXp,
				nextLevelXp = progress.nextLevelXp,
				xpToNextLevel = progress.xpToNextLevel,
				duplicateEvent = progress.duplicateEvent,
				didLevelUp = progress.didLevelUp,
				xpGranted = progress.xpGranted,
				lastEventId = progress.lastEventId,
				updatedAt = progress.updatedAt
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
