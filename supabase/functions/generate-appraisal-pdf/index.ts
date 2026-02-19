import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { appraisal_id } = await req.json()

    if (!appraisal_id) {
      return new Response(
        JSON.stringify({ error: 'Appraisal ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('📄 Generating PDF for appraisal:', appraisal_id)

    // Fetch appraisal data
    const { data: appraisal, error: fetchError } = await supabaseAdmin
      .from('appraisals')
      .select('*')
      .eq('id', appraisal_id)
      .single()

    if (fetchError || !appraisal) {
      console.error('❌ Error fetching appraisal:', fetchError)
      return new Response(
        JSON.stringify({ error: `Appraisal not found: ${fetchError?.message}` }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Appraisal data fetched:', appraisal)

    // Debug: Log the image URLs being used
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const imagesBaseUrl = `${supabaseUrl}/storage/v1/object/public/documents/appraisal_files`
    console.log('🖼️ Images base URL:', imagesBaseUrl)

    // Test if images are accessible
    try {
      const testImageUrl = `${imagesBaseUrl}/prime_style_logo.jpg`
      console.log('🔍 Testing image accessibility:', testImageUrl)
      
      const imageResponse = await fetch(testImageUrl)
      if (imageResponse.ok) {
        console.log('✅ Images are accessible')
      } else {
        console.log('❌ Images are not accessible:', imageResponse.status, imageResponse.statusText)
      }
    } catch (error) {
      console.log('❌ Error testing image accessibility:', error.message)
    }

    // Generate HTML for the PDF
    const htmlContent = generateAppraisalHTML(appraisal)

    // Return the HTML content for client-side PDF generation
    return new Response(
      JSON.stringify({ 
        success: true,
        html_content: htmlContent,
        appraisal_data: appraisal,
        note: 'HTML content ready for PDF generation'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error in generate-appraisal-pdf function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function generateAppraisalHTML(appraisal: any): string {
  // Get the base URL for Supabase Storage
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const imagesBaseUrl = `${supabaseUrl}/storage/v1/object/public/documents/appraisal_files`
  
  // Fallback for testing - you can replace these with actual image URLs
  const fallbackImages = {
    logo: `${imagesBaseUrl}/prime_style_logo.jpg`,
    topLeft: `${imagesBaseUrl}/top_left.jpg`,
    topRight: `${imagesBaseUrl}/top_right.jpg`,
    bottomLeft: `${imagesBaseUrl}/bottom_left.jpg`,
    bottomRight: `${imagesBaseUrl}/bottom_right.jpg`,
    diamond1: `${imagesBaseUrl}/diamond_img1.jpg`,
    diamond2: `${imagesBaseUrl}/diamond_img2.jpg`
  }
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Appraisal - ${appraisal.stock_number}</title>
      <style>
        /* Appraisal CSS - Based on the design template */
        body{ 
          margin:0px; 
          color: #042a3f; 	
          font-family:Arial, Helvetica, sans-serif;
          font-size:14px;
          background:#ffffff;
        }
        h1, h2, h3, ul, ol {margin:0px;}
        a img{ border:0px;}
        p{ margin:0px; line-height:18px; font-family:Arial, Helvetica, sans-serif;}
        .c{ display:block; float:none; clear:both;}
        .round5{ -webkit-border-radius:5px; border-radius: 5px; position:relative ;}
        .round10{ -webkit-border-radius:10px; border-radius: 10px; position:relative ;}
        .round15{ -webkit-border-radius:15px; border-radius: 15px; position:relative ;}
        .left25{ float:left; width:25%;}
        .left50{ float:left; width:50%;}
        .left75{ float:left; width:75%;}
        .left33{ float:left; width:33%;}
        .a_left{ text-align:left;}
        .a_center{ text-align:center;}
        .a_right{ text-align:right;}
        a { color: #0c4186; text-decoration:none;}
        .flot_left{float:left;}
        .flot_right{float:right;}
        a:hover { color: #fcae01;}
        .img_left{ border:5px solid #fff; float:left; margin-right:10px; margin-bottom:10px;}
        .img_right{ border:5px solid #fff; float:right; margin-left:10px; margin-bottom:10px;}
        .bold{font-weight:bold}
        ul,li{
          margin:0px;
          padding:0px;
        }
        li{
          list-style:none;	
        }
        .main {
          width:830px;
          margin:0px auto;
        }
        .cnt_main{
          margin:0px 60px;	
        }
        .top_bg{
          padding: 2px 37px;
        }
        .top_border{
          border:3px solid #305e78;
          background:#fff;
          padding:14px 0px;
          min-height:973px;
          position: relative;
        }
        .top_border::before {
          content: '';
          position: absolute;
          top: 10px;
          left: 10px;
          width: 50px;
          height: 50px;
          display: none;
        }
        .top_border::after {
          content: '';
          position: absolute;
          top: 10px;
          right: 10px;
          width: 50px;
          height: 50px;
          display: none;
        }
        .head{
          background:transparent;
          padding-bottom:27px;
          margin-bottom:20px;
        }
        .logo_img{
          width:300px;
          float:left;
          text-align:center;
          margin-left:51px;
        }
        .logo_txt{
          font-size:14px;
          font-weight:bold;
          padding:8px 28px 0px 28px;
          line-height:18px;
        }
        .sale{
          margin-bottom:20px;
          font-size:18px;	
        }
        .name{
          font-size:16px;
          margin-top:6px;	
        }
        .light_blue{
          background:transparent;
          -webkit-border-radius:0px; 
          border-radius:0px; 
          position:relative ;
          padding:14px 20px ;
          margin-bottom:40px;	
        }
        .stones{
          font-weight:bold;
          margin-bottom:15px;	
        }
        .light_blue .tr{
          margin-bottom:10px;
        }
        .light_blue .tr2{
          margin-top:26px;
          margin-bottom:20px;
        }
        .light_blue .td{
          float:left;
        }
        .light_blue .wid1{
          width:294px;	
        }
        .img_border{
          border:none;
          float:left;
          padding:5px;
          background:transparent;
          margin-right:15px;	
        }
        .img_txt{
          width:380px;
          float:left;
        }	
        .img_txt p{
          line-height:18px;
          font-size:12px;
          margin-top:6px;	
        }
        .diamond_txt{
          margin-left: 3px;
          width:330px;
          float:left;
          line-height:25px;
          margin-top:15px;
        }	
        .prime_style_logo{
          float:right;	
        }
        .diamond_size{
          font-size:18px;	
        }
        .diamond_color{
          color:#cc0000;
          font-size:24px;	
        }
        .color_box{
          width:293px;
          float:left;	
        }
        .color_box+.color_box{
          width:280px;
          margin-left:27px;	
        }
        .color_txt{
          background:url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEiIHZpZXdCb3g9IjAgMCAxMDAgMSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGxpbmUgeDE9IjAiIHkxPSIwLjUiIHgyPSIxMDAiIHkyPSIwLjUiIHN0cm9rZT0iIzMwNWU3OCIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg==') repeat-x center 8px;	
          padding:0px 100px;
          text-align:center;
          margin-bottom:7px;
        }
        .color_txt span{
          background:#fff;
          padding:0px 10px;
        }
        
        /* Additional styles for the appraisal content */
        .spec-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #b8c5c9;
        }
        .spec-label {
          font-weight: bold;
          color: #042a3f;
        }
        .spec-value {
          color: #042a3f;
        }
        /* Additional styles for the appraisal content */
        .appraisal-content {
          padding: 20px 40px;
        }
        .appraisal-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .appraisal-title {
          font-size: 24px;
          font-weight: bold;
          color: #042a3f;
          margin-bottom: 10px;
        }
        .appraisal-subtitle {
          font-size: 16px;
          color: #042a3f;
          margin-bottom: 5px;
        }
        .appraisal-date {
          font-size: 14px;
          color: #666;
        }
        .diamond-specs {
          background: #CDDBDF;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }
        .specs-title {
          font-weight: bold;
          font-size: 18px;
          margin-bottom: 15px;
          color: #042a3f;
        }
        .specs-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        .spec-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #b8c5c9;
        }
        .spec-label {
          font-weight: bold;
          color: #042a3f;
        }
        .spec-value {
          color: #042a3f;
        }
        .valuation-section {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }
        .valuation-title {
          font-weight: bold;
          font-size: 18px;
          margin-bottom: 15px;
          color: #042a3f;
        }
        .replacement-value {
          font-size: 24px;
          font-weight: bold;
          color: #cc0000;
          text-align: center;
        }
        .description-section {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }
        .description-title {
          font-weight: bold;
          font-size: 18px;
          margin-bottom: 15px;
          color: #042a3f;
        }
        .description-text {
          line-height: 1.6;
          color: #042a3f;
        }
        .image-section {
          text-align: center;
          margin: 30px 0;
        }
        .appraisal-image {
          max-width: 300px;
          max-height: 300px;
          border: none;
          border-radius: 0px;
        }
        .footer-info {
          text-align: center;
          font-size: 12px;
          color: #666;
          margin-top: 40px;
          padding-top: 20px;
          border-top: none;
          position: relative;
        }
        .footer-info::before {
          content: '';
          position: absolute;
          bottom: 10px;
          left: 10px;
          width: 50px;
          height: 50px;
          display: none;
        }
        .footer-info::after {
          content: '';
          position: absolute;
          bottom: 10px;
          right: 10px;
          width: 50px;
          height: 50px;
          display: none;
        }
      </style>
    </head>
    <body>
      <div class="main">
        <div class="top_bg">
          <div class="top_border">
            <div class="cnt_main">
              <!-- Header with logo and title -->
              <div class="head">
                <div class="logo_img">
                  <img src="${fallbackImages.logo}" alt="Prime Style Logo" style="max-width: 200px; height: auto;">
                </div>
                <div class="logo_txt">
                  <div class="sale">JEWELRY APPRAISAL CERTIFICATE</div>
                  <div class="name">Professional Gemological Assessment</div>
                </div>
              </div>

              <!-- Appraisal Content -->
              <div class="appraisal-content">
                <div class="appraisal-header">
                  <div class="appraisal-title">Stock Number: ${appraisal.stock_number}</div>
                  <div class="appraisal-subtitle">Appraisal Date: ${new Date().toLocaleDateString()}</div>
                  <div class="appraisal-date">Generated: ${new Date().toLocaleString()}</div>
                </div>

                <!-- Diamond Image Section -->
                <div style="text-align: center; margin: 20px 0;">
                  <img src="${fallbackImages.diamond1}" alt="Diamond" style="max-width: 150px; height: auto; margin: 0 10px;">
                  <img src="${fallbackImages.diamond2}" alt="Diamond" style="max-width: 150px; height: auto; margin: 0 10px;">
      </div>

                <!-- Diamond Specifications -->
                <div class="light_blue">
                  <div class="stones">Diamond Specifications</div>
                  <div class="tr">
                    <div class="td wid1">
                      <div class="spec-item">
                        <span class="spec-label">Type:</span>
                        <span class="spec-value">${appraisal.type || 'N/A'}</span>
                      </div>
                      <div class="spec-item">
                        <span class="spec-label">Shape:</span>
                        <span class="spec-value">${appraisal.shape || 'N/A'}</span>
                      </div>
                      <div class="spec-item">
                        <span class="spec-label">Measurement:</span>
                        <span class="spec-value">${appraisal.measurement || 'N/A'}</span>
          </div>
                      <div class="spec-item">
                        <span class="spec-label">Color:</span>
                        <span class="spec-value">${appraisal.color || 'N/A'}</span>
          </div>
          </div>
                    <div class="td">
                      <div class="spec-item">
                        <span class="spec-label">Clarity:</span>
                        <span class="spec-value">${appraisal.clarity || 'N/A'}</span>
          </div>
                      <div class="spec-item">
                        <span class="spec-label">Polish & Symmetry:</span>
                        <span class="spec-value">${appraisal.polish_symmetry || 'N/A'}</span>
          </div>
                      <div class="spec-item">
                        <span class="spec-label">Diamond Weight:</span>
                        <span class="spec-value">${appraisal.diamond_weight || 'N/A'} ct</span>
          </div>
                      <div class="spec-item">
                        <span class="spec-label">Precious Metal:</span>
                        <span class="spec-value">${appraisal.precious_metal || 'N/A'}</span>
          </div>
          </div>
        </div>
      </div>

                <!-- Valuation -->
                <div class="light_blue">
                  <div class="stones">Valuation</div>
                  <div class="tr2">
                    <div class="diamond_color">$${appraisal.replacement_value || 'N/A'}</div>
        </div>
      </div>

      ${appraisal.image_url ? `
                  <div class="light_blue">
                    <div class="stones">Image</div>
                    <div class="img_border">
                      <img src="${appraisal.image_url}" alt="Appraisal Image" style="max-width: 200px; max-height: 200px;" />
          </div>
        </div>
      ` : ''}

      ${appraisal.description ? `
                  <div class="light_blue">
                    <div class="stones">Description</div>
                    <div class="img_txt">
                      <p>${appraisal.description}</p>
          </div>
        </div>
      ` : ''}

                <div class="footer-info">
        <p>This appraisal certificate was generated automatically on ${new Date().toLocaleString()}</p>
        <p>For questions or concerns, please contact our customer service team.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}
