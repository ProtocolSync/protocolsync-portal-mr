export { ApiClient } from './api/ApiClient';
export type { ApiClientConfig, ApiResponse } from './api/ApiClient';
export type { IAuthService, AuthResponse } from './auth/IAuthService';

// Services
export { SitesService } from './services/SitesService';
export type { Site, CreateSiteData, UpdateSiteStatusData, AddSiteAdministratorData, SiteAdministrator } from './services/SitesService';

export { UsersService } from './services/UsersService';
export type { CompanyUser, CreateUserData, UpdateUserData } from './services/UsersService';

export { TrialsService } from './services/TrialsService';
export type { Trial, CreateTrialData, UpdateTrialData } from './services/TrialsService';

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

export { ProtocolDocumentsService } from './services/ProtocolDocumentsService';
export type {
  ProtocolDocument,
  ProtocolVersion,
  UploadProtocolData
} from './services/ProtocolDocumentsService';

export { DelegationService } from './services/DelegationService';
export type {
  DelegationReportConfig,
  CreateDelegationData,
  ReportGenerationResponse,
  ReportStatusResponse
} from './services/DelegationService';

export { DocumentQueryService } from './services/DocumentQueryService';
export type {
  DocumentQuerySource,
  QueryMessage,
  SendQueryRequest,
  SendQueryResponse
} from './services/DocumentQueryService';
