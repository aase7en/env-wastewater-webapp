import WWTPDigitalTwin from './WWTPDigitalTwin';
import type { WWTPViewSnapshot } from './wwtp-model';

// No readings are fabricated. Wire your approved ENV Twin selectors to snapshot.
const snapshot: WWTPViewSnapshot = {
  mode: 'unavailable',
  date: null,
  assets: {},
};

export function WWTPDigitalTwinExample() {
  return (
    <WWTPDigitalTwin
      snapshot={snapshot}
      onAssetSelect={assetId => console.info('Selected scene asset:', assetId)}
      style={{ height: '78vh' }}
    />
  );
}
