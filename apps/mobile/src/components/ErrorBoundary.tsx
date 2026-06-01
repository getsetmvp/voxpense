// Root error boundary. Catches render errors anywhere in the tree.

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: '#FAFAFA',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#0A0A0A' }}>
            App hit an unexpected error
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: '#737373',
              textAlign: 'center',
              maxWidth: 320,
            }}
          >
            {this.state.error.message}
          </Text>
          <Pressable
            onPress={this.reset}
            style={{
              marginTop: 8,
              paddingHorizontal: 16,
              height: 40,
              borderRadius: 12,
              backgroundColor: '#6366F1',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}
