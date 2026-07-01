using System;
using System.Collections.Generic;

namespace Beamable.GameService
{
	public static class MerchantProgressionRules
	{
		public const string GameXpStat = "merchant_game_xp";
		public const string GameLevelStat = "merchant_game_level";

		public static MerchantPlayerState CalculateState(
			IReadOnlyList<int> thresholds,
			int gameXp,
			string startingWeaponId)
		{
			var normalizedXp = Math.Max(0, gameXp);
			return new MerchantPlayerState
			{
				gameXp = normalizedXp,
				gameLevel = CalculateLevel(thresholds, normalizedXp),
				startingWeaponId = startingWeaponId ?? string.Empty,
				equippedWeaponId = startingWeaponId ?? string.Empty
			};
		}

		public static int CalculateLevel(IReadOnlyList<int> thresholds, int gameXp)
		{
			if (thresholds == null || thresholds.Count == 0)
			{
				return 1;
			}

			var level = 1;
			for (var i = 0; i < thresholds.Count; i++)
			{
				if (gameXp >= thresholds[i])
				{
					level = i + 1;
				}
			}

			return level;
		}

		public static int ParseStatInt(IDictionary<string, string> stats, string key, int fallback = 0)
		{
			if (stats == null || !stats.TryGetValue(key, out var rawValue))
			{
				return fallback;
			}

			return int.TryParse(rawValue, out var value) ? value : fallback;
		}
	}

	public class MerchantPlayerState
	{
		public int gameXp;
		public int gameLevel;
		public string equippedWeaponId;
		public string startingWeaponId;

		public MerchantPlayerStateResponse ToResponse()
		{
			return new MerchantPlayerStateResponse
			{
				gameXp = gameXp,
				gameLevel = gameLevel,
				equippedWeaponId = equippedWeaponId,
				startingWeaponId = startingWeaponId
			};
		}
	}
}
