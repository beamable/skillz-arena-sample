using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;

namespace Beamable.GameService
{
	public static class MerchantEncounterRules
	{
		public const string EventType = "merchant_boss_defeated";

		public static string ValidateResolveRequest(ResolveBossEncounterRequest request)
		{
			if (request == null)
			{
				return "Boss encounter request is required.";
			}

			if (string.IsNullOrWhiteSpace(request.caveId))
			{
				return "Cave id is required.";
			}

			if (string.IsNullOrWhiteSpace(request.sessionId))
			{
				return "Session id is required.";
			}

			return null;
		}

		public static string ValidateCaveUnlock(MerchantCaveContent cave, int gameLevel)
		{
			if (cave == null)
			{
				return "Cave content is required.";
			}

			if (gameLevel < cave.requiredGameLevel)
			{
				return $"{cave.displayName} requires game level {cave.requiredGameLevel}.";
			}

			return null;
		}

		public static string CreateEventId(string sourcePid, string playerKey, string caveId, string sessionId)
		{
			var value = string.Join("|",
				NormalizeSegment(sourcePid),
				NormalizeSegment(playerKey),
				NormalizeSegment(caveId),
				NormalizeSegment(sessionId));
			var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
			return $"boss-defeat-{Convert.ToHexString(bytes).ToLowerInvariant()}";
		}

		public static RecordArenaXpRequest CreateArenaXpRequest(
			string eventId,
			string playerKey,
			string sourceCid,
			string sourcePid,
			string sourceGame,
			string caveId,
			string sessionId,
			string bossId,
			int arenaXpAmount)
		{
			return new RecordArenaXpRequest
			{
				eventId = eventId,
				playerKey = playerKey,
				sourceCid = sourceCid,
				sourcePid = sourcePid,
				sourceGame = sourceGame,
				eventType = EventType,
				xpAmount = arenaXpAmount,
				occurredAt = DateTime.UtcNow,
				matchId = caveId.Trim(),
				sessionId = sessionId.Trim(),
				metadataJson = $"{{\"caveId\":\"{EscapeJson(caveId)}\",\"bossId\":\"{EscapeJson(bossId)}\"}}"
			};
		}

		public static MerchantLootRollResponse[] RollLoot(
			IReadOnlyList<MerchantDropEntry> entries,
			string eventId)
		{
			var validEntries = entries?
				.Where(entry => entry != null && entry.weight > 0 && !string.IsNullOrWhiteSpace(entry.itemContentId))
				.ToArray() ?? Array.Empty<MerchantDropEntry>();
			if (validEntries.Length == 0)
			{
				return Array.Empty<MerchantLootRollResponse>();
			}

			var totalWeight = validEntries.Sum(entry => entry.weight);
			var roll = DeterministicNumber($"{eventId}|loot", totalWeight);
			var cursor = 0;
			var selected = validEntries[0];
			foreach (var entry in validEntries)
			{
				cursor += entry.weight;
				if (roll < cursor)
				{
					selected = entry;
					break;
				}
			}

			var minQuantity = Math.Max(1, selected.minQuantity);
			var maxQuantity = Math.Max(minQuantity, selected.maxQuantity);
			var quantity = minQuantity + DeterministicNumber($"{eventId}|quantity", maxQuantity - minQuantity + 1);

			return new[]
			{
				new MerchantLootRollResponse
				{
					itemContentId = selected.itemContentId.Trim(),
					quantity = quantity
				}
			};
		}

		private static int DeterministicNumber(string seed, int exclusiveMax)
		{
			if (exclusiveMax <= 1)
			{
				return 0;
			}

			var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(seed));
			var value = BitConverter.ToUInt32(bytes, 0);
			return (int)(value % exclusiveMax);
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
