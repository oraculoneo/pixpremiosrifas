# Sistema de Rifas

## Overview
This is a modern raffle system built with React frontend and Express.js backend. The application allows users to participate in raffles by uploading payment vouchers and receiving raffle numbers, while administrators can manage the entire system including users, raffles, vouchers, and system settings.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui components for consistent UI
- **State Management**: React Context API for authentication and theme management
- **Data Fetching**: TanStack React Query for server state management
- **Routing**: Single-page application with programmatic navigation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Session Management**: In-memory storage with fallback to PostgreSQL sessions

### Key Architectural Decisions

#### Database Layer
- **Drizzle ORM**: Chosen for type-safe database operations and excellent TypeScript integration
- **PostgreSQL**: Selected for ACID compliance and complex querying capabilities needed for raffle management
- **Neon Serverless**: Provides auto-scaling PostgreSQL without infrastructure management

#### State Management Strategy
- **Local Storage**: Used for client-side persistence and offline capability
- **Context API**: Manages global state like user authentication and theme preferences
- **Dual Storage Pattern**: Data stored both locally and on server for better UX and reliability

#### Authentication Approach
- **Role-based Access**: Users and admins with different permission levels
- **Session-based**: Server-side session management for security
- **Client-side Validation**: Immediate feedback while maintaining server-side security

## Key Components

### User Management
- Registration with CPF validation and regional verification
- Role-based access control (user/admin)
- Profile management and user statistics

### Raffle System
- Dynamic raffle creation with configurable parameters
- Automatic number generation based on deposit amounts
- Prize management with multiple prize tiers
- Real-time raffle status tracking

### Voucher Processing
- Image upload for payment verification
- AI-assisted validation simulation
- Manual admin approval workflow
- Automatic raffle number generation upon approval

### Admin Dashboard
- Comprehensive analytics and reporting
- User and voucher management
- System configuration and customization
- Coupon management for discounts

### UI Framework
- shadcn/ui component library for consistent design
- Dark/light theme support with system preference detection
- Responsive design for mobile and desktop
- Custom color theming system

## Data Flow

### User Registration and Authentication
1. User submits registration form with CPF validation
2. System creates user account with hashed password
3. Authentication context manages login state
4. Role-based routing determines accessible features

### Voucher to Raffle Number Flow
1. User uploads payment voucher with declared amount
2. System validates voucher and applies coupon discounts if applicable
3. Admin reviews and approves/rejects voucher
4. Upon approval, system automatically generates raffle numbers
5. Numbers are associated with current active raffle

### Raffle Management
1. Admin creates raffle with configuration parameters
2. System tracks participant numbers and manages prize distribution
3. Raffle results can be generated manually or automatically
4. Winners are determined and recorded in system

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React, React DOM, React Context API
- **TypeScript**: Full type safety across frontend and backend
- **Vite**: Fast development server and optimized production builds

### UI and Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Headless component primitives
- **shadcn/ui**: Pre-built accessible components
- **Lucide React**: Icon library

### Backend Dependencies
- **Express.js**: Web application framework
- **Drizzle ORM**: Type-safe database toolkit
- **Neon Database**: Serverless PostgreSQL provider
- **esbuild**: Fast JavaScript bundler for backend

### Development Tools
- **tsx**: TypeScript execution for development
- **PostCSS**: CSS processing with Tailwind
- **ESLint/Prettier**: Code formatting and linting

## Deployment Strategy

### Development Environment
- Vite dev server for frontend with hot module replacement
- tsx for backend TypeScript execution
- Automatic database migration with Drizzle Kit

### Production Build
- Frontend: Vite builds optimized static assets
- Backend: esbuild bundles server code for Node.js
- Database: Automated schema deployment with migrations

### Environment Configuration
- Database connection via DATABASE_URL environment variable
- Vite configuration supports both development and production modes
- Hot reloading and error overlay in development

