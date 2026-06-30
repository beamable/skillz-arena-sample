using Beamable.Common;
using MongoDB.Driver;

namespace Beamable.Server
{
	public static class ArenaStorageExtension
	{
		/// <summary>
		/// Get an authenticated MongoDB instance for ArenaStorage
		/// </summary>
		/// <returns></returns>
		public static Promise<IMongoDatabase> ArenaStorageDatabase(
			this IStorageObjectConnectionProvider provider)
			=> provider.GetDatabase<ArenaStorage>();

		/// <summary>
		/// Gets a MongoDB collection from ArenaStorage by the requested name, and uses the given mapping class.
		/// If you don't want to pass in a name, consider using the overload without a collection name.
		/// </summary>
		/// <param name="provider">The storage connection provider.</param>
		/// <param name="name">The name of the collection</param>
		/// <typeparam name="TCollection">The type of the mapping class</typeparam>
		/// <returns>When the promise completes, you'll have an authorized collection</returns>
		public static Promise<IMongoCollection<TCollection>> ArenaStorageCollection<TCollection>(
			this IStorageObjectConnectionProvider provider, string name)
			where TCollection : StorageDocument
			=> provider.GetCollection<ArenaStorage, TCollection>(name);

		/// <summary>
		/// Gets a MongoDB collection from ArenaStorage by the requested name, and uses the given mapping class.
		/// If you want to control the collection name separately from the class name, use the overload with a collection name.
		/// </summary>
		/// <param name="provider">The storage connection provider.</param>
		/// <typeparam name="TCollection">The type of the mapping class</typeparam>
		/// <returns>When the promise completes, you'll have an authorized collection</returns>
		public static Promise<IMongoCollection<TCollection>> ArenaStorageCollection<TCollection>(
			this IStorageObjectConnectionProvider provider)
			where TCollection : StorageDocument
			=> provider.GetCollection<ArenaStorage, TCollection>();
	}
}
