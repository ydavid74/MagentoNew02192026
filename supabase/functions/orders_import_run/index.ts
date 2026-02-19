import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface ImportCounts {
  customers: number
  orders: number  
  items: number
  status: number
  documents: number
}

interface ImportResult {
  importId: string
  status: 'completed' | 'failed'
  counts: ImportCounts
  errors: string[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const formData = await req.formData()
    const dryRun = formData.get('dry_run') === 'true'

    console.log('Starting CSV import, dry_run:', dryRun)

    // Create import log entry
    const { data: importLog, error: logError } = await supabaseClient
      .from('import_logs')
      .insert({
        created_by: user.id,
        status: 'running',
        import_type: dryRun ? 'csv_dry_run' : 'csv_bulk_import'
      })
      .select()
      .single()

    if (logError || !importLog) {
      console.error('Error creating import log:', logError)
      return new Response(JSON.stringify({ error: 'Failed to create import log' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const counts: ImportCounts = {
      customers: 0,
      orders: 0,
      items: 0,
      status: 0,
      documents: 0
    }
    const errors: string[] = []

    try {
      // Process customers.csv
      const customersFile = formData.get('customers') as File
      if (customersFile) {
        const result = await processCustomersCSV(customersFile, supabaseClient, dryRun)
        counts.customers = result.count
        errors.push(...result.errors)
      }

      // Process orders.csv
      const ordersFile = formData.get('orders') as File
      if (ordersFile) {
        const result = await processOrdersCSV(ordersFile, supabaseClient, dryRun)
        counts.orders = result.count
        errors.push(...result.errors)
      }

      // Process items.csv
      const itemsFile = formData.get('items') as File
      if (itemsFile) {
        const result = await processItemsCSV(itemsFile, supabaseClient, dryRun)
        counts.items = result.count
        errors.push(...result.errors)
      }

      // Process status.csv
      const statusFile = formData.get('status') as File
      if (statusFile) {
        const result = await processStatusCSV(statusFile, supabaseClient, dryRun)
        counts.status = result.count
        errors.push(...result.errors)
      }

      // Process documents.csv
      const documentsFile = formData.get('documents') as File
      if (documentsFile) {
        const result = await processDocumentsCSV(documentsFile, supabaseClient, dryRun)
        counts.documents = result.count
        errors.push(...result.errors)
      }

      const finalStatus = errors.length > 0 ? 'failed' : 'completed'

      // Update import log
      await supabaseClient
        .from('import_logs')
        .update({
          status: finalStatus,
          ended_at: new Date().toISOString(),
          counts,
          errors
        })
        .eq('id', importLog.id)

      const result: ImportResult = {
        importId: importLog.id,
        status: finalStatus,
        counts,
        errors
      }

      console.log('Import completed:', result)

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } catch (error) {
      console.error('Import processing error:', error)
      
      // Update import log with error
      await supabaseClient
        .from('import_logs')
        .update({
          status: 'failed',
          ended_at: new Date().toISOString(),
          counts,
          errors: [...errors, `Processing error: ${error.message}`]
        })
        .eq('id', importLog.id)

      return new Response(JSON.stringify({
        importId: importLog.id,
        status: 'failed',
        counts,
        errors: [...errors, `Processing error: ${error.message}`]
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function processCustomersCSV(file: File, supabase: any, dryRun: boolean) {
  const text = await file.text()
  const rows = parseCSV(text)
  const errors: string[] = []
  let count = 0

  // Expected columns: name, email, phone, billing_addr, shipping_addr
  const requiredColumns = ['name', 'email']
  
  if (rows.length === 0) {
    errors.push('Customers CSV is empty')
    return { count, errors }
  }

  const headers = rows[0]
  const missingColumns = requiredColumns.filter(col => !headers.includes(col))
  if (missingColumns.length > 0) {
    errors.push(`Missing required columns in customers.csv: ${missingColumns.join(', ')}`)
    return { count, errors }
  }

  for (let i = 1; i < rows.length; i++) {
    try {
      const row = rows[i]
      const customer = {
        name: row[headers.indexOf('name')],
        email: row[headers.indexOf('email')],
        phone: row[headers.indexOf('phone')] || null,
        billing_addr: parseJSONField(row[headers.indexOf('billing_addr')]),
        shipping_addr: parseJSONField(row[headers.indexOf('shipping_addr')])
      }

      if (!customer.name || !customer.email) {
        errors.push(`Row ${i + 1}: Missing required customer data`)
        continue
      }

      if (!dryRun) {
        const { error } = await supabase
          .from('customers')
          .upsert(customer, { onConflict: 'email' })
        
        if (error) {
          errors.push(`Row ${i + 1}: ${error.message}`)
          continue
        }
      }

      count++
    } catch (error) {
      errors.push(`Row ${i + 1}: ${error.message}`)
    }
  }

  return { count, errors }
}

async function processOrdersCSV(file: File, supabase: any, dryRun: boolean) {
  const text = await file.text()
  const rows = parseCSV(text)
  const errors: string[] = []
  let count = 0

  // Expected columns: customer_email, purchase_from, order_date, total_amount, current_status
  const requiredColumns = ['customer_email', 'order_date', 'current_status']
  
  if (rows.length === 0) {
    errors.push('Orders CSV is empty')
    return { count, errors }
  }

  const headers = rows[0]
  const missingColumns = requiredColumns.filter(col => !headers.includes(col))
  if (missingColumns.length > 0) {
    errors.push(`Missing required columns in orders.csv: ${missingColumns.join(', ')}`)
    return { count, errors }
  }

  for (let i = 1; i < rows.length; i++) {
    try {
      const row = rows[i]
      const customerEmail = row[headers.indexOf('customer_email')]
      
      // Find customer by email
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('email', customerEmail)
        .single()

      if (customerError || !customer) {
        errors.push(`Row ${i + 1}: Customer not found with email ${customerEmail}`)
        continue
      }

      const order = {
        customer_id: customer.id,
        purchase_from: row[headers.indexOf('purchase_from')] || null,
        order_date: row[headers.indexOf('order_date')],
        total_amount: parseFloat(row[headers.indexOf('total_amount')]) || 0,
        current_status: row[headers.indexOf('current_status')]
      }

      if (!order.order_date || !order.current_status) {
        errors.push(`Row ${i + 1}: Missing required order data`)
        continue
      }

      if (!dryRun) {
        const { error } = await supabase
          .from('orders')
          .insert(order)
        
        if (error) {
          errors.push(`Row ${i + 1}: ${error.message}`)
          continue
        }
      }

      count++
    } catch (error) {
      errors.push(`Row ${i + 1}: ${error.message}`)
    }
  }

  return { count, errors }
}

async function processItemsCSV(file: File, supabase: any, dryRun: boolean) {
  const text = await file.text()
  const rows = parseCSV(text)
  const errors: string[] = []
  let count = 0

  // Expected columns: order_id, sku, size, metal_type, details, price, qty
  const requiredColumns = ['order_id', 'sku', 'price']
  
  if (rows.length === 0) {
    errors.push('Items CSV is empty')
    return { count, errors }
  }

  const headers = rows[0]
  const missingColumns = requiredColumns.filter(col => !headers.includes(col))
  if (missingColumns.length > 0) {
    errors.push(`Missing required columns in items.csv: ${missingColumns.join(', ')}`)
    return { count, errors }
  }

  for (let i = 1; i < rows.length; i++) {
    try {
      const row = rows[i]
      const item = {
        order_id: row[headers.indexOf('order_id')],
        sku: row[headers.indexOf('sku')],
        size: row[headers.indexOf('size')] || null,
        metal_type: row[headers.indexOf('metal_type')] || null,
        details: row[headers.indexOf('details')] || null,
        price: parseFloat(row[headers.indexOf('price')]) || 0,
        qty: parseInt(row[headers.indexOf('qty')]) || 1
      }

      if (!item.order_id || !item.sku) {
        errors.push(`Row ${i + 1}: Missing required item data`)
        continue
      }

      if (!dryRun) {
        const { error } = await supabase
          .from('order_items')
          .insert(item)
        
        if (error) {
          errors.push(`Row ${i + 1}: ${error.message}`)
          continue
        }
      }

      count++
    } catch (error) {
      errors.push(`Row ${i + 1}: ${error.message}`)
    }
  }

  return { count, errors }
}

async function processStatusCSV(file: File, supabase: any, dryRun: boolean) {
  const text = await file.text()
  const rows = parseCSV(text)
  const errors: string[] = []
  let count = 0

  // Expected columns: order_id, status, comment, created_by_email
  const requiredColumns = ['order_id', 'status']
  
  if (rows.length === 0) {
    errors.push('Status CSV is empty')
    return { count, errors }
  }

  const headers = rows[0]
  const missingColumns = requiredColumns.filter(col => !headers.includes(col))
  if (missingColumns.length > 0) {
    errors.push(`Missing required columns in status.csv: ${missingColumns.join(', ')}`)
    return { count, errors }
  }

  for (let i = 1; i < rows.length; i++) {
    try {
      const row = rows[i]
      const createdByEmail = row[headers.indexOf('created_by_email')]
      let createdBy = null

      if (createdByEmail) {
        // Find user by email - this is a simplified approach
        // In production, you might want a different user lookup strategy
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .limit(1)
          .single()
        
        if (profile) {
          createdBy = profile.user_id
        }
      }

      const statusHistory = {
        order_id: row[headers.indexOf('order_id')],
        status: row[headers.indexOf('status')],
        comment: row[headers.indexOf('comment')] || null,
        created_by: createdBy
      }

      if (!statusHistory.order_id || !statusHistory.status) {
        errors.push(`Row ${i + 1}: Missing required status data`)
        continue
      }

      if (!dryRun) {
        const { error } = await supabase
          .from('order_status_history')
          .insert(statusHistory)
        
        if (error) {
          errors.push(`Row ${i + 1}: ${error.message}`)
          continue
        }
      }

      count++
    } catch (error) {
      errors.push(`Row ${i + 1}: ${error.message}`)
    }
  }

  return { count, errors }
}

async function processDocumentsCSV(file: File, supabase: any, dryRun: boolean) {
  const text = await file.text()
  const rows = parseCSV(text)
  const errors: string[] = []
  let count = 0

  // Expected columns: order_id, type, filename, file_url
  const requiredColumns = ['type', 'filename', 'file_url']
  
  if (rows.length === 0) {
    errors.push('Documents CSV is empty')
    return { count, errors }
  }

  const headers = rows[0]
  const missingColumns = requiredColumns.filter(col => !headers.includes(col))
  if (missingColumns.length > 0) {
    errors.push(`Missing required columns in documents.csv: ${missingColumns.join(', ')}`)
    return { count, errors }
  }

  for (let i = 1; i < rows.length; i++) {
    try {
      const row = rows[i]
      const document = {
        order_id: row[headers.indexOf('order_id')] || null,
        type: row[headers.indexOf('type')],
        filename: row[headers.indexOf('filename')],
        file_url: row[headers.indexOf('file_url')],
        size: parseInt(row[headers.indexOf('size')]) || null,
        content_type: row[headers.indexOf('content_type')] || null,
        uploaded_by: null // Will be set from auth context
      }

      if (!document.type || !document.filename || !document.file_url) {
        errors.push(`Row ${i + 1}: Missing required document data`)
        continue
      }

      if (!dryRun) {
        const { error } = await supabase
          .from('documents')
          .insert(document)
        
        if (error) {
          errors.push(`Row ${i + 1}: ${error.message}`)
          continue
        }
      }

      count++
    } catch (error) {
      errors.push(`Row ${i + 1}: ${error.message}`)
    }
  }

  return { count, errors }
}

function parseCSV(text: string): string[][] {
  const lines = text.trim().split('\n')
  return lines.map(line => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current.trim())
    return result
  })
}

function parseJSONField(value: string): any {
  if (!value || value.trim() === '') return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}