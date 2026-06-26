import { createNavigationContainerRef } from '@react-navigation/native';

/**
 * A ref to the NavigationContainer, used for imperative navigation from
 * outside React components (e.g., Axios response interceptors).
 *
 * Usage:
 *   1. Pass this ref to <NavigationContainer ref={navigationRef}>
 *   2. Call navigationRef.current?.navigate(...) or .reset(...) anywhere.
 */
export const navigationRef = createNavigationContainerRef();
