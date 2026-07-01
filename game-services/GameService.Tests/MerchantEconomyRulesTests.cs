using Beamable.GameService;
using Beamable.Common.Api.Inventory;

namespace GameService.Tests;

public class MerchantEconomyRulesTests
{
	[Fact]
	public void ValidateSellRequest_RejectsNonLootItems()
	{
		var error = MerchantEconomyRules.ValidateSellRequest(new SellLootRequest
		{
			itemContentId = "items.weapon.starter_blade",
			quantity = 1
		});

		Assert.Equal("Only merchant loot can be sold.", error);
	}

	[Theory]
	[InlineData("loot.siren_glass", "items.loot.siren_glass")]
	[InlineData("items.loot.siren_glass", "items.loot.siren_glass")]
	[InlineData("weapon.moonsteel_cutlass", "items.weapon.moonsteel_cutlass")]
	[InlineData("items.weapon.moonsteel_cutlass", "items.weapon.moonsteel_cutlass")]
	public void NormalizeContentId_MapsInventoryIdsToCanonicalItemIds(string input, string expected)
	{
		Assert.Equal(expected, MerchantEconomyRules.NormalizeContentId(input));
	}

	[Theory]
	[InlineData("loot.siren_glass")]
	[InlineData("items.loot.siren_glass")]
	public void ValidateSellRequest_AcceptsLootContentIds(string itemContentId)
	{
		var error = MerchantEconomyRules.ValidateSellRequest(new SellLootRequest
		{
			itemContentId = itemContentId,
			quantity = 1
		});

		Assert.Null(error);
	}

	[Fact]
	public void SummarizeLoot_ReadsRawInventoryItemGroups()
	{
		var view = new InventoryView();
		view.items["loot.siren_glass"] = new List<ItemView>
		{
			new() { id = 10, contentId = "loot.siren_glass" },
			new() { id = 11, contentId = "loot.siren_glass" }
		};
		view.items["loot.glowcap_ore"] = new List<ItemView>
		{
			new() { id = 12, contentId = "loot.glowcap_ore" }
		};

		var stacks = MerchantEconomyRules.SummarizeLoot(view);

		Assert.Equal(2, stacks.Length);
		Assert.Equal("items.loot.glowcap_ore", stacks[0].itemContentId);
		Assert.Equal("loot.glowcap_ore", stacks[0].inventoryContentId);
		Assert.Equal(1, stacks[0].quantity);
		Assert.Equal("items.loot.siren_glass", stacks[1].itemContentId);
		Assert.Equal("loot.siren_glass", stacks[1].inventoryContentId);
		Assert.Equal(2, stacks[1].quantity);
		Assert.Equal(new long[] { 10, 11 }, stacks[1].instanceIds);
	}

	[Fact]
	public void SummarizeWeapons_ReadsRawInventoryItemGroups()
	{
		var view = new InventoryView();
		view.items["weapon.moonsteel_cutlass"] = new List<ItemView>
		{
			new() { id = 20, contentId = "weapon.moonsteel_cutlass" }
		};

		var stacks = MerchantEconomyRules.SummarizeWeapons(view);

		Assert.Single(stacks);
		Assert.Equal("items.weapon.moonsteel_cutlass", stacks[0].itemContentId);
		Assert.Equal("weapon.moonsteel_cutlass", stacks[0].inventoryContentId);
		Assert.Equal(1, stacks[0].quantity);
	}

	[Fact]
	public void GetCurrencyBalance_ReadsRawCurrencyId()
	{
		var view = new InventoryView();
		view.currencies["gold"] = 125;

		var balance = MerchantEconomyRules.GetCurrencyBalance(view, "currency.gold");

		Assert.Equal(125, balance);
	}

	[Fact]
	public void CalculateGoldForSale_UsesSellPriceAndQuantity()
	{
		var gold = MerchantEconomyRules.CalculateGoldForSale(
			new MerchantLootContent { sellPrice = 45 },
			3);

		Assert.Equal(135, gold);
	}

	[Fact]
	public void CalculateArenaXpForSale_UsesArenaXpOnSellAndQuantity()
	{
		var arenaXp = MerchantEconomyRules.CalculateArenaXpForSale(
			new MerchantLootContent { arenaXpOnSell = 5 },
			2);

		Assert.Equal(10, arenaXp);
	}

	[Fact]
	public void CreateSaleEventId_IsDeterministicForSaleId()
	{
		var first = MerchantEconomyRules.CreateSaleEventId("pid", "player", "items.loot.phoenix_ember", 2, "sale-1");
		var second = MerchantEconomyRules.CreateSaleEventId("pid", "player", "items.loot.phoenix_ember", 2, "sale-1");
		var different = MerchantEconomyRules.CreateSaleEventId("pid", "player", "items.loot.phoenix_ember", 2, "sale-2");

		Assert.Equal(first, second);
		Assert.NotEqual(first, different);
		Assert.StartsWith("loot-sale-", first);
	}

	[Fact]
	public void CreateArenaSaleXpRequest_UsesLootSoldEventType()
	{
		var request = MerchantEconomyRules.CreateArenaSaleXpRequest(
			"event-1",
			"player-key",
			"cid",
			"pid",
			"merchant-game",
			"items.loot.starforged_core",
			1,
			15);

		Assert.Equal("merchant_loot_sold", request.eventType);
		Assert.Equal(15, request.xpAmount);
		Assert.Equal("items.loot.starforged_core", request.matchId);
		Assert.Contains("starforged_core", request.metadataJson);
	}

	[Fact]
	public void OwnsItem_ReturnsTrueForPositiveQuantity()
	{
		var ownsItem = MerchantEconomyRules.OwnsItem(
			new[]
			{
				new MerchantOwnedWeaponResponse { itemContentId = "items.weapon.moonsteel_cutlass", quantity = 1 }
			},
			"items.weapon.moonsteel_cutlass");

		Assert.True(ownsItem);
	}
}
