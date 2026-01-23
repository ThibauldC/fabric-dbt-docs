# Extensibility Toolkit Knowledge

## Context

The Microsoft Fabric Extensibility Toolkit enables partners and customers to create custom workloads that integrate seamlessly with the Fabric platform. This knowledge applies to developing, deploying, and maintaining custom Fabric workloads.

## Development Workflow

### CRITICAL: Always Compile Before Completing Changes

**MANDATORY STEP**: Before considering any code changes complete, you MUST compile the workload and fix all TypeScript/webpack errors.

```bash
cd Workload
npm run build:test
```

**Why this is critical:**
- TypeScript compilation errors will prevent the workload from running
- Webpack errors indicate configuration or module issues
- Type safety ensures runtime reliability
- Early error detection prevents deployment failures

**Process:**
1. Make code changes
2. Run `npm run build:test` in the Workload directory
3. Fix ALL compilation errors (not just warnings)
4. Re-run compilation to verify fixes
5. Only mark task as complete when compilation succeeds

**Common compilation commands:**
- `npm run build:test` - Build with test configuration
- `npm run build:prod` - Build for production
- `npm run start:devServer` - Start development server (compiles with hot reload)

## Key Concepts

### Workload Architecture
- **Frontend**: React/TypeScript application running in Fabric's web experience
- **Backend**: Optional REST API service hosted separately (Azure, on-premises, or other cloud)
- **Manifest**: XML/JSON configuration defining workload capabilities and integration points
- **Authentication**: Integrated with Entra ID (Azure AD) for seamless user authentication

### Core Components
- **Items**: Custom data types and experiences (e.g., custom reports, datasets, models)
- **Editors**: UI components for creating and editing workload items
- **Viewers**: Read-only views for displaying workload content
- **APIs**: RESTful interfaces for backend integration and data operations

## Implementation Patterns

### Item Development Pattern
Every workload item requires exactly four components:

```typescript
// 1. Model - Data interface and state definition
[ItemName]ItemDefinition.ts

// 2. Editor - Main editing experience
[ItemName]ItemEditor.tsx

// 3. Ribbon - Toolbar and navigation commands
[ItemName]ItemEditorRibbon.tsx

// 3. Empty View - Initial view that is shown if the item does not have a state
[ItemName]ItemEditorEmptyView.tsx

// 4. Default View - Default view that contains the default editor experience 
[ItemName]ItemEditorDefaultView.tsx
```

### Authentication Integration
```typescript
// Standard pattern for API authentication
import { WorkloadClientAPI } from '@ms-fabric/workload-client';

const workloadClient = new WorkloadClientAPI();
const accessToken = await workloadClient.authentication.acquireAccessToken(scopes);
```

### Ribbon Pattern
The toolkit provides a standardized Ribbon component with a clean API for consistent ribbon experiences:

```typescript
// Recommended pattern - mandatory homeToolbarActions, optional additionalToolbars
import { Ribbon, createSaveAction, createSettingsAction } from '../../components/ItemEditor';

export function MyItemRibbon(props: RibbonProps) {
  const { t } = useTranslation();
  
  // Create a translation helper function
  const translate = (key: string, fallback?: string) => t(key, fallback);
  
  // Define mandatory Home tab actions
  const homeToolbarActions: RibbonAction[] = [
    createSaveAction(
      props.saveItemCallback,
      !props.isSaveButtonEnabled,
      translate
    ),
    createSettingsAction(
      props.openSettingsCallback,
      translate
    )
  ];
  
  // Optional: Define additional tabs for complex items
  const additionalToolbars = [
    {
      key: 'data',
      label: t('Data'),
      actions: [/* custom actions */]
    }
  ];
  
  return (
    <Ribbon 
      homeToolbarActions={homeToolbarActions}           // Mandatory
      additionalToolbars={additionalToolbars}     // Optional
      viewContext={viewContext} 
    />
  );
}

// Simple pattern - just home actions (like HelloWorld)
return (
  <Ribbon 
    homeToolbarActions={homeToolbarActions}
    viewContext={viewContext} 
  />
);
```

Key Benefits:

- **Consistent API**: Every ribbon has a mandatory Home tab with `homeToolbarActions`
- **Standard Actions**: Use `createSaveAction()`, `createSettingsAction()` factories
- **Optional Complexity**: Add `additionalToolbars` only when needed
- **Accessibility**: Built-in Tooltip + ToolbarButton patterns

### Layout Components

#### ItemEditorDefaultView - Multi-Panel Layout System

The toolkit provides `ItemEditorDefaultView` for flexible multi-panel layouts with advanced features:

```typescript
import { ItemEditorDefaultView } from '../../components/ItemEditor';

// Basic single-panel layout
<ItemEditorDefaultView
  center={{ content: <MyMainContent /> }}
/>

// Multi-panel with navigation, editor, and output
<ItemEditorDefaultView
  left={{
    content: <FileExplorer />,
    title: "Files",
    width: 320,
    collapsible: true,
    onCollapseChange: (collapsed) => savePreference('collapsed', collapsed),
    enableUserResize: true
  }}
  center={{
    content: <CodeEditor />,
    ariaLabel: "Code editor workspace"
  }}
/>
```

**Key Features:**

- **Left Panel (Optional)**: Navigation trees, file explorers, OneLakeView, and secondary views (list views, catalog browsers, workspace explorers) with collapsible headers
- **Center Panel (Required)**: Main editing content, forms, canvases, detail views
- **Resizable Splitters**: Drag-to-resize with min/max constraints and live preview (controlled via `enableUserResize` in left panel config)
- **Collapse Controls**: Header-based toggle following OneLakeView patterns
- **State Management**: Internal state management with notification callbacks
- **Responsive Design**: Mobile-friendly with adaptive layouts

#### ItemEditorDetailView - L2 Navigation Pattern

For drill-down detail views (L2 pages), always use the dedicated DetailView component:

```typescript
import { ItemEditorDetailView } from '../../components/ItemEditor';

// Register as detail view for automatic back navigation
{
  name: 'item-details',
  component: (
    <ItemEditorDetailView
      center={{ content: <ItemDetailsForm item={selectedItem} /> }}
      toolbarActions={[
        { key: 'save', label: 'Save', icon: Save24Regular, onClick: handleSave },
        { key: 'delete', label: 'Delete', icon: Delete24Regular, onClick: handleDelete }
      ]}
    />
  ),
  isDetailView: true  // ⭐ Enables automatic back navigation
}
```

**L2 Detail View Use Cases:**
- Item property/configuration screens  
- Record detail forms
- Settings dialogs
- Data preview/inspection views
- Any drill-down content requiring back navigation

#### ItemSettings Pattern - General Item Configuration

For general item properties and configuration, use the ItemSettings pattern instead of editor panels:

```typescript
// Use createSettingsAction() in ribbon to open settings flyout
import { createSettingsAction } from '../../components/ItemEditor';

const homeToolbarActions: RibbonAction[] = [
  createSaveAction(handleSave, !isSaveEnabled, translate),
  createSettingsAction(handleOpenSettings, translate)  // ⭐ Opens settings flyout
];

// Settings flyout automatically includes:
// - Item name and description (managed by platform)
// - Custom settings sections for your item
function handleOpenSettings() {
  // Platform handles settings flyout display
  // Custom settings are registered via WorkloadManifest.xml
}
```

**ItemSettings Use Cases:**
- **Version configuration**: API versions, schema versions
- **Endpoint configuration**: Connection strings, service URLs  
- **Authentication settings**: Credentials, tokens, connection modes
- **Performance settings**: Timeout values, retry policies
- **Feature toggles**: Enable/disable item features
- **Metadata**: Tags, categories, custom properties

**Benefits:**
- **Consistent UX**: Standard Fabric settings flyout pattern
- **Platform Integration**: Item names/descriptions managed automatically  
- **Separation of Concerns**: Configuration separate from editing workflow
- **Discoverability**: Users expect settings in the ribbon settings action

#### ItemEditorEmptyView - First-Time User Experience

For items without definition/state (first-time usage), use the Empty View pattern:

```typescript
import { ItemEditorEmptyView } from '../../components/ItemEditor';

// Register as initial view for new items
{
  name: 'empty',
  component: (
    <ItemEditorEmptyView
      title="Welcome to MyCustomItem!"
      description="Get started by configuring your item below"
      imageSrc="/assets/items/MyCustomItem/empty-state.svg"
      tasks={[
        {
          id: 'setup',
          label: 'Setup Data Source',
          description: 'Connect to your data source to get started',
          icon: Database24Regular,
          onClick: () => setCurrentView('setup'),
          appearance: 'primary'
        },
        {
          id: 'import',
          label: 'Import Existing',
          description: 'Import configuration from another item',
          icon: CloudArrowUp24Regular,
          onClick: handleImport,
          appearance: 'secondary'
        }
      ]}
    />
  )
}

// Use as initial view based on item state
<ItemEditor
  initialView={!item?.definition?.state ? 'empty' : 'main'}
  views={views}
  ribbon={ribbon}
/>
```

**Empty View Use Cases:**
- **New items**: Items created but not yet configured
- **No definition**: Items without saved state or configuration  
- **Onboarding**: Guide users through initial setup steps
- **Call-to-action**: Present clear next steps for getting started

**Empty View Best Practices:**
- **Clear Value Proposition**: Explain what the item does and why it's useful
- **Progressive Disclosure**: Start with 1-2 primary actions, not overwhelming choices
- **Visual Appeal**: Include illustration or icon to make the state feel intentional
- **Action-Oriented**: Use verbs for button labels ('Setup', 'Import', 'Connect')
- **Help Documentation**: Provide links to getting started guides or samples

### Manifest Configuration

- **WorkloadManifest.xml**: Defines workload metadata, capabilities, and permissions
- **[ItemName]Item.xml**: Defines individual item types, their properties, and behaviors
- **Product.json**: Frontend metadata including routes, translations, and assets

## Best Practices

### Development Guidelines

1. **Follow Naming Conventions**: Use PascalCase for item names, maintain consistency
2. **Implement Error Handling**: Provide user-friendly error messages and recovery options
3. **Use Fluent UI**: Leverage @fluentui/react-components for consistent visual design
4. **Ribbon Pattern**: Use Ribbon with `homeToolbarActions` (mandatory) and optional `additionalToolbars`. Import action factories from components/ItemEditor
5. **Toolbar Components**: ALWAYS use `Tooltip` + `ToolbarButton` pattern for toolbar actions. Import from `@fluentui/react-components` and wrap each `ToolbarButton` in a `Tooltip` for accessibility
6. **Content Padding**: ItemEditor panels have ZERO padding. Your view content components MUST add `padding: var(--spacingVerticalM, 12px)` to their root CSS class for proper spacing
7. **State Management**: Use Redux Toolkit patterns for complex state management
8. **Performance**: Implement lazy loading and code splitting for large applications
9. **Item Loading Optimization**: Prevent unnecessary item reloads when the same item is already loaded

#### Item Loading Optimization Pattern

When implementing item editors, prevent unnecessary API calls and loading states by checking if the requested item is already loaded:

```typescript
// RECOMMENDED: Optimize loadDataFromUrl to prevent unnecessary reloads
async function loadDataFromUrl(pageContext: ContextProps, pathname: string): Promise<void> {
  // Prevent unnecessary reload if the same item is already loaded
  if (pageContext.itemObjectId && item && item.id === pageContext.itemObjectId) {
    console.log(`Item ${pageContext.itemObjectId} is already loaded, skipping reload`);
    return;
  }

  setIsLoading(true);
  // ... rest of loading logic
}
```

**Benefits of this optimization:**
- **Prevents API calls** when the same item is already loaded
- **Avoids unnecessary loading states** that cause UI flicker  
- **Preserves current state** (like unsaved changes) when navigating within the same item
- **Reduces server load** by eliminating redundant requests

**When this optimization helps:**
- Navigating between different views of the same item
- URL changes that don't actually change the item being edited
- Browser history navigation within the same item context
- Parent component re-renders that trigger useEffect dependencies

**Implementation Notes:**
- Add the check as the first step in your `loadDataFromUrl` function
- Compare `pageContext.itemObjectId` with the currently loaded `item.id`
- Include logging to help with debugging when the optimization is active
- The function will still reload when the `itemObjectId` actually changes

### Security Considerations
1. **Minimal Scopes**: Request only necessary OAuth scopes for operations
2. **Input Validation**: Validate all user inputs and API responses
3. **Secure Storage**: Use secure storage for sensitive configuration data
4. **HTTPS Only**: Ensure all backend communications use HTTPS

### Testing Strategies
1. **Unit Tests**: Test individual components and business logic
2. **Integration Tests**: Verify API integrations and authentication flows
3. **E2E Tests**: Test complete user workflows and item lifecycles
4. **Performance Tests**: Validate loading times and responsiveness

## Common Issues

### Authentication Problems
- **Issue**: Token acquisition failures
- **Solution**: Verify Entra app configuration and scope permissions
- **Prevention**: Implement proper error handling and token refresh logic

### Manifest Validation Errors
- **Issue**: Build failures due to invalid XML/JSON
- **Solution**: Use schema validation and consistent naming patterns
- **Prevention**: Regular validation during development process

### Performance Issues
- **Issue**: Slow loading or unresponsive UI
- **Solution**: Implement code splitting, lazy loading, and efficient state management
- **Prevention**: Regular performance profiling and optimization

### Development Environment Issues
- **Issue**: Local development server connection problems
- **Solution**: Verify DevGateway configuration and network connectivity
- **Prevention**: Use provided setup scripts and validate environment configuration

## Development Workflow

### Setup Process
1. Run `scripts/Setup/SetupWorkload.ps1` with appropriate parameters
2. Configure environment variables in `.env.*` files
3. Install dependencies: `npm install` in Workload directory
4. Build manifest package: `scripts/Build/BuildManifestPackage.ps1`

### Development Loop
1. Start DevGateway: `scripts/Run/StartDevGateway.ps1`
2. Start DevServer: `scripts/Run/StartDevServer.ps1`
3. Implement changes in `Workload/app/` directory
4. Test in browser at configured development URL
5. Build and validate: `scripts/Build/BuildRelease.ps1`

### Deployment Process
1. Build production release with organization name
2. Create Azure Web App or alternative hosting
3. Deploy using `scripts/Deploy/DeployToAzureWebApp.ps1`
4. Register workload with Fabric tenant
5. Test in production environment

## Integration Points

### Fabric Platform APIs
- **Items API**: CRUD operations for workload items
- **Workspaces API**: Workspace management and permissions
- **OneLake API**: Data storage and access patterns
- **Job Scheduler API**: Background task execution

### Microsoft Services
- **Power BI**: Embedding reports and dashboards
- **Azure Services**: Backend hosting and data services
- **Microsoft 365**: Integration with Office applications
- **Entra ID**: Authentication and user management

## References

