using System;
using System.Security.Cryptography;
using System.Text;

namespace Beamable.GameService
{
	public static class PlayerKeyHasher
	{
		public static string NormalizeEmail(string email)
		{
			return string.IsNullOrWhiteSpace(email) ? string.Empty : email.Trim().ToLowerInvariant();
		}

		public static string HashEmail(string email)
		{
			var normalized = NormalizeEmail(email);
			if (normalized.Length == 0)
			{
				return string.Empty;
			}

			var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(normalized));
			return Convert.ToHexString(bytes).ToLowerInvariant();
		}
	}
}
