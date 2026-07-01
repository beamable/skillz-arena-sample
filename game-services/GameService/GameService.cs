using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Beamable.Common.Api;
using Beamable.Common.Api.Inventory;
using Beamable.Common.Api.Stats;
using Beamable.Common.Content;
using Beamable.Common.Inventory;
using Beamable.Common.Shop;
using Beamable.Server;
using Beamable.Server.Api.RealmConfig;

namespace Beamable.GameService
{
	public partial class GameService : Microservice
	{
		private const string ServiceVersion = "0.1.0";

		[ConfigureServices]
		public static void Configure(IServiceBuilder builder)
		{
			var cache = new ArenaBridgeConfigCache();
			builder.AddSingleton(_ => cache);
		}

		[InitializeServices]
		public static async Task Initialize(IServiceInitializer initializer)
		{
			var cache = initializer.GetServiceAsCache<ArenaBridgeConfigCache>();
			var realmConfig = initializer.GetService<IMicroserviceRealmConfigService>();
			var signedRequester = initializer.GetService<ISignedRequester>();
			await cache.Initialize(realmConfig, signedRequester);
		}

		[Callable]
		public HealthCheckResponse HealthCheck()
		{
			return new HealthCheckResponse
			{
				status = "healthy",
				version = ServiceVersion,
				timestamp = DateTime.UtcNow
			};
		}

		[ClientCallable]
		public async Task<PlayerProfileResponse> GetPlayerProfile()
		{
			var identity = await GetCurrentEmailIdentity();
			if (!identity.success)
			{
				return PlayerProfileResponse.Invalid(identity.error);
			}

			return new PlayerProfileResponse
			{
				success = true,
				error = string.Empty,
				playerId = identity.playerId,
				arenaPlayerKey = identity.playerKey
			};
		}

		[ClientCallable]
		public async Task<GetGameArenaProgressResponse> GetArenaProgress()
		{
			var identity = await GetCurrentEmailIdentity();
			if (!identity.success)
			{
				return GetGameArenaProgressResponse.Invalid(identity.error);
			}

			var progress = await CreateArenaBridge().GetProgress(identity.playerKey);
			return GetGameArenaProgressResponse.FromArena(progress);
		}

		[ClientCallable]
		public async Task<GetMerchantPlayerStateResponse> GetMerchantPlayerState()
		{
			var identity = await GetCurrentEmailIdentity();
			if (!identity.success)
			{
				return GetMerchantPlayerStateResponse.Invalid(identity.error);
			}

			var progression = await LoadContent<MerchantProgressionContent>("merchant_progression.default");
			var state = await GetMerchantPlayerState(progression);
			var arenaProgress = await CreateArenaBridge().GetProgress(identity.playerKey);

			return new GetMerchantPlayerStateResponse
			{
				success = arenaProgress.success,
				error = arenaProgress.error,
				gameXp = state.gameXp,
				gameLevel = state.gameLevel,
				equippedWeaponId = state.equippedWeaponId,
				startingWeaponId = state.startingWeaponId,
				gold = state.gold,
				loot = state.loot,
				ownedWeapons = state.ownedWeapons,
				arenaProgress = GetMerchantPlayerStateArenaProgressResponse.FromArena(arenaProgress)
			};
		}

