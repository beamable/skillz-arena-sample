using Beamable.Arena;
using Xunit;

namespace Beamable.Arena.Tests;

public class ArenaProgressionRulesTests
{
	[Theory]
	[InlineData(0, 1, 0, 100, 100)]
	[InlineData(99, 1, 0, 100, 1)]
	[InlineData(100, 2, 100, 250, 150)]
	[InlineData(250, 3, 250, 450, 200)]
	[InlineData(700, 5, 700, 1000, 300)]
	[InlineData(1000, 6, 1000, 1000, 0)]
	[InlineData(1500, 6, 1000, 1000, 0)]
	public void Calculate_ReturnsExpectedLevelState(
		int totalXp, int level, int currentLevelXp, int nextLevelXp, int xpToNextLevel)
	{
		var state = ArenaProgressionRules.Calculate(totalXp);

		Assert.Equal(level, state.level);
		Assert.Equal(currentLevelXp, state.currentLevelXp);
		Assert.Equal(nextLevelXp, state.nextLevelXp);
		Assert.Equal(xpToNextLevel, state.xpToNextLevel);
	}
}