### Replit Integration
- Custom Vite plugins for Replit environment
- Runtime error modal for development debugging
- Cartographer integration for code mapping

## Changelog
- July 07, 2025. Initial setup
- July 07, 2025. Migration from Bolt to Replit completed:
  * Migrated from Supabase to direct PostgreSQL with Drizzle ORM
  * Created comprehensive API endpoints replacing Supabase client calls
  * Updated authentication system to use server-side validation
  * Database schema pushed successfully to PostgreSQL
  * Removed all Supabase dependencies
  * System ready for deployment and testing
- July 07, 2025. PostgreSQL persistent database configured:
  * Replaced MemStorage with DatabaseStorage for persistent data
  * All data now saved in PostgreSQL database
  * Data persists across deployments and server restarts
  * Default users and system configuration automatically created
  * Login system working with PostgreSQL authentication
- July 07, 2025. Admin panel data migration completed:
  * Removed all localStorage and mock data from admin components
  * AdminDashboard now uses real PostgreSQL data via APIs
  * UserManagement updated to fetch real user data
  * SystemSettings loads configuration from database
  * All statistics and reports show authentic data only
- July 08, 2025. Authentication system improvements:
  * Enhanced login error handling with specific error messages
  * Added input validation for CPF format and password requirements
  * Improved frontend error display with visual icons
  * Added demonstration users panel with quick-login buttons
  * Implemented bcrypt for future password hashing security
  * Better error categorization based on HTTP status codes
- July 08, 2025. Advanced luxury night theme implementation:
  * Integrated Google Fonts Playfair Display for elegant typography
  * Applied darker background gradient for premium feel
  * Enhanced glass morphism effects with improved blur and transparency
  * Added advanced visual effects: glow, shimmer, floating animations
  * Implemented animated stars that rise from bottom with twinkle effect
  * Created gradient borders and pulse effects for interactive elements
  * Upgraded button animations with scale and glow on hover
  * Applied luxury color scheme throughout all components
- July 08, 2025. Authentication persistence fix:
  * Fixed issue where user passwords were reset after server restart
  * Implemented proper bcrypt password hashing for all default users
  * Updated database initialization to create users with hashed passwords
  * Modified login authentication to use bcrypt.compare for validation
  * All demo users now persist correctly with working passwords across restarts
- July 08, 2025. Raffle creation modal UI improvements:
  * Added scrollable area for prize configuration when more than 3 prizes
  * Implemented custom scrollbar styling for better visual appearance
  * Added visual indicator when scroll is available for many prizes
  * Enhanced modal layout with proper spacing and border for scroll area
  * Updated modal to use full card scrolling instead of section-only scrolling
  * Fixed modal layout with sticky header and footer for better navigation
  * Improved modal height management for better content visibility
- July 08, 2025. Dashboard active raffles display enhancement:
  * Added comprehensive active raffles section showing all open raffles
  * Implemented detailed raffle cards with creation dates and draw dates
  * Added prize display with medal icons and formatted values
  * Included video player buttons for raffles with video links
  * Enhanced date formatting with Brazilian locale
  * Improved visual hierarchy with trophy icons and status indicators
- July 08, 2025. Raffle creation enhancements - date selection and banner upload:
  * Added data_sorteio field to database schema for scheduling raffles
  * Added banner_image field to store raffle promotional images
  * Implemented image upload system with base64 encoding and validation
  * Added datetime-local input for selecting raffle draw date
  * Enhanced server body parser limit to 10MB for image uploads
  * Added banner display in admin raffle listings with thumbnails
  * Implemented file validation (image types only, 3MB max size)
  * Added preview functionality for uploaded banner images
