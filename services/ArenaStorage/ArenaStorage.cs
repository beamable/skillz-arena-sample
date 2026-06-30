using Beamable.Server;

namespace Beamable.Server
{
	/// <summary>
	/// This class represents the existence of the ArenaStorage database.
	/// Use it for type safe access to the database.
	/// <code>
	/// var db = await Storage.GetDatabase&lt;ArenaStorage&gt;();
	/// </code>
	/// </summary>
	[StorageObject("ArenaStorage")]
	public class ArenaStorage : MongoStorageObject
	{
		
	}
}
