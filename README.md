# BakeSync ERP

A comprehensive Next.js 14 ERP system for bakery operations featuring inventory management, recipe tracking, POS system, production planning, and financial analytics.

## Features

- **Inventory Management** - Track raw materials and finished goods with real-time stock levels
- **Recipe Management** - Create, edit, and manage bakery recipes with cost analysis
- **Point of Sale (POS)** - Process customer transactions with responsive cart interface
- **Production Planning** - Schedule and track production batches
- **Financial Analytics** - Monitor expenses, revenue, and profitability
- **Role-based Access Control** - Different permissions for managers, bakers, and cashiers
- **Real-time Inventory Tracking** - Live stock updates and low-stock alerts
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Package Manager**: pnpm
- **Icons**: Lucide React

## Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (version 18 or higher)
- **pnpm** (recommended package manager)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mikaelleon/BakeSync.git
   cd BakeSync
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start the development server**
   ```bash
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm test` - Run Playwright tests (server starts automatically)
- `pnpm test:ui` - Run tests with interactive UI mode
- `pnpm test:headed` - Run tests in headed mode (visible browser)

## Project Structure

```
bakesync-erp/
├── app/                    # Next.js App Router pages
│   ├── (app)/             # Main application routes
│   │   ├── dashboard/     # Dashboard page
│   │   ├── inventory/     # Inventory management
│   │   ├── recipes/       # Recipe management
│   │   ├── pos/          # Point of Sale system
│   │   ├── production/    # Production planning
│   │   └── financials/    # Financial analytics
│   └── login/             # Authentication
├── components/            # Reusable UI components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility functions and types
├── hooks/                # Custom React hooks
├── documents/            # Project documentation
│   ├── setup/            # Setup and configuration guides
│   ├── implementation/   # Implementation guides
│   ├── analysis/         # Analysis and fixes
│   ├── features/         # Feature documentation
│   └── gantts/           # Gantt chart files
├── docs/                 # Additional documentation assets
│   ├── database/         # Database scripts
│   └── assets/           # Documentation images
└── public/               # Static assets
```

## User Roles

- **Manager** - Full access to all features
- **Baker** - Access to recipes, production, and raw materials inventory
- **Cashier** - Access to POS system and finished goods inventory

## Default Login Credentials

The application uses mock authentication. You can access different roles by logging in with:

- **Manager**: Full system access
- **Baker**: Production and recipe access
- **Cashier**: POS system access

## Testing

The project includes a comprehensive Playwright test suite with Page Object Model (POM) pattern:

- **Automatic server startup** - Tests start the dev server automatically
- **Page Object Model** - Maintainable test structure with reusable page classes
- **Semantic selectors** - Reliable element selection using `getByRole` and `getByLabel`
- **Multi-browser support** - Chromium, Firefox, and optional WebKit

See [tests/README.md](tests/README.md) and [documents/setup/PLAYWRIGHT_SETUP.md](documents/setup/PLAYWRIGHT_SETUP.md) for detailed testing documentation.

## Documentation

Comprehensive documentation is available in the `documents/` directory:

- **[Setup Guides](documents/setup/)** - Configuration and setup instructions
- **[Implementation Guides](documents/implementation/)** - Development guides and phase summaries
- **[Analysis Documents](documents/analysis/)** - Technical analysis and fixes
- **[Feature Documentation](documents/features/)** - Feature lists and progress tracking
- **[Gantt Charts](documents/gantts/)** - Project planning and task scheduling

See [documents/README.md](documents/README.md) for complete documentation structure.

## Features Overview

### Inventory Management
- Track raw materials and finished goods
- Set minimum stock levels and alerts
- Bulk edit functionality
- Expiration date tracking
- Real-time stock updates

### Recipe Management
- Create and edit recipes with detailed instructions
- Ingredient management with quantities and units
- Cost analysis and pricing
- Production yield tracking
- Inventory integration for ingredient availability

### Point of Sale
- Responsive cart interface
- Multiple payment methods (Cash, Card, GCash)
- Real-time inventory updates
- Transaction history
- Receipt generation

### Production Planning
- Batch scheduling and tracking
- Recipe-based production
- Inventory consumption tracking
- Production logs and analytics

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