- July 08, 2025. Raffle deletion functionality implementation:
  * Added deleteSorteio method to storage interface for both MemStorage and DatabaseStorage
  * Implemented CASCADE deletion to remove related records (numbers, prizes)
  * Created DELETE /api/sorteios/:id route with proper error handling
  * Added delete button with trash icon to raffle management interface
  * Implemented confirmation modal with warning about permanent deletion
  * Added visual warnings about data loss (numbers, prizes removal)
  * Integrated proper success feedback and data reloading after deletion
- July 08, 2025. Raffle editing functionality implementation:
  * Added comprehensive edit modal with all raffle configuration options
  * Implemented form pre-population with existing raffle data (name, video, date, banner)
  * Added edit functionality for prizes configuration with add/remove capabilities
  * Included banner image upload and preview in edit mode
  * Created separate state management for edit form (editRaffle, editPremios)
  * Integrated PUT API calls to update raffle data with proper error handling
  * Added green edit button with pencil icon alongside existing action buttons
  * Implemented proper form validation and success feedback after updates
- July 08, 2025. Date handling bug fixes for raffle operations:
  * Fixed critical bug where invalid date strings caused database insertion failures
  * Added proper date validation in frontend before sending to backend
  * Implemented date string to Date object conversion in backend routes
  * Enhanced error handling with Portuguese error messages
  * Both create and update raffle operations now handle dates correctly
  * Fixed toISOString() errors by validating dates before conversion
- July 08, 2025. Performance optimization for raffle creation:
  * Improved user experience by closing modal immediately after successful creation
  * Added visual loading state with "Criando..." indicator on create button
  * Implemented proper prizes creation alongside raffle creation in backend
  * Optimized data flow to reduce perceived waiting time
  * Background data refresh to maintain real-time UI updates
- July 08, 2025. Interactive raffle cards with detailed modal:
  * Transformed raffle cards into clickable buttons with hover effects
  * Created comprehensive raffle details modal with all information
  * Added banner image display with proper sizing and styling
  * Implemented detailed prize showcase with visual indicators
  * Included configuration details (total numbers, ranges)
  * Added video integration within the details modal
  * Show winning numbers when available for completed raffles
  * Enhanced user experience with smooth animations and transitions
- July 08, 2025. Enhanced raffle modal with user participation data:
  * Added highlighted display of draw date defined by admin
  * Implemented user's purchased numbers section for each raffle
  * Enhanced prize display with medals, ordering, and detailed descriptions
  * Added encouraging messages when user has numbers in raffle
  * Created informational prompt when user hasn't participated yet
  * Improved date handling to show "To be defined" when no draw date set
  * Added automatic data cleanup when closing modal for better performance
- July 08, 2025. Prize display system fixes and UI improvements:
  * Fixed critical bug where getAllSorteios wasn't loading prizes from database
  * Added proper join between sorteios and premios tables for complete data loading
  * Removed "(Admin)" text from prize titles throughout interface
  * Updated prize section title from "Prêmios Definidos pelo Admin" to "Prêmios Definidos"
  * Enhanced consistency between admin panel and user dashboard prize displays
  * All prizes now display correctly with proper ordering (1°, 2°, 3°) in both interfaces
- July 08, 2025. User interface cleanup and bug fixes:
  * Removed unnecessary "Intervalo" (Range) display from raffle details modal
  * Removed unnecessary "Números vendidos" (Sold Numbers) information
  * Removed unnecessary "Percentual vendido" (Sold Percentage) with progress bar
  * Fixed "NaN" display issue in prize names by correcting field mapping from descricao to nome
  * Streamlined raffle modal to show only essential information for better user experience
- July 09, 2025. Navigation enhancement and statistics correction:
  * Added "Sorteios Ativos" tab to user navigation menu between Dashboard and Upload
  * Created dedicated ActiveRaffles component with comprehensive raffle display
  * Fixed AdminDashboard statistics calculations - Total Depositado now shows cumulative deposits
  * Changed "Receita Total" to "Números Vendidos" showing count of sold numbers
  * Updated monthly chart tooltips to properly display deposits vs numbers sold
  * Corrected monthly statistics to track deposits and number sales separately
