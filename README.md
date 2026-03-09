# Fabric DBT Docs

A Microsoft Fabric workload extension that integrates dbt (data build tool) documentation directly into the Fabric platform, enabling seamless access to data lineage, documentation, and metadata without leaving the Fabric environment.

## What is this project?

**Fabric DBT Docs** extends Microsoft Fabric with a custom workload that allows users to:

- **View dbt Documentation**: Access comprehensive dbt project documentation directly within Fabric
- **Explore Data Lineage**: Visualize data transformations and dependencies between models
- **Browse Metadata**: Examine detailed model, column, and test information
- **Integrated Experience**: Leverage native Fabric UI components and authentication for a seamless workflow

This project is built on the **Microsoft Fabric Extensibility Toolkit**, which provides the foundation for creating custom workloads that integrate deeply with the Fabric platform.

### Key Components

- **DbtDocsItem**: A custom Fabric item type that displays dbt documentation and lineage
- **HelloWorldItem**: Reference implementation demonstrating Fabric workload development patterns
- **Fabric Integration**: Full integration with Fabric authentication, OneLake storage, and UI components

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed and configured:

- **Node.js** (LTS recommended) - [Download](https://nodejs.org/en/download/)
- **PowerShell 7+** - [Install](https://learn.microsoft.com/en-us/powershell/scripting/install/installing-powershell)
- **.NET SDK** (x64 for macOS) - [Download](https://dotnet.microsoft.com/en-us/download)
- **Azure CLI** - [Install](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest)
- **VS Code** or similar editor - [Download](https://code.visualstudio.com/download)

#### Microsoft Fabric Prerequisites

- **Fabric Tenant**: Access to [Microsoft Fabric](https://app.fabric.microsoft.com/)
- **Fabric Workspace**: A workspace for development and testing
- **Fabric Capacity**: Assigned to your development workspace
- **Entra App**: Application registration for authentication (create new or use existing)

> **Note**: After installing new software, restart PowerShell and Visual Studio so new tools are available in your PATH.

### Setup Instructions

#### 1. Clone and Navigate to Project

```bash
git clone <repository-url>
cd fabric-dbt-docs
```

#### 2. Install Dependencies

```powershell
cd Workload
npm install
cd ..
```

#### 3. Configure Development Environment

Run the setup script to initialize your development environment:

```powershell
.\scripts\Setup\SetupWorkload.ps1
```

**The script will prompt for:**
- Workload name (e.g., `MyOrg.DbtDocs`)
- Frontend Azure AD App ID
- Development workspace GUID

This creates environment-specific configuration files (`.env.dev`, `.env.test`, `.env.prod`).

#### 4. Set Up Developer Workspace

Configure your local development environment:

```powershell
.\scripts\Setup\SetupDevEnvironment.ps1
```

> **Using GitHub Codespaces?** Everything is pre-configured. Just select an **8-core machine** and open in VS Code locally.

## How to Use It

### Starting Development

#### Terminal 1: Start the Development Gateway

The Development Gateway bridges your local development environment with Microsoft Fabric:

```powershell
.\scripts\Run\StartDevGateway.ps1
```

**What it does:**
- Authenticates with Azure/Entra ID
- Registers your workload with the development workspace
- Builds the manifest package
- Enables communication between your development server and Fabric

**Success indicators:**
- ✅ "DevGateway started successfully"
- ✅ "Workload registered with workspace [ID]"

#### Terminal 2: Start the Development Server

In a new PowerShell window, start the frontend development server:

```powershell
.\scripts\Run\StartDevServer.ps1
```

**What it does:**
- Compiles TypeScript and React code
- Enables hot module replacement for instant updates
- Opens the workload UI in your default browser
- Watches for file changes

**Success indicators:**
- ✅ "webpack compiled successfully"
- ✅ Browser opens to `http://localhost:5000`

### Working with Items

#### Create a New Item

The Fabric DBT Docs workload includes two item types:

1. **DbtDocsItem**: Display dbt documentation and lineage
2. **HelloWorldItem**: Reference implementation for learning

To create a new custom item type, follow the [Item Creation Guide](docs/CREATE_ITEM.md) in the project documentation.

#### Edit Existing Items

1. Open the workload in your Fabric workspace
2. Create or open an item
3. Edit the content in the provided interface
4. Click **Save** to persist changes

### Building for Deployment

#### Build the Frontend

```powershell
.\scripts\Build\BuildFrontend.ps1 -Environment prod
```

Compiles TypeScript/React to optimized JavaScript in `build/Frontend/`.

#### Build the Manifest Package

```powershell
.\scripts\Build\BuildManifestPackage.ps1 -Environment prod
```

Creates a NuGet package containing workload configuration and metadata.

#### Complete Production Build

```powershell
.\scripts\Build\BuildAll.ps1 -Environment prod
```

Runs all build steps and creates deployment artifacts.

### Project Structure

```
fabric-dbt-docs/
├── Workload/                          # Main workload application
│   ├── .env.dev/.env.test/.env.prod   # Environment-specific configuration
│   ├── app/                           # React/TypeScript application code
│   │   ├── items/                     # Custom item implementations
│   │   │   ├── DbtDocsItem/          # dbt documentation viewer
│   │   │   └── HelloWorldItem/        # Reference implementation
│   │   ├── components/                # Reusable UI components
│   │   ├── assets/                    # Images, icons, translations
│   │   └── App.tsx                    # Main application entry point
│   ├── Manifest/                      # Workload configuration
│   │   ├── Product.json               # Workload metadata
│   │   ├── WorkloadManifest.xml       # Workload manifest
│   │   └── items/                     # Item-specific configuration
│   └── package.json                   # Dependencies and scripts
├── scripts/                           # Automation scripts
│   ├── Setup/                         # Setup and configuration scripts
│   ├── Build/                         # Build and compilation scripts
│   └── Run/                           # Development and deployment runners
├── build/                             # Generated build artifacts (not committed)
└── docs/                              # Project documentation

```

### Environment Variables

Configuration is managed through environment files in the `Workload/` directory:

**`.env.dev`** - Local development configuration
```bash
WORKLOAD_NAME=MyOrg.DbtDocs
WORKLOAD_VERSION=1.0.0
FRONTEND_APPID=your-app-id
FRONTEND_URL=http://localhost:60006/
LOG_LEVEL=debug
```

**`.env.test`** - Staging environment
```bash
WORKLOAD_NAME=MyOrg.DbtDocs
FRONTEND_URL=https://staging-url.azurestaticapps.net/
LOG_LEVEL=info
```

**`.env.prod`** - Production environment
```bash
WORKLOAD_NAME=MyOrg.DbtDocs
FRONTEND_URL=https://prod-url.azurestaticapps.net/
LOG_LEVEL=warn
```

### Common Tasks

#### View Available NPM Scripts

```powershell
cd Workload
npm run  # Lists all available scripts
```

Key scripts:
- `npm start` - Start development server
- `npm run build:test` - Build for testing
- `npm run build:prod` - Build for production

#### Check Project Status

```powershell
git status              # See uncommitted changes
npm run build:test      # Verify TypeScript compilation
```

#### Clear Build Artifacts

```powershell
Remove-Item -Recurse -Force build/
npm install            # Clean reinstall if needed
```

#### Update Dependencies

```powershell
cd Workload
npm update
npm audit              # Check for security vulnerabilities
```

## Key Resources

- **[Microsoft Fabric Documentation](https://learn.microsoft.com/en-us/fabric/)** - Comprehensive Fabric platform docs
- **[Fabric Extensibility Toolkit](https://learn.microsoft.com/en-us/fabric/extensibility-toolkit/)** - Workload development guide
- **[dbt Documentation](https://docs.getdbt.com/)** - Learn about dbt and data transformation
- **[Fluent UI Components](https://react.fluentui.dev/)** - UI component library

## Troubleshooting

### DevGateway Fails to Start

**Problem**: Authentication fails or cannot connect to Fabric
- Ensure you're logged into Azure CLI: `az login`
- Verify your Entra app is configured correctly
- Check workspace GUID is valid for your Fabric tenant

### DevServer Shows Compilation Errors

**Problem**: TypeScript or webpack errors after code changes
- Verify imports and file paths are correct
- Check for missing dependencies: `npm install`
- Review error messages carefully—they usually indicate exact issues

### Workload Doesn't Appear in Fabric

**Problem**: Created items or workload not visible in Fabric UI
- Verify `Product.json` includes your item in `createExperience` and `recommendedItemTypes`
- Check `.env` file has correct `WORKLOAD_NAME`
- Restart both DevGateway and DevServer
- Refresh your Fabric browser tab

### Port Conflicts

**Problem**: "Port already in use" error
- List processes on port: `netstat -ano | findstr :5000`
- Kill process: `taskkill /PID <PID> /F`
- Or use different port in webpack config

## Development Workflow

1. **Daily Development**:
   - Start DevGateway and DevServer (one-time per session)
   - Make code changes in `Workload/app/`
   - Changes hot-reload automatically
   - Test in Fabric UI

2. **Before Committing**:
   - Run `npm run build:test` to verify compilation
   - Test item creation and basic functionality
   - Check for console errors in browser DevTools

3. **Deployment**:
   - Run `npm run build:prod` for production build
   - Execute `BuildManifestPackage.ps1` with prod environment
   - Deploy artifacts to Azure hosting
   - Register workload with Fabric tenant

## Learning Resources

### For First-Time Setup
Start with the official [Project Setup Guide](docs/Project_Setup.md) for detailed step-by-step instructions.

### For AI Assistance
If using GitHub Copilot or other AI tools, refer to [AI Instructions](./github/copilot-instructions.md) for critical architectural context.

### Available Components
The toolkit provides pre-built components. See [Components Documentation](./docs/components/README.md) for complete details.

### Project Organization
Review the [Project Structure Guide](docs/Project_Structure.md) to understand how files are organized and generated.

## Support

- **Issues & Questions**: Use the [Issues](../../issues) tab to report bugs or ask questions
- **Discussions**: Check [Discussions](../../discussions) for community conversations
- **Documentation**: Comprehensive docs in the `docs/` folder

## Licensing

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Use of Microsoft trademarks or logos is subject to [Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general). Use of third-party trademarks is subject to those third-party's policies.

---

**Happy developing! 🚀**
