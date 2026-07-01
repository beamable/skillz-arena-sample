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
	public class GetMerchantPlayerStateResponse
	{
		public bool success;
		public string error;
		public int gameXp;
		public int gameLevel;
		public string equippedWeaponId;
		public string startingWeaponId;
		public long gold;
		public MerchantLootStackResponse[] loot;
		public MerchantOwnedWeaponResponse[] ownedWeapons;
		public GetMerchantPlayerStateArenaProgressResponse arenaProgress;

		public static GetMerchantPlayerStateResponse Invalid(string error)
		{
			return new GetMerchantPlayerStateResponse
			{
				success = false,
				error = error,
				equippedWeaponId = string.Empty,
				startingWeaponId = string.Empty,
				loot = Array.Empty<MerchantLootStackResponse>(),
				ownedWeapons = Array.Empty<MerchantOwnedWeaponResponse>(),
				arenaProgress = GetMerchantPlayerStateArenaProgressResponse.Invalid(error)
			};
		}
	}

	[Serializable]
	public class SellLootRequest
	{
		public string itemContentId;
		public int quantity;
	}

	[Serializable]
	public class SellLootResponse
	{
		public bool success;
		public string error;
		public string eventId;
		public string itemContentId;
		public int quantitySold;
		public int goldGranted;
		public int arenaXpAwarded;
		public SellLootArenaProgressResponse arenaProgress;

		public static SellLootResponse Invalid(string error)
		{
			return new SellLootResponse
			{
				success = false,
				error = error,
				eventId = string.Empty,
				itemContentId = string.Empty,
				arenaProgress = SellLootArenaProgressResponse.Invalid(error)
			};
		}
	}

	[Serializable]
	public class BuyWeaponRequest
	{
		public string listingId;
	}

	[Serializable]
	public class BuyWeaponResponse
	{
		public bool success;
		public string error;
		public string listingId;
		public string weaponContentId;
		public int goldSpent;

		public static BuyWeaponResponse Invalid(string error)
		{
			return new BuyWeaponResponse
			{
				success = false,
				error = error,
				listingId = string.Empty,
				weaponContentId = string.Empty
			};
		}
	}

	[Serializable]
	public class EquipWeaponRequest
	{
		public string weaponContentId;
	}

	[Serializable]
	public class EquipWeaponResponse
	{
		public bool success;
		public string error;
		public string equippedWeaponId;

		public static EquipWeaponResponse Invalid(string error)
		{
			return new EquipWeaponResponse
			{
				success = false,
				error = error,
				equippedWeaponId = string.Empty
			};
		}
	}

	[Serializable]
	public class ResolveBossEncounterRequest
	{
		public string caveId;
		public string sessionId;
	}

	[Serializable]
	public class ResolveBossEncounterResponse
	{
		public bool success;
		public string error;
		public string eventId;
		public string caveId;
		public string caveName;
		public string bossId;
		public string bossName;
		public bool defeated;
		public int gameXpAwarded;
		public int arenaXpAwarded;
		public MerchantPlayerStateResponse playerState;
		public MerchantLootRollResponse[] loot;
		public ResolveBossEncounterArenaProgressResponse arenaProgress;

		public static ResolveBossEncounterResponse Invalid(string error)
		{
			return new ResolveBossEncounterResponse
			{
				success = false,
				error = error,
				eventId = string.Empty,
				caveId = string.Empty,
				caveName = string.Empty,
				bossId = string.Empty,
				bossName = string.Empty,
				loot = Array.Empty<MerchantLootRollResponse>(),
				playerState = MerchantPlayerStateResponse.Default(),
				arenaProgress = ResolveBossEncounterArenaProgressResponse.Invalid(error)
			};
		}
	}

	[Serializable]
	public class GetMerchantPlayerStateArenaProgressResponse
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

		public static GetMerchantPlayerStateArenaProgressResponse Invalid(string error)
		{
			return new GetMerchantPlayerStateArenaProgressResponse
			{
				success = false,
				error = error,
				playerKey = string.Empty,
				lastEventId = string.Empty
			};
		}

		public static GetMerchantPlayerStateArenaProgressResponse FromArena(ArenaProgressResponse progress)
		{
			return new GetMerchantPlayerStateArenaProgressResponse
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
	public class ResolveBossEncounterArenaProgressResponse
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

		public static ResolveBossEncounterArenaProgressResponse Invalid(string error)
		{
			return new ResolveBossEncounterArenaProgressResponse
			{
				success = false,
				error = error,
				playerKey = string.Empty,
				lastEventId = string.Empty
			};
		}

		public static ResolveBossEncounterArenaProgressResponse FromArena(ArenaProgressResponse progress)
		{
			return new ResolveBossEncounterArenaProgressResponse
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
	public class MerchantPlayerStateResponse
	{
		public int gameXp;
		public int gameLevel;
		public string equippedWeaponId;
		public string startingWeaponId;
		public long gold;

		public static MerchantPlayerStateResponse Default()
		{
			return new MerchantPlayerStateResponse
			{
				gameXp = 0,
				gameLevel = 1,
				equippedWeaponId = string.Empty,
				startingWeaponId = string.Empty,
				gold = 0
			};
		}
	}

	[Serializable]
	public class MerchantLootStackResponse
	{
		public string itemContentId;
		public string inventoryContentId;
		public int quantity;
		public long[] instanceIds;
	}

	[Serializable]
	public class MerchantOwnedWeaponResponse
	{
		public string itemContentId;
		public string inventoryContentId;
		public int quantity;
		public long[] instanceIds;
	}

	[Serializable]
	public class MerchantLootRollResponse
	{
		public string itemContentId;
		public int quantity;
	}

	[Serializable]
	public class SellLootArenaProgressResponse
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

		public static SellLootArenaProgressResponse Invalid(string error)
		{
			return new SellLootArenaProgressResponse
			{
				success = false,
				error = error,
				playerKey = string.Empty,
				lastEventId = string.Empty
			};
		}

		public static SellLootArenaProgressResponse FromArena(ArenaProgressResponse progress)
		{
			return new SellLootArenaProgressResponse
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
