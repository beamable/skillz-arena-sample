using Beamable.Server;
using System.Threading.Tasks;

namespace Beamable.GameService
{
	public class Program
	{
		/// <summary>
		/// The entry point for the <see cref="GameService"/> service.
		/// </summary>
		public static async Task Main()
		{
			await BeamServer
				.Create()
				.IncludeRoutes<GameService>(routePrefix: "")
				.RunForever();
		}
	}
}
