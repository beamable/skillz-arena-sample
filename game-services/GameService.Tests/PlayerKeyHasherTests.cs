using Beamable.GameService;

namespace GameService.Tests;

public class PlayerKeyHasherTests
{
	[Fact]
	public void NormalizeEmail_TrimsAndLowercases()
	{
		Assert.Equal("player@example.com", PlayerKeyHasher.NormalizeEmail("  Player@Example.COM  "));
	}

	[Fact]
	public void HashEmail_IsStableForNormalizedEmail()
	{
		var first = PlayerKeyHasher.HashEmail("  Player@Example.COM  ");
		var second = PlayerKeyHasher.HashEmail("player@example.com");

		Assert.Equal(first, second);
		Assert.Equal(64, first.Length);
		Assert.DoesNotContain("@", first);
	}

	[Fact]
	public void HashEmail_ReturnsEmptyForMissingEmail()
	{
		Assert.Equal(string.Empty, PlayerKeyHasher.HashEmail(" "));
	}
}