- [Extensibility Toolkit Documentation](https://learn.microsoft.com/en-us/fabric/workload-development-kit/)
- [Fabric REST APIs](https://learn.microsoft.com/en-us/rest/api/fabric/)
- [React Development Guide](https://reactjs.org/docs/getting-started.html)
- [Fluent UI Components](https://react.fluentui.dev/)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/)

# Microsoft Fabric Platform Context

## Overview

Microsoft Fabric is a unified analytics platform that brings together all the data and analytics tools that organizations need. It's a comprehensive, end-to-end analytics solution designed for enterprise applications that consolidates data engineering, real-time analytics, business intelligence, and machine learning into a single, integrated environment.

### Key Characteristics

- **Unified Platform**: All analytics capabilities in one place, eliminating the need for multiple vendor solutions
- **SaaS Foundation**: Built on a Software-as-a-Service foundation for simplified management
- **Open Data Format**: Uses open standards like Delta Lake for data storage
- **Integrated Experience**: Seamless workflow across different analytics workloads

- **AI-Powered**: Includes Copilot integration across all experiences

## Core Components & Workloads

Microsoft Fabric consists of several integrated workloads, each serving specific analytics needs:

### Data Integration & Movement

#### Data Factory

- **Purpose**: Data ingestion, transformation, and orchestration

- **Capabilities**:
  - Modern ETL/ELT pipelines
  - 200+ data connectors
  - Copy activities and dataflows
  - Pipeline orchestration

- **Use Cases**: Moving data from various sources into Fabric, data transformation workflows

#### OneLake

- **Purpose**: Unified data lake storage for the entire organization

- **Capabilities**:
  - Single source of truth for all organizational data
  - Delta Lake format support
  - Automatic data management and governance
  - Shortcuts to external data sources

- **Use Cases**: Centralized data storage, data sharing across workloads

### Data Storage & Processing

#### Data Engineering (Lakehouse)

- **Purpose**: Big data processing and transformation using Apache Spark

- **Capabilities**:
  - Lakehouse architecture combining data lakes and warehouses
  - Notebooks for interactive development
  - Spark job orchestration
  - Delta tables for ACID transactions

- **Use Cases**: Large-scale data processing, data science workflows, exploratory analysis

#### Data Warehouse

- **Purpose**: Enterprise-scale data warehousing with SQL interface

- **Capabilities**:
  - T-SQL query support
  - Columnar storage optimization
  - Automatic scaling
  - Integration with Power BI

- **Use Cases**: Traditional data warehousing, complex analytical queries, enterprise reporting

#### Databases

- **Purpose**: Operational SQL databases for transactional workloads

- **Capabilities**:
  - Fully managed SQL databases
  - ACID compliance
  - Automatic backup and recovery
  - Integration with other Fabric workloads

- **Use Cases**: Application backends, operational data stores

### Real-Time Analytics

#### Real-Time Intelligence

- **Purpose**: Streaming data ingestion, processing, and analysis

- **Capabilities**:
  - Event streaming with Event Streams
  - KQL (Kusto Query Language) for fast analytics
  - Real-time dashboards
  - Alerting and monitoring

- **Use Cases**: IoT data processing, real-time monitoring, streaming analytics

#### Eventhouse

- **Purpose**: High-performance analytics database for time-series and log data

- **Capabilities**:
  - Optimized for time-series data
  - KQL query interface
  - Fast ingestion and querying
  - Integration with streaming sources

- **Use Cases**: Log analytics, telemetry data, time-series analysis

### Business Intelligence & Visualization

#### Power BI

- **Purpose**: Business intelligence and data visualization

- **Capabilities**:
  - Interactive reports and dashboards
  - Self-service analytics
  - Mobile accessibility
  - Embedded analytics

- **Use Cases**: Executive dashboards, self-service BI, data storytelling

#### Paginated Reports

- **Purpose**: Pixel-perfect formatted reports

- **Capabilities**:
  - Print-ready report formatting
  - Integration with various data sources
  - Automated report distribution
  - Compliance reporting

- **Use Cases**: Regulatory reports, invoices, operational reports

### Machine Learning & AI

#### Data Science

- **Purpose**: Machine learning model development and deployment

- **Capabilities**:
  - MLflow integration for model lifecycle management
  - AutoML capabilities
  - Model serving and deployment
  - Integration with popular ML frameworks

- **Use Cases**: Predictive analytics, recommendation systems, classification models

#### Applied AI Services

- **Purpose**: Pre-built AI capabilities and cognitive services

- **Capabilities**:
  - Text analytics and language understanding
  - Computer vision services
  - Document intelligence
  - Integration with Azure Cognitive Services

- **Use Cases**: Document processing, sentiment analysis, image recognition

## Platform Architecture

### Compute Engine

- **Apache Spark**: Distributed computing for big data processing

- **SQL Engine**: Optimized for analytical queries

- **KQL Engine**: Fast analytics for streaming and log data

### Storage Layer

- **OneLake**: Unified data lake built on Delta Lake format

- **Automatic Optimization**: Built-in data management and optimization

- **Multi-Format Support**: Parquet, Delta, CSV, JSON, and more

### Security & Governance

- **Unified Security Model**: Consistent security across all workloads

- **Data Loss Prevention (DLP)**: Built-in data protection

- **Row-Level Security (RLS)**: Fine-grained access control

- **Information Protection**: Sensitivity labeling and classification

### Integration Points

- **Microsoft 365**: Deep integration with Office applications

- **Azure Services**: Native connectivity to Azure data services

- **Third-Party Systems**: Extensive connector ecosystem

- **On-Premises**: Hybrid data integration capabilities

## Development & Extensibility

### APIs and Programmability

#### Fabric REST APIs

- **Location**: All APIs documented at [Microsoft Fabric REST API Specs](https://github.com/microsoft/fabric-rest-api-specs/)
- **Format**: OpenAPI/Swagger specifications
- **Coverage**: Complete CRUD operations for all Fabric resources
- **Authentication**: Azure AD/Entra ID integration

**Key API Categories:**

- **Core APIs**: Workspace, capacity, and tenant management
- **Data Factory APIs**: Pipeline and dataflow operations
- **Power BI APIs**: Report and dataset management
- **Lakehouse APIs**: Data engineering operations
- **Warehouse APIs**: SQL warehouse management
- **Real-Time Intelligence APIs**: Streaming and KQL operations

#### Client Libraries and SDKs

- **AutoRest Generated**: Official SDKs generated from OpenAPI specs
- **Multiple Languages**: Support for .NET, Python, JavaScript, Java
- **Power BI JavaScript API**: For embedding and integration
- **Power BI .NET SDK**: For programmatic report and dataset operations

### Extensibility Toolkit

#### Purpose

- Enable partners and customers to build custom workloads
- Integrate third-party services into the Fabric experience
- Extend platform capabilities with domain-specific functionality

#### Capabilities
- **Custom UI Integration**: React-based frontend integration
- **Backend Service Integration**: RESTful API integration
- **Fabric API Access**: Full access to platform APIs
- **Single Sign-On**: Integrated authentication with Entra ID
- **Resource Management**: Workspace and capacity integration

### Application Lifecycle Management (ALM)

#### Git Integration
- **Source Control**: Native Git integration for all artifacts
- **Branching Strategy**: Support for feature branches and merging
- **Collaboration**: Multi-developer workflows
- **Version History**: Complete audit trail of changes

#### Deployment Pipelines
- **CI/CD Support**: Automated deployment across environments
- **Environment Promotion**: Dev → Test → Production workflows
- **Rollback Capabilities**: Safe deployment with rollback options
- **Integration Testing**: Automated testing in deployment pipelines

## Data Governance & Security

### Information Protection
- **Sensitivity Labels**: Microsoft Purview integration
- **Data Classification**: Automatic and manual classification
- **Access Policies**: Fine-grained access control
- **Audit Logging**: Comprehensive activity logging

### Compliance & Regulatory
- **Industry Standards**: SOC, ISO, GDPR compliance
- **Data Residency**: Control over data location
- **Encryption**: End-to-end encryption at rest and in transit
- **Backup & Recovery**: Automated backup and point-in-time recovery

## AI Integration (Copilot)

### Platform-Wide AI
- **Natural Language Queries**: Query data using natural language
- **Code Generation**: AI-assisted code and query generation
- **Data Insights**: Automated insight discovery
- **Content Creation**: AI-powered report and dashboard creation

### Workload-Specific AI
- **Data Factory**: AI-assisted pipeline creation
- **Power BI**: Natural language report generation
- **Data Science**: AutoML and model recommendations
- **SQL**: AI-powered query optimization and suggestions

## Licensing & Capacity

### Licensing Models
- **Fabric Capacity**: Pay-as-you-go or reserved capacity
- **Power BI Premium**: Per-user and per-capacity options
- **Developer Trial**: Free trial for development and testing

### Capacity Management
- **Elastic Scaling**: Automatic scaling based on demand
- **Workload Isolation**: Separate compute resources for different workloads
- **Performance Monitoring**: Built-in capacity utilization monitoring
- **Cost Optimization**: Tools for monitoring and optimizing costs

## Integration Ecosystem

### Microsoft Ecosystem
- **Microsoft 365**: SharePoint, Teams, Excel integration
- **Azure**: Native connectivity to all Azure services
- **Power Platform**: Power Apps, Power Automate integration
- **Dynamics 365**: Business application integration

### Third-Party Ecosystem
- **Data Connectors**: 200+ pre-built connectors
- **Partner Solutions**: ISV workloads and extensions
- **Open Standards**: Support for open formats and protocols
- **Custom Connectors**: Build custom data source connectors

## Community & Learning Resources

### Official Documentation

- **Primary Documentation**: [Microsoft Fabric Documentation](https://learn.microsoft.com/en-us/fabric/)
- **API Documentation**: [Fabric REST API Reference](https://learn.microsoft.com/en-us/rest/api/fabric/)
- **Learning Paths**: Role-based training modules
- **Sample Code**: GitHub repositories with examples

### Community Resources

- **Community Forums**: [Microsoft Fabric Community](https://community.fabric.microsoft.com/)
- **User Groups**: Local and virtual meetups
- **MVP Program**: Community recognition program
- **Feedback Portal**: [Fabric Ideas Portal](https://ideas.fabric.microsoft.com/)

### Developer Resources

- **GitHub**: [Fabric REST API Specifications](https://github.com/microsoft/fabric-rest-api-specs/)
- **Terraform Provider**: Infrastructure as code support
- **Command Line Interface**: Fabric CLI for automation
- **VS Code Extensions**: Development tools integration

## Best Practices for AI Tools

### Understanding Fabric Context

1. **Unified Platform Approach**: Recognize that Fabric integrates multiple analytics capabilities
2. **Data-Centric Design**: All workloads share the same underlying data through OneLake
3. **API-First Architecture**: Most operations can be automated through REST APIs
4. **Security Model**: Understand workspace-based security and governance

### Working with Fabric APIs

1. **OpenAPI Specifications**: Always reference the latest specs from the GitHub repository
2. **Authentication**: Use Entra ID (Azure AD) for all API authentication
3. **Rate Limiting**: Implement proper retry logic and respect API limits
4. **Long-Running Operations**: Handle async operations properly using the provided patterns

### Development Patterns

1. **Workload Integration**: Use the Extensibility Toolkit for custom workload development
2. **Git Integration**: Leverage source control for all Fabric artifacts
3. **Environment Strategy**: Implement proper dev/test/prod workflows
4. **Monitoring**: Implement proper logging and monitoring for custom solutions
5. **UI Components**: Prefer components from `@fluentui/react-components` (v9) over `@fluentui/react` (v8). Replace imports like `import { DefaultButton } from '@fluentui/react'` with `import { Button } from '@fluentui/react-components'`. Verify API and prop differences (appearance, tokens, and shorthands) when migrating components.

### Data Management

1. **OneLake First**: Store data in OneLake for maximum interoperability
2. **Delta Format**: Use Delta Lake format for ACID compliance and performance
3. **Shortcuts**: Use OneLake shortcuts to avoid data duplication
4. **Governance**: Implement proper data classification and access controls



This document provides AI tools with the essential context needed to understand Microsoft Fabric's comprehensive analytics platform, its various workloads, development capabilities, and integration patterns. Use this information to make informed decisions when working with Fabric-related tasks and development scenarios.

# Run Workload - Step-by-Step Guide

## Process

This guide provides comprehensive instructions for AI tools on how to start and run a Microsoft Fabric workload using the scripts available in the `scripts/Run/` directory. The workload consists of two main components that work together: the Development Gateway and the Development Server.

### Prerequisites Check

Before starting the workload, ensure the following prerequisites are met:

1. **Project Setup Complete**: The workload must be properly configured using the setup scripts
2. **Dependencies Installed**: Node.js dependencies must be installed in the `Workload/` directory
3. **Azure Login**: User must be authenticated with Azure CLI for Fabric API access
4. **Development Workspace**: A valid Fabric workspace must be configured for development

### Architecture Overview

The workload runs using two components:

- **Development Gateway** (`DevGateway`): Bridges between Fabric and your workload, handles authentication
- **Development Server** (`DevServer`): Hosts the frontend React application and serves the workload UI

### Step 1: Prepare the Environment

#### 1.1: Navigate to Project Root
```powershell
cd "c:\Dev\Fabric\Extensibility\Microsoft-Fabric-workload-development-sample"
```

#### 1.2: Install Dependencies (if not already done)
```powershell
cd Workload
npm install
cd ..
```

#### 1.3: Verify Configuration
Check that the development configuration file exists and is properly configured:
```powershell
# Verify DevGateway configuration exists
Test-Path "config\DevGateway\workload-dev-mode.json"

# Check workspace configuration
Get-Content "config\DevGateway\workload-dev-mode.json"
```

**Expected Configuration Structure:**
```json
{  
    "WorkspaceGuid": "your-workspace-id-here",
    "ManifestPackageFilePath": "path-to-manifest-package.nupkg"
}
```

### Step 2: Start the Development Gateway

The Development Gateway must be started first as it handles the connection to Fabric.

#### 2.1: Run the StartDevGateway Script
```powershell
.\scripts\Run\StartDevGateway.ps1
```

**What this script does:**
1. **Builds Manifest Package**: Automatically runs `BuildManifestPackage.ps1` to ensure the latest configuration
2. **Authenticates with Azure**: Handles Azure login for Fabric API access
3. **Starts DevGateway**: Launches the Development Gateway process
4. **Registers Workload**: Registers your workload with the development workspace

#### 2.2: Authentication Process

**Interactive Login (Default):**
- The script will open a browser window for Azure authentication
- Sign in with your Fabric-enabled Azure account
- Grant necessary permissions for workload development

**Non-Interactive Login (Codespaces/CI):**
If running in GitHub Codespaces or automated environments:
- The script will prompt for your Fabric tenant ID
- Use device code authentication when browser login isn't available

#### 2.3: Verify Gateway Started Successfully

Look for these indicators in the console output:
- ✅ "Manifest package built successfully"
- ✅ "Authentication completed"
- ✅ "DevGateway started on port [port]"
- ✅ "Workload registered with workspace [workspace-id]"

**Common Port**: The DevGateway typically runs on port `60006` (configurable)

### Step 3: Start the Development Server

Once the Development Gateway is running, start the frontend development server.

#### 3.1: Open a New Terminal/PowerShell Window
Keep the DevGateway terminal open and start a new session for the DevServer.

#### 3.2: Run the StartDevServer Script
```powershell
# Navigate to project root in new terminal
cd "c:\Dev\Fabric\Extensibility\Microsoft-Fabric-workload-development-sample"

# Start the development server
.\scripts\Run\StartDevServer.ps1
```

**What this script does:**
1. **Changes to DevServer Directory**: Navigates to `Workload/devServer`
2. **Detects Environment**: Automatically handles Codespaces vs. local development
3. **Starts Webpack Dev Server**: Launches the React development server with hot reload
4. **Opens Browser**: Automatically opens the workload in your default browser

#### 3.3: Environment-Specific Behavior

**Local Development:**
- Uses `npm start` command
- Full memory allocation for optimal performance
- Hot module replacement enabled

**GitHub Codespaces:**
- Uses `npm run start:codespace` command  
- Reduced memory allocation to prevent OOM errors
- Hot reload disabled for stability

#### 3.4: Verify Development Server Started

Look for these indicators:
- ✅ "webpack compiled successfully"
- ✅ "DevServer started on http://localhost:[port]"
- ✅ Browser opens automatically to the workload interface
- ✅ No compilation errors in the terminal

**Default Port**: The DevServer typically runs on port `5000` or `3000`

### Step 4: Access and Test the Workload

#### 4.1: Browser Access
The workload should automatically open in your browser. If not, navigate to:
```
http://localhost:[dev-server-port]
```

#### 4.2: Fabric Integration Access
Access your workload through the Fabric portal:
1. Navigate to your Fabric workspace
2. Look for your workload in the experience switcher
3. Create new items using your custom workload types

#### 4.3: Test Basic Functionality
1. **Create New Item**: Test creating items from your workload
2. **Editor Loading**: Verify item editors load correctly  
3. **Save/Load**: Test saving and loading item data
4. **Navigation**: Check routing between different views

### Step 5: Monitor and Debug

#### 5.1: Monitor Both Terminals
Keep both terminal windows visible to monitor:

**DevGateway Terminal:**
- Fabric API communication
- Authentication status
- Workload registration events
- Error messages from Fabric integration

**DevServer Terminal:**
- Webpack compilation status
- Hot reload events
- JavaScript errors and warnings
- Network requests from the frontend

#### 5.2: Common Success Indicators
- Both services show "running" status
- No error messages in either terminal
- Browser loads workload interface without errors
- Items can be created and edited successfully

#### 5.3: Log Locations
- **DevGateway Logs**: Console output in DevGateway terminal
- **DevServer Logs**: Console output in DevServer terminal  
- **Browser Logs**: Browser Developer Tools Console
- **Network Activity**: Browser Developer Tools Network tab

### Alternative: Combined Startup Using npm Scripts

For simplified development, you can also use the npm scripts directly from the Workload directory:

#### Option A: Start Both Services Separately
```powershell
# Terminal 1: Start DevGateway
cd Workload
npm run start:devGateway

# Terminal 2: Start DevServer  
cd Workload
npm run start:devServer
```

#### Option B: Start DevServer Only (if DevGateway already running)
```powershell
cd Workload
npm start
```

## Usage

### Quick Start Checklist for AI Tools

When starting a workload, follow this checklist:

**Prerequisites:**
- [ ] Project setup completed (`scripts/Setup/Setup.ps1` has been run)
- [ ] Node.js dependencies installed (`npm install` in Workload directory)
- [ ] Azure CLI installed and available
- [ ] Development workspace configured in `config/DevGateway/workload-dev-mode.json`

**Startup Sequence:**
- [ ] Open first terminal/PowerShell window
- [ ] Run `.\scripts\Run\StartDevGateway.ps1`
- [ ] Wait for successful authentication and gateway startup
- [ ] Open second terminal/PowerShell window
- [ ] Run `.\scripts\Run\StartDevServer.ps1`
- [ ] Verify both services are running without errors
- [ ] Test workload functionality in browser

**Verification Steps:**
- [ ] DevGateway shows "started successfully" message
- [ ] DevServer shows "webpack compiled successfully"
- [ ] Browser opens workload interface automatically
- [ ] No errors in either terminal window
- [ ] Workload appears in Fabric workspace

### Environment-Specific Commands

#### Local Development Environment
```powershell
# Start DevGateway with interactive login
.\scripts\Run\StartDevGateway.ps1

# Start DevServer with full performance
.\scripts\Run\StartDevServer.ps1
```

#### GitHub Codespaces Environment
```powershell
# Start DevGateway with device code auth
.\scripts\Run\StartDevGateway.ps1 -InteractiveLogin $false

# DevServer will automatically use codespace configuration
.\scripts\Run\StartDevServer.ps1
```

#### Automated/CI Environment
```powershell
# Non-interactive DevGateway startup
.\scripts\Run\StartDevGateway.ps1 -InteractiveLogin $false
```

### Troubleshooting Common Issues

#### Issue: DevGateway Authentication Fails
**Symptoms:** Authentication errors, unable to connect to Fabric
**Solutions:**
- Ensure you're logged into Azure CLI: `az login`
- Check your account has Fabric permissions
- Verify tenant ID is correct for Fabric workspace

#### Issue: DevServer Port Conflicts
**Symptoms:** "Port already in use" errors
**Solutions:**
- Kill existing Node.js processes: `taskkill /f /im node.exe` (Windows)
- Change port in webpack configuration
- Use different port: `npm start -- --port 3001`

#### Issue: Manifest Package Not Found
**Symptoms:** DevGateway can't find manifest package
**Solutions:**
- Run `.\scripts\Build\BuildManifestPackage.ps1` manually
- Check `config/DevGateway/workload-dev-mode.json` path is correct
- Verify manifest files exist in `build/Manifest/`

#### Issue: Workload Not Appearing in Fabric
**Symptoms:** Workload not visible in Fabric workspace
**Solutions:**
- Verify workspace ID in configuration matches your Fabric workspace
- Check DevGateway is running and registered successfully
- Refresh Fabric workspace in browser
- Verify workload manifest is correctly configured

#### Issue: Hot Reload Not Working
**Symptoms:** Changes not reflected in browser automatically
**Solutions:**
- Restart DevServer if hot reload stops working
- Clear browser cache and refresh
- Check for TypeScript/JavaScript errors that block compilation

### Development Workflow Tips

1. **Keep Both Terminals Open**: Monitor both DevGateway and DevServer outputs
2. **DevGateway First**: Always start DevGateway before DevServer
3. **Check Authentication**: Ensure Azure authentication is valid throughout development
4. **Monitor Compilation**: Watch for webpack compilation errors in DevServer terminal
5. **Test Incrementally**: Test changes frequently to catch issues early
6. **Use Browser DevTools**: Monitor console and network tabs for runtime issues

This comprehensive startup process ensures your Microsoft Fabric workload runs correctly with all necessary services properly configured and connected.
# Update Workload Configuration - .env-Based System

## Process Overview

This guide provides instructions for updating Microsoft Fabric workload configuration using the simplified .env-based system. The new system uses environment files as the single source of truth for all configuration.

## 🏗️ **New Configuration Architecture**

### Environment-Based Configuration
- **Environment Files**: `Workload/.env.dev`, `.env.test`, `.env.prod` - Primary configuration source
- **Templates**: `Workload/Manifest/` - Version-controlled templates with placeholders
- **Generated Files**: `build/Manifest/` and `build/DevGateway/` - Auto-generated from templates and .env files

### Key Benefits
- **Simplicity**: Standard .env format familiar to all developers
- **Environment Management**: Separate committed files for each deployment target
- **Template Processing**: Placeholders like `{{WORKLOAD_NAME}}` replaced during generation
- **Self-Contained**: All configuration lives with application code

## Step 1: Update Environment Configuration

### 1.1: Edit Environment Files

Update the appropriate .env file in the `Workload/` directory:

**For Development** (`Workload/.env.dev`):
```bash
WORKLOAD_VERSION=1.0.0
WORKLOAD_NAME=Org.YourWorkloadName
ITEM_NAMES=HelloWorld,CustomItem
FRONTEND_APPID=12345678-1234-1234-1234-123456789abc
FRONTEND_URL=http://localhost:60006/
LOG_LEVEL=debug
```

**For Staging** (`Workload/.env.test`):
```bash
WORKLOAD_VERSION=1.0.0
WORKLOAD_NAME=YourOrganization.YourWorkloadName
ITEM_NAMES=HelloWorld,CustomItem
FRONTEND_APPID=12345678-1234-1234-1234-123456789abc
FRONTEND_URL=https://your-staging-url.azurestaticapps.net/
LOG_LEVEL=info
```

**For Production** (`Workload/.env.prod`):
```bash
WORKLOAD_VERSION=1.0.0
WORKLOAD_NAME=YourOrganization.YourWorkloadName
ITEM_NAMES=HelloWorld,CustomItem
FRONTEND_APPID=12345678-1234-1234-1234-123456789abc
FRONTEND_URL=https://your-production-url.azurestaticapps.net/
# Update Workload Configuration - .env-Based System

## Process Overview

This guide provides instructions for updating Microsoft Fabric workload configuration using the simplified .env-based system. The configuration uses environment files as the single source of truth.

## 🏗️ Configuration Architecture

### Environment-Based Configuration

- **Environment Files**: `Workload/.env.dev`, `.env.test`, `.env.prod` - Primary configuration source
- **Templates**: `config/templates/` - Version-controlled templates with placeholders
- **Generated Files**: `build/Manifest/` and `build/DevGateway/` - Auto-generated from templates

### Key Benefits

- **Simplicity**: Standard .env format familiar to all developers
- **Environment Management**: Separate committed files for each deployment target
- **Template Processing**: Placeholders like `{{WORKLOAD_NAME}}` replaced during generation
- **Self-Contained**: All configuration lives with application code

## Step 1: Update Environment Configuration

### 1.1: Understand Environment File Generation

**Automated Generation**: If you ran `SetupWorkload.ps1`, environment files were automatically generated:
- **`.env.dev`** - Development configuration with localhost URLs and debug logging
- **`.env.test`** - Staging configuration with staging URLs and info logging  
- **`.env.prod`** - Production configuration with production URLs and warn logging

**Template Source**: Files are generated from `config/templates/Workload/.env` with placeholders replaced.

### 1.2: Edit Environment Files (Manual Updates)

Update the appropriate .env file in the `Workload/` directory:

**Development Configuration** (`Workload/.env.dev`):

```bash
WORKLOAD_VERSION=1.0.0
WORKLOAD_NAME=YourOrganization.YourWorkloadName
ITEM_NAMES=HelloWorld,CustomItem
FRONTEND_APPID=12345678-1234-1234-1234-123456789abc
FRONTEND_URL=http://localhost:60006/
LOG_LEVEL=debug
```

**Staging Configuration** (`Workload/.env.test`):

```bash
WORKLOAD_VERSION=1.0.0
WORKLOAD_NAME=YourOrganization.YourWorkloadName
ITEM_NAMES=HelloWorld,CustomItem
FRONTEND_APPID=12345678-1234-1234-1234-123456789abc
FRONTEND_URL=https://your-staging-url.azurestaticapps.net/
LOG_LEVEL=info
```

**Production Configuration** (`Workload/.env.prod`):

```bash
WORKLOAD_VERSION=1.0.0
WORKLOAD_NAME=YourOrganization.YourWorkloadName
ITEM_NAMES=HelloWorld,CustomItem
FRONTEND_APPID=12345678-1234-1234-1234-123456789abc
FRONTEND_URL=https://your-production-url.azurestaticapps.net/
LOG_LEVEL=warn
```

### 1.2: Configuration Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `WORKLOAD_VERSION` | Version of your workload | `1.0.0` |
| `WORKLOAD_NAME` | Unique workload identifier | `MyCompany.MyWorkload` |
| `ITEM_NAMES` | Comma-separated list of item names | `HelloWorld,CustomItem` |
| `FRONTEND_APPID` | Azure AD App ID for authentication | `12345678-1234-1234-1234-123456789abc` |
| `FRONTEND_URL` | Base URL for workload frontend | `http://localhost:60006/` |
| `LOG_LEVEL` | Logging level | `debug`, `info`, `warn`, `error` |

## Step 2: Apply Configuration Changes

### 2.1: Commit Environment Files

After updating .env files, commit them to version control:

```powershell
git add Workload/.env.dev Workload/.env.test Workload/.env.prod
git commit -m "Update workload configuration"
```

### 2.2: Developer Environment Setup

If workload name or fundamental settings changed, developers need to update their environment:

```powershell
# Each developer runs this to update their local DevGateway configuration
.\scripts\Setup\SetupDevEnvironment.ps1
```

## Step 3: Common Configuration Updates

### 3.1: Update Workload Name

When changing workload name, update all environment files:

```powershell
# Update all .env files with new workload name
(Get-Content Workload\.env.dev) -replace 'WORKLOAD_NAME=.*', 'WORKLOAD_NAME=NewCompany.NewWorkload' | Set-Content Workload\.env.dev
(Get-Content Workload\.env.test) -replace 'WORKLOAD_NAME=.*', 'WORKLOAD_NAME=NewCompany.NewWorkload' | Set-Content Workload\.env.test
(Get-Content Workload\.env.prod) -replace 'WORKLOAD_NAME=.*', 'WORKLOAD_NAME=NewCompany.NewWorkload' | Set-Content Workload\.env.prod
```

### 3.2: Add New Items

When adding new items, update the ITEM_NAMES variable:

```bash
# Before
ITEM_NAMES=HelloWorld

# After
ITEM_NAMES=HelloWorld,NewCustomItem
```

Then create the item configuration in `Workload/Manifest/items/[NewCustomItem]Item/`.

### 3.3: Update Frontend App ID

When changing Azure AD App registration:

```bash
# Update in all environment files
FRONTEND_APPID=new-app-id-here
```

### 3.4: Switch Base URLs for Deployment

For different deployment environments:

```bash
# Development
FRONTEND_URL=http://localhost:60006/

# Staging
FRONTEND_URL=https://staging-workload.azurestaticapps.net/

# Production  
FRONTEND_URL=https://prod-workload.azurestaticapps.net/
```

## Step 4: Template Updates

### 4.1: Update Item Templates

When modifying item configurations, update files in:

- `Workload/Manifest/items/[ItemName]Item/[ItemName]Item.xml` - Use placeholders like `{{WORKLOAD_NAME}}`
- `Workload/Manifest/items/[ItemName]Item/[ItemName]Item.json` - JSON configuration

### 4.2: Update General Workload Templates

Modify workload-level configuration:

- `Workload/Manifest/Product.json` - Workload metadata
- `Workload/Manifest/WorkloadManifest.xml` - Main manifest with placeholders

## Step 5: Validation and Testing

### 5.1: Validate Configuration

Check that all required variables are set:

```powershell
# Validate development environment
Get-Content Workload\.env.dev | Where-Object { $_ -match "^[A-Z_]+=.+" }

# Validate production environment  
Get-Content Workload\.env.prod | Where-Object { $_ -match "^[A-Z_]+=.+" }
```

### 5.2: Test Configuration

Test the updated configuration:

```powershell
# Start development server with updated config
.\scripts\Run\StartDevServer.ps1

# Start DevGateway with updated config
.\scripts\Run\StartDevGateway.ps1
```

## Step 6: Environment Switching

### 6.1: Switch Between Environments

For local testing of different environments:

```powershell
# Use development configuration (default)
Copy-Item Workload\.env.dev Workload\.env

# Use staging configuration
Copy-Item Workload\.env.test Workload\.env

# Use production configuration
Copy-Item Workload\.env.prod Workload\.env
```

### 6.2: Build for Specific Environment

During build/deployment, the appropriate .env file is used automatically based on the target environment.

## Quick Reference

### File Locations

- **Configuration**: `Workload/.env.dev`, `Workload/.env.test`, `Workload/.env.prod`
- **Templates**: `Workload/Manifest/` and `config/templates/Workload/`
- **Generated**: `build/Manifest/` and `build/DevGateway/` (not committed)

### Common Commands

```powershell
# Update developer environment after config changes
.\scripts\Setup\SetupDevEnvironment.ps1

# Start development with current configuration
.\scripts\Run\StartDevServer.ps1
.\scripts\Run\StartDevGateway.ps1

# Switch to production configuration locally
Copy-Item Workload\.env.prod Workload\.env
```

### Key Principles

1. **Edit .env files directly** - No complex scripts needed
2. **Commit all .env files** - Shared team configuration
3. **Use placeholders in templates** - `{{WORKLOAD_NAME}}` for environment-specific generation
4. **Run SetupDevEnvironment.ps1** - When fundamental settings change
5. **Test locally** - Copy appropriate .env file to test different environments

This simplified approach provides maximum flexibility with minimal complexity, making workload configuration management straightforward for all team members.
``` 
    "description": "Updated workload description",
    "version": "1.0.1",
    "organization": "YourOrganization",
    "workloadId": "YourWorkloadName"
  },
  "frontend": {
    "appId": "your-production-app-id",
    "baseUrl": "https://your-workload.azurestaticapps.net/",
    "developmentPort": 5173
  },
  "environment": {
    "development": {
      "workspaceGuid": "your-dev-workspace-guid",
      "debug": true,
      "logLevel": "debug"
    },
    "production": {
      "workspaceGuid": "your-prod-workspace-guid", 
      "debug": false,
      "logLevel": "error"
    }
  }
}
```

### 1.2: Validate Configuration Schema

The configuration file includes JSON schema validation:

```powershell
# The config.json automatically validates against config-schema.json
# VS Code and other editors will show validation errors
```

## Step 2: Generate Configuration Files

### 2.1: Use Quick Update Script (Recommended)

For workload name changes:

```powershell
# Update workload name and regenerate all files
.\scripts\Setup\UpdateWorkloadName.ps1 -WorkloadName "YourOrg.YourWorkload"

# Update with environment files
.\scripts\Setup\UpdateWorkloadName.ps1 -WorkloadName "YourOrg.YourWorkload" -UpdateEnvironmentFiles
```

### 2.2: Use Full Configuration Generator

For comprehensive updates:

```powershell
# Generate all configuration files
.\scripts\Setup\GenerateConfiguration.ps1

# Generate for specific environment
.\scripts\Setup\GenerateConfiguration.ps1 -Environment production

# Force regeneration of all files
.\scripts\Setup\GenerateConfiguration.ps1 -Force
```

## Step 3: Validate Configuration Consistency

### 3.1: Run Configuration Validation

```powershell
# Check configuration consistency  
.\scripts\Setup\ValidateConfiguration.ps1

# Automatically fix inconsistencies
.\scripts\Setup\ValidateConfiguration.ps1 -FixInconsistencies
```

### 3.2: Manual Validation

Verify key files contain correct values:

```powershell
# Check workload name consistency
Select-String -Path "config\Manifest\*.xml" -Pattern "YourOrg.YourWorkload"
Select-String -Path "config\DevGateway\*.json" -Pattern "YourOrg.YourWorkload"
Select-String -Path "Workload\.env*" -Pattern "WORKLOAD_NAME=YourOrg.YourWorkload"
```

## Step 4: Advanced Configuration Updates

### 4.1: Adding New Items

Add items to the shared configuration:

```json
{
  "items": [
    {
      "name": "HelloWorldItem",
      "displayName": "Hello World Item",
      "description": "Existing item",
      "iconPath": "assets/images/HelloWorldItem.svg"
    },
    {
      "name": "NewCustomItem",
      "displayName": "New Custom Item", 
      "description": "Newly added item",
      "iconPath": "assets/images/NewCustomItem.svg"
    }
  ]
}
```

Then regenerate configuration:

```powershell
.\scripts\Setup\GenerateConfiguration.ps1 -Force
```

### 4.2: Environment-Specific Updates

Update environment-specific settings:

```json
{
  "environment": {
    "development": {
      "workspaceGuid": "dev-workspace-guid",
      "debug": true,
      "logLevel": "debug"
    },
    "staging": {
      "workspaceGuid": "staging-workspace-guid",
      "debug": false, 
      "logLevel": "info"
    },
    "production": {
      "workspaceGuid": "prod-workspace-guid",
      "debug": false,
      "logLevel": "error"
    }
  }
}
```

Generate for specific environment:

```powershell
# Generate staging configuration
.\scripts\Setup\GenerateConfiguration.ps1 -Environment staging

# Generate production configuration  
.\scripts\Setup\GenerateConfiguration.ps1 -Environment production
```

### 4.3: Frontend Configuration Updates

Update frontend settings:

```json
{
  "frontend": {
    "appId": "new-app-id",
    "baseUrl": "https://new-domain.azurestaticapps.net/",
    "developmentPort": 3000
  }
}
```

## Step 5: Testing and Validation

### 5.1: Build and Test

After configuration updates:

```powershell
# Validate configuration
.\scripts\Setup\ValidateConfiguration.ps1

# Build manifest package
.\scripts\Build\BuildManifestPackage.ps1

# Test development environment
.\scripts\Run\StartDevGateway.ps1
.\scripts\Run\StartDevServer.ps1
```

### 5.2: Environment Testing

Test each environment configuration:

```powershell
# Test development environment
.\scripts\Setup\GenerateConfiguration.ps1 -Environment development
.\scripts\Run\StartDevGateway.ps1

# Test production environment (after proper setup)
.\scripts\Setup\GenerateConfiguration.ps1 -Environment production
.\scripts\Build\BuildRelease.ps1
```

## Usage

### Quick Commands for Common Updates

#### Update Workload Name
```powershell
# Single command to update workload name everywhere
.\scripts\Setup\UpdateWorkloadName.ps1 -WorkloadName "NewOrg.NewWorkload" -UpdateEnvironmentFiles -Force
```

#### Validate All Configuration
```powershell
# Check and fix all configuration issues
.\scripts\Setup\ValidateConfiguration.ps1 -FixInconsistencies
```

#### Switch Environments
```powershell
# Switch to production configuration
.\scripts\Setup\GenerateConfiguration.ps1 -Environment production

# Switch back to development
.\scripts\Setup\GenerateConfiguration.ps1 -Environment development
```

#### Complete Configuration Regeneration
```powershell
# Force regenerate everything
.\scripts\Setup\GenerateConfiguration.ps1 -Force
```

### Configuration File Relationships

The new system maintains these relationships automatically:

```text
Workload/.env.* (ENVIRONMENT CONFIGURATION)
       ↓
Workload/Manifest/ (TEMPLATES WITH TOKENS)
       ↓
build/Manifest/ (GENERATED - NOT COMMITTED)
build/DevGateway/ (GENERATED - NOT COMMITTED)  
```

### Troubleshooting

#### Issue: Configuration Inconsistency
**Solution**: Run validation and fix
```powershell
.\scripts\Setup\ValidateConfiguration.ps1 -FixInconsistencies
```

#### Issue: Missing Configuration Files
**Solution**: Regenerate all files
```powershell
.\scripts\Setup\GenerateConfiguration.ps1 -Force
```

#### Issue: Wrong Environment Active
**Solution**: Switch to correct environment
```powershell
.\scripts\Setup\GenerateConfiguration.ps1 -Environment development
```

#### Issue: Template Updates Not Applied
**Solution**: Force regeneration
```powershell
.\scripts\Setup\GenerateConfiguration.ps1 -Force
```

This enhanced template system ensures consistent configuration management across all Fabric workload components while maintaining a clean version control structure.

- **`scripts/Setup/Setup.ps1`**: Main setup script that orchestrates the entire process
- **`scripts/Setup/SetupWorkload.ps1`**: Handles workload-specific configuration and template processing

## Files Requiring Updates

When updating a workload name, the following files must be updated consistently:

### 1. Manifest Configuration Files (`build/Manifest/`)

#### `WorkloadManifest.xml`
```xml
<Workload WorkloadName="[Organization].[WorkloadId]" HostingType="FERemote">
```

#### Item Manifest Files (`*Item.xml`)
**All item XML files must be updated:**
- `HelloWorldItem.xml`
- `[ItemName].xml`
- Any custom item XML files

```xml
<Item TypeName="[Organization].[WorkloadId].[ItemName]" Category="Data">
  <Workload WorkloadName="[Organization].[WorkloadId]" />
</Item>
```

### 2. Environment Configuration Files (`Workload/`)

#### `.env.dev`
```bash
WORKLOAD_NAME=[Organization].[WorkloadId]
```

#### `.env.prod`
```bash
WORKLOAD_NAME=[Organization].[WorkloadId]
```

#### `.env.test`
```bash
WORKLOAD_NAME=[Organization].[WorkloadId]
```

### 3. Template Files (`Workload/Manifest/`)

Templates use placeholder tokens that get replaced during setup:

#### `WorkloadManifest.xml`
```xml
<Workload WorkloadName="{{WORKLOAD_NAME}}" HostingType="FERemote">
```

#### Item Template Files
```xml
<Item TypeName="{{WORKLOAD_NAME}}.[ItemName]" Category="Data">
  <Workload WorkloadName="{{WORKLOAD_NAME}}" />
</Item>
```

## Step-by-Step Update Process

### Method 1: Using Setup Scripts (Recommended)

1. **Prepare Parameters**:
   ```powershell
   $WorkloadName = "YourOrg.YourWorkloadId"
   ```

2. **Run Setup Script**:
   ```powershell
   .\scripts\Setup\Setup.ps1 -WorkloadName $WorkloadName -Force $true
   ```

3. **Verify Updates**: Check that all files have been updated with the new workload name

### Method 2: Manual Update Process

#### Step 1: Update Template Files
Update all template files in `Workload/Manifest/` to ensure future setup runs use correct values.

#### Step 2: Update Manifest Files
1. **Update `build/Manifest/WorkloadManifest.xml`**:
   ```xml
   <Workload WorkloadName="NewOrg.NewWorkloadId" HostingType="FERemote">
   ```

2. **Update all Item XML files** in `build/Manifest/`:
   - Find all `*Item.xml` files
   - Update `TypeName` and `WorkloadName` attributes:
   ```xml
   <Item TypeName="NewOrg.NewWorkloadId.ItemName" Category="Data">
     <Workload WorkloadName="NewOrg.NewWorkloadId" />
   </Item>
   ```

#### Step 3: Update Environment Files
Update all three environment files in `Workload/`:

1. **`.env.dev`**:
   ```bash
   WORKLOAD_NAME=NewOrg.NewWorkloadId
   ```

2. **`.env.prod`**:
   ```bash
   WORKLOAD_NAME=NewOrg.NewWorkloadId
   ```

3. **`.env.test`**:
   ```bash
   WORKLOAD_NAME=NewOrg.NewWorkloadId
   ```

#### Step 4: Rebuild and Test
1. **Build manifest package**:
   ```powershell
   .\scripts\Build\BuildManifestPackage.ps1
   ```

2. **Build application**:
   ```powershell
   cd Workload
   npm run build:test
   ```

3. **Test the workload**:
   ```powershell
   npm run start
   ```

## Validation Checklist

After updating the workload name, verify these items:

### Configuration Consistency
- [ ] `WorkloadManifest.xml` contains the new workload name
- [ ] All `*Item.xml` files use the new workload name in both `TypeName` and `WorkloadName`
- [ ] All three `.env` files contain the updated `WORKLOAD_NAME`
- [ ] Template files use `{{WORKLOAD_NAME}}` placeholders correctly

### Build Validation
- [ ] Manifest package builds successfully
- [ ] Frontend application builds without errors
- [ ] No references to old workload name in generated files

### Runtime Validation
- [ ] Workload appears with correct name in Fabric
- [ ] Items can be created and edited successfully
- [ ] No console errors related to workload identification

## Common Issues and Troubleshooting

### Issue: Workload Not Recognized
**Symptoms**: Workload doesn't appear in Fabric or shows as unregistered
**Solutions**:
- Verify `WorkloadManifest.xml` has correct `WorkloadName`
- Ensure environment variables are updated
- Rebuild manifest package
- Restart dev gateway

### Issue: Items Not Loading
**Symptoms**: Items show errors or don't load in editor
**Solutions**:
- Check that all `*Item.xml` files have matching `WorkloadName`
- Verify `TypeName` follows correct pattern: `[Organization].[WorkloadId].[ItemName]`
- Ensure frontend routes match item configurations

### Issue: Template Replacement Failures
**Symptoms**: Setup script fails or generates files with placeholder tokens
**Solutions**:
- Verify template files contain correct `{{WORKLOAD_NAME}}` tokens
- Check that `SetupWorkload.ps1` replacement dictionary includes all required tokens
- Run setup script with `-Force $true` to overwrite existing files

### Issue: Environment Mismatch
**Symptoms**: Different behavior between development and production
**Solutions**:
- Ensure all three `.env` files have the same `WORKLOAD_NAME` value
- Verify the workload name matches between manifest and environment files
- Check that the correct environment file is being used for each build

## Best Practices

### Development Workflow
1. **Always use "Org" organization** for development and testing
2. **Test thoroughly** before changing to production organization name
3. **Use setup scripts** rather than manual updates when possible
4. **Version control** all configuration changes

### Production Deployment
1. **Register organization name** with Microsoft before production deployment
2. **Update organization name** only when ready for production
3. **Test in staging environment** with production organization name
4. **Document organization name** requirements for future developers

### Naming Conventions
1. **Organization names** should be meaningful and registered
2. **WorkloadId** should be descriptive and unique within organization
3. **Avoid special characters** in workload names (use letters, numbers, periods only)
4. **Use PascalCase** for WorkloadId portion

## Integration with CI/CD

### Environment Variables
Configure build pipelines to use environment-specific workload names:

```yaml
variables:
  - name: WORKLOAD_NAME_DEV
    value: "Org.MyWorkload"
  - name: WORKLOAD_NAME_PROD  
    value: "ContosoInc.MyWorkload"
```

### Automated Deployment
Use setup scripts in deployment pipelines:

```yaml
- task: PowerShell@2
  inputs:
    filePath: 'scripts/Setup/Setup.ps1'
    arguments: '-WorkloadName $(WORKLOAD_NAME) -Force $true'
```

This comprehensive approach ensures that workload name updates are applied consistently across all required files and configurations, maintaining the integrity of the Fabric workload throughout the development and deployment lifecycle.


---
applyTo: "/Workload/app/items/[ItemName]Item/"
---

# Create New Workload Item

## 🚨 MANDATORY PROCESS - FOLLOW EXACTLY

**CRITICAL**: This process has multiple steps that are easy to miss. Use disciplined execution:

### 📋 Step 0: Create Complete TODO List (MANDATORY)

Before writing ANY code, create a comprehensive todo list with `manage_todo_list`:

**REQUIRED TODO ITEMS - ALL MUST BE COMPLETED:**
1. Read both instruction files completely
2. 🔍 **DISCOVER EXISTING COMPONENTS** - Search for Base* components before coding
3. Create [ItemName]ItemDefinition.ts with proper interface for storing the state of the item
4. Create [ItemName]ItemEditor.tsx using ItemEditor
5. Create [ItemName]ItemEmptyView.tsx with proper patterns
6. Create [ItemName]ItemDefaultView.tsx using **EXISTING BASE COMPONENTS**
7. Create [ItemName]ItemRibbon.tsx using RibbonToolbar
8. Create [ItemName]Item.scss with ONLY overrides
9. Add route to App.tsx
10. Create manifest JSON and XML files
11. Copy icon file from HelloWorld pattern
12. Add translations to Manifest/assets/locales/en-US/translations.json
13. Add translations to app/assets/locales/en-US/translation.json
14. 🚨 **UPDATE PRODUCT.JSON - CRITICAL FOR ITEM VISIBILITY**
15. Verify all files created and syntax correct

### 🔍 Component Discovery Phase (Step 2)

**MANDATORY**: Before coding any views, search for existing components:

```bash
# Use semantic_search to find existing patterns:
- "ItemEditorView left right split layout"
- "ItemEditorDetailView left center" 
- "Base* components [your use case]"
```

**Available Components (USE THESE - DON'T REINVENT):**
- **ItemEditorView**: Left/center layouts (explorer + content)
- **ItemEditorDetailView**: Detail views with actions
- **ItemEditorEmptyView**: Empty states with tasks

### 🎯 **CRITICAL: When to Use ItemEditorDetailView**

**ALWAYS use ItemEditorDetailView for these scenarios:**

1. **Detail/Drill-down Pages (L2 Pages)**: 
   - Record details, configuration pages, property panels
   - Any page you navigate TO from a main view
   - Pages that need a "back" button

2. **Settings and Configuration**:
   - Item settings, preferences, advanced options
   - Multi-step wizards or forms
   - Property editing interfaces

3. **Edit/View Individual Items**:
   - File viewers, table schemas, record editors
   - Any focused view of a single entity
   - Content that requires dedicated actions

**⚠️ DON'T create custom detail layouts** - ItemEditorDetailView provides:
- ✅ Automatic back navigation (mark view as `isDetailView: true`)
- ✅ Context-specific actions in ribbon
- ✅ Optional left panel for properties/navigation
- ✅ Consistent layout with other detail views
- ✅ Built-in accessibility and responsive behavior

**Example Usage Pattern:**
```tsx
// In your views registration
{
  name: 'record-detail-123',
  component: (
    <ItemEditorDetailView
      left={{
        content: <PropertiesPanel record={record} />,
        title: "Properties",
        width: 280,
        collapsible: true
      }}
      center={{
        content: <RecordEditor record={record} />
      }}
      actions={[
        { key: 'save', label: 'Save', icon: Save24Regular, onClick: handleSave },
        { key: 'delete', label: 'Delete', icon: Delete24Regular, onClick: handleDelete }
      ]}
    />
  ),
  isDetailView: true  // ⭐ This enables automatic back navigation
}
```

### 🔄 Execution Rules (MANDATORY)

1. **Mark ONE todo in-progress** before starting work
2. **Complete that todo FULLY** - no partial work
3. **Mark completed IMMEDIATELY** after finishing
4. **NEVER skip Product.json** - it's required for Fabric integration
5. **Follow HelloWorld patterns EXACTLY** - including version numbers

---

## 🏗️ Architecture Overview

**CRITICAL**: All item editors MUST use the standardized architecture patterns:

### Required Base Components

1. **ItemEditor** (`Workload/app/components/ItemEditor/ItemEditor.tsx`)
   - 🚨 **MANDATORY**: ALL item editors must use ItemEditor as the container
   - Provides consistent layout: Fixed ribbon + scrollable content
   - Handles full-height iframe rendering
   - Ensures proper scroll behavior (ribbon stays fixed, content scrolls)
   - **DO NOT create custom layout patterns** - use ItemEditor

2. **Ribbon Components** (`Workload/app/components/ItemEditor/`)
   - 🚨 **MANDATORY**: Use the standardized Ribbon pattern
   - **Ribbon**: Standard ribbon structure with tabs
   - **RibbonToolbar**: Renders action buttons with proper spacing
   - **Standard Action Factories**: `createSaveAction`, `createSettingsAction`
   - **Tooltip + ToolbarButton**: ALWAYS wrap ToolbarButton in Tooltip for accessibility

### Standard Architecture Pattern

```typescript
// CORRECT Pattern - Use ItemEditor + Standard Ribbon
export function [ItemName]ItemEditor(props: PageProps) {
  // ... state and logic ...
  
  return (
    <ItemEditor
      ribbon={
        <[ItemName]ItemRibbon
          saveItemCallback={handleSave}
          openSettingsCallback={handleSettings}
          isSaveButtonEnabled={hasChanges}
        />
      }
    >
      {currentView === EDITOR_VIEW_TYPES.EMPTY ? (
        <[ItemName]ItemEmptyView {...emptyProps} />
      ) : (
        <[ItemName]ItemDefaultView {...defaultProps} />
      )}
    </ItemEditor>
  );
}
```

### ❌ INCORRECT Patterns - DO NOT USE

```typescript
// ❌ WRONG: Custom Stack layout without ItemEditor
<Stack className="editor">
  <MyCustomRibbon />
  <Stack className="main">
    {content}
  </Stack>
</Stack>

// ❌ WRONG: Not using standard ribbon components
<div className="custom-toolbar">
  <button onClick={save}>Save</button>  // No Tooltip wrapper
</div>

// ❌ WRONG: Custom scroll handling
<div style={{height: '100vh', overflow: 'scroll'}}>
  {/* ItemEditor handles this */}
</div>
```

### Key Benefits of Standard Architecture

✅ **Consistent UX**: All items look and behave the same way  
✅ **Accessibility**: Built-in ARIA labels, keyboard navigation, screen reader support  
✅ **Maintenance**: Centralized updates benefit all items  
✅ **Scroll Behavior**: Proper fixed ribbon + scrollable content  
✅ **Responsive**: Mobile-friendly layouts and touch targets  
✅ **Testing**: Standard patterns = standard test coverage  

### 🚨 CRITICAL: Styling Requirements

**MANDATORY**: All styling MUST follow the standardized patterns and will be verified by the verification team:

1. **Component Styles** (🚫 STRICTLY FORBIDDEN TO MODIFY):
   - **DO NOT EDIT**: Any files in `Workload/app/components/` directory
   - **DO NOT MODIFY**: `ItemEditor.scss`, `Ribbon.scss`, `OneLakeView.scss`, `Wizard.scss`, etc.
   - **REASON**: Components provide standardized layouts and functionality for all items
   - **CONSEQUENCE**: Modifications to control files will fail verification and break other items

2. **Item-Specific Styles** (✅ REQUIRED):
   - Create `[ItemName]Item.scss` in your item folder (`Workload/app/items/[ItemName]/`)
   - Import item styles: `import "./[ItemName]Item.scss";`
   - Define ONLY item-specific branding, colors, and custom content styling
   - Use prefixed class names: `.hello-world-*`, `.data-analyzer-*` for clear item identification

3. **Styling Pattern** (HelloWorld Example):
   ```scss
   // [ItemName]Item.scss - All item-specific styles
   .hello-world-view {
     /* Typical views need padding to prevent content from touching edges */
     padding: var(--spacingVerticalL, 12px);
     /* Add other item-specific styles like colors, layout, or branding */
   }
   
   .hello-world-section-title {
     color: var(--colorBrandForeground1);
     font-weight: var(--fontWeightSemibold);
   }
   ```

4. **Component Usage**:
   ```tsx
   // Use item-specific classes for your content
   <div className="hello-world-view">
     <div className="hello-world-section-title">
       {/* Content with item-specific styling */}
     </div>
   </div>
   ```

4. **Verification Checklist** (Will be checked):
   - ✅ ItemEditor used (no custom editor layout)
   - ✅ Ribbon + RibbonToolbar used (no custom ribbon layout)  
   - ✅ Styles in separate `[ItemName]Item.scss` file in item directory
   - ✅ **NO MODIFICATIONS** to any files in `components/` directory
   - ✅ Item-specific class naming pattern used (`.item-name-*`)
   - ✅ Only item content and branding styled, not control structure
   - ✅ Import pattern: `import "./[ItemName]Item.scss";` (no global imports)

**❌ STYLE VIOLATIONS** (Will fail verification):
```scss
// ❌ WRONG: Modifying control files
// components/ItemEditor/ItemEditor.scss
.item-editor-container {
  background: blue;  // FORBIDDEN: Don't modify control styles
}

// ❌ WRONG: Modifying any control files
// components/Ribbon/Ribbon.scss, components/OneLakeView/OneLakeView.scss, etc.
}

// ❌ WRONG: Not using separate SCSS file
// Inline styles in JSX
<div style={{background: 'blue'}}>  // Use SCSS file instead

// ❌ WRONG: Duplicating control structural styles
// [ItemName]Item.scss
.my-item-view {
  display: flex;           // ❌ Don't duplicate layout from components
  flex-direction: column;  // ❌ components handle their own structure
  background: blue;        // ✅ Only item-specific styles like this
}
```

---

## Process

This guide provides step-by-step instructions for AI tools to create a new item in the Microsoft Fabric Extensibility Toolkit. Creating a new item requires implementation files, manifest configuration, routing setup, and environment variable updates.

**🚨 REMEMBER**: 
- Always use ItemEditor and standard Ribbon components!
- **CRITICAL**: Must update Product.json to register item in create dialogs
- **OneLakeStorageClient**: Always use `createItemWrapper()` for item-scoped OneLake operations
- **OneLakeView**: Use the control from `components/OneLakeView`, NOT the sample code

### Step 1: Create Item Implementation Structure

1. **Create item directory**:
   ```
   Workload/app/items/[ItemName]Item/
   ```

2. **Create the required implementation files**:
   - `[ItemName]ItemDefinition.ts` - Data model and interface definitions
   - `[ItemName]ItemEditor.tsx` - Main editor component
   - `[ItemName]ItemEmptyView.tsx` - Empty state component (shown when item is first created)
   - `[ItemName]ItemDefaultView.tsx` - Default/main content view (shown when item has data)
   - `[ItemName]ItemRibbon.tsx` - Ribbon/toolbar component

### Step 2: Implement the Model (`[ItemName]ItemDefinition.ts`)

The model defines the data structure that will be stored in Fabric. **Use the HelloWorld pattern**:

```typescript
// Based on HelloWorldItemDefinition.ts
export interface [ItemName]ItemDefinition {
  // Add your item-specific properties here
  // Example: Follow HelloWorld pattern with a simple property
  message?: string;
  // Add more properties as needed:
  // title?: string;
  // description?: string;
  // configuration?: any;
}
```

**Key Points**:
- Define the interface that represents your item's state
- This data will be persisted in Fabric's storage
- Keep it serializable (JSON-compatible types only)
- Follow the HelloWorld pattern for consistency

### Step 3: Implement the Editor (`[ItemName]ItemEditor.tsx`)

The main editor component handles the item's primary interface. **🚨 CRITICAL: MUST use ItemEditor component!**

```typescript
// Based on HelloWorldItemEditor.tsx - Complete functional implementation with ItemEditor
import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { MessageBar, MessageBarBody } from "@fluentui/react-components";
import { Warning20Filled } from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { PageProps, ContextProps } from "../../App";
import { ItemWithDefinition, getWorkloadItem, callGetItem, saveItemDefinition } from "../../controller/ItemCRUDController";
import { callOpenSettings } from "../../controller/SettingsController";
import { callNotificationOpen } from "../../controller/NotificationController";
import { ItemEditor, ItemEditorEmptyView } from "../../components/ItemEditor";
import { [ItemName]ItemDefinition } from "./[ItemName]ItemDefinition";
import { [ItemName]ItemDefaultView } from "./[ItemName]ItemDefaultView";
import { [ItemName]ItemRibbon } from "./[ItemName]ItemRibbon";
import "./[ItemName]Item.scss";


export function [ItemName]ItemEditor(props: PageProps) {
  const { workloadClient } = props;
  const pageContext = useParams<ContextProps>();
  const { t } = useTranslation();

  // Different views that are available for the [ItemName] item
  const EDITOR_VIEW_TYPES = {
    EMPTY: 'empty',
    DEFAULT: 'default',
  } as const;

  type CurrentView = keyof typeof EDITOR_VIEW_TYPES;

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [item, setItem] = useState<ItemWithDefinition<[ItemName]ItemDefinition>>();
  const [currentView, setCurrentView] = useState<CurrentView>(EDITOR_VIEW_TYPES.EMPTY);
  const [hasBeenSaved, setHasBeenSaved] = useState<boolean>(false);

  const { pathname } = useLocation();

  async function loadDataFromUrl(pageContext: ContextProps, pathname: string): Promise<void> {
    setIsLoading(true);
    var LoadedItem: ItemWithDefinition<[ItemName]ItemDefinition> = undefined;
    if (pageContext.itemObjectId) {
      try {
        LoadedItem = await getWorkloadItem<[ItemName]ItemDefinition>(
          workloadClient,
          pageContext.itemObjectId,
        );

        // Ensure item definition is properly initialized without mutation
        if (!LoadedItem.definition) {
          LoadedItem = {
            ...LoadedItem,
            definition: {
              state: undefined,
            }
          };
        }

        setItem(LoadedItem);
        setCurrentView(!LoadedItem?.definition?.state ? EDITOR_VIEW_TYPES.EMPTY : EDITOR_VIEW_TYPES.DEFAULT);

      } catch (error) {
        setItem(undefined);
      }
    } else {
      console.log(`non-editor context. Current Path: ${pathname}`);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    setHasBeenSaved(false);
  }, [currentView, item?.id]);

  useEffect(() => {
    loadDataFromUrl(pageContext, pathname);
  }, [pageContext, pathname]);

  const navigateToDefaultView = () => {
    setCurrentView(EDITOR_VIEW_TYPES.DEFAULT);
  };

  const handleOpenSettings = async () => {
    if (item) {
      try {
        const item_res = await callGetItem(workloadClient, item.id);
        await callOpenSettings(workloadClient, item_res.item, 'About');
      } catch (error) {
        console.error('Failed to open settings:', error);
      }
    }
  };

  async function SaveItem() {
    var successResult = await saveItemDefinition<[ItemName]ItemDefinition>(
      workloadClient,
      item.id,
      {
        state: EDITOR_VIEW_TYPES.DEFAULT
      });
    const wasSaved = Boolean(successResult);
    setHasBeenSaved(wasSaved);
    callNotificationOpen(
      props.workloadClient,
      t("ItemEditor_Saved_Notification_Title"),
      t("ItemEditor_Saved_Notification_Text", { itemName: item.displayName }),
      undefined,
      undefined
    );
  }

  const isSaveEnabled = () => {
    if (currentView === EDITOR_VIEW_TYPES.EMPTY) {
      return false;
    }

    if (currentView === EDITOR_VIEW_TYPES.DEFAULT) {
      if (hasBeenSaved) {
        return false;
      }

      if (!item?.definition?.state) {
        return true;
      }

      return false;
    }

    return false;
  };

  // ItemEditor handles loading state internally
  return (
    <ItemEditor
      ribbon={
        <[ItemName]ItemRibbon
          {...props}
          isSaveButtonEnabled={isSaveEnabled()}
          currentView={currentView}
          saveItemCallback={SaveItem}
          openSettingsCallback={handleOpenSettings}
          navigateToDefaultViewCallback={navigateToDefaultView}
        />
      }
      views={(setCurrentView) => [
        {
          name: EDITOR_VIEW_TYPES.EMPTY,
          component: (
            <ItemEditorEmptyView
              title={t('[ItemName]ItemEmptyView_Title', 'Welcome to [ItemName]!')}
              description={t('[ItemName]ItemEmptyView_Description', 'Get started with your new item')}
              imageSrc="/assets/items/[ItemName]Item/EditorEmpty.svg"
              imageAlt="Empty state illustration"
              tasks={[
                {
                  id: 'getting-started',
                  label: t('[ItemName]ItemEmptyView_StartButton', 'Getting Started'),
                  onClick: () => setCurrentView(EDITOR_VIEW_TYPES.DEFAULT),
                  appearance: 'primary'
                }
              ]}
            />
          )
        },
        {
          name: EDITOR_VIEW_TYPES.DEFAULT,
          component: (
            <[ItemName]ItemDefaultView
              workloadClient={workloadClient}
              item={item}
            />
          )
        }
        // 🎯 FOR DETAIL VIEWS (L2 Pages): Add additional views here
        // {
        //   name: 'record-detail-123',
        //   component: (
        //     <ItemEditorDetailView
        //       left={{
        //         content: <PropertiesPanel />,
        //         title: "Properties",
        //         width: 240
        //       }}
        //       center={{
        //         content: <RecordEditor />
        //       }}
        //       actions={[
        //         { key: 'save', label: 'Save', icon: Save24Regular, onClick: handleSave },
        //         { key: 'delete', label: 'Delete', icon: Delete24Regular, onClick: handleDelete }
        //       ]}
        //     />
        //   ),
        //   isDetailView: true  // ⭐ CRITICAL: Enables automatic back navigation
        // }
      ]}
      initialView={!item?.definition?.state ? EDITOR_VIEW_TYPES.EMPTY : EDITOR_VIEW_TYPES.DEFAULT}
    />
  );
}
```

**🚨 CRITICAL Architecture Requirements**:

1. **ItemEditor Container**:
   - MUST use `<ItemEditor>` as the root container
   - Provides fixed ribbon + scrollable content layout
   - Handles proper scroll behavior automatically
   - DO NOT create custom layout patterns

2. **View Registration System** (MANDATORY):
   - Use `views={(setCurrentView) => [...]}` prop to register views
   - Each view has `name` and `component` properties
   - Use `initialView` prop to set the starting view
   - Views are automatically managed by ItemEditor

3. **Ribbon Prop**:
   - Pass ribbon component via `ribbon={<[ItemName]ItemRibbon />}` prop
   - Ribbon will be fixed at the top (doesn't scroll)
   - Use standard Ribbon components (see Step 5)

4. **Notification Prop** (Optional):
   - Pass notification via `notification={<MessageBar />}` prop
   - Appears between ribbon and content
   - Fixed position (doesn't scroll)

5. **View Navigation**:
   - Views receive `setCurrentView` function for navigation
   - Call `setCurrentView(EDITOR_VIEW_TYPES.VIEWNAME)` to switch views
   - DO NOT use manual if/else statements in children

5. **Automatic Loading Handling**:
   - ItemEditor automatically handles loading states internally
   - DO NOT manually check `isLoading` before rendering ItemEditor
   - DO NOT import or use `ItemEditorLoadingView` - it's handled internally

**Key Features**:

- **Complete State Management**: Loading, saving, and updating item definitions
- **View Switching**: Automatic transitions between empty and loaded states
- **ItemEditor Integration**: Proper use of the standard layout component
- **Error Handling**: Proper try/catch for async operations
- **Immutable Updates**: Safe state updates using functional patterns
- **Notifications**: User feedback on save operations
- **Settings Integration**: Opens item settings when needed
- **Loading States**: Progress indicators during data operations

### Step 4: Implement the Empty State (`[ItemName]ItemEmptyView.tsx`)

The empty state is shown when users first create the item. **🚨 CRITICAL: Use ItemEditorEmptyView component**:

```typescript
// Based on HelloWorldItemEmptyView.tsx - Uses ItemEditorEmptyView component
import React from "react";
import { useTranslation } from "react-i18next";

import { WorkloadClientAPI } from "@ms-fabric/workload-client";
import { ItemWithDefinition } from "../../controller/ItemCRUDController";
import { [ItemName]ItemDefinition } from "./[ItemName]ItemDefinition";
import { ItemEditorEmptyView, EmptyStateTask } from "../../components/ItemEditor";

interface [ItemName]ItemEmptyViewProps {
  workloadClient: WorkloadClientAPI;
  item?: ItemWithDefinition<[ItemName]ItemDefinition>;
  onNavigateToDefaultView: () => void;
}

/**
 * Empty state component - the first screen users see
 * This component uses the ItemEditorEmptyView control for consistency
 * across all item types.
 */
export function [ItemName]ItemEmptyView({
  workloadClient,
  item,
  onNavigateToDefaultView
}: [ItemName]ItemEmptyViewProps) {
  const { t } = useTranslation();

  // Define onboarding tasks using the standard EmptyStateTask interface
  const tasks: EmptyStateTask[] = [
    {
      id: 'getting-started',
      label: t('[ItemName]ItemEmptyView_StartButton', 'Getting Started'),
      description: t('[ItemName]ItemEmptyView_StartDescription', 'Learn how to use this item'),
      onClick: onNavigateToDefaultView,
      appearance: 'primary'
    }
  ];

  return (
    <ItemEditorEmptyView
      title={t('[ItemName]ItemEmptyView_Title', 'Welcome to [ItemName]!')}
      description={t('[ItemName]ItemEmptyView_Description', 'This is the first screen people will see after an item is created. Include some basic information to help them continue.')}
      imageSrc="/assets/items/[ItemName]Item/EditorEmpty.svg"
      imageAlt="Empty state illustration"
      tasks={tasks}
    />
  );
}
```

**🚨 CRITICAL Requirements**:

1. **Use ItemEditorEmptyView** (MANDATORY):
   - Import from `../../components`
   - Provides consistent empty state UI across all items
   - DO NOT create custom empty state layouts

2. **EmptyStateTask Interface** (REQUIRED):
   - Use `EmptyStateTask[]` for defining action buttons
   - Standard properties: `id`, `label`, `description`, `onClick`, `appearance`
   - Tasks are automatically rendered as buttons by ItemEditorEmptyView

3. **Standard Props** (REQUIRED):
   - `title`: Main heading displayed to users
   - `description`: Explanatory text below title
   - `imageSrc`: Path to empty state illustration
   - `imageAlt`: Accessibility text for illustration
   - `tasks`: Array of EmptyStateTask for user actions

**Key Features**:

- ✅ **Consistency**: Same empty state pattern across all item editors
- ✅ **Accessibility**: Built-in ARIA labels and keyboard navigation
- ✅ **Localization**: Uses translation keys for all user-facing text
- ✅ **Standard Layout**: Follows Fabric design guidelines automatically
- ✅ **Maintainability**: Changes to empty state behavior centralized
- ✅ **Less Code**: Base component handles layout and styling

### Step 4.1: Implement the Default View (`[ItemName]ItemDefaultView.tsx`)

The default view is shown when the item has content and is the main editing interface.

#### Architecture Decision: Choose the Right Component

**For Simple Main Views** - Use standard React components with ItemEditor:

- Dashboard-style layouts with cards and summary information
- List views, tables, or data grids as primary content
- Simple editing interfaces without drill-down functionality

**For Detail/Drill-down Views (L2 Pages)** - Use ItemEditorDetailView:

- Record details, settings pages, configuration panels
- Any view that users navigate TO from another view
- Views that need context-specific actions and back navigation
- **Mark as `isDetailView: true` in view registration for automatic back navigation**

**Use the HelloWorld pattern as template for simple main views**:

```typescript
// Based on HelloWorldItemDefaultView.tsx - Complete functional implementation
import React, { useState, useEffect } from "react";
import { Stack } from "@fluentui/react";
import { Text, Input, Button, Card, CardHeader } from "@fluentui/react-components";
import "./[ItemName]Item.scss";
import { useTranslation } from "react-i18next";
import { WorkloadClientAPI } from "@ms-fabric/workload-client";
import { ItemWithDefinition, saveItemDefinition } from "../../controller/ItemCRUDController";
import { [ItemName]ItemDefinition } from "./[ItemName]ItemDefinition";

interface [ItemName]ItemDefaultViewProps {
  workloadClient: WorkloadClientAPI;
  item: ItemWithDefinition<[ItemName]ItemDefinition>;
}

export const [ItemName]ItemDefaultView: React.FC<[ItemName]ItemDefaultViewProps> = ({
  workloadClient,
  item
}) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState<string>(item?.definition?.message || "");
  const [isEdited, setIsEdited] = useState<boolean>(false);

  // Track changes to enable save functionality
  useEffect(() => {
    setIsEdited(message !== (item?.definition?.message || ""));
  }, [message, item?.definition?.message]);

  const handleMessageChange = (value: string) => {
    setMessage(value);
  };

  const handleSaveChanges = async () => {
    if (item && isEdited) {
      try {
        await saveItemDefinition<[ItemName]ItemDefinition>(
          workloadClient,
          item.id,
          {
            ...item.definition,
            message: message
          }
        );
        setIsEdited(false);
      } catch (error) {
        console.error('Failed to save changes:', error);
      }
    }
  };

  return (
    <div className="editor-default-view">
      <Stack tokens={{ childrenGap: 24 }} style={{ padding: '24px' }}>
        <Stack.Item>
          <Text as="h1" size={900} weight="semibold">
            {t('[ItemName]ItemDefaultView_Title', `${item?.displayName} Editor`)}
          </Text>
        </Stack.Item>
        
        <Stack.Item>
          <Card>
            <CardHeader
              header={
                <Text weight="semibold">
                  {t('[ItemName]ItemDefaultView_Content_Header', 'Content')}
                </Text>
              }
            />
            <Stack tokens={{ childrenGap: 16 }} style={{ padding: '16px' }}>
              <Stack.Item>
                <Text>
                  {t('[ItemName]ItemDefaultView_Message_Label', 'Message:')}
                </Text>
              </Stack.Item>
              <Stack.Item>
                <Input
                  value={message}
                  onChange={(e, data) => handleMessageChange(data.value)}
                  placeholder={t('[ItemName]ItemDefaultView_Message_Placeholder', 'Enter your message here...')}
                  style={{ width: '100%' }}
                />
              </Stack.Item>
              {isEdited && (
                <Stack.Item>
                  <Button 
                    appearance="primary" 
                    onClick={handleSaveChanges}
                  >
                    {t('[ItemName]ItemDefaultView_Save_Button', 'Save Changes')}
                  </Button>
                </Stack.Item>
              )}
            </Stack>
          </Card>
        </Stack.Item>
        
        <Stack.Item>
          <Text size={400} style={{ color: 'var(--colorNeutralForeground3)' }}>
            {t('[ItemName]ItemDefaultView_Help_Text', 'This is your main editing interface. Customize this view based on your item\'s functionality.')}
          </Text>
        </Stack.Item>
      </Stack>
    </div>
  );
};
```

**Key Features**:

- **State Management**: Tracks changes and enables conditional save functionality
- **User Interface**: Clean card-based layout following Fluent UI patterns
- **Change Detection**: Automatically detects when content has been modified
- **Save Integration**: Provides inline save functionality for immediate feedback
- **Localization Support**: Uses translation keys for all user-facing text
- **Responsive Design**: Adapts to different screen sizes and container widths
- **Error Handling**: Includes proper try/catch for save operations

### Step 4.2: OneLakeStorageClient Best Practices

**🚨 CRITICAL**: When working with OneLake storage in item contexts, ALWAYS use the wrapper pattern for correct path handling.

#### ✅ **CORRECT Pattern** - Use createItemWrapper():

```typescript
// ✅ ALWAYS use this pattern for item-scoped OneLake operations
const oneLakeClient = new OneLakeStorageClient(props.workloadClient);
const itemWrapper = oneLakeClient.createItemWrapper({
  id: props.item.id,
  workspaceId: props.item.workspaceId
});

// Now use wrapper methods with relative paths
await itemWrapper.writeFileAsBase64('Files/myfile.txt', base64Content);
const content = await itemWrapper.readFileAsText('Files/myfile.txt');
const fullPath = itemWrapper.getPath('Files/myfile.txt'); // For storage in definitions
```

#### ❌ **WRONG Pattern** - Direct client with manual paths:

```typescript
// ❌ NEVER do this - manual path construction is error-prone
const oneLakeClient = new OneLakeStorageClient(props.workloadClient);
const filePath = `${props.item.id}/Files/myfile.txt`; // Manual path construction
await oneLakeClient.writeFileAsBase64(filePath, base64Content);
```

#### **Key Benefits of Wrapper Pattern:**

- **Automatic Path Prefixing**: Handles workspace/item ID correctly
- **Type Safety**: Ensures correct item context
- **Cleaner API**: Relative paths instead of full OneLake paths  
- **Error Prevention**: Can't accidentally use wrong workspace/item IDs
- **Consistency**: All operations use the same item context

### Step 4.3: OneLakeView Control Usage

**🚨 CRITICAL**: Use the new OneLakeView control for OneLake browsing functionality. Do NOT copy code from the sample.

#### ✅ **CORRECT Pattern** - Use the reusable control:

```typescript
// ✅ Import the OneLakeView control
import { OneLakeView } from '../../../components/OneLakeView';

// ✅ Use the control with proper configuration
<OneLakeView
  workloadClient={props.workloadClient}
  config={{
    mode: "edit", // or "view" for read-only
    allowItemSelection: true,
    allowedItemTypes: ["Lakehouse", "Warehouse", "KQLDatabase"],
    initialItem: {
      id: props.item.id,
      workspaceId: props.item.workspaceId,
      displayName: props.item.displayName
    },
    refreshTrigger: refreshTrigger
  }}
  callbacks={{
    onFileSelected: async (fileName: string, oneLakeLink: string) => {
      // Handle file selection
    },
    onTableSelected: async (tableName: string, oneLakeLink: string) => {
      // Handle table selection  
    },
    onItemChanged: async (item) => {
      // Handle item change (e.g., user selects different item from DataHub)
    }
  }}
/>
```

#### ❌ **WRONG Pattern** - Don't copy from samples:

```typescript
// ❌ NEVER copy SampleOneLakeViewComponent code
// Use the OneLakeView control instead
import { OneLakeViewComponent } from '../../../samples/views/SampleOneLakeView';

// ❌ This is a sample wrapper, not the reusable control
<OneLakeViewComponent ... />
```

#### ❌ **WRONG Pattern** - Missing configuration:

```typescript
// ❌ NEVER do this - control will show empty state without initialItem
<OneLakeView
  workloadClient={props.workloadClient}
  config={{
    mode: "view",
    allowItemSelection: true,
    // ❌ Missing initialItem - control will show empty state
  }}
  callbacks={{}}
/>
```

#### **Key Points:**

- **Use Control Not Sample**: Import from `components/OneLakeView`, not samples
- **initialItem Required**: Control needs current item to load and display content
- **All Properties Needed**: Must include `id`, `workspaceId`, and `displayName`  
- **Empty State Handling**: Control shows add button when no initialItem provided
- **Refresh Support**: Use `refreshTrigger` to force re-fetch when needed
- **Clean API**: config and callbacks are clearly separated

### Step 5: Implement the Ribbon (`[ItemName]ItemRibbon.tsx`)

The ribbon provides toolbar actions and navigation tabs. **🚨 CRITICAL: Use standard Ribbon components!**

```typescript
// Based on HelloWorldItemRibbon.tsx - Demonstrates RECOMMENDED ribbon pattern
import React from "react";
import { PageProps } from '../../App';
import { CurrentView, EDITOR_VIEW_TYPES } from "./[ItemName]ItemDefinition";
import { useTranslation } from "react-i18next";
import { 
  Ribbon, 
  RibbonToolbar, 
  RibbonAction,
  createSaveAction,
  createSettingsAction,
  createRibbonTabs
} from '../../components/ItemEditor';
import { Rocket24Regular } from '@fluentui/react-icons';

/**
 * Props interface for the [ItemName] Ribbon component
 */
export interface [ItemName]ItemRibbonProps extends PageProps {
  isSaveButtonEnabled?: boolean;
  currentView: CurrentView;
  saveItemCallback: () => Promise<void>;
  openSettingsCallback: () => Promise<void>;
  navigateToDefaultViewCallback: () => void;
}

/**
 * [ItemName]ItemRibbon - Implements the standard ribbon pattern
 * 
 * This demonstrates the MANDATORY pattern for creating consistent ribbons
 * across all item editors in the Fabric Extensibility Toolkit.
 * 
 * 🚨 REQUIRED COMPONENTS:
 * - Ribbon: Provides consistent ribbon structure and layout
 * - RibbonToolbar: Renders actions with automatic Tooltip + ToolbarButton pattern
 * - createRibbonTabs: Ensures Home tab is always present
 * - Standard action factories: createSaveAction, createSettingsAction
 * 
 * Key Features:
 * - Automatic accessibility (Tooltip + ToolbarButton pattern)
 * - Consistent styling across all item editors
 * - Follows Fabric design guidelines
 * - Support for custom actions when needed
 */
export function [ItemName]ItemRibbon(props: [ItemName]ItemRibbonProps) {
  const { t } = useTranslation();
  
  // Create a translation helper function for action factories
  const translate = (key: string, fallback?: string) => t(key, fallback);
  
  // 🚨 REQUIRED: Define ribbon tabs using createRibbonTabs
  // Home tab is mandatory, additional tabs can be added as second parameter
  const tabs = createRibbonTabs(
    t("ItemEditor_Ribbon_Home_Label")
    // Additional tabs can be added here:
    // [
    //   createDataTab(t("Data")),
    //   createFormatTab(t("Format"))
    // ]
  );
  
  // Define ribbon actions - mix of standard and custom actions
  const actions: RibbonAction[] = [
    // 🚨 STANDARD ACTION: Save button (mandatory for most items)
    // Use createSaveAction factory for consistent behavior
    createSaveAction(
      props.saveItemCallback,
      !props.isSaveButtonEnabled,  // disabled when save not needed
      translate
    ),
    
    // ✅ OPTIONAL ACTION: Settings button (if your item needs settings)
    // Use createSettingsAction factory for consistent behavior when needed
    createSettingsAction(
      props.openSettingsCallback,
      translate
    ),
    
    // ✅ CUSTOM ACTION EXAMPLE: View navigation
    // Define custom actions inline for item-specific functionality
    {
      key: 'navigate-default',
      icon: Rocket24Regular,
      label: t("ItemEditor_Ribbon_Navigate_Label", "Navigate to Default"),
      onClick: props.navigateToDefaultViewCallback,
      testId: 'ribbon-navigate-default-btn',
      hidden: props.currentView !== EDITOR_VIEW_TYPES.EMPTY  // Only show in EMPTY view
    }
  ];
  
  // 🚨 REQUIRED: Use Ribbon + RibbonToolbar pattern
  return (
    <Ribbon tabs={tabs}>
      <RibbonToolbar actions={actions} />
    </Ribbon>
  );
}
```

**🚨 CRITICAL Architecture Requirements**:

1. **Ribbon Component** (MANDATORY):
   - Use `<Ribbon tabs={tabs}>` as the container
   - Provides consistent structure and styling
   - DO NOT create custom ribbon layouts with `<div className="ribbon">`

2. **RibbonToolbar Component** (MANDATORY):
   - Use `<RibbonToolbar actions={actions} />` for action rendering
   - Automatically applies Tooltip + ToolbarButton pattern
   - Handles accessibility and styling automatically
   - DO NOT create custom `<Toolbar>` components

3. **createRibbonTabs Helper** (MANDATORY):
   - Use `createRibbonTabs()` to define tabs
   - Ensures Home tab is always present
   - Accepts Home tab label and optional additional tabs array

4. **Standard Action Factories** (use when needed):
   - `createSaveAction()`: Save button with standard behavior (required for most items)
   - `createSettingsAction()`: Settings button with standard behavior (optional, only if item needs settings)
   - Import from `'../../components/ItemEditor'`

5. **Custom Actions** (when needed):
   - Define inline as `RibbonAction` objects
   - Include: key, icon, label, onClick, testId
   - Optional: disabled, hidden (for conditional visibility)

**❌ INCORRECT Patterns - DO NOT USE**:

```typescript
// ❌ WRONG: Custom ribbon layout
return (
  <div className="ribbon">
    <TabList><Tab>Home</Tab></TabList>
    <Toolbar>
      <Tooltip><ToolbarButton /></Tooltip>
    </Toolbar>
  </div>
);

// ❌ WRONG: Manual Tooltip + ToolbarButton pattern
<Toolbar>
  <Tooltip content="Save" relationship="label">
    <ToolbarButton icon={<Save24Regular />} onClick={onSave} />
  </Tooltip>
</Toolbar>

// ❌ WRONG: Creating custom action factories
export function createCustomSaveAction() { ... }  // Use standard factories instead
```

**✅ CORRECT Pattern**:

```typescript
// ✅ CORRECT: Use standard components and factories
const tabs = createRibbonTabs(t("Home"));
const actions = [
  createSaveAction(onSave, disabled, label),
  createSettingsAction(onSettings, label),
  { key: 'custom', icon: Icon, label, onClick, testId }  // Custom actions inline
];

return (
  <Ribbon tabs={tabs}>
    <RibbonToolbar actions={actions} />
  </Ribbon>
);
```

**Key Benefits**:

- ✅ **Consistency**: Same ribbon pattern across all item editors
- ✅ **Accessibility**: Automatic Tooltip + ToolbarButton implementation
- ✅ **Maintainability**: Changes to ribbon behavior centralized
- ✅ **Type Safety**: TypeScript interfaces ensure correct usage
- ✅ **Less Code**: Factory functions reduce boilerplate
- ✅ **Best Practices**: Follows Fabric design guidelines automatically

### Step 5.1: Create Item-Specific Styles (`[ItemName]Item.scss`)

**🚨 MANDATORY**: Create a separate SCSS file for item-specific styling. This will be verified by the verification team.

**File Location**: `Workload/app/items/[ItemName]Item/[ItemName]Item.scss`

```scss
// [ItemName]Item.scss - Item-specific styles
// Based on HelloWorldItem.scss pattern

// 🚨 IMPORTANT: Contains ONLY item-specific styles
// Components provide their own layout/structure (DO NOT modify control files)

// Example: Item-specific view styling
.[item-name]-view {
  background-color: var(--colorNeutralBackground1);
  padding: var(--spacingVerticalL);
  border-radius: var(--borderRadiusMedium);
}

// Example: Item-specific section headers
.[item-name]-section-title {
  color: var(--colorBrandForeground1);
  font-size: var(--fontSizeBase500);
  font-weight: var(--fontWeightSemibold);
  margin-bottom: var(--spacingVerticalM);
}

// Example: Item-specific hero section
.[item-name]-hero-section {
  background: linear-gradient(135deg, var(--colorBrandBackground), var(--colorBrandBackground2));
  padding: var(--spacingVerticalXXL) var(--spacingHorizontalXL);
  border-radius: var(--borderRadiusLarge);
  color: var(--colorNeutralForegroundOnBrand);
}

// Add other item-specific styles here - NO CONTROL MODIFICATIONS
```

**Import Pattern in Components**:

```tsx
// In [ItemName]ItemEditor.tsx, [ItemName]ItemDefaultView.tsx, [ItemName]ItemRibbon.tsx, etc.
import "./[ItemName]Item.scss";       // Item-specific styles (REQUIRED)
```

**Usage Pattern**:

```tsx
// Apply item-specific classes with clear naming
<div className="[item-name]-view">
  <div className="[item-name]-section-title">
    {/* Item-specific styling and content */}
  </div>
</div>
```

**✅ DO** (Will pass verification):
- Create separate `[ItemName]Item.scss` file with all item-specific styles
- Use item-prefixed class names (`.hello-world-*`, `.data-analyzer-*`, etc.)
- Use Fabric design tokens (`var(--color*, --spacing*, --fontSize*)`)
- Follow BEM naming: `.item-name-element-modifier`
- Import only `[ItemName]Item.scss` in item components

**❌ DON'T** (Will fail verification):
- Modify control files in `Workload/app/components/` directory (ItemEditor, Ribbon, OneLakeView, etc.)
- Duplicate control layout/structure styles in item SCSS
- Use inline styles instead of SCSS file
- Override control structural styles with `!important`
- Create global styles that affect other items

### Step 6: Create Manifest Configuration

#### 6.1: Create XML Manifest Template (`Workload/Manifest/items/[ItemName]Item/[ItemName]Item.xml`)

**Use the HelloWorld pattern exactly**:

```xml
<?xml version='1.0' encoding='utf-8'?>
<ItemManifestConfiguration SchemaVersion="2.0.0">
  <Item TypeName="{{WORKLOAD_NAME}}.[ItemName]" Category="Data">
    <Workload WorkloadName="{{WORKLOAD_NAME}}" />
  </Item>
</ItemManifestConfiguration>
```

**Key Elements**:

- **Location**: Place in `Workload/Manifest/items/[ItemName]Item/[ItemName]Item.xml`
- **Template Processing**: Use `{{WORKLOAD_NAME}}` placeholder for environment-specific generation
- **Naming Convention**: Follow `[ItemName]Item.xml` pattern
- **Category**: Fabric category (Data, Analytics, etc.)
- **Environment Generation**: Manifest generation will replace placeholders with values from .env files

#### 6.2: Create JSON Manifest (`Workload/Manifest/items/[ItemName]Item/[ItemName]Item.json`)

**Use the HelloWorld pattern as template**:

```json
{
  "name": "[ItemName]",
  "version": "1.100",
  "displayName": "[ItemName]Item_DisplayName",
  "displayNamePlural": "[ItemName]Item_DisplayName_Plural",
  "editor": {
    "path": "/[ItemName]Item-editor"
  },
  "icon": {
    "name": "assets/images/[ItemName]Item-icon.png"
  },
  "activeIcon": {
    "name": "assets/images/[ItemName]Item-icon.png"
  },
  "contextMenuItems": [],
  "quickActionItems": [],
  "supportedInMonitoringHub": true,
  "supportedInDatahubL1": true,
  "itemJobActionConfig": {},
  "itemSettings": {
    "getItemSettings": {
      "action": "getItemSettings"
    }
  },
  "editorTab": {
    "onDeactivate": "item.tab.onDeactivate",
    "canDeactivate": "item.tab.canDeactivate",
    "canDestroy": "item.tab.canDestroy",
    "onDestroy": "item.tab.onDestroy",
    "onDelete": "item.tab.onDelete"
  },
  "createItemDialogConfig": {
    "onCreationFailure": { "action": "item.onCreationFailure" },
    "onCreationSuccess": { "action": "item.onCreationSuccess" }
  }
}
```

**Key Properties**:

- `name`: Internal item name
- `displayName`/`displayNamePlural`: Localization keys
- `editor.path`: Route path for the editor
- `icon`: Path to item icon in assets
- Hub support flags for where item appears in Fabric UI

### Step 7: Add Routing Configuration

Update `Workload/app/App.tsx` to add the route for your new item:

```typescript
// Add import for your editor
import { [ItemName]ItemEditor } from "./items/[ItemName]Item/[ItemName]ItemEditor";

// Add route in the Switch statement
<Route path="/[ItemName]Item-editor/:itemObjectId">
  <[ItemName]ItemEditor {...pageProps} />
</Route>
```

**Route Pattern**:
- Path must match the `editor.path` in the JSON manifest
- Include `:itemObjectId` parameter for item identification
- Route name should follow the pattern: `/[ItemName]Item-editor`

### Step 8: Create Asset Files

#### 8.1: Add Item Icon

Create an icon file: `Workload/Manifest/assets/images/[ItemName]Item-icon.png`
- **Size**: 24x24 pixels recommended
- **Format**: PNG with transparency
- **Style**: Follow Fabric design guidelines

#### 8.2: Create Editor Empty State Asset

Create an empty state illustration: `Workload/app/assets/items/[ItemName]Item/EditorEmpty.svg`

**Folder Structure**:
```
Workload/app/assets/items/
└── [ItemName]Item/
    └── EditorEmpty.svg
```

**Requirements**:
- **Format**: SVG (vector format for scalability)
- **Size**: Optimized for display in empty state components
- **Style**: Follow Fabric design system guidelines
- **Content**: Visual representation that communicates the item's purpose when empty

**Usage**: This asset is referenced in the `[ItemName]ItemEmptyView.tsx` component to provide visual guidance when the item has no content yet.

#### 8.3: Add Localization Strings

**🚨 CRITICAL: Two Different Translation Locations**

**Translation files serve different purposes and must be updated separately:**

**For Manifest Files (Product.json, [ItemName]Item.json ONLY)**:
Update `Workload/Manifest/assets/locales/en-US/translations.json`:

```json
{
  // Add these entries to the existing translations - ONLY for manifest references
  "[ItemName]Item_DisplayName": "Your Item Display Name",
  "[ItemName]Item_DisplayName_Plural": "Your Item Display Names",
  "[ItemName]Item_Description": "Description of what this item does"
}
```

**For React Components (App code with useTranslation() ONLY)**:
Update `Workload/app/assets/locales/en-US/translation.json`:

```json
{
  // Add entries for UI components, buttons, messages, etc.
  "[ItemName]ItemEditor_Loading": "Loading [Item Name]...",
  "[ItemName]ItemEditor_LoadError": "Failed to load the [item name] item.",
  "[ItemName]ItemEmptyView_Title": "Get started with [Item Name]",
  "[ItemName]ItemEmptyView_Description": "Description for empty state",
  "[ItemName]ItemRibbon_Save_Label": "Save",
  "[ItemName]ItemRibbon_Settings_Label": "Settings"
}
```

**Key Differences**:
- **Manifest translations** (`Workload/Manifest/assets/locales/`) - ONLY for keys referenced in .json manifest files
- **App translations** (`Workload/app/assets/locales/`) - ONLY for React components using `useTranslation()` hook
- **Never mix these up** - Each location serves a specific build-time purpose

**For Additional Locales**:

- Add corresponding entries in other locale files (e.g., `es/translations.json`)
- Maintain the same keys with translated values

#### 8.4: 🚨 CRITICAL - Update Product.json Configuration

**MANDATORY STEP - DO NOT SKIP**: Update `Workload/Manifest/Product.json` to register your new item in Fabric's create experience. **This step is REQUIRED for your item to appear in create dialogs.**

**Step 8.4.1 - Add to createExperience.cards array**:

The `createExperience.cards` array controls what items appear in Fabric's "Create new item" dialogs. You MUST add your item here.

```json
{
  "createExperience": {
    "description": "Workload_Description",
    "cards": [
      {
        "title": "HelloWorldItem_DisplayName",
        "description": "HelloWorldItem_Description", 
        "itemType": "HelloWorld"
        // ... existing HelloWorld configuration
      },
      {
        "title": "[ItemName]Item_DisplayName",           // ← ADD THIS BLOCK
        "description": "[ItemName]Item_Description",     // ← Use localization key
        "icon": {
          "name": "assets/images/[ItemName]Item-icon.png"
        },
        "icon_small": {
          "name": "assets/images/[ItemName]Item-icon.png"  
        },
        "availableIn": [
          "home",
          "create-hub",
          "workspace-plus-new", 
          "workspace-plus-new-teams"
        ],
        "itemType": "[ItemName]",                        // ← CRITICAL: Must match JSON manifest "name" field
        "createItemDialogConfig": {
          "onCreationFailure": { "action": "item.onCreationFailure" },
          "onCreationSuccess": { "action": "item.onCreationSuccess" }
        }
      }
    ]
  }
}
```

**Step 8.4.2 - Add to recommendedItemTypes array**:

The `recommendedItemTypes` array controls which items appear on the workload home page as featured/recommended items.

```json
{
  "homePage": {
    "recommendedItemTypes": [
      "HelloWorld",        // ← Existing item
      "[ItemName]"         // ← ADD THIS - Must match itemType in createExperience
    ]
  }
}
```

**⚠️ CRITICAL Requirements**:

- **itemType Consistency**: The `itemType` field in `createExperience.cards` MUST exactly match:
  - The `name` field in your `[ItemName]Item.json` manifest
  - The entry in `recommendedItemTypes` array
- **Localization Keys**: Use translation keys (e.g., `[ItemName]Item_DisplayName`) not hardcoded strings
- **Icon Files**: Ensure icon files exist in `assets/images/` directory
- **Both Arrays Required**: Items need to be in BOTH `createExperience.cards` AND `recommendedItemTypes`

**❌ Common Mistakes - DO NOT DO THIS**:
```json
// WRONG: Missing createExperience.cards entry
{
  "homePage": {
    "recommendedItemTypes": ["HelloWorld", "MyItem"]  // ← Only this, item won't appear in create dialogs
  }
}

// WRONG: Hardcoded strings instead of localization keys  
{
  "title": "My Custom Item",              // ← Should be "[ItemName]Item_DisplayName"
  "description": "Does custom things"     // ← Should be "[ItemName]Item_Description"
}

// WRONG: itemType mismatch
{
  "createExperience": {
    "cards": [{ "itemType": "MyCustomItem" }]     // ← Different from manifest "name"
  },
  "homePage": {
    "recommendedItemTypes": ["MyItem"]            // ← Different from createExperience
  }
}
```

**✅ Correct Pattern - ALWAYS DO THIS**:
```json
{
  "createExperience": {
    "cards": [
      {
        "title": "[ItemName]Item_DisplayName",      // ← Localization key
        "description": "[ItemName]Item_Description", // ← Localization key
        "itemType": "[ItemName]",                   // ← Matches manifest "name"
        // ... complete card configuration
      }
    ]
  },
  "homePage": {
    "recommendedItemTypes": ["[ItemName]"]         // ← Matches itemType above
  }
}
```

**Validation Checklist**:
- [ ] Item added to `createExperience.cards` array
- [ ] Item added to `recommendedItemTypes` array  
- [ ] `itemType` matches JSON manifest `name` field exactly
- [ ] All text uses localization keys (no hardcoded strings)
- [ ] Icon files exist in assets directory
- [ ] `availableIn` array includes appropriate Fabric UI locations

### Step 9: 🚨 CRITICAL - Update Environment Variables

**IMPORTANT**: After creating a new item, you MUST update the `ITEM_NAMES` variable in ALL environment files, or your item will not be included in the build:

1. **Update Workload/.env.dev**:
   ```bash
   # Before
   ITEM_NAMES=HelloWorld
   
   # After - add your new item
   ITEM_NAMES=HelloWorld,[ItemName]
   ```

2. **Update Workload/.env.test**:
   ```bash
   ITEM_NAMES=HelloWorld,[ItemName]
   ```

3. **Update Workload/.env.prod**:
   ```bash
   ITEM_NAMES=HelloWorld,[ItemName]
   ```

**Why This Matters**:
- The ITEM_NAMES variable controls which items are included when building the manifest package
- Missing items from this list will NOT appear in the workload
- Each environment can have different sets of items enabled
- This is required for the BuildManifestPackage.ps1 script to include your item

### Step 10: Testing and Validation

1. **Build the project**:
   ```powershell
   cd Workload
   npm run build:test
   ```

2. **Start development server**:
   ```powershell
   npm run start
   ```

3. **Test item creation**:
   - Navigate to Fabric workspace
   - Create new item of your type
   - Verify editor loads correctly
   - Test save/load functionality

### Step 11: Build and Deploy

1. **Build manifest package**:
   ```powershell
   .\scripts\Build\BuildManifestPackage.ps1
   ```

2. **Build release**:
   ```powershell
   .\scripts\Build\BuildRelease.ps1
   ```

## Quick Start: Use HelloWorld as Template

**For AI Tools**: Instead of creating empty files, copy and modify the existing HelloWorld item:

### 1. Copy HelloWorld Item Structure
```bash
# Copy the entire HelloWorld item implementation
cp -r Workload/app/items/[ItemName]Item

# Copy the manifest files
cp -r Workload/Manifest/items/[ItemName]Item
```

### 2. Find and Replace Pattern
```bash
# Replace all instances in the copied files:
HelloWorld → [ItemName]
HelloWorldItem → [ItemName]Item
HelloWorldItemDefinition → [ItemName]ItemDefinition
HelloWorldItemEditor → [ItemName]ItemEditor
HelloWorldItemEmptyView → [ItemName]ItemEmptyView
HelloWorldItemDefaultView → [ItemName]ItemDefaultView
HelloWorldItemRibbon → [ItemName]ItemRibbon
```

### 3. Update File Names
```bash
# Rename all files to match the new item name
mv [ItemName]Item/HelloWorldItemDefinition.ts [ItemName]Item/[ItemName]ItemDefinition.ts
mv [ItemName]Item/HelloWorldItemEditor.tsx [ItemName]Item/[ItemName]ItemEditor.tsx
mv [ItemName]Item/HelloWorldItemEmptyView.tsx [ItemName]Item/[ItemName]ItemEmptyView.tsx
mv [ItemName]Item/HelloWorldItemDefaultView.tsx [ItemName]Item/[ItemName]ItemDefaultView.tsx
mv [ItemName]Item/HelloWorldItemRibbon.tsx [ItemName]Item/[ItemName]ItemRibbon.tsx
# Continue for all files...
```

This approach ensures you get a **complete, functional item** rather than empty file structures.

---

## Usage

### Quick Checklist for AI Tools

When creating a new item, ensure all these components are created:

**Implementation Files** (in `Workload/app/items/[ItemName]Item/`):
- [ ] `[ItemName]ItemDefinition.ts` - Data model interface
- [ ] `[ItemName]ItemEditor.tsx` - Main editor component  
- [ ] `[ItemName]ItemEmptyView.tsx` - Empty state component
- [ ] `[ItemName]ItemDefaultView.tsx` - Default/main content view
- [ ] `[ItemName]ItemRibbon.tsx` - Ribbon/toolbar component

**Manifest Files** (in `Workload/Manifest/items/[ItemName]Item/`):
- [ ] `[ItemName]Item.xml` - XML manifest template with placeholders like `{{WORKLOAD_NAME}}`
- [ ] `[ItemName]Item.json` - JSON manifest with editor path and metadata

**product Configuration File** (in `Workload/Manifest/Product.json`):
- [ ] 🚨 **CRITICAL**: Add item to `createExperience.cards` array (item won't appear in create dialogs without this)
- [ ] 🚨 **CRITICAL**: Add item to `recommendedItemTypes` array (item won't appear on home page without this)  
- [ ] Verify `itemType` field matches JSON manifest `name` field exactly
- [ ] Use localization keys for title/description, not hardcoded strings

**Asset Files**:
- [ ] `Workload/Manifest/assets/images/[ItemName]Item-icon.png` - Item icon
- [ ] `Workload/app/assets/items/[ItemName]Item/EditorEmpty.svg` - Empty state illustration
- [ ] Localization entries in `Workload/Manifest/assets/locales/*/translations.json`

**Code Integration**:
- [ ] Route added to `Workload/app/App.tsx`
- [ ] Import statement for editor component
- [ ] Route path matches manifest `editor.path`

### Common Patterns

1. **Item Naming**: Use PascalCase for ItemName (e.g., `MyCustomItem`)
2. **File Naming**: Follow pattern `[ItemName]Item[Component].tsx`
3. **Route Naming**: Use kebab-case `/[item-name]-editor/:itemObjectId`
4. **TypeName**: Use dot notation `Org.WorkloadName.ItemName`
5. **Localization Keys**: Use underscore notation `[ItemName]Item_DisplayName`

### Troubleshooting

**Common Issues**:
- **🚨 MOST COMMON**: Item doesn't appear in create dialogs → Check `createExperience.cards` in Product.json
- **Item not on home page**: Missing from `recommendedItemTypes` array in Product.json
- **Route not found**: Ensure route path matches manifest `editor.path`
- **Icon not loading**: Verify icon file exists in assets/images/
- **Localization missing**: Check translation keys in all locale files
- **Save not working**: Verify model interface is properly defined
- **Empty state not showing**: Check onFinishEmpty callback implementation
- **Build errors**: Check `ITEM_NAMES` environment variable includes your item

---

## 🚨 FINAL VERIFICATION - NO EXCEPTIONS

**MANDATORY: Before claiming ANY item creation is complete, verify EVERY item below:**

### 📁 All Files Exist and Are Syntactically Correct
```bash
# Verify these files exist:
ls Workload/app/items/[ItemName]Item/[ItemName]ItemDefinition.ts
ls Workload/app/items/[ItemName]Item/[ItemName]ItemEditor.tsx  
ls Workload/app/items/[ItemName]Item/[ItemName]ItemEmptyView.tsx
ls Workload/app/items/[ItemName]Item/[ItemName]ItemDefaultView.tsx
ls Workload/app/items/[ItemName]Item/[ItemName]ItemRibbon.tsx
ls Workload/app/items/[ItemName]Item/[ItemName]Item.scss
ls Workload/Manifest/items/[ItemName]Item/[ItemName]Item.json
ls Workload/Manifest/items/[ItemName]Item/[ItemName]Item.xml
ls Workload/Manifest/assets/images/[ItemName]Item-icon.png
```

### 🚨 CRITICAL: Product.json Updated (MOST MISSED STEP)
```bash
# Verify both these entries exist in Product.json:
grep -n "[ItemName]" Workload/Manifest/Product.json
# Should show entries in BOTH:
# - createExperience.cards array
# - recommendedItemTypes array
```

### ✅ Translations in Correct Locations
```bash
# Manifest translations (for .json files):
grep "[ItemName]Item_DisplayName" Workload/Manifest/assets/locales/en-US/translations.json

# App translations (for React components):
grep "[ItemName]Item" Workload/app/assets/locales/en-US/translation.json
```

### 🏗️ Architecture Compliance
- **Component Discovery**: Used semantic_search to find existing Base* components before coding
- **ItemEditor used**: Check editor uses `<ItemEditor>` not custom layout  
- **Ribbon used**: Check ribbon uses `Ribbon` + `RibbonToolbar`
- **Existing Base Components**: Used ItemEditorView, ItemEditorDetailView etc. instead of reinventing
- **OneLakeStorageClient Wrapper**: Used `createItemWrapper()` for all OneLake operations, no manual path construction
- **OneLakeView Control**: Used control from `components/OneLakeView`, not sample code
- **Version number**: Must be "1.100" (copy from HelloWorld exactly)
- **SCSS overrides only**: Check .scss file doesn't duplicate layout styles

### 🔄 App Integration
- **Route added**: Check `App.tsx` has route for `/[ItemName]Item-editor/:itemObjectId`
- **Imports correct**: All import paths are valid and components exist

**IF ANY VERIFICATION FAILS, THE ITEM IS INCOMPLETE. FIX IT BEFORE PROCEEDING.**


---
applyTo: "/Workload/app/items/[ItemName]Item/"
---

# Rename Workload Item

## Process

This guide provides step-by-step instructions for AI tools to safely rename an item in the Microsoft Fabric Extensibility Toolkit. Renaming an item requires updating implementation files, manifest configuration, routing changes, and environment variable updates.

**⚠️ WARNING**: Renaming an item affects multiple files and configurations. Ensure you have backups and coordinate with your team before proceeding.

### Step 1: Plan the Rename Operation

Before starting, define your rename parameters:

1. **Current Item Name**: The existing item name (e.g., "OldItem")
2. **New Item Name**: The desired new name (e.g., "NewItem")  
3. **Impact Assessment**: Identify all files and references that need updating
4. **Backup Strategy**: Ensure you can rollback if needed

**Naming Conventions**:
- Use PascalCase for ItemName (e.g., `MyCustomItem`)
- Ensure the new name follows Fabric workload naming standards
- Avoid conflicts with existing item names

### Step 2: Update Implementation File Names and Contents

#### 2.1: Rename Implementation Files

Rename all files in the item directory from `[OldItemName]` to `[NewItemName]`:

```
Workload/app/items/[OldItemName]Item/ → Workload/app/items/[NewItemName]Item/
├── [OldItemName]ItemModel.ts → [NewItemName]ItemModel.ts
├── [OldItemName]ItemEditor.tsx → [NewItemName]ItemEditor.tsx  
├── [OldItemName]ItemEditorEmpty.tsx → [NewItemName]ItemEditorEmpty.tsx
└── [OldItemName]ItemEditorRibbon.tsx → [NewItemName]ItemEditorRibbon.tsx
```

#### 2.2: Update File Contents

Update all references within the implementation files:

**In `[NewItemName]ItemModel.ts`**:
```typescript
// Update interface name
export interface [NewItemName]ItemDefinition {
  // Keep existing properties unchanged
}
```

**In `[NewItemName]ItemEditor.tsx`**:
```typescript
// Update imports
import { [NewItemName]ItemEditorRibbon } from "./[NewItemName]ItemEditorRibbon";
import { [NewItemName]ItemDefinition } from "./[NewItemName]ItemModel";
import { [NewItemName]ItemEmpty } from "./[NewItemName]ItemEditorEmpty";

// Update function name
export function [NewItemName]ItemEditor(props: PageProps) {
  // Keep existing logic unchanged
}
```

**In `[NewItemName]ItemEditorEmpty.tsx`**:
```typescript
// Update imports and interface names
import { [NewItemName]ItemDefinition } from "./[NewItemName]ItemModel";

interface [NewItemName]ItemEmptyStateProps {
  // Keep existing properties
}

export const [NewItemName]ItemEmpty: React.FC<[NewItemName]ItemEmptyStateProps> = ({
  // Keep existing implementation
});
```

**In `[NewItemName]ItemEditorRibbon.tsx`**:
```typescript
// Update interface and function names
export interface [NewItemName]ItemEditorRibbonProps extends PageProps {
  // Keep existing properties
}

export function [NewItemName]ItemEditorRibbon(props: [NewItemName]ItemEditorRibbonProps) {
  // Keep existing implementation
}
```

### Step 3: Update Manifest Configuration

#### 3.1: Rename Manifest Directory

Rename the manifest directory:
```
Workload/Manifest/items/[OldItemName]Item/ → Workload/Manifest/items/[NewItemName]Item/
```

#### 3.2: Rename and Update Manifest Files

**Rename XML Manifest**:
```
[OldItemName]Item.xml → [NewItemName]Item.xml
```

Update content to use new item name:
```xml
<?xml version='1.0' encoding='utf-8'?>
<ItemManifestConfiguration SchemaVersion="2.0.0">
  <Item TypeName="{{WORKLOAD_NAME}}.[NewItemName]" Category="Data">
    <Workload WorkloadName="{{WORKLOAD_NAME}}" />
  </Item>
</ItemManifestConfiguration>
```

**Rename JSON Manifest**:
```
[OldItemName]Item.json → [NewItemName]Item.json
```

Update content with new names and paths:
```json
{
  "name": "[NewItemName]",
  "version": "1.100",
  "displayName": "[NewItemName]Item_DisplayName",
  "displayNamePlural": "[NewItemName]Item_DisplayName_Plural", 
  "editor": {
    "path": "/[NewItemName]Item-editor"
  },
  "icon": {
    "name": "assets/images/[NewItemName]Item-icon.png"
  },
  "activeIcon": {
    "name": "assets/images/[NewItemName]Item-icon.png"
  },
  "supportedInMonitoringHub": true,
  "supportedInDatahubL1": true,
  "editorTab": {
    "onDeactivate": "item.tab.onDeactivate",
    "canDeactivate": "item.tab.canDeactivate", 
    "canDestroy": "item.tab.canDestroy",
    "onDestroy": "item.tab.onDestroy",
    "onDelete": "item.tab.onDelete"
  },
  "createItemDialogConfig": {
    "onCreationFailure": { "action": "item.onCreationFailure" },
    "onCreationSuccess": { "action": "item.onCreationSuccess" }
  }
}
```

### Step 4: Update Asset Files

#### 4.1: Rename Item Icon

Rename the icon file:
```
Workload/Manifest/assets/images/[OldItemName]Item-icon.png →
Workload/Manifest/assets/images/[NewItemName]Item-icon.png
```

#### 4.2: Update Localization Entries

Update `Workload/Manifest/assets/locales/*/translations.json` files:

```json
{
  // Remove old entries
  // "[OldItemName]Item_DisplayName": "...",
  // "[OldItemName]Item_DisplayName_Plural": "...",
  // "[OldItemName]Item_Description": "...",
  
  // Add new entries
  "[NewItemName]Item_DisplayName": "Your New Item Display Name",
  "[NewItemName]Item_DisplayName_Plural": "Your New Item Display Names", 
  "[NewItemName]Item_Description": "Description of what this item does"
}
```

**For All Locales**:
- Update entries in all locale files (en-US, es, etc.)
- Maintain consistent translations across all supported languages
- Remove old localization keys to avoid confusion

#### 4.3: Update Product.json (if needed)

If the item was referenced in `Workload/Manifest/Product.json`, update any references:

- Update createExperience entries for the renamed item
- Change any item-specific configuration sections
- Ensure all references use the new item name

### Step 5: Update Routing Configuration

Update `Workload/app/App.tsx` to use the new item name:

```typescript
// Update import statement
import { [NewItemName]ItemEditor } from "./items/[NewItemName]Item/[NewItemName]ItemEditor";

// Update route definition
<Route path="/[NewItemName]Item-editor/:itemObjectId">
  <[NewItemName]ItemEditor {...pageProps} />
</Route>
```

**Key Changes**:
1. Update the import path to the new directory and component name
2. Update the route path to match the new editor path in the JSON manifest
3. Update the component reference in the route definition
4. Ensure the route path follows the pattern: `/[NewItemName]Item-editor`

### Step 6: Update Asset Dependencies

#### 6.1: Rename Additional Assets

If the item has additional assets in `Workload/app/assets/items/`:

```
Workload/app/assets/items/[OldItemName]/ → Workload/app/assets/items/[NewItemName]/
```

Rename any item-specific assets:
- EditorEmpty.jpg or other images
- Configuration files
- Custom stylesheets or resources

#### 6.2: Update Asset References

Check for any hardcoded references to the old item name in:
- CSS files with item-specific styles
- Configuration files
- Documentation or help files
- Test files

### Step 7: 🚨 CRITICAL - Update Environment Variables

**IMPORTANT**: Update the `ITEM_NAMES` variable in ALL environment files to use the new item name:

1. **Update Workload/.env.dev**:
   ```bash
   # Before
   ITEM_NAMES=HelloWorld,[OldItemName],CustomItem
   
   # After - replace with new item name
   ITEM_NAMES=HelloWorld,[NewItemName],CustomItem
   ```

2. **Update Workload/.env.test**:
   ```bash
   ITEM_NAMES=HelloWorld,[NewItemName],CustomItem
   ```

3. **Update Workload/.env.prod**:
   ```bash
   ITEM_NAMES=HelloWorld,[NewItemName],CustomItem
   ```

**Why This Matters**:
- The ITEM_NAMES variable controls which items are included when building the manifest package
- The old item name will cause build failures since the files no longer exist
- The new item name must be included for the renamed item to appear in the workload
- All environment files must be updated consistently

### Step 8: Validation and Testing

#### 8.1: Build Validation

1. **Build the project**:
   ```powershell
   cd Workload
   npm run build:test
   ```

2. **Check for build errors**:
   - Verify no import errors for renamed components
   - Ensure no manifest generation errors
   - Confirm no missing asset references

#### 8.2: Runtime Validation

1. **Start development server**:
   ```powershell
   npm run start
   ```

2. **Test renamed item**:
   - Navigate to Fabric workspace
   - Create new item with the new name
   - Verify editor loads correctly with new route
   - Test save/load functionality
   - Verify UI shows correct display names

#### 8.3: Manifest Generation Test

1. **Test manifest generation**:
   ```powershell
   .\scripts\Build\BuildManifestPackage.ps1 -Environment dev
   ```

2. **Verify clean build**:
   - No errors about missing old item files
   - Generated manifest includes renamed item with correct paths
   - All assets are properly referenced

### Step 9: Clean Up Old References

#### 9.1: Search for Remaining References

Search the entire codebase for any remaining references to the old item name:

```powershell
# Search for old item name references
findstr /s /i "[OldItemName]" *.ts *.tsx *.json *.xml *.md
```

#### 9.2: Update Documentation

Update any documentation that references the old item name:
- README files
- API documentation
- Code comments
- Example configurations

#### 9.3: Clear Build Artifacts

Remove any cached build artifacts that might reference the old item:

```powershell
# Clear build directory
Remove-Item -Recurse -Force build/

# Clear node modules cache if needed
npm run clean
npm install
```

### Step 10: Final Verification

Run a complete build and test cycle to ensure everything works:

```powershell
# Full build test
.\scripts\Setup\SetupWorkload.ps1 -Force $true
.\scripts\Build\BuildManifestPackage.ps1 -Environment dev
.\scripts\Build\BuildRelease.ps1 -Environment dev

# Development test
cd Workload
npm run build:test
npm run start
```

## Verification Checklist

After renaming, verify all these components have been updated:

**Implementation Files**:
- [ ] Directory renamed: `Workload/app/items/[NewItemName]Item/`
- [ ] All four TypeScript files renamed with new item name
- [ ] All internal references updated (interfaces, functions, imports)
- [ ] No TypeScript errors about missing modules

**Manifest Files**:
- [ ] Directory renamed: `Workload/Manifest/items/[NewItemName]Item/`
- [ ] XML manifest file renamed and content updated
- [ ] JSON manifest file renamed with correct paths and names
- [ ] Product.json updated if referenced

**Asset Files**:
- [ ] Icon renamed: `Workload/Manifest/assets/images/[NewItemName]Item-icon.png`
- [ ] Localization entries updated in all locale files
- [ ] Additional assets renamed if they exist

**Code Integration**:
- [ ] Route updated in `Workload/app/App.tsx`
- [ ] Import statement updated with new path and component name
- [ ] Route path matches new manifest `editor.path`

**Environment Variables**:
- [ ] Old item name removed from `ITEM_NAMES` in `Workload/.env.dev`
- [ ] New item name added to `ITEM_NAMES` in `Workload/.env.dev`
- [ ] Same updates applied to `Workload/.env.test` and `Workload/.env.prod`

**Build Validation**:
- [ ] `npm run build:test` completes without errors
- [ ] `npm run start` works correctly
- [ ] `BuildManifestPackage.ps1` runs without errors
- [ ] Renamed item appears correctly in Fabric workspace

## Common Issues and Solutions

### Build Errors After Rename

**Error**: "Cannot find module '[OldItemName]ItemEditor'"
**Solution**: Update all import statements to use the new component names

**Error**: "Manifest file not found for item [OldItemName]"
**Solution**: Update ITEM_NAMES in all .env files to use the new item name

**Error**: "Route component [NewItemName]ItemEditor is not defined"  
**Solution**: Verify the component export name matches the new item name

### Asset Reference Errors

**Error**: "Image not found: [OldItemName]Item-icon.png"
**Solution**: Ensure icon file was renamed and manifest JSON references are updated

**Error**: "Translation key '[OldItemName]Item_DisplayName' not found"
**Solution**: Update localization files in all supported locales

### Runtime Issues

**Problem**: Item appears with old display name in Fabric
**Solution**: Clear browser cache and verify localization files are updated

**Problem**: Editor doesn't load when creating renamed item
**Solution**: Verify route path in App.tsx matches the editor path in JSON manifest

## Rollback Strategy

If you need to revert the rename:

1. **Use version control**: Git checkout to restore previous state
2. **Manual rollback**: Rename all files back to original names
3. **Reverse environment variables**: Update ITEM_NAMES back to old name
4. **Rebuild**: Run BuildManifestPackage.ps1 to regenerate manifests
5. **Test thoroughly**: Verify original functionality is restored

**Best Practice**: Create a git branch before starting the rename operation to enable easy rollback.


---
applyTo: "/Workload/app/items/[ItemName]Item/"
---

# Delete Workload Item

## Process

This guide provides step-by-step instructions for AI tools to safely delete an item from the Microsoft Fabric Extensibility Toolkit. Deleting an item requires removing implementation files, manifest configuration, routing cleanup, and environment variable updates.

**⚠️ WARNING**: Deleting an item is irreversible. Ensure you have backups if needed and verify the item is not in use.

### Step 1: Verify Item Deletion Safety

Before deleting, check for dependencies:

1. **Check for data dependencies**: Ensure no critical data relies on this item type
2. **Review deployment status**: Verify item is not deployed in production environments
3. **Backup considerations**: Consider backing up item implementation if it might be needed later
4. **Team coordination**: Confirm with team that item removal is intentional

### Step 2: Remove Item Implementation Files

Delete the entire item directory and all its contents:

```
Workload/app/items/[ItemName]Item/
├── [ItemName]ItemEditorDefaultView.tsx
├── [ItemName]ItemDefinition.ts
├── [ItemName]ItemEditor.tsx
├── [ItemName]ItemEditorEmptyView.tsx
└── [ItemName]ItemEditorRibbon.tsx
```

**Important**: 
- Remove the entire `[ItemName]Item/` directory
- Verify no other files reference these components
- Check for any shared utilities that might need cleanup

### Step 3: Remove Manifest Configuration

#### 3.1: Delete XML Manifest Template

Remove: `Workload/Manifest/items/[ItemName]Item/[ItemName]Item.xml`

#### 3.2: Delete JSON Manifest

Remove: `Workload/Manifest/items/[ItemName]Item/[ItemName]Item.json`

#### 3.3: Remove Item Directory

Delete the entire manifest directory: `Workload/Manifest/items/[ItemName]Item/`

#### 3.4: Update Product.json (if needed)

If the item was referenced in `Workload/Manifest/Product.json`, remove any specific references:

- Remove createExperience entries for the deleted item
- Clean up any item-specific configuration sections
- Verify no broken references remain

### Step 4: Remove Asset Files

#### 4.1: Delete Item Icon

Remove: `Workload/Manifest/assets/images/[ItemName]Item-icon.png`

#### 4.2: Clean Up Localization Entries

Update `Workload/Manifest/assets/locales/*/translations.json` files:

```json
{
  // Remove these entries from all locale files
  // "[ItemName]Item_DisplayName": "...",
  // "[ItemName]Item_DisplayName_Plural": "...",
  // "[ItemName]Item_Description": "..."
}
```

**For All Locales**:
- Remove entries from all locale files (en-US, es, etc.)
- Ensure consistent cleanup across all translation files
- Verify no orphaned translation keys remain

### Step 5: Remove Routing Configuration

Update `Workload/app/App.tsx` to remove the route:

```typescript
// Remove the import statement
// import { [ItemName]ItemEditor } from "./items/[ItemName]Item/[ItemName]ItemEditor";

// Remove the route from the Switch statement
// <Route path="/[ItemName]Item-editor/:itemObjectId">
//   <[ItemName]ItemEditor {...pageProps} />
// </Route>
```

**Cleanup Steps**:
1. Remove the import statement for the deleted editor component
2. Remove the route definition that matched the item's editor path
3. Verify no other components import the deleted item components
4. Check for any route guards or permissions that reference the deleted item

### Step 6: 🚨 CRITICAL - Update Environment Variables

**IMPORTANT**: Remove the item from the `ITEM_NAMES` variable in ALL environment files, or the build will fail trying to find the deleted item:

1. **Update Workload/.env.dev**:
   ```bash
   # Before
   ITEM_NAMES=HelloWorld,[ItemName],CustomItem
   
   # After - remove the deleted item
   ITEM_NAMES=HelloWorld,CustomItem
   ```

2. **Update Workload/.env.test**:
   ```bash
   ITEM_NAMES=HelloWorld,CustomItem
   ```

3. **Update Workload/.env.prod**:
   ```bash
   ITEM_NAMES=HelloWorld,CustomItem
   ```

**Why This Matters**:
- The ITEM_NAMES variable controls which items are included when building the manifest package
- Leaving deleted items in this list will cause build failures
- The BuildManifestPackage.ps1 script will try to find manifest files for items in this list
- Each environment file must be updated consistently

### Step 7: Remove Asset Dependencies

#### 7.1: Clean Up Item-Specific Assets

Remove any additional assets in `Workload/app/assets/items/[ItemName]/`:
- EditorEmpty.jpg or other item-specific images
- Any configuration files specific to the item
- Custom stylesheets or resources

#### 7.2: Check for Shared Assets

Review shared assets that might reference the deleted item:
- CSS files that might have item-specific styles
- Shared configuration files
- Documentation or help files

### Step 8: Validation and Testing

#### 8.1: Build Validation

1. **Build the project**:
   ```powershell
   cd Workload
   npm run build:test
   ```

2. **Check for build errors**:
   - Verify no import errors for deleted components
   - Ensure no manifest generation errors
   - Confirm no missing asset references

#### 8.2: Runtime Validation

1. **Start development server**:
   ```powershell
   npm run start
   ```

2. **Test application**:
   - Verify application starts without errors
   - Check that remaining items still work correctly
   - Ensure no broken routes or missing components

#### 8.3: Manifest Generation Test

1. **Test manifest generation**:
   ```powershell
   .\scripts\Build\BuildManifestPackage.ps1 -Environment dev
   ```

2. **Verify clean build**:
   - No errors about missing item files
   - Generated manifest doesn't reference deleted item
   - All remaining items are properly included

### Step 9: Clean Up Build Artifacts

Remove any generated files that might reference the deleted item:

1. **Clear build directory**:
   ```powershell
   Remove-Item -Recurse -Force build/
   ```

2. **Regenerate clean build**:
   ```powershell
   .\scripts\Build\BuildManifestPackage.ps1 -Environment dev
   ```

This ensures no stale references to the deleted item remain in generated files.

### Step 10: Documentation Updates

1. **Update README or documentation** that references the deleted item
2. **Update any API documentation** that mentioned the item type
3. **Remove item from examples or samples** if it was used as a reference
4. **Update deployment guides** if they specifically mentioned the item

## Verification Checklist

After deletion, verify all these components have been removed:

**Implementation Files**:
- [ ] `Workload/app/items/[ItemName]Item/` directory completely removed
- [ ] No import references to deleted components remain
- [ ] No TypeScript errors about missing modules

**Manifest Files**:
- [ ] `Workload/Manifest/items/[ItemName]Item/` directory completely removed
- [ ] Product.json cleaned of any item-specific references
- [ ] No manifest generation errors

**Asset Files**:
- [ ] `Workload/Manifest/assets/images/[ItemName]Item-icon.png` removed
- [ ] Localization entries removed from all locale files
- [ ] No orphaned asset references

**Code Integration**:
- [ ] Route removed from `Workload/app/App.tsx`
- [ ] Import statement removed
- [ ] No broken route references

**Environment Variables**:
- [ ] Item removed from `ITEM_NAMES` in `Workload/.env.dev`
- [ ] Item removed from `ITEM_NAMES` in `Workload/.env.test`
- [ ] Item removed from `ITEM_NAMES` in `Workload/.env.prod`

**Build Validation**:
- [ ] `npm run build:test` completes without errors
- [ ] `npm run start` works correctly
- [ ] `BuildManifestPackage.ps1` runs without errors
- [ ] No references to deleted item in generated files

## Common Issues and Solutions

### Build Errors After Deletion

**Error**: "Cannot find module '[ItemName]ItemEditor'"
**Solution**: Remove all import statements referencing the deleted item

**Error**: "Manifest file not found for item [ItemName]"
**Solution**: Remove the item from ITEM_NAMES in all .env files

**Error**: "Route component [ItemName]ItemEditor is not defined"
**Solution**: Remove the route definition from App.tsx

### Asset Reference Errors

**Error**: "Image not found: [ItemName]Item-icon.png"
**Solution**: Verify the icon file was properly deleted and no manifest references remain

**Error**: "Translation key '[ItemName]Item_DisplayName' not found"
**Solution**: Clean up localization files in all supported locales

### Deployment Issues

**Problem**: Deleted item still appears in deployed workload
**Solution**: Rebuild and redeploy manifest package with updated ITEM_NAMES

**Problem**: Build fails in production environment
**Solution**: Ensure ITEM_NAMES is updated in production .env files

## Rollback Strategy

If you need to restore a deleted item:

1. **Restore from version control**: Use git to restore deleted files
2. **Re-add to ITEM_NAMES**: Update environment variables
3. **Rebuild**: Run BuildManifestPackage.ps1 to regenerate manifests
4. **Test thoroughly**: Verify item functionality is fully restored

**Best Practice**: Always use version control tags or branches before major deletions to enable easy rollback.
