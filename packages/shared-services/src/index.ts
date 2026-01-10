export { ApiClient } from './api/ApiClient';
export type { ApiClientConfig, ApiResponse } from './api/ApiClient';
export type { IAuthService, AuthResponse } from './auth/IAuthService';

// Services
export { SitesService } from './services/SitesService';
export type { Site, CreateSiteData, UpdateSiteStatusData, AddSiteAdministratorData, SiteAdministrator } from './services/SitesService';

export { UsersService } from './services/UsersService';
export type { CompanyUser, CreateUserData, UpdateUserData } from './services/UsersService';

export { HelpChatService } from './services/HelpChatService';
export type {
  HelpMessage,
  HelpMessageSource,
  SendMessageRequest,
  SendMessageResponse,
  ConversationHistoryResponse,
  EscalationRequest,
  EscalationResponse
} from './services/HelpChatService';
