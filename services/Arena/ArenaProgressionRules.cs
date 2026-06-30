using System;

namespace Beamable.Arena
{
	public static class ArenaProgressionRules
	{
		private static readonly int[] TotalXpThresholds = { 0, 100, 250, 450, 700, 1000 };

		public static ArenaLevelState Calculate(int totalXp)
		{
			if (totalXp < 0)
			{
				throw new ArgumentOutOfRangeException(nameof(totalXp), "Total XP cannot be negative.");
			}

			var levelIndex = 0;
			for (var i = 0; i < TotalXpThresholds.Length; i++)
			{
				if (totalXp >= TotalXpThresholds[i])
				{
					levelIndex = i;
				}
			}

			var level = levelIndex + 1;
			var currentLevelXp = TotalXpThresholds[levelIndex];
			var nextLevelXp = levelIndex + 1 < TotalXpThresholds.Length
				? TotalXpThresholds[levelIndex + 1]
				: currentLevelXp;

			return new ArenaLevelState
			{
				level = level,
				currentLevelXp = currentLevelXp,
				nextLevelXp = nextLevelXp,
				xpToNextLevel = Math.Max(0, nextLevelXp - totalXp)
			};
		}
	}

	[Serializable]
	public class ArenaLevelState
	{
		public int level;
		public int currentLevelXp;
		public int nextLevelXp;
		public int xpToNextLevel;
	}
}
