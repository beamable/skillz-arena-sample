using System;
using System.Collections.Generic;
using Beamable.Common.Content;
using Beamable.Common.Content.Validation;
using Beamable.Common.Inventory;

namespace Beamable.GameService;

[Serializable]
[ContentType("merchant_caves")]
public class MerchantCaveContent : ContentObject
{
    [CannotBeBlank]
    public string displayName = "";

    [MustBeNonNegative]
    public int tier;

    [MustBeNonNegative]
    public int requiredGameLevel;

    [CannotBeBlank]
    public string bossId = "";

    [CannotBeBlank]
    public string backgroundKey = "";
}

[Serializable]
[ContentType("merchant_bosses")]
public class MerchantBossContent : ContentObject
{
    [CannotBeBlank]
    public string displayName = "";

    [MustBeNonNegative]
    public int tier;

    [MustBeNonNegative]
    public int baseGameXp;

    [MustBeNonNegative]
    public int arenaXpOnDefeat;

    [CannotBeBlank]
    public string dropTableId = "";

    [CannotBeBlank]
    public string spriteKey = "";
}

[Serializable]
[ContentType("merchant_drop_tables")]
public class MerchantDropTableContent : ContentObject
{
    public List<MerchantDropEntry> entries = new();
}

[Serializable]
public class MerchantDropEntry
{
    [CannotBeBlank]
    public string itemContentId = "";

    [MustBeNonNegative]
    public int weight;

    [MustBeNonNegative]
    public int minQuantity;

    [MustBeNonNegative]
    public int maxQuantity;
}

[Serializable]
[ContentType("merchant_progression")]
public class MerchantProgressionContent : ContentObject
{
    [CannotBeBlank]
    public string startingWeaponId = "";

    public List<int> gameXpThresholds = new();
}

[Serializable]
[ContentType("loot")]
public class MerchantLootContent : ItemContent
{
    [CannotBeBlank]
    public string displayName = "";

    [CannotBeBlank]
    public string rarity = "";

    [MustBeNonNegative]
    public int sellPrice;

    [MustBeNonNegative]
    public int arenaXpOnSell;
}

[Serializable]
[ContentType("weapon")]
public class MerchantWeaponContent : ItemContent
{
    [CannotBeBlank]
    public string displayName = "";

    [MustBeNonNegative]
    public int power;

    [MustBeNonNegative]
    public int tier;
}
