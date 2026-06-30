namespace Beamable.Arena
{
	public static class ArenaValidation
	{
		public static string ValidateRecordXpEvent(RecordArenaXpRequest request)
		{
			if (request == null)
			{
				return "Request is required.";
			}

			if (string.IsNullOrWhiteSpace(request.eventId))
			{
				return "Event ID is required.";
			}

			if (string.IsNullOrWhiteSpace(request.playerKey))
			{
				return "Player key is required.";
			}

			if (string.IsNullOrWhiteSpace(request.sourceCid))
			{
				return "Source CID is required.";
			}

			if (string.IsNullOrWhiteSpace(request.sourcePid))
			{
				return "Source PID is required.";
			}

			if (string.IsNullOrWhiteSpace(request.eventType))
			{
				return "Event type is required.";
			}

			if (request.xpAmount <= 0)
			{
				return "XP amount must be greater than zero.";
			}

			return null;
		}

		public static string ValidateGetProgress(GetArenaProgressRequest request)
		{
			if (request == null)
			{
				return "Request is required.";
			}

			if (string.IsNullOrWhiteSpace(request.playerKey))
			{
				return "Player key is required.";
			}

			return null;
		}
	}
}
