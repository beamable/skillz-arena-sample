using System;
using Beamable.Server;

namespace Beamable.Arena
{
	[Serializable]
	public class ArenaXpEventDocument : StorageDocument
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
		public DateTime recordedAt;
	}

	[Serializable]
	public class ArenaPlayerProgressDocument : StorageDocument
	{
		public string playerKey;
		public int totalXp;
		public int level;
		public int currentLevelXp;
		public int nextLevelXp;
		public int xpToNextLevel;
		public string lastEventId;
		public DateTime createdAt;
		public DateTime updatedAt;
	}
}