		[ClientCallable]
		public async Task<ResolveBossEncounterResponse> ResolveBossEncounter(ResolveBossEncounterRequest request)
		{
			var validationError = MerchantEncounterRules.ValidateResolveRequest(request);
			if (validationError != null)
			{
				return ResolveBossEncounterResponse.Invalid(validationError);
			}

			var identity = await GetCurrentEmailIdentity();
			if (!identity.success)
			{
				return ResolveBossEncounterResponse.Invalid(identity.error);
			}

			var caveId = request.caveId.Trim();
			var sessionId = request.sessionId.Trim();
			var progression = await LoadContent<MerchantProgressionContent>("merchant_progression.default");
			var state = await GetMerchantPlayerState(progression);
			var cave = await LoadContent<MerchantCaveContent>(caveId);
			var unlockError = MerchantEncounterRules.ValidateCaveUnlock(cave, state.gameLevel);
			if (unlockError != null)
			{
				return ResolveBossEncounterResponse.Invalid(unlockError);
			}

			var boss = await LoadContent<MerchantBossContent>(cave.bossId);
			var dropTable = await LoadContent<MerchantDropTableContent>(boss.dropTableId);
			var arenaConfig = GetArenaBridgeConfig();
			var eventId = MerchantEncounterRules.CreateEventId(arenaConfig.sourcePid, identity.playerKey, caveId, sessionId);
			var arenaRequest = MerchantEncounterRules.CreateArenaXpRequest(
				eventId,
				identity.playerKey,
				arenaConfig.sourceCid,
				arenaConfig.sourcePid,
				arenaConfig.sourceGame,
				caveId,
				sessionId,
				cave.bossId,
				boss.arenaXpOnDefeat);
			var arenaProgress = await CreateArenaBridge().RecordXpEvent(arenaRequest);

			if (!arenaProgress.success)
			{
				return ResolveBossEncounterResponse.Invalid(arenaProgress.error);
			}

			var gameXpAwarded = arenaProgress.duplicateEvent ? 0 : boss.baseGameXp;
			if (gameXpAwarded > 0)
			{
				state = await ApplyGameXp(progression, state, gameXpAwarded);
			}

			var loot = MerchantEncounterRules.RollLoot(dropTable.entries, eventId);
			if (!arenaProgress.duplicateEvent)
			{
				await GrantLoot(loot, eventId);
				state = await GetMerchantPlayerState(progression);
			}

			return new ResolveBossEncounterResponse
			{
				success = true,
				error = string.Empty,
				eventId = eventId,
				caveId = caveId,
				caveName = cave.displayName,
				bossId = cave.bossId,
				bossName = boss.displayName,
				defeated = true,
				gameXpAwarded = gameXpAwarded,
				arenaXpAwarded = arenaProgress.xpGranted,
				playerState = state.ToResponse(),
				loot = loot,
				arenaProgress = ResolveBossEncounterArenaProgressResponse.FromArena(arenaProgress)
			};
		}

		[ClientCallable]
		public async Task<SellLootResponse> SellLoot(SellLootRequest request)
		{
			var validationError = MerchantEconomyRules.ValidateSellRequest(request);
			if (validationError != null)
			{
				return SellLootResponse.Invalid(validationError);
			}

			var identity = await GetCurrentEmailIdentity();
			if (!identity.success)
			{
				return SellLootResponse.Invalid(identity.error);
			}

			var itemContentId = MerchantEconomyRules.NormalizeContentId(request.itemContentId);
			var progression = await LoadContent<MerchantProgressionContent>("merchant_progression.default");
			var lootContent = await LoadContent<MerchantLootContent>(itemContentId);
			var state = await GetMerchantPlayerState(progression);
			var ownedLoot = state.loot.FirstOrDefault(item => item.itemContentId == itemContentId);
			if (ownedLoot == null || ownedLoot.quantity < request.quantity)
			{
				return SellLootResponse.Invalid($"Not enough {lootContent.displayName} to sell.");
			}

			var goldGranted = MerchantEconomyRules.CalculateGoldForSale(lootContent, request.quantity);
			var arenaXpAmount = MerchantEconomyRules.CalculateArenaXpForSale(lootContent, request.quantity);
			var arenaConfig = GetArenaBridgeConfig();
			var saleId = Guid.NewGuid().ToString("N");
			var eventId = string.Empty;
			ArenaProgressResponse arenaProgress = null;
			if (arenaXpAmount > 0)
			{
				eventId = MerchantEconomyRules.CreateSaleEventId(
					arenaConfig.sourcePid,
					identity.playerKey,
					itemContentId,
					request.quantity,
					saleId);
				var arenaRequest = MerchantEconomyRules.CreateArenaSaleXpRequest(
					eventId,
					identity.playerKey,
					arenaConfig.sourceCid,
					arenaConfig.sourcePid,
					arenaConfig.sourceGame,
					itemContentId,
					request.quantity,
					arenaXpAmount);
				arenaProgress = await CreateArenaBridge().RecordXpEvent(arenaRequest);
				if (!arenaProgress.success)
				{
					return SellLootResponse.Invalid(arenaProgress.error);
				}
			}

			var builder = new InventoryUpdateBuilder();
			builder.CurrencyChange(MerchantEconomyRules.GoldCurrencyId, goldGranted);
			foreach (var itemId in ownedLoot.instanceIds.Take(request.quantity))
			{
				builder.DeleteItem(ownedLoot.inventoryContentId, itemId);
			}

			await Services.Inventory.Update(builder, $"sell-{saleId}");
			state = await GetMerchantPlayerState(progression);
			arenaProgress ??= await CreateArenaBridge().GetProgress(identity.playerKey);

			return new SellLootResponse
			{
				success = true,
				error = string.Empty,
				eventId = eventId,
				itemContentId = itemContentId,
				quantitySold = request.quantity,
				goldGranted = goldGranted,
				arenaXpAwarded = arenaProgress.xpGranted,
				arenaProgress = SellLootArenaProgressResponse.FromArena(arenaProgress)
			};
		}

