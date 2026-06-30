using Beamable.Server;
using System.Threading.Tasks;

namespace Beamable.Arena
{
	public class Program
	{
		/// <summary>
		/// The entry point for the <see cref="Arena"/> service.
		/// </summary>
		public static async Task Main()
		{
			await BeamServer
				.Create()
				.IncludeRoutes<Arena>(routePrefix: "")
				.RunForever();
		}
	}
}
