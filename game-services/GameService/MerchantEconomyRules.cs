using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using Beamable.Common.Api.Inventory;

namespace Beamable.GameService
{
	public static class MerchantEconomyRules
	{
		public const string GoldCurrencyId = "currency.gold";
		public const string LootSoldEventType = "merchant_loot_sold";

		public static string ValidateSellRequest(SellLootRequest request)
		{
			if (request == null)
			{
				return "Sell loot request is required.";
			}

			if (string.IsNullOrWhiteSpace(request.itemContentId))
			{
				return "Loot item id is required.";
			}

			if (!IsLootContentId(request.itemContentId))
			{
				return "Only merchant loot can be sold.";
			}

			if (request.quantity <= 0)
			{
				return "Sell quantity must be positive.";
			}

			return null;
		}

		public static string ValidateBuyRequest(BuyWeaponRequest request)
		{
			if (request == null)
			{
				return "Buy weapon request is required.";
			}

			return string.IsNullOrWhiteSpace(request.listingId) ? "Shop listing id is required." : null;
		}

		public static string ValidateEquipRequest(EquipWeaponRequest request)
		{
			if (request == null)
			{
				return "Equip weapon request is required.";
			}

			if (string.IsNullOrWhiteSpace(request.weaponContentId))
			{
				return "Weapon item id is required.";
			}

			return IsWeaponContentId(request.weaponContentId)
				? null
				: "Only merchant weapons can be equipped.";
		}

		public static bool IsLootContentId(string contentId)
		{
			var normalized = NormalizeContentId(contentId);
			return normalized.StartsWith("items.loot.", StringComparison.Ordinal);
		}

		public static bool IsWeaponContentId(string contentId)
		{
			var normalized = NormalizeContentId(contentId);
			return normalized.StartsWith("items.weapon.", StringComparison.Ordinal);
		}

		public static string NormalizeContentId(string contentId)
		{
			var trimmed = contentId?.Trim() ?? string.Empty;
			if (trimmed.StartsWith("items.", StringComparison.Ordinal))
			{
				return trimmed;
			}

			if (trimmed.StartsWith("loot.", StringComparison.Ordinal) || trimmed.StartsWith("weapon.", StringComparison.Ordinal))
			{
				return $"items.{trimmed}";
			}

			return trimmed;
		}

		public static string ToInventoryContentId(string contentId)
		{
			var normalized = NormalizeContentId(contentId);
			if (normalized.StartsWith("items.", StringComparison.Ordinal))
			{
				return normalized.Substring("items.".Length);
			}

			return normalized.StartsWith("currency.", StringComparison.Ordinal)
				? normalized.Substring("currency.".Length)
				: normalized;
		}

		public static int CalculateGoldForSale(MerchantLootContent loot, int quantity)
		{
			return Math.Max(0, loot?.sellPrice ?? 0) * Math.Max(0, quantity);
		}

		public static int CalculateArenaXpForSale(MerchantLootContent loot, int quantity)
		{
			return Math.Max(0, loot?.arenaXpOnSell ?? 0) * Math.Max(0, quantity);
		}

		public static bool OwnsItem(IEnumerable<MerchantOwnedWeaponResponse> items, string itemContentId)
		{
			var normalized = NormalizeContentId(itemContentId);
			return items != null && items.Any(item => NormalizeContentId(item.itemContentId) == normalized && item.quantity > 0);
		}

		public static long GetCurrencyBalance(InventoryView view, string currencyContentId)
		{
			if (view?.currencies == null)
			{
				return 0;
			}

			var inventoryCurrencyId = ToInventoryContentId(currencyContentId);
			if (view.currencies.TryGetValue(currencyContentId, out var canonicalBalance))
			{
				return canonicalBalance;
			}

			return view.currencies.TryGetValue(inventoryCurrencyId, out var inventoryBalance) ? inventoryBalance : 0;
		}

		public static MerchantLootStackResponse[] SummarizeLoot(InventoryView view)
		{
			return SummarizeItems(
					view,
					IsLootContentId,
					(contentId, inventoryContentId, quantity, instanceIds) => new MerchantLootStackResponse
					{
						itemContentId = contentId,
						inventoryContentId = inventoryContentId,
						quantity = quantity,
						instanceIds = instanceIds
					})
				.OrderBy(item => item.itemContentId)
				.ToArray();
		}

		public static MerchantOwnedWeaponResponse[] SummarizeWeapons(InventoryView view)
		{
			return SummarizeItems(
					view,
					IsWeaponContentId,
					(contentId, inventoryContentId, quantity, instanceIds) => new MerchantOwnedWeaponResponse
					{
						itemContentId = contentId,
						inventoryContentId = inventoryContentId,
						quantity = quantity,
						instanceIds = instanceIds
					})
				.OrderBy(item => item.itemContentId)
				.ToArray();
		}

		private static IEnumerable<TStack> SummarizeItems<TStack>(
			InventoryView view,
			Func<string, bool> contentIdPredicate,
			Func<string, string, int, long[], TStack> createStack)
		{
			if (view?.items == null)
			{
				return Enumerable.Empty<TStack>();
			}

			return view.items
				.Where(group => contentIdPredicate(group.Key))
				.Select(group =>
				{
					var inventoryContentId = group.Key;
					var canonicalContentId = NormalizeContentId(group.Key);
					var instanceIds = (group.Value ?? new List<ItemView>())
						.Select(item => item.id)
						.OrderBy(id => id)
						.ToArray();

					return createStack(canonicalContentId, inventoryContentId, instanceIds.Length, instanceIds);
				});
		}

		public static string CreateSaleEventId(
			string sourcePid,
			string playerKey,
			string itemContentId,
			int quantity,
			string saleId)
		{
			var value = string.Join("|",
				NormalizeSegment(sourcePid),
				NormalizeSegment(playerKey),
				NormalizeSegment(itemContentId),
				Math.Max(0, quantity).ToString(),
				NormalizeSegment(saleId));
			var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
			return $"loot-sale-{Convert.ToHexString(bytes).ToLowerInvariant()}";
		}

		public static RecordArenaXpRequest CreateArenaSaleXpRequest(
			string eventId,
			string playerKey,
			string sourceCid,
			string sourcePid,
			string sourceGame,
			string itemContentId,
			int quantity,
			int arenaXpAmount)
		{
			return new RecordArenaXpRequest
			{
				eventId = eventId,
				playerKey = playerKey,
				sourceCid = sourceCid,
				sourcePid = sourcePid,
				sourceGame = sourceGame,
				eventType = LootSoldEventType,
				xpAmount = arenaXpAmount,
				occurredAt = DateTime.UtcNow,
				matchId = itemContentId.Trim(),
				sessionId = eventId,
				metadataJson = $"{{\"itemContentId\":\"{EscapeJson(itemContentId)}\",\"quantity\":{Math.Max(0, quantity)}}}"
			};
		}

		private static string NormalizeSegment(string value)
		{
			return string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();
		}

		private static string EscapeJson(string value)
		{
			return (value ?? string.Empty).Replace("\\", "\\\\").Replace("\"", "\\\"");
		}
	}
}
