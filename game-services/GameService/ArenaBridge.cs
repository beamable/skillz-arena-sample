using System;
using System.Reflection;
using System.Threading.Tasks;
using Beamable.Common.Api;

namespace Beamable.GameService
{
	public class ArenaBridge
	{
		private const string ArenaServiceName = "Arena";
		private readonly ISignedRequester _signedRequester;
		private readonly ArenaBridgeConfig _config;

		public ArenaBridge(ISignedRequester signedRequester, ArenaBridgeConfig config)
		{
			_signedRequester = signedRequester ?? throw new ArgumentNullException(nameof(signedRequester));
			_config = config ?? throw new ArgumentNullException(nameof(config));
			_config.Validate();
		}

		public Task<ArenaProgressResponse> GetProgress(string playerKey)
		{
			return Post<ArenaProgressResponse>("GetProgress", new GetArenaProgressRequest { playerKey = playerKey });
		}

		public Task<ArenaProgressResponse> RecordXpEvent(RecordArenaXpRequest request)
		{
			return Post<ArenaProgressResponse>("RecordXpEvent", request);
		}

		public static string CreateArenaRoute(string arenaCid, string arenaPid, string methodName)
		{
			return $"/basic/{arenaCid}.{arenaPid}.micro_{ArenaServiceName}/{methodName}";
		}

		private async Task<T> Post<T>(string methodName, object body)
		{
			ConfigureRequesterForArena();
			return await _signedRequester.Request<T>(
				Method.POST,
				CreateArenaRoute(_config.arenaCid, _config.arenaPid, methodName),
				body,
				includeAuthHeader: false);
		}

		private void ConfigureRequesterForArena()
		{
			var method = _signedRequester.GetType().GetMethod(
				"SetRealmInfo",
				BindingFlags.Public | BindingFlags.Instance,
				null,
				new[] { typeof(string), typeof(string), typeof(string) },
				null);

			if (method == null)
			{
				throw new InvalidOperationException("The Beamable signed requester does not expose SetRealmInfo; cross-PID Arena calls cannot be signed.");
			}

			method.Invoke(_signedRequester, new object[] { _config.arenaCid, _config.arenaPid, _config.arenaSecret });
		}
	}
}