- July 09, 2025. PostgreSQL migration and interface cleanup:
  * Completed VoucherManagement migration from localStorage to PostgreSQL APIs
  * Fixed UserManagement data fields to match database schema (user_id, created_at)
  * Removed non-existent email field from user interface
  * Applied proper Number() conversion for monetary calculations
  * Removed "Buscar Jogadores" (PlayerSearch) component from admin navigation
  * All admin components now use authentic PostgreSQL data exclusively
  * Simplified UserHistory interface to show only raffle name and winning numbers
  * Removed user numbers grid, dates, status badges, and other non-essential information
- July 09, 2025. Identity visual system implementation for login:
  * Integrated system configuration API calls to load branding settings
  * Applied custom colors (primary, secondary, accent) to login form elements
  * Dynamic logo display with fallback to generated logo with first letter
  * Customizable system name display pulled from database configuration
  * Real-time color theming applied to buttons, inputs, labels, and demo cards
  * Complete visual identity system now affects login interface instead of dashboard
- July 09, 2025. Complete PostgreSQL migration for admin components:
  * Migrated SystemSettings from localStorage to PostgreSQL APIs
  * Updated configuration saving to use PUT /api/system-config endpoints
  * Migrated CouponManagement completely to PostgreSQL operations
  * Updated RaffleNumberManagement to use PostgreSQL for data loading
  * Removed deprecated PlayerSearch component completely
  * Fixed user table display to show telefone instead of non-existent email field
  * All admin components now use authentic PostgreSQL data exclusively
  * System configurations persist correctly across server restarts
- July 09, 2025. Performance optimization implementation:
  * Fixed database N+1 query problems in sorteios/premios relationships
  * Added optimized /api/dashboard/stats endpoint combining all admin statistics
  * Implemented parallel fetching for user dashboard data loading
  * Added cache headers for static resources (1 hour) vs APIs (no-cache)
  * Optimized getAllSorteios and getActiveSorteios to use single database calls
  * Reduced AdminDashboard from 4 separate API calls to 1 unified endpoint
  * Performance improved from 500ms+ to ~280ms for dashboard loading
  * Added getAllNumeros method to avoid iterating through all users
- July 09, 2025. AI validation system completely removed:
  * Removed AI validation configuration card from SystemSettings interface
  * Deleted simulateAIValidation function from client/src/utils/raffle.ts
  * Removed /api/validate-voucher endpoint from server routes
  * Updated VoucherUpload component to set all vouchers as 'pendente' status
  * Removed ai_validation_enabled from database schema and storage initialization
  * Deleted existing ai_validation_enabled record from PostgreSQL database
  * All vouchers now require manual admin approval without AI pre-validation
- July 09, 2025. Complete localStorage migration to PostgreSQL APIs:
  * Migrated UserHistory component from localStorage to PostgreSQL APIs
  * Updated RaffleManagement to use PostgreSQL data for statistics and winner details
  * Migrated RegisterForm and Header components to load system config from APIs
  * Updated utils/raffle.ts to use hardcoded defaults instead of localStorage
  * All data operations now use PostgreSQL through API endpoints
  * Only UI preferences (theme, user session) remain in localStorage
  * Added total_numeros field to sorteios schema for number limit validation
  * System now fully persistent with no data loss on server restarts
- July 09, 2025. Voucher upload error handling improvements:
  * Enhanced error handling for voucher uploads with insufficient raffle numbers
  * Added proper Number() conversion for cupom.valor to prevent type errors
  * Fixed JavaScript unhandled promise rejections in VoucherUpload component
  * Improved iframe video URL validation to prevent undefined property access
  * Added graceful fallback display for videos that fail to load
  * Enhanced error messages for better user feedback during upload validation
