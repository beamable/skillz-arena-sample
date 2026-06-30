using System;

namespace Beamable.GameService
{
	[Serializable]
	public class RecordArenaXpRequest
	{
		public string eventId;
		public string playerKey;
		public string sourceCid;
		public string sourcePid;
		public string sourceGame;
		public string eventType;
		public int xpAmount;
		public DateTime occurredAt;
		public string matchId;
		public string sessionId;
		public string metadataJson;
	}

	[Serializable]
	public class GetArenaProgressRequest
	{
		public string playerKey;
	}

	[Serializable]
	public class ArenaProgressResponse
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

		public static ArenaProgressResponse Invalid(string error)
		{
			return new ArenaProgressResponse
			{
				success = false,
				error = error,
				playerKey = string.Empty,
				lastEventId = string.Empty
			};
		}
	}
}