		[ClientCallable]
		public async Task<BuyWeaponResponse> BuyWeapon(BuyWeaponRequest request)
		{
			var validationError = MerchantEconomyRules.ValidateBuyRequest(request);
			if (validationError != null)
			{
				return BuyWeaponResponse.Invalid(validationError);
			}

			var identity = await GetCurrentEmailIdentity();
			if (!identity.success)
			{
				return BuyWeaponResponse.Invalid(identity.error);
			}

			var listingId = request.listingId.Trim();
			var progression = await LoadContent<MerchantProgressionContent>("merchant_progression.default");
			var listing = await LoadContent<ListingContent>(listingId);
			if (listing.price == null || listing.price.type != "currency" || listing.price.symbol != MerchantEconomyRules.GoldCurrencyId)
			{
				return BuyWeaponResponse.Invalid("That listing is not priced in Gold.");
			}

			var weaponContentId = MerchantEconomyRules.NormalizeContentId(listing.offer?.obtainItems?.FirstOrDefault()?.contentId?.GetId());
			if (string.IsNullOrWhiteSpace(weaponContentId) || !MerchantEconomyRules.IsWeaponContentId(weaponContentId))
			{
				return BuyWeaponResponse.Invalid("That listing does not grant a merchant weapon.");
			}

			var state = await GetMerchantPlayerState(progression);
			if (MerchantEconomyRules.OwnsItem(state.ownedWeapons, weaponContentId) || weaponContentId == state.startingWeaponId)
			{
				return BuyWeaponResponse.Invalid("You already own that weapon.");
			}

			if (state.gold < listing.price.amount)
			{
				return BuyWeaponResponse.Invalid("Not enough Gold.");
			}

			var transactionId = $"buy-{Guid.NewGuid():N}";
			var builder = new InventoryUpdateBuilder();
			builder.CurrencyChange(MerchantEconomyRules.GoldCurrencyId, -listing.price.amount);
			builder.AddItem(weaponContentId, new Dictionary<string, string>
			{
				{ "source", "merchant_weapon_shop" },
				{ "listingId", listingId }
			});
			await Services.Inventory.Update(builder, transactionId);
			state = await GetMerchantPlayerState(progression);

			return new BuyWeaponResponse
			{
				success = true,
				error = string.Empty,
				listingId = listingId,
				weaponContentId = weaponContentId,
				goldSpent = listing.price.amount
			};
		}

		[ClientCallable]
		public async Task<EquipWeaponResponse> EquipWeapon(EquipWeaponRequest request)
		{
			var validationError = MerchantEconomyRules.ValidateEquipRequest(request);
			if (validationError != null)
			{
				return EquipWeaponResponse.Invalid(validationError);
			}

			var identity = await GetCurrentEmailIdentity();
			if (!identity.success)
			{
				return EquipWeaponResponse.Invalid(identity.error);
			}

			var weaponContentId = MerchantEconomyRules.NormalizeContentId(request.weaponContentId);
			var progression = await LoadContent<MerchantProgressionContent>("merchant_progression.default");
			var state = await GetMerchantPlayerState(progression);
			var ownsWeapon = weaponContentId == state.startingWeaponId || MerchantEconomyRules.OwnsItem(state.ownedWeapons, weaponContentId);
			if (!ownsWeapon)
			{
				return EquipWeaponResponse.Invalid("You do not own that weapon.");
			}

			await Services.Stats.SetStats(
				StatsDomainType.Game,
				StatsAccessType.Private,
				Context.UserId,
				new Dictionary<string, string>
				{
					{ MerchantProgressionRules.EquippedWeaponStat, weaponContentId }
				});
			state = await GetMerchantPlayerState(progression);

			return new EquipWeaponResponse
			{
				success = true,
				error = string.Empty,
				equippedWeaponId = weaponContentId
			};
		}

		[ClientCallable]
		public async Task<CompleteQuickGameResponse> CompleteQuickGame(CompleteQuickGameRequest request)
		{
			var validationError = QuickGameRules.ValidateCompletion(request);
			if (validationError != null)
			{
				return CompleteQuickGameResponse.Invalid(validationError);
			}

			var identity = await GetCurrentEmailIdentity();
			if (!identity.success)
			{
				return CompleteQuickGameResponse.Invalid(identity.error);
			}

			var arenaConfig = GetArenaBridgeConfig();
			var eventId = QuickGameRules.CreateEventId(arenaConfig.sourcePid, identity.playerKey, request.quickGameId, request.sessionId);
			var arenaRequest = QuickGameRules.CreateArenaXpRequest(
				eventId,
				identity.playerKey,
				arenaConfig.sourceCid,
				arenaConfig.sourcePid,
				arenaConfig.sourceGame,
				request);

			var progress = await CreateArenaBridge().RecordXpEvent(arenaRequest);

			return new CompleteQuickGameResponse
			{
				success = progress.success,
				error = progress.error,
				eventId = eventId,
				xpAwarded = progress.success ? QuickGameRules.XpAward : 0,
				progress = CompleteQuickGameArenaProgressResponse.FromArena(progress)
			};
		}

		private async Task<PlayerEmailIdentity> GetCurrentEmailIdentity()
		{
			var user = await Services.Auth.GetUser(Context.UserId);
			if (user == null || string.IsNullOrWhiteSpace(user.email))
			{
				return PlayerEmailIdentity.Invalid("Email credentials are required. Complete email signup or link an email before using Arena progression.");
			}

			return new PlayerEmailIdentity
			{
				success = true,
				error = string.Empty,
				playerId = user.id,
				playerKey = PlayerKeyHasher.HashEmail(user.email)
			};
		}

		private ArenaBridgeConfig GetArenaBridgeConfig()
		{
			return Provider.GetService<ArenaBridgeConfigCache>().Value;
		}

		private ArenaBridge CreateArenaBridge()
		{
			return new ArenaBridge(SignedRequester, GetArenaBridgeConfig());
		}

		private async Task<TContent> LoadContent<TContent>(string contentId) where TContent : ContentObject, new()
		{
			var content = await Services.Content.GetContent(contentId, typeof(TContent), "global");
			return (TContent)content;
		}

		private async Task<MerchantPlayerState> GetMerchantPlayerState(MerchantProgressionContent progression)
		{
			var stats = await Services.Stats.GetFilteredStats(
				StatsDomainType.Game,
				StatsAccessType.Private,
				Context.UserId,
				new[]
				{
					MerchantProgressionRules.GameXpStat,
					MerchantProgressionRules.GameLevelStat,
					MerchantProgressionRules.EquippedWeaponStat
				});
			var gameXp = MerchantProgressionRules.ParseStatInt(stats, MerchantProgressionRules.GameXpStat);
			var equippedWeaponId = MerchantProgressionRules.ParseStatString(
				stats,
				MerchantProgressionRules.EquippedWeaponStat,
				progression.startingWeaponId);
			var state = MerchantProgressionRules.CalculateState(
				progression.gameXpThresholds,
				gameXp,
				progression.startingWeaponId,
				equippedWeaponId);
			await PopulateInventoryState(state);
			return state;
		}

		private async Task<MerchantPlayerState> ApplyGameXp(
			MerchantProgressionContent progression,
			MerchantPlayerState currentState,
			int gameXpAwarded)
		{
			var nextState = MerchantProgressionRules.CalculateState(
				progression.gameXpThresholds,
				currentState.gameXp + Math.Max(0, gameXpAwarded),
				progression.startingWeaponId,
				currentState.equippedWeaponId);

			await Services.Stats.SetStats(
				StatsDomainType.Game,
				StatsAccessType.Private,
				Context.UserId,
				new Dictionary<string, string>
				{
					{ MerchantProgressionRules.GameXpStat, nextState.gameXp.ToString() },
					{ MerchantProgressionRules.GameLevelStat, nextState.gameLevel.ToString() }
				});

			return nextState;
		}

		private async Task GrantLoot(MerchantLootRollResponse[] loot, string transactionId)
		{
			if (loot == null || loot.Length == 0)
			{
				return;
			}

			var builder = new InventoryUpdateBuilder();
			foreach (var lootRoll in loot)
			{
				for (var i = 0; i < Math.Max(0, lootRoll.quantity); i++)
				{
					builder.AddItem(lootRoll.itemContentId, new Dictionary<string, string>
					{
						{ "source", "boss_encounter" },
						{ "eventId", transactionId }
					});
				}
			}

			if (!builder.IsEmpty)
			{
				await Services.Inventory.Update(builder, transactionId);
			}
		}

		private async Task PopulateInventoryState(MerchantPlayerState state)
		{
			var inventoryApi = Services.Inventory as AbsInventoryApi;
			if (inventoryApi == null)
			{
				throw new MicroserviceException(500, "inventoryApiUnavailable", "Inventory API does not expose raw inventory view access.");
			}

			var inventoryView = await inventoryApi.GetCurrent("currency,items.loot,items.weapon");
			state.gold = MerchantEconomyRules.GetCurrencyBalance(inventoryView, MerchantEconomyRules.GoldCurrencyId);
			state.loot = MerchantEconomyRules.SummarizeLoot(inventoryView);
			state.ownedWeapons = MerchantEconomyRules.SummarizeWeapons(inventoryView);
		}
	}
}
