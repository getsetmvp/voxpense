// Entry route. AuthGate in _layout handles redirection; we just render a
// splash placeholder while auth state hydrates.

import { Screen, LoadingView } from '../src/components/glass';

export default function IndexRedirect() {
  return (
    <Screen>
      <LoadingView label="Loading VoxPense…" />
    </Screen>
  );
}
