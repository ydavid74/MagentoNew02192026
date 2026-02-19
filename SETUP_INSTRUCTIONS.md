# Setup Instructions for Magento Gemini Admin

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Setup

### 1. Run the following migrations in order:

#### Migration 1: Update Orders Structure

```sql
-- File: supabase/migrations/20250101000000_update_orders_structure.sql
-- Adds bill_to_name and ship_to_name columns to orders table
```

#### Migration 2: Set Purchase From to Primestyle

```sql
-- File: supabase/migrations/20250101000001_update_purchased_from_to_primestyle.sql
-- Sets all purchase_from values to 'primestyle'
```

#### Migration 3: Add Customer Details

```sql
-- File: supabase/migrations/20250101000002_add_customer_details.sql
-- Adds customization_notes, previous_order_id, how_did_you_hear to orders table
-- Adds first_name, last_name, company, tax_id, notes to customers table
```

#### Migration 4: Add Bill/Ship Names

```sql
-- File: supabase/migrations/20250101000003_add_bill_ship_names.sql
-- Adds bill_to_name and ship_to_name columns to orders table
```

#### Migration 5: Create Address Tables

```sql
-- File: supabase/migrations/20250101000004_create_address_tables.sql
-- Creates order_billing_address and order_shipping_address tables
-- Replaces JSONB address fields with dedicated tables
```

#### Migration 6: Add Image Column to Order Items

```sql
-- File: supabase/migrations/20250101000005_add_image_to_order_items.sql
-- Adds image column to order_items table for product images
```

#### Migration 7: Add Address Table Policies

```sql
-- File: supabase/migrations/20250101000006_add_address_table_policies.sql
-- Enables RLS and adds policies for address tables
-- Adds created_by and updated_by columns with triggers
```

#### Migration 8: Add Storage Bucket Policies

```sql
-- File: supabase/migrations/20250101000007_add_storage_bucket_policies.sql
-- Creates documents bucket and adds storage policies
-- Enables authenticated users to upload/manage product images
```

### 2. Storage Bucket Setup

The migrations will automatically create a `documents` bucket with the following structure:

* **Bucket Name**: `documents`
* **Public Access**: Yes (for viewing images)
* **Product Images Path**: `product-images/{orderId}/{filename}`

### 3. Row Level Security (RLS)

The following tables have RLS enabled with appropriate policies:

* `order_billing_address` - Users can only access addresses for orders they have access to
* `order_shipping_address` - Users can only access addresses for orders they have access to
* `storage.objects` - Authenticated users can upload/manage files in the documents bucket

## Test Users

Create test users using the provided SQL script:

```sql
-- File: scripts/create-test-user.sql
-- Creates admin and employee test users
```

## Features Implemented

### Authentication & Authorization

* ✅ Supabase authentication integration
* ✅ Role-based access control (admin/employee)
* ✅ AuthGuard and AdminGuard components
* ✅ Session persistence and management

### Orders Management

* ✅ Orders listing with pagination and search
* ✅ Order detail page with sidebar navigation
* ✅ Editable order information (date, status, purchase from)
* ✅ Customization notes management
* ✅ Billing and shipping address management
* ✅ Order items CRUD operations
* ✅ Product image upload and management
* ✅ Cost tracking and management
* ✅ Comments and audit history

### Image Management

* ✅ Product image upload via drag & drop or file picker
* ✅ Supabase Storage integration
* ✅ Image validation (type, size)
* ✅ Automatic image deletion when items are removed
* ✅ Organized storage structure by order and SKU

### UI/UX Features

* ✅ Modern, professional color theme
* ✅ Responsive design with Tailwind CSS
* ✅ Shadcn UI components
* ✅ Dark mode support
* ✅ Toast notifications
* ✅ Loading states and error handling

## Testing


1. **Start the development server**:

   ```bash
   npm run dev
   ```
2. **Navigate to the test page** (`/test`) to verify component styling
3. **Test authentication flow**:
   * Sign in with test credentials
   * Verify role-based access
   * Test session persistence
4. **Test order management**:
   * Create/edit orders
   * Add/edit/delete order items
   * Upload product images
   * Manage addresses and notes

## Troubleshooting

### Common Issues


1. **"Stuck loading icon"**:
   * Clear browser cache
   * Restart development server
   * Check authentication status
2. **Database errors**:
   * Ensure all migrations have been run
   * Check Supabase connection
   * Verify environment variables
3. **Image upload failures**:
   * Check storage bucket policies
   * Verify file size and type
   * Check authentication status

### Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check
```

## Security Notes

* All database operations are protected by RLS policies
* File uploads are restricted to authenticated users
* User access is limited to their own data or admin-level access
* Address tables track who created/modified records
* Storage bucket policies prevent unauthorized access

## Next Steps


1. **Production Deployment**:
   * Set up production Supabase project
   * Configure custom domain for storage
   * Set up CDN for image delivery
2. **Advanced Features**:
   * Image optimization and compression
   * Bulk image upload
   * Image metadata and tagging
   * Advanced search and filtering
3. **Performance Optimization**:
   * Implement image lazy loading
   * Add caching strategies
   * Optimize database queries


