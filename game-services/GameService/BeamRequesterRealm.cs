using System;
using System.Reflection;
using Beamable.Common.Api;

namespace Beamable.GameService
{
	public class BeamRequesterRealm
	{
		public string cid;
		public string pid;
	}

	public static class BeamRequesterRealmResolver
	{
		public static BeamRequesterRealm Resolve(ISignedRequester requester)
		{
			if (requester == null)
			{
				throw new ArgumentNullException(nameof(requester));
			}

			var cid = ReadStringProperty(requester, "Cid");
			var pid = ReadStringProperty(requester, "Pid");
			if (string.IsNullOrWhiteSpace(cid) || string.IsNullOrWhiteSpace(pid))
			{
				throw new InvalidOperationException("The Beamable signed requester does not expose the current CID/PID.");
			}

			return new BeamRequesterRealm
			{
				cid = cid,
				pid = pid
			};
		}

		private static string ReadStringProperty(object instance, string propertyName)
		{
			var property = instance.GetType().GetProperty(propertyName, BindingFlags.Public | BindingFlags.Instance);
			return property?.GetValue(instance) as string;
		}
	}
}
