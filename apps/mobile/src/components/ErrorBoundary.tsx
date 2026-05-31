// Root error boundary. Catches render errors anywhere in the tree.

import { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorView } from './glass/States';
import { Screen } from './glass/Screen';

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
        <Screen>
          <ErrorView
            title="App hit an unexpected error"
            message={this.state.error.message}
            onRetry={this.reset}
          />
        </Screen>
      );
    }
    return this.props.children;
  }
}
