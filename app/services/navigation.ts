import {
  createNavigationContainerRef,
  CommonActions,
  StackActions,
} from '@react-navigation/native';
import { ScreenName, ScreenPath } from '../constants/screens';

// Create navigation ref
export const navigationRef = createNavigationContainerRef();

// Navigation params type
export type NavigationParams = Record<string, any>;

// Navigation service
class NavigationService {
  private async ensureReady() {
    await navigationRef.isReady();
    if (!navigationRef.isReady()) {
      throw new Error('Navigation container is not ready');
    }
  }

  // Navigate to a screen
  async navigate(screenName: ScreenName, params?: NavigationParams) {
    await this.ensureReady();
    navigationRef.dispatch(
      CommonActions.navigate({
        name: screenName,
        params,
      })
    );
  }

  // Reset navigation stack and navigate to a screen
  async resetAndNavigate(screenName: ScreenName, params?: NavigationParams) {
    await this.ensureReady();
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: screenName, params }],
      })
    );
  }

  // Go back
  async goBack() {
    await this.ensureReady();
    navigationRef.dispatch(CommonActions.goBack());
  }

  // Push a new screen onto the stack
  async push(screenName: ScreenName, params?: NavigationParams) {
    await this.ensureReady();
    navigationRef.dispatch(StackActions.push(screenName, params));
  }

  // Replace current screen
  async replace(screenName: ScreenName, params?: NavigationParams) {
    await this.ensureReady();
    navigationRef.dispatch(StackActions.replace(screenName, params));
  }

  // Pop to top of stack
  async popToTop() {
    await this.ensureReady();
    navigationRef.dispatch(StackActions.popToTop());
  }

  // Pop n screens
  async pop(n: number = 1) {
    await this.ensureReady();
    navigationRef.dispatch(StackActions.pop(n));
  }
}

// Export singleton instance
export const navigationService = new NavigationService();

// Default export to satisfy Expo Router
export default {};