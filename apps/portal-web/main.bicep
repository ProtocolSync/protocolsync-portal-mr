@description('The name of the application')
param appName string = 'protocolsync'

@description('The Azure region where resources will be deployed')
param location string = resourceGroup().location

@description('Environment name (dev, staging, prod)')
@allowed([
  'dev'
  'staging'
  'prod'
])
param environment string = 'dev'

@description('App Service Plan SKU')
@allowed([
  'B1'
  'B2'
  'B3'
  'S1'
  'S2'
  'S3'
  'P1v2'
  'P2v2's
  'P3v2'
])
param appServicePlanSku string = 'S1'

@description('Node.js version')
param nodeVersion string = '20-lts'

@description('Backend API URL')
param backendApiUrl string

@description('Chat API URL')
param chatApiUrl string = ''

@description('Website URL')
param websiteUrl string = ''

@description('Azure Entra ID Client ID')
param azureClientId string = ''

@description('Azure Entra ID Tenant ID')
param azureTenantId string = ''

@description('API Key')
@secure()
param apiKey string = ''

// Variables
var uniqueSuffix = uniqueString(resourceGroup().id)
var portalAppServicePlanName = '${appName}-portal-plan-${environment}-${uniqueSuffix}'
var portalAppServiceName = '${appName}-portal-${environment}-${uniqueSuffix}'
var vnetName = '${appName}-vnet-${environment}'
var appSubnetName = 'app-subnet'

// Reference existing VNet
resource vnet 'Microsoft.Network/virtualNetworks@2023-05-01' existing = {
  name: vnetName
}

// App Service Plan for Portal
resource portalAppServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: portalAppServicePlanName
  location: location
  sku: {
    name: appServicePlanSku
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

// Portal App Service (React/Vite Frontend)
resource portalAppService 'Microsoft.Web/sites@2022-09-01' = {
  name: portalAppServiceName
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: portalAppServicePlan.id
    httpsOnly: true
    virtualNetworkSubnetId: '${vnet.id}/subnets/${appSubnetName}'
    siteConfig: {
      linuxFxVersion: 'NODE|${nodeVersion}'
      alwaysOn: true
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      http20Enabled: true
      vnetRouteAllEnabled: true
      appCommandLine: 'npm run preview'
      appSettings: [
        {
          name: 'NODE_ENV'
          value: environment == 'prod' ? 'production' : 'development'
        }
        {
          name: 'PORT'
          value: '8080'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~20'
        }
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'true'
        }
        {
          name: 'VITE_API_URL'
          value: backendApiUrl
        }
        {
          name: 'VITE_CHAT_API_URL'
          value: !empty(chatApiUrl) ? chatApiUrl : backendApiUrl
        }
        {
          name: 'VITE_WEBSITE_URL'
          value: websiteUrl
        }
        {
          name: 'VITE_AZURE_CLIENT_ID'
          value: azureClientId
        }
        {
          name: 'VITE_AZURE_TENANT_ID'
          value: azureTenantId
        }
        {
          name: 'VITE_API_KEY'
          value: apiKey
        }
        // CORS (adjust as needed)
        {
          name: 'CORS_ORIGIN'
          value: '*'
        }
      ]
      cors: {
        allowedOrigins: [
          '*'
        ]
        supportCredentials: false
      }
    }
  }
}

// Portal App Service Logs Configuration
resource portalAppServiceLogs 'Microsoft.Web/sites/config@2022-09-01' = {
  parent: portalAppService
  name: 'logs'
  properties: {
    applicationLogs: {
      fileSystem: {
        level: 'Information'
      }
    }
    httpLogs: {
      fileSystem: {
        enabled: true
        retentionInMb: 35
        retentionInDays: 7
      }
    }
    detailedErrorMessages: {
      enabled: true
    }
    failedRequestsTracing: {
      enabled: true
    }
  }
}

// Outputs
output portalAppServiceUrl string = 'https://${portalAppService.properties.defaultHostName}'
output portalAppServiceName string = portalAppService.name
output vnetName string = vnet.name
output vnetId string = vnet.id
output resourceGroupName string = resourceGroup().name