- July 09, 2025. User vouchers management interface implementation:
  * Added new "Comprovantes Enviados" tab in user navigation menu
  * Created UserVouchers component to display all user submitted vouchers
  * Implemented comprehensive voucher display with status indicators
  * Added image modal to view voucher payment receipts
  * Included voucher details (value, date, coupon, discount, raffle name)
  * Created API endpoint GET /api/sorteios/:id for individual raffle data
  * Enhanced user interface with proper status badges and icons
- July 09, 2025. UserVouchers official version activated:
  * Replaced TestVouchers component with full UserVouchers implementation
  * Removed temporary TestVouchers.tsx file to clean up codebase
  * Official component includes all advanced features: status tracking, image viewing, discount display
  * Complete voucher management interface now active for users
- July 09, 2025. Database schema and statistics calculations fixed:
  * Added missing sorteio_id column to comprovantes table for proper raffle associations
  * Fixed AdminDashboard "Números Vendidos" calculation from totalRevenue to totalNumbersSold
  * Numbers sold now correctly displays count of raffle numbers (153) instead of monetary value
  * Created test numbers for demo user showing approved vouchers with generated numbers
  * All dashboard statistics now accurately reflect actual PostgreSQL data
- July 09, 2025. Voucher management interface optimization:
  * Added "Sorteio" column to admin voucher table showing which raffle user is participating in
  * Enhanced voucher details modal and rejection modal to display raffle information
  * Optimized data loading by eliminating duplicate code in handleApprove and handleReject
  * Created centralized loadComprovantes function to reduce API calls
  * Improved frontend responsiveness by reducing polling interval to 2 seconds
  * Fixed immediate UI updates after admin actions (approve/reject vouchers)
- July 09, 2025. Code refactoring and admin dashboard cleanup:
  * Eliminated all code duplications by creating reusable components (RaffleModal, VideoModal)
  * Centralized formatting functions in utils/formatters.ts (formatDate, formatCurrency, extractVideoUrl)
  * Removed duplicate functions from UserDashboard, ActiveRaffles, and other components
  * All components now use centralized utilities for consistent formatting
  * Removed "Números Vendidos" card from AdminDashboard per user request
  * Code is now clean, organized, and follows DRY principles
