using Beamable.GameService;

namespace GameService.Tests;

public class MerchantProgressionRulesTests
{
	[Theory]
	[InlineData(0, 1)]
	[InlineData(99, 1)]
	[InlineData(100, 2)]
	[InlineData(259, 2)]
	[InlineData(260, 3)]
	[InlineData(900, 5)]
	[InlineData(1200, 5)]
	public void CalculateLevel_UsesTotalXpThresholds(int gameXp, int expectedLevel)
	{
		var thresholds = new[] { 0, 100, 260, 520, 900 };

		var level = MerchantProgressionRules.CalculateLevel(thresholds, gameXp);

		Assert.Equal(expectedLevel, level);
	}

	[Fact]
	public void CalculateState_UsesStartingWeaponAsEquippedWeaponForV1()
	{
		var state = MerchantProgressionRules.CalculateState(
			new[] { 0, 100 },
			120,
			"items.weapon.starter_blade");

		Assert.Equal(120, state.gameXp);
		Assert.Equal(2, state.gameLevel);
		Assert.Equal("items.weapon.starter_blade", state.startingWeaponId);
		Assert.Equal("items.weapon.starter_blade", state.equippedWeaponId);
	}
}
