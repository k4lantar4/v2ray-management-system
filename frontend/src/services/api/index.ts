export { AuthService } from './auth.service';
export { UserService } from './user.service';
export { ServerService } from './server.service';
export { SubscriptionService } from './subscription.service';

// Helper function to initialize all services
export const initializeServices = () => {
  return {
    auth: AuthService.getInstance(),
    users: UserService.getInstance(),
    servers: ServerService.getInstance(),
    subscriptions: SubscriptionService.getInstance(),
  };
};

// Export service instances
export const services = initializeServices(); 