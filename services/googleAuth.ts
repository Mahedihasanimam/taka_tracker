import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { getSupabaseClient } from '@/services/supabaseClient';

WebBrowser.maybeCompleteAuthSession();

export interface GoogleIdentityProfile {
  providerUserId: string;
  email?: string;
  name?: string;
}

interface GoogleAuthResult {
  success: boolean;
  message: string;
  profile?: GoogleIdentityProfile;
}

const extractCodeFromUrl = (url: string): string | null => {
  const parsed = Linking.parse(url);
  const codeFromQuery = parsed.queryParams?.code;
  if (typeof codeFromQuery === 'string' && codeFromQuery.length > 0) {
    return codeFromQuery;
  }

  const matched = url.match(/[?&#]code=([^&#]+)/);
  if (matched?.[1]) {
    return decodeURIComponent(matched[1]);
  }

  return null;
};

export const signInWithGoogleViaSupabase = async (): Promise<GoogleAuthResult> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      success: false,
      message: 'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY.',
    };
  }

  // Use Expo/Native runtime-aware callback URL.
  // For Expo Go this becomes an exp:// URL; for native builds it uses the app scheme.
  const redirectTo = Linking.createURL('auth/signIn');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        prompt: 'select_account',
      },
    },
  });

  if (error || !data?.url) {
    return {
      success: false,
      message: error?.message || 'Failed to start Google sign-in.',
    };
  }

  const authResult = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (authResult.type !== 'success') {
    return {
      success: false,
      message:
        authResult.type === 'cancel'
          ? 'Google sign-in was cancelled.'
          : `Google sign-in was not completed (result: ${authResult.type}).`,
    };
  }

  const authCode = extractCodeFromUrl(authResult.url);
  if (!authCode) {
    return {
      success: false,
      message: 'Google sign-in did not return an authorization code.',
    };
  }

  const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode);
  if (exchangeError || !sessionData?.user) {
    return {
      success: false,
      message: exchangeError?.message || 'Failed to complete Google sign-in.',
    };
  }

  const authUser = sessionData.user;
  const fullName =
    (typeof authUser.user_metadata?.full_name === 'string' && authUser.user_metadata.full_name) ||
    (typeof authUser.user_metadata?.name === 'string' && authUser.user_metadata.name) ||
    undefined;

  return {
    success: true,
    message: 'Google sign-in successful.',
    profile: {
      providerUserId: authUser.id,
      email: authUser.email || undefined,
      name: fullName,
    },
  };
};
