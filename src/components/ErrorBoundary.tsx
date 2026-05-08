/**
 * ErrorBoundary.tsx
 *
 * Class component that catches render-time errors in its subtree.
 *
 * React's ErrorBoundary only catches:
 *   - errors thrown during render
 *   - errors in lifecycle methods
 *   - errors in constructors of children
 *
 * It does NOT catch:
 *   - errors in event handlers (use try/catch)
 *   - async errors (use the global handler in src/lib/errorHandler.ts)
 *   - errors during server-side rendering (n/a for RN)
 *
 * Pair this component with installGlobalErrorHandler() to cover both classes
 * of failure. Render errors here keep the app alive with a fallback UI;
 * async errors are caught by the global handler and persisted.
 */

import { Component, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { captureException } from '../lib/sentry';

const LAST_ERROR_KEY = 'luckyday.lastError.v1';

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error): void {
    AsyncStorage.setItem(
      LAST_ERROR_KEY,
      JSON.stringify({
        message: error.message,
        stack: error.stack ?? null,
        isFatal: true,
        timestamp: new Date().toISOString(),
      }),
    ).catch(() => {});
    captureException(error, { source: 'ErrorBoundary' });
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>✦</Text>
          <Text style={styles.title}>Something interrupted your reading</Text>
          <Text style={styles.body}>
            We caught an issue and kept LuckyDay running. Tap below to try again.
          </Text>
          <Pressable style={styles.button} onPress={this.reset}>
            <Text style={styles.buttonText}>Reload your reading</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#FDF0F6',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    color: '#2A1B27',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    color: '#5C4659',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#B65A8B',
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