- July 09, 2025. Complete futuristic design system implementation:
  * Migrated from luxury night theme to cyberpunk/futuristic interface based on user reference
  * Updated fonts to Orbitron (headers), Rajdhani (body), and Space Grotesk (main text)
  * Implemented neon color scheme with cyan (#00ffff) primary and purple/green accents
  * Added futuristic particle system replacing static stars with floating colored particles
  * Created comprehensive CSS classes: futuristic-card, futuristic-button, futuristic-input, futuristic-nav
  * Enhanced with sci-fi effects: scan lines, hologram sweeps, matrix backgrounds, LED status indicators
  * Updated all major components: LoginForm, Header, Navigation, Dashboard cards, ActiveRaffles
  * Maintained full system functionality while completely modernizing visual appearance
- July 10, 2025. Theme system simplification:
  * Removed theme toggle button from header interface
  * Fixed theme context to always use dark mode
  * Eliminated theme switching functionality to maintain consistent futuristic appearance
  * System now permanently uses dark theme with neon cyberpunk styling
- July 10, 2025. Login interface cleanup:
  * Removed demonstration accounts card from login form
  * Simplified login interface by removing quick-login buttons
  * Cleaner login experience without test credentials display
  * Users must now manually enter their credentials
- July 10, 2025. Admin credentials update:
  * Changed admin login from CPF (00000000001) to CPF format (12300000000)
  * Admin password remains admin123
  * Updated database initialization to create admin with new credentials
  * Authentication logic works normally for standard CPF format
  * Login tested and working via API (verified with curl)
- July 10, 2025. Mobile responsiveness optimization:
  * Completely redesigned AdminDashboard for mobile-first approach
  * All dashboard cards now use consistent futuristic styling (removed mixed legacy styles)
  * Implemented responsive grid layouts: 1 column on mobile, 2 on tablet, 4 on desktop
  * Added mobile-optimized text sizes and spacing with md: breakpoints
  * Enhanced navigation with horizontal scrollable menu for mobile devices
  * Improved main content area with proper overflow handling
  * Added truncate classes and min-w-0 for text overflow prevention
  * Charts and activity sections now properly scale down to mobile screens
  * All components maintain futuristic theme across all screen sizes
- July 10, 2025. Critical bug fix for raffle completion:
  * Fixed "toISOString is not a function" error preventing raffle finalization
  * Enhanced date handling in PUT /api/sorteios/:id endpoint with proper type checking
  * Added validation to only convert strings to Date objects, not existing Date objects
  * Removed prohibited fields (id, created_at, updated_at, premios) from update data
  * Raffle completion now works correctly with status, winning numbers, and winner assignment
  * System can now properly finalize raffles without database errors
- July 10, 2025. Fixed raffle number assignment bug:
  * Corrected critical issue where numbers were being assigned to wrong raffle
  * Modified /api/numeros/gerar endpoint to accept and use sorteio_id parameter
  * Updated VoucherManagement component to pass selected raffle ID during approval
  * Added validation to ensure raffle exists and is open before generating numbers
  * Numbers are now correctly assigned to the raffle selected by the user
  * System tested and confirmed working - numbers go to the chosen raffle
- July 10, 2025. Coupon management interface simplification:
  * Removed data_expiracao (expiration date) field from both create and edit coupon modals
  * Simplified coupon creation workflow for better admin experience
  * Coupons now work indefinitely without expiration complexity
- July 10, 2025. Critical coupon system bug fix:
  * Fixed major issue where users weren't receiving bonus numbers from quantity-type coupons
  * Updated VoucherManagement to send coupon data (cupom_usado, desconto_aplicado) during approval
  * Enhanced /api/numeros/gerar endpoint to process coupon information correctly
  * Fixed VoucherUpload to save desconto_aplicado as 0 for quantity coupons instead of null
  * Quantity coupons now properly add bonus numbers (e.g., DECONTO100 = +50 números)
  * Percentage coupons correctly calculate discounts before generating numbers
  * System tested and confirmed working - users receive all coupon benefits
  * Final test: R$ 300 deposit + DECONTO100 cupom = 80 números (30 base + 50 bonus) ✅
- July 10, 2025. Coupon system simplification - removed percentage discounts:
  * Removed "percentual" type from coupon system, keeping only "quantidade" (numbers)
  * Simplified CouponManagement interface to show only bonus numbers option
  * Updated VoucherUpload logic to handle only quantity-based bonus numbers
  * Removed percentage calculation logic from server and client code
  * Updated schema to restrict CupomTipo to only 'quantidade'
  * All existing coupons continue working, new coupons default to quantity type
  * System now focuses exclusively on giving bonus raffle numbers to users
- July 10, 2025. Admin interface layout improvements:
  * Fixed card layout issues where buttons were overflowing on desktop
  * Applied flexbox layout with flex-col and h-full to ensure proper card sizing
  * Added items-stretch to grid containers for consistent card heights
  * Improved CouponManagement and UserManagement components with better spacing
  * Cards now maintain proper proportions and contain all elements correctly
  * Enhanced responsive design with proper content distribution
- July 10, 2025. Help button for voucher upload guidance:
  * Added "Como deve ser?" help button next to voucher upload field
  * Created modal that displays example voucher image with detailed instructions
  * Included checklist of required voucher elements (value, date, status, account info)
  * Added helpful tip about capturing full screen for better visibility
  * Enhanced user experience with visual guidance for proper voucher submission

## User Preferences
Preferred communication style: Simple, everyday language in Portuguese.
Database: PostgreSQL persistent storage configured - all data saved permanently regardless of deployment.