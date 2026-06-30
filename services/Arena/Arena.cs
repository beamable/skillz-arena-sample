using System;
using System.Threading.Tasks;
using Beamable.Server;
using MongoDB.Driver;

namespace Beamable.Arena
{
	public partial class Arena : Microservice
	{
		private const string XpEventsCollection = "arena_xp_events";
		private const string PlayerProgressCollection = "arena_player_progress";
		private const string ServiceVersion = "0.1.0";

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

		[ServerCallable]
		public async Task<ArenaProgressResponse> RecordXpEvent(RecordArenaXpRequest request)
		{
			var validationError = ArenaValidation.ValidateRecordXpEvent(request);
			if (validationError != null)
			{
				return ArenaProgressResponse.Invalid(validationError);
			}

			var events = await Storage.ArenaStorageCollection<ArenaXpEventDocument>(XpEventsCollection);
			var progressCollection = await Storage.ArenaStorageCollection<ArenaPlayerProgressDocument>(PlayerProgressCollection);

			var existingEvent = await events
				.Find(Builders<ArenaXpEventDocument>.Filter.Eq(x => x.eventId, request.eventId))
				.FirstOrDefaultAsync();

			if (existingEvent != null)
			{
				var existingProgress = await GetOrCreateProgress(progressCollection, existingEvent.playerKey);
				return ArenaProgressResponse.FromProgress(existingProgress, true);
			}

			var now = DateTime.UtcNow;
			var eventDocument = new ArenaXpEventDocument
			{
				eventId = request.eventId.Trim(),
				playerKey = request.playerKey.Trim(),
				sourceCid = request.sourceCid.Trim(),
				sourcePid = request.sourcePid.Trim(),
				sourceGame = NormalizeOptional(request.sourceGame),
				eventType = request.eventType.Trim(),
				xpAmount = request.xpAmount,
				occurredAt = request.occurredAt == default ? now : request.occurredAt,
				matchId = NormalizeOptional(request.matchId),
				sessionId = NormalizeOptional(request.sessionId),
				metadataJson = NormalizeOptional(request.metadataJson),
				recordedAt = now
			};

			await events.InsertOneAsync(eventDocument);

			var currentProgress = await GetOrCreateProgress(progressCollection, eventDocument.playerKey);
			var previousLevel = currentProgress.level;
			var newTotalXp = currentProgress.totalXp + eventDocument.xpAmount;
			var newLevelState = ArenaProgressionRules.Calculate(newTotalXp);

			var update = Builders<ArenaPlayerProgressDocument>.Update
				.Set(x => x.totalXp, newTotalXp)
				.Set(x => x.level, newLevelState.level)
				.Set(x => x.currentLevelXp, newLevelState.currentLevelXp)
				.Set(x => x.nextLevelXp, newLevelState.nextLevelXp)
				.Set(x => x.xpToNextLevel, newLevelState.xpToNextLevel)
				.Set(x => x.lastEventId, eventDocument.eventId)
				.Set(x => x.updatedAt, now);

			var filter = Builders<ArenaPlayerProgressDocument>.Filter.Eq(x => x.playerKey, eventDocument.playerKey);
			await progressCollection.UpdateOneAsync(filter, update, new UpdateOptions { IsUpsert = false });

			currentProgress.totalXp = newTotalXp;
			currentProgress.level = newLevelState.level;
			currentProgress.currentLevelXp = newLevelState.currentLevelXp;
			currentProgress.nextLevelXp = newLevelState.nextLevelXp;
			currentProgress.xpToNextLevel = newLevelState.xpToNextLevel;
			currentProgress.lastEventId = eventDocument.eventId;
			currentProgress.updatedAt = now;

			var response = ArenaProgressResponse.FromProgress(currentProgress, false);
			response.didLevelUp = newLevelState.level > previousLevel;
			response.xpGranted = eventDocument.xpAmount;
			return response;
		}

		[ServerCallable]
		public async Task<ArenaProgressResponse> GetProgress(GetArenaProgressRequest request)
		{
			var validationError = ArenaValidation.ValidateGetProgress(request);
			if (validationError != null)
			{
				return ArenaProgressResponse.Invalid(validationError);
			}

			var progressCollection = await Storage.ArenaStorageCollection<ArenaPlayerProgressDocument>(PlayerProgressCollection);
			var progress = await GetOrCreateProgress(progressCollection, request.playerKey.Trim());
			return ArenaProgressResponse.FromProgress(progress, false);
		}

		private static string NormalizeOptional(string value)
		{
			return string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();
		}

		private static async Task<ArenaPlayerProgressDocument> GetOrCreateProgress(
			IMongoCollection<ArenaPlayerProgressDocument> progressCollection, string playerKey)
		{
			var filter = Builders<ArenaPlayerProgressDocument>.Filter.Eq(x => x.playerKey, playerKey);
			var existing = await progressCollection.Find(filter).FirstOrDefaultAsync();
			if (existing != null)
			{
				return existing;
			}

			var levelState = ArenaProgressionRules.Calculate(0);
			var now = DateTime.UtcNow;
			var created = new ArenaPlayerProgressDocument
			{
				playerKey = playerKey,
				totalXp = 0,
				level = levelState.level,
				currentLevelXp = levelState.currentLevelXp,
				nextLevelXp = levelState.nextLevelXp,
				xpToNextLevel = levelState.xpToNextLevel,
				lastEventId = string.Empty,
				createdAt = now,
				updatedAt = now
			};

			await progressCollection.InsertOneAsync(created);
			return created;
		}
	}
}
