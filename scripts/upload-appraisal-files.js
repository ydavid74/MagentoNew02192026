#!/usr/bin/env node

/**
 * Script to upload appraisal design files to Supabase Storage
 * Run this script after setting up the storage bucket
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   VITE_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const appraisalFilesDir = join(__dirname, '../public/appraisal_files')

async function uploadAppraisalFiles() {
  try {
    console.log('🚀 Starting upload of appraisal files...')
    
    // Read all files in the appraisal_files directory
    const files = readdirSync(appraisalFilesDir)
    
    for (const file of files) {
      const filePath = join(appraisalFilesDir, file)
      const fileStat = statSync(filePath)
      
      if (fileStat.isFile()) {
        console.log(`📁 Uploading ${file}...`)
        
        // Read file content
        const fileContent = readFileSync(filePath)
        
        // Determine content type based on file extension
        const ext = extname(file).toLowerCase()
        let contentType = 'application/octet-stream'
        
        switch (ext) {
          case '.css':
            contentType = 'text/css'
            break
          case '.jpg':
          case '.jpeg':
            contentType = 'image/jpeg'
            break
          case '.png':
            contentType = 'image/png'
            break
          case '.gif':
            contentType = 'image/gif'
            break
        }
        
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('documents')
          .upload(`appraisal_files/${file}`, fileContent, {
            contentType,
            cacheControl: '3600',
            upsert: true // Allow overwriting existing files
          })
        
        if (error) {
          console.error(`❌ Error uploading ${file}:`, error.message)
        } else {
          console.log(`✅ Successfully uploaded ${file}`)
        }
      }
    }
    
    console.log('🎉 Upload completed!')
    console.log('📋 Files are now available at:')
    console.log(`   ${supabaseUrl}/storage/v1/object/public/documents/appraisal_files/`)
    
  } catch (error) {
    console.error('❌ Error during upload:', error.message)
    process.exit(1)
  }
}

// Run the upload
uploadAppraisalFiles()
