import { CredentialStatus } from "@beamable/sdk";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { ArenaHub } from "../arena/ArenaHub";
import { defaultArenaProgress } from "../arena/defaultArenaProgress";
import { CaveEncounterScreen } from "../game/CaveEncounterScreen";
import type { MerchantBoss, MerchantCave } from "../game/content/gameContent";
import { defaultMerchantState } from "../game/defaultMerchantState";
import { TownScreen } from "../game/TownScreen";
import type {
  GetGameArenaProgressResponse,
  GetMerchantPlayerStateResponse,
  ResolveBossEncounterResponse,
} from "../generated/game/beamable/clients/types";
import {
  clearBeamContextsOnLogout,
  getArenaBeam,
  getGameBeam,
  getRegisteredArenaServiceClient,
  getRegisteredGameServiceClient,
} from "./beam/beamContexts";
import { toUserFacingError } from "./beam/beamErrors";
import { withTimeout } from "./async/withTimeout";
import { styles } from "./SkillzArenaApp.styles";
import type { AppRoute, AuthMode, PlayerSession, ServiceHealthState } from "./types";

const emptyHealth: ServiceHealthState = {
  game: "not checked",
  arena: "not checked",
};

export function SkillzArenaApp() {
  const [route, setRoute] = useState<AppRoute>("arena");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<PlayerSession | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEncounter, setSelectedEncounter] = useState<{
    boss: MerchantBoss | undefined;
    cave: MerchantCave;
  } | null>(null);

  const canSubmit = useMemo(() => {
    return email.trim().length > 3 && password.length >= 6 && !isBusy;
  }, [email, isBusy, password]);

  const loadSession = useCallback(async (sessionEmail: string) => {
    const [gameBeam, arenaBeam] = await Promise.all([
      withTimeout(getGameBeam(), 15000, "Game Beam context did not initialize in time."),
      withTimeout(getArenaBeam(), 15000, "Arena Beam context did not initialize in time."),
    ]);
    const gameClient = getRegisteredGameServiceClient(gameBeam);
    const arenaClient = getRegisteredArenaServiceClient(arenaBeam);

    const [gameHealthResult, arenaHealthResult, profile, arenaProgress, merchantState] = await Promise.allSettled([
      withTimeout(gameClient.healthCheck(), 10000, "GameService health check timed out."),
      withTimeout(arenaClient.healthCheck(), 10000, "Arena health check timed out."),
      withTimeout(gameClient.getPlayerProfile(), 10000, "Player profile request timed out."),
      withTimeout(gameClient.getArenaProgress(), 10000, "Arena progress request timed out."),
      withTimeout(gameClient.getMerchantPlayerState(), 10000, "Merchant player state request timed out."),
    ]);

    if (profile.status === "rejected") {
      throw profile.reason;
    }

    const resolvedProgress =
      arenaProgress.status === "fulfilled" ? arenaProgress.value : defaultArenaProgress;
    const resolvedMerchantState =
      merchantState.status === "fulfilled" ? merchantState.value : defaultMerchantState;

    setSession({
      email: sessionEmail,
      profile: profile.value,
      arenaProgress: resolvedProgress,
      merchantState: resolvedMerchantState,
      health: {
        game: gameHealthResult.status === "fulfilled" ? gameHealthResult.value.status : "offline",
        arena: arenaHealthResult.status === "fulfilled" ? arenaHealthResult.value.status : "offline",
      },
    });
    setRoute("arena");
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const beam = await withTimeout(
          getGameBeam(),
          12000,
          "Saved Beamable session restore timed out.",
        );
        const account = await withTimeout(
          beam.account.current(),
          8000,
          "Saved Beamable account lookup timed out.",
        );
        if (!isMounted || !account.email) {
          return;
        }

        setEmail(account.email);
        await loadSession(account.email);
      } catch {
        clearBeamContextsOnLogout();
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [loadSession]);

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      let signupUsesExistingCredential = false;

      if (authMode === "signup") {
        clearBeamContextsOnLogout();
        const beam = await withTimeout(
          getGameBeam(),
          15000,
          "Game Beam context did not initialize in time.",
        );
        const currentAccount = await withTimeout(
          beam.account.current(),
          8000,
          "Current Beamable account lookup timed out.",
        );
        if (currentAccount.email) {
          const guestToken = await withTimeout(
            beam.auth.loginAsGuest(),
            10000,
            "Fresh guest session request timed out.",
          );
          await withTimeout(beam.refresh(guestToken), 15000, "Fresh guest session refresh timed out.");
        }

        const emailStatus = await withTimeout(
          beam.account.getEmailCredentialStatus({ email: normalizedEmail }),
          8000,
          "Email availability check timed out.",
        );
        if (emailStatus === CredentialStatus.Unknown) {
          throw new Error("Beamable could not verify whether that email is available. Try again in a moment.");
        }

        if (emailStatus === CredentialStatus.Assigned) {
          signupUsesExistingCredential = true;
        } else {
          await withTimeout(
            beam.account.addCredentials({ email: normalizedEmail, password }),
            10000,
            "Email signup request timed out.",
          );
        }
      }

      const beam = await withTimeout(
        getGameBeam(),
        15000,
        "Game Beam context did not initialize in time.",
      );
      let token;
      try {
        token = await withTimeout(
          beam.auth.loginWithEmail({ email: normalizedEmail, password }),
          10000,
          "Email login request timed out.",
        );
      } catch (loginError) {
        if (signupUsesExistingCredential) {
          throw new Error(
            "That email already has Beamable credentials. Enter the existing password; logging in will create the player in this realm if needed.",
          );
        }

        throw loginError;
      }
      await withTimeout(beam.refresh(token), 15000, "Beamable session refresh timed out.");
      await loadSession(normalizedEmail);
    } catch (submitError) {
      setError(toUserFacingError(submitError));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRefreshProgress() {
    if (!session) {
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      const gameBeam = await withTimeout(
        getGameBeam(),
        15000,
        "Game Beam context did not initialize in time.",
      );
      const gameClient = getRegisteredGameServiceClient(gameBeam);
      const progress = await withTimeout(
        gameClient.getArenaProgress(),
        10000,
        "Arena progress request timed out.",
      );
      setSession({
        ...session,
        arenaProgress: progress,
      });
    } catch (refreshError) {
      setError(toUserFacingError(refreshError));
    } finally {
      setIsBusy(false);
    }
  }

  async function refreshMerchantState() {
    const gameBeam = await withTimeout(
      getGameBeam(),
      15000,
      "Game Beam context did not initialize in time.",
    );
    const gameClient = getRegisteredGameServiceClient(gameBeam);
    const merchantState = await withTimeout(
      gameClient.getMerchantPlayerState(),
      10000,
      "Merchant player state request timed out.",
    );
    setSession((currentSession) => {
      if (!currentSession) {
        return currentSession;
      }

      return {
        ...currentSession,
        merchantState,
        arenaProgress: merchantState.arenaProgress,
      };
    });
    return merchantState;
  }

  function handleMerchantStateChange(merchantState: GetMerchantPlayerStateResponse) {
    setSession((currentSession) => {
      if (!currentSession) {
        return currentSession;
      }

      return {
        ...currentSession,
        merchantState,
        arenaProgress: merchantState.arenaProgress,
      };
    });
  }

  function handleArenaProgressChange(arenaProgress: GetGameArenaProgressResponse) {
    setSession((currentSession) => {
      if (!currentSession) {
        return currentSession;
      }

      return {
        ...currentSession,
        arenaProgress,
      };
    });
  }

  function handleLogout() {
    clearBeamContextsOnLogout();
    setSession(null);
    setPassword("");
    setRoute("arena");
    setSelectedEncounter(null);
    setError(null);
  }

  function handleEnterCave(cave: MerchantCave, boss: MerchantBoss | undefined) {
    setSelectedEncounter({ cave, boss });
    setError(null);
    setRoute("encounter");
  }

  async function handleEncounterComplete(result: ResolveBossEncounterResponse) {
    if (!session) {
      return;
    }

    setSession({
      ...session,
      arenaProgress: result.arenaProgress,
      merchantState: {
        ...session.merchantState,
        success: result.success,
        error: result.error,
        gameXp: result.playerState.gameXp,
        gameLevel: result.playerState.gameLevel,
        equippedWeaponId: result.playerState.equippedWeaponId,
        startingWeaponId: result.playerState.startingWeaponId,
        gold: result.playerState.gold,
        arenaProgress: result.arenaProgress,
      },
    });

    try {
      await refreshMerchantState();
    } catch (refreshError) {
      setError(toUserFacingError(refreshError));
    }
  }

  if (isBootstrapping) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.centered}>
          <ActivityIndicator color="#f7c35f" size="large" />
          <Text style={styles.bootText}>Opening the Arena gate...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.root}>
        <ScrollView contentContainerStyle={styles.authLayout}>
          <View style={styles.authArt}>
            <View style={styles.sun} />
            <View style={styles.colosseum}>
              <View style={styles.archRow}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <View key={index} style={styles.arch} />
                ))}
              </View>
              <View style={styles.gate} />
            </View>
          </View>

          <View style={styles.authPanel}>
            <Text style={styles.kicker}>Skillz Arena Sample</Text>
            <Text style={styles.title}>Merchant Arena</Text>
            <Text style={styles.subtitle}>
              Sign in to enter the Arena hub, then step through the gate into the merchant game PID.
            </Text>

            <View style={styles.modeRow}>
              <ModeButton
                label="Login"
                isActive={authMode === "login"}
                onPress={() => setAuthMode("login")}
              />
              <ModeButton
                label="Signup"
                isActive={authMode === "signup"}
                onPress={() => setAuthMode("signup")}
              />
            </View>

            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="merchant@example.com"
              placeholderTextColor="#8b8f9d"
              style={styles.input}
              value={email}
            />
            <TextInput
              autoCapitalize="none"
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#8b8f9d"
              secureTextEntry
              style={styles.input}
              value={password}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <PrimaryButton
              disabled={!canSubmit}
              label={isBusy ? "Working..." : authMode === "login" ? "Enter Arena" : "Create Merchant"}
              onPress={handleSubmit}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      {route === "arena" ? (
        <ArenaHub
          error={error}
          isBusy={isBusy}
          onEnterGame={() => setRoute("town")}
          onLogout={handleLogout}
          onRefresh={handleRefreshProgress}
          session={session}
        />
      ) : route === "town" ? (
        <TownScreen
          error={error}
          isBusy={isBusy}
          merchantState={session.merchantState}
          onArenaProgressChange={handleArenaProgressChange}
          onEnterCave={handleEnterCave}
          onLogout={handleLogout}
          onMerchantStateChange={handleMerchantStateChange}
          onMerchantStateRefresh={refreshMerchantState}
          onRefreshArena={handleRefreshProgress}
          onReturnToArena={() => setRoute("arena")}
          session={session}
        />
      ) : selectedEncounter ? (
        <CaveEncounterScreen
          boss={selectedEncounter.boss}
          cave={selectedEncounter.cave}
          onComplete={handleEncounterComplete}
          onReturnToTown={() => setRoute("town")}
          session={session}
        />
      ) : (
        <TownScreen
          error={error}
          isBusy={isBusy}
          merchantState={session.merchantState}
          onArenaProgressChange={handleArenaProgressChange}
          onEnterCave={handleEnterCave}
          onLogout={handleLogout}
          onMerchantStateChange={handleMerchantStateChange}
          onMerchantStateRefresh={refreshMerchantState}
          onRefreshArena={handleRefreshProgress}
          onReturnToArena={() => setRoute("arena")}
          session={session}
        />
      )}
    </SafeAreaView>
  );
}

type ButtonProps = {
  disabled?: boolean;
  label: string;
  onPress: () => void;
};

function PrimaryButton({ disabled = false, label, onPress }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        disabled ? styles.buttonDisabled : null,
        pressed && !disabled ? styles.buttonPressed : null,
      ]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

type ModeButtonProps = {
  isActive: boolean;
  label: string;
  onPress: () => void;
};

function ModeButton({ isActive, label, onPress }: ModeButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.modeButton, isActive ? styles.modeButtonActive : null]}
    >
      <Text style={[styles.modeButtonText, isActive ? styles.modeButtonTextActive : null]}>
        {label}
      </Text>
    </Pressable>
  );
}
