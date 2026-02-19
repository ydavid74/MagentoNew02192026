import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Appraisal } from "@/services/appraisals";

// Function to generate HTML for Jewelry Report matching the exact design
export const generateJewelryReportHTML = (
  appraisal: Appraisal,
  orderData?: any
): string => {
  // Use local images from public/appraisal_files folder
  const imagesBaseUrl = "/appraisal_files/";

  // Debug: Log the order data structure
  console.log("📄 Order data structure:", orderData);
  console.log("📄 Customer data:", orderData?.customers);
  console.log("📄 Billing address:", orderData?.billing_address);
  console.log("📄 Customer billing_addr:", orderData?.customers?.billing_addr);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Jewelry Report - ${appraisal.stock_number}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          margin: 0px;
          color: #042a3f;
          background: #ffffff;
        }
        
        
        h1, h2, h3, ul, ol { margin: 0px; }
        a img { border: 0px; }
        p { margin: 0px; line-height: 18px; }
        .c { display: block; float: none; clear: both; }
        .bold { font-weight: bold; }
        .flot_left { float: left; }
        .flot_right { float: right; }
        .a_left { text-align: left; }
        .a_center { text-align: center; }
        .a_right { text-align: right; }
        
        .main {
          width: 830px;
          margin: 0 auto;
        }
        
        .report-container {
          width: 100%;
          background: white;
          position: relative;
          border: none;
          padding: 0;
          overflow: hidden;
        }
        
        .cnt_main {
          margin: 0px 60px;
        }
        
        .top_bg {
          padding: 2px 37px;
        }
        
        .top_border {
          border: 3px solid #305e78;
          background: #fff;
          padding: 10px 0px;
          min-height: 770px;
        }
        
        .top-border .top-border-left {
          float: left;
        }
        
        .top-border .top-border-right {
          float: right;
        }
        
        .top-border .top-border-center {
          background: url('${imagesBaseUrl}top.jpg');
          height: 32px;
        }
        
        .middle-bg {
          background: url('${imagesBaseUrl}left.jpg') repeat-y;
        }
        
        .top_bg {
          background: url('${imagesBaseUrl}right.jpg') repeat-y right top;
        }
        
        .bottom-border .bottom-border-left {
          float: left;
        }
        
        .bottom-border .bottom-border-right {
          float: right;
        }
        
        .bottom-border .bottom-border-center {
          background: url('${imagesBaseUrl}bottom.jpg');
          height: 32px;
        }
        
        .head {
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        
        .separator-line {
          width: 100%;
          height: 2px;
          background-color: #305e78;
          position: relative;
          margin: 10px 0;
        }
        
        .separator-line::before,
        .separator-line::after {
          content: '';
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          background-color: #305e78;
          border-radius: 50%;
        }
        
        .separator-line::before {
          left: 0;
        }
        
        .separator-line::after {
          right: 0;
        }
        
        .logo_img {
          width: 300px;
          float: left;
          text-align: center;
          margin-left: 51px;
        }
        
        .logo_txt {
          font-size: 14px;
          font-weight: bold;
          padding: 8px 28px 0px 28px;
          line-height: 18px;
        }
        
        .sale {
          margin-bottom: 30px;
          margin-top: 30px;
          font-size: 18px;
        }
        
        .name {
          font-size: 16px;
          margin-top: 6px;
        }
        
        .light_blue {
          background: #CDDBDF;
          border-radius: 8px;
          position: relative;
          padding: 10px 10px;
          margin-bottom: 10px;
        }
        
        .stones {
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .light_blue .tr {
          margin-bottom: 8px;
        }
        
        .light_blue .tr2 {
          margin-top: 15px;
          margin-bottom: 15px;
        }
        
        .light_blue .td {
          float: left;
        }
        
        .light_blue .wid1 {
          width: 294px;
        }
        
        .img_border {
          border: 1px solid #c6c9ca;
          float: left;
          padding: 5px;
          background: #fff;
          margin-right: 15px;
        }
        
        .img_txt {
          width: 380px;
          float: left;
        }
        
        .img_txt p {
          line-height: 16px;
          font-size: 12px;
          margin-top: 4px;
          color: #042a3f;
        }
        
        .diamond_txt {
          margin-left: 3px;
          width: 330px;
          float: left;
          line-height: 25px;
          margin-top: 10px;
        }
        
        .prime_style_logo {
          float: right;
        }
        
        .diamond_size {
          font-size: 18px;
        }
        
        .diamond_color {
          color: #cc0000;
          font-size: 24px;
        }
        
        .color_box {
          width: 293px;
          float: left;
        }
        
        .color_box + .color_box {
          width: 280px;
          margin-left: 27px;
        }
        
        .color_txt {
          position: relative;
          text-align: center;
          margin-bottom: 7px;
          padding: 0px 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .color_txt::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 20px;
          right: 20px;
          height: 1px;
          background-color: #305e78;
          transform: translateY(-50%);
        }
        
        .color_txt span {
          background: #fff;
          padding: 0px 15px;
          font-weight: bold;
          color: #042a3f;
          position: relative;
          z-index: 2;
          transform: translateY(-6px);
        }
        
        /* Ensure text visibility within PDF */
        .sale, .sale * {
          color: #042a3f;
        }
        
        .name, .name * {
          color: #042a3f;
        }
        
        .stones, .stones * {
          color: #042a3f;
        }
        
        .light_blue, .light_blue * {
          color: #042a3f !important;
        }
        
        .light_blue .bold {
          color: #042a3f;
        }
        
        .diamond_txt, .diamond_txt * {
          color: #042a3f;
        }
        
        .diamond_size {
          color: #042a3f;
        }
        
        .diamond_color {
          color: #cc0000;
        }
        
        /* Override for specific elements that need different colors */
        .diamond_color, .diamond_color * {
          color: #cc0000;
        }
        
        .color_txt, .color_txt * {
          color: #042a3f;
        }
        
        .logo_txt, .logo_txt * {
          color: #042a3f;
        }
        
        .img_txt, .img_txt * {
          color: #042a3f !important;
        }
        
        .img_txt p {
          color: #042a3f !important;
        }
        
        .img_txt .bold {
          color: #042a3f !important;
          font-weight: bold;
        }
        
        /* PDF-specific font styling - matching original CSS */
        .main, .main * {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 14px;
        }
        
        .sale {
          font-size: 18px;
        }
        
        .name {
          font-size: 16px;
        }
        
        .logo_txt {
          font-size: 14px;
          font-weight: bold;
          line-height: 18px;
        }
        
        .img_txt p {
          font-size: 12px;
          line-height: 18px;
        }
        
        .diamond_size {
          font-size: 18px;
        }
        
        .diamond_color {
          font-size: 24px;
        }
        
        .stones {
          font-weight: bold;
        }
        
        .light_blue .tr, .light_blue .tr2 {
          font-size: 14px;
        }
        
        .light_blue .bold {
          font-weight: bold;
        }
        
        
      </style>
    </head>
    <body>
      <center>
        <div class="main">
          <div class="report-container">
            <!-- Top Border -->
            <div class="top-border" style="transform: translateY(5px) !important;">
              <div class="top-border-left"><img src="${imagesBaseUrl}top_left.jpg"></div>
              <div class="top-border-right"><img src="${imagesBaseUrl}top_right.jpg"></div>
              <div class="top-border-center"></div>
              <div class="c"></div>
            </div>
            
            <!-- Middle Content -->
            <div class="middle-bg">
              <div class="top_bg">
                <div class="top_border">
                  <div class="cnt_main">
                    <!-- Header -->
                    <div class="head">
                      <div>
                        <div class="flot_left"><img src="${imagesBaseUrl}top_diamond.jpg" alt="top_diamond"></div>
                        <div class="logo_img">
                          <div><img src="${imagesBaseUrl}Jewelry_Report.png" alt="appraisal"></div>
                          <div style="text-align: center; display: flex; justify-content: center; align-items: center;"><img style="height:50px;" src="${imagesBaseUrl}logo-2.png" alt="prime_style"></div>
                          <div class="logo_txt" style="padding: 8px 0px 0px 28px;">
                            Primestyle LLC<br>
                            1557 NE 164th St. Unit P,<br>
                            North Miami Beach, Florida 33162<br>
                            Tel: 888.532.9440 | 212.302.3377
                          </div>
                        </div>
                        <div class="flot_right"><img src="${imagesBaseUrl}top_diamond.jpg" alt="top_diamond"></div>
                        <div class="c"></div>
                      </div>
                    </div>
                    
                    <!-- Separator Line -->
                    <div class="separator-line"></div>
        
                    <!-- Sale Details -->
                    <div class="sale">
                      <div>
                        <div class="flot_left">
                          <div><span class="bold">Sale Number:</span> ${
                            orderData?.order_id ||
                            "N/A"
                          }</div>
                          <div class="name"><span class="bold">Name:</span> ${
                            orderData?.customers?.name ||
                            orderData?.bill_to_name ||
                            appraisal.customer_name ||
                            "N/A"
                          }</div>
                        </div>
                         <div class="flot_right">
                           <div><span class="bold">Item Id:</span> ${
                            appraisal.stock_number ||
                            "N/A"
                          }</div>
                           <div class="name a_right"><span class="bold">Date:</span> ${new Date(
                             appraisal.created_at || ""
                           ).toLocaleDateString()}</div>
                         </div>
                        <div class="c"></div>
                      </div>
                    </div>
        
                    <!-- Precious Stones Section -->
                    <div class="light_blue" style="margin-bottom: 20px;">
                      <div class="stones">Precious Stones:</div>
                      <div>
                        <div class="tr">
                          <div class="td wid1 bold">TYPE:</div>
                          <div class="flot_left">${
                            appraisal.diamond_type || "N/A"
                          }</div>
                          <div class="c"></div>
                        </div>
                        <div class="tr">
                          <div class="td wid1 bold">SHAPE:</div>
                          <div class="flot_left">${
                            appraisal.shape || "N/A"
                          }</div>
                          <div class="c"></div>
                        </div>
                        <div class="tr">
                          <div class="td wid1 bold">MEASUREMENTS:</div>
                          <div class="flot_left">${
                            appraisal.measurement || "N/A"
                          }</div>
                          <div class="c"></div>
                        </div>
                        <div class="tr">
                          <div class="td wid1 bold">COLOR:</div>
                          <div class="flot_left">${
                            appraisal.color || "N/A"
                          }</div>
                          <div class="c"></div>
                        </div>
                        <div class="tr">
                          <div class="td wid1 bold">CLARITY:</div>
                          <div class="flot_left">${
                            appraisal.clarity || "N/A"
                          }</div>
                          <div class="c"></div>
                        </div>
                        <div class="tr">
                          <div class="td wid1 bold">POLISH & SYMMETRY:</div>
                          <div class="flot_left">${
                            appraisal.polish_symmetry || "N/A"
                          }</div>
                          <div class="c"></div>
                        </div>
                        <div class="tr2">
                          <div class="td wid1 bold">Precious Metal:</div>
                          <div class="flot_left">${
                            appraisal.precious_metal || "N/A"
                          }</div>
                          <div class="c"></div>
                        </div>
                      </div>
                      <div>
                        <div class="img_border"><img src="${
                          appraisal.image_url ||
                          imagesBaseUrl + "diamond_img1.jpg"
                        }" style="width:120px;height:120px;" alt="img1"></div>
                        <div class="img_txt">
                          <div class="bold">Description:</div>
                          <p>${
                            appraisal.description || "No description provided"
                          }</p>
                        </div>
                        <div class="c"></div>
                      </div>
                    </div>
        
                    <!-- Summary Section -->
                    <div style="margin-bottom: 15px;">
                      <div class="diamond_txt bold">
                        <div>DIAMOND TOTAL WEIGHT IS <span class="diamond_size">${
                          appraisal.diamond_weight || "N/A"
                        } CARATS</span> APPRAISED RETAIL REPLACEMENT VALUE IS <span class="diamond_color">$${
    appraisal.replacement_value || "N/A"
  }</span></div>
                      </div>
                      <div class="prime_style_logo"><img src="${imagesBaseUrl}prime_style_logo.jpg" alt="prime_style_logo"></div>
                      <div class="c"></div>
                    </div>
                    
                    <!-- Grading Scales -->
                    <div>
                      <div class="color_box">
                        <div class="color_txt"><span>Color</span></div>
                        <div><img src="${imagesBaseUrl}diamond_img1.jpg" alt="diamond_img"></div>
                      </div>
                      <div class="color_box">
                        <div class="color_txt"><span>Clarity</span></div>
                        <div><img src="${imagesBaseUrl}diamond_img2.jpg" alt="diamond_img"></div>
                      </div>
                      <div class="c"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Bottom Border -->
            <div class="bottom-border">
              <div class="bottom-border-left"><img src="${imagesBaseUrl}bottom_left.jpg"></div>
              <div class="bottom-border-right"><img src="${imagesBaseUrl}bottom_right.jpg"></div>
              <div class="bottom-border-center"></div>
              <div class="c"></div>
            </div>
          </div>
        </center>
      </body>
    </html>
  `;
};

// Function to show PDF preview in a modal
export const showPDFPreview = (appraisal: Appraisal, orderData?: any): void => {
  const htmlContent = generateJewelryReportHTML(appraisal, orderData);

  // Create modal overlay
  const modalOverlay = document.createElement("div");
  modalOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    box-sizing: border-box;
  `;

  // Create modal content
  const modalContent = document.createElement("div");
  modalContent.style.cssText = `
    background: hsl(var(--background));
    border: 1px solid hsl(var(--border));
    border-radius: 12px;
    width: 95%;
    max-width: 1200px;
    max-height: 95%;
    overflow: hidden;
    position: relative;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
  `;

  // Create header with controls
  const header = document.createElement("div");
  header.style.cssText = `
    padding: 20px 24px;
    border-bottom: 1px solid hsl(var(--border));
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: hsl(var(--muted));
    border-radius: 12px 12px 0 0;
  `;

  const title = document.createElement("h3");
  title.textContent = `Jewelry Report - ${appraisal.stock_number || "N/A"}`;
  title.style.cssText = `
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: hsl(var(--foreground));
  `;

  const buttonContainer = document.createElement("div");
  buttonContainer.style.cssText = `
    display: flex;
    gap: 12px;
  `;

  // Download button
  const downloadBtn = document.createElement("button");
  downloadBtn.textContent = "Download PDF";
  downloadBtn.style.cssText = `
    background: hsl(var(--primary));
    color: hsl(var(--primary-foreground));
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  downloadBtn.onmouseover = () => {
    downloadBtn.style.background = "hsl(var(--primary) / 0.9)";
    downloadBtn.style.transform = "translateY(-1px)";
  };
  downloadBtn.onmouseout = () => {
    downloadBtn.style.background = "hsl(var(--primary))";
    downloadBtn.style.transform = "translateY(0)";
  };

  // Print button
  const printBtn = document.createElement("button");
  printBtn.textContent = "Print";
  printBtn.style.cssText = `
    background: hsl(var(--secondary));
    color: hsl(var(--secondary-foreground));
    border: 1px solid hsl(var(--border));
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  printBtn.onmouseover = () => {
    printBtn.style.background = "hsl(var(--secondary) / 0.8)";
    printBtn.style.transform = "translateY(-1px)";
  };
  printBtn.onmouseout = () => {
    printBtn.style.background = "hsl(var(--secondary))";
    printBtn.style.transform = "translateY(0)";
  };

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Close";
  closeBtn.style.cssText = `
    background: hsl(var(--destructive));
    color: hsl(var(--destructive-foreground));
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  `;
  closeBtn.onmouseover = () => {
    closeBtn.style.background = "hsl(var(--destructive) / 0.9)";
    closeBtn.style.transform = "translateY(-1px)";
  };
  closeBtn.onmouseout = () => {
    closeBtn.style.background = "hsl(var(--destructive))";
    closeBtn.style.transform = "translateY(0)";
  };

  // PDF content container
  const pdfContainer = document.createElement("div");
  pdfContainer.style.cssText = `
    padding: 24px;
    background: hsl(var(--muted) / 0.3);
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    overflow: auto;
    min-height: 0;
  `;

  // Create iframe for PDF content
  const iframe = document.createElement("iframe");
  iframe.style.cssText = `
    width: 100%;
    max-width: 1000px;
    height: 100%;
    min-height: 600px;
    border: 1px solid hsl(var(--border));
    background: hsl(var(--background));
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  `;

  // Print functionality
  printBtn.onclick = () => {
    console.log("🖨️ Print button clicked");
    try {
      // Create a new window for printing
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Wait for content to load, then trigger print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            // Close the print window after printing
            printWindow.close();
          }, 500);
        };
      } else {
        alert("Please allow popups to use the print function.");
      }
    } catch (error) {
      console.error("❌ Print error:", error);
      alert("Print failed. Please try again.");
    }
  };

  // Assemble modal
  buttonContainer.appendChild(downloadBtn);
  buttonContainer.appendChild(printBtn);
  buttonContainer.appendChild(closeBtn);
  header.appendChild(title);
  header.appendChild(buttonContainer);
  pdfContainer.appendChild(iframe);
  modalContent.appendChild(header);
  modalContent.appendChild(pdfContainer);
  modalOverlay.appendChild(modalContent);

  // Add to document
  document.body.appendChild(modalOverlay);

  // Set iframe content
  iframe.srcdoc = htmlContent;

  // Event handlers
  downloadBtn.onclick = async () => {
    try {
      console.log("🔄 Starting PDF generation...");

      // Show loading state
      const originalText = downloadBtn.textContent;
      downloadBtn.textContent = "Generating PDF...";
      downloadBtn.disabled = true;
      downloadBtn.style.opacity = "0.7";
      downloadBtn.style.cursor = "not-allowed";

      // Add loading spinner
      const spinner = document.createElement("div");
      spinner.style.cssText = `
        width: 16px;
        height: 16px;
        border: 2px solid transparent;
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      `;

      // Add CSS animation
      const style = document.createElement("style");
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);

      downloadBtn.innerHTML = "";
      downloadBtn.appendChild(spinner);
      downloadBtn.appendChild(document.createTextNode(" Generating PDF..."));

      console.log("📄 Calling generatePDFFromAppraisal...");
      await generatePDFFromAppraisal(appraisal, orderData);
      console.log("✅ PDF generation completed successfully");

      // Reset button state
      downloadBtn.textContent = originalText;
      downloadBtn.disabled = false;
      downloadBtn.style.opacity = "1";
      downloadBtn.style.cursor = "pointer";

      // Remove spinner and style
      document.head.removeChild(style);
    } catch (error) {
      console.error("❌ Error generating PDF:", error);
      console.error("Error details:", error);

      // Reset button state on error
      downloadBtn.textContent = "Download PDF";
      downloadBtn.disabled = false;
      downloadBtn.style.opacity = "1";
      downloadBtn.style.cursor = "pointer";

      // Remove spinner and style if they exist
      const existingStyle = document.querySelector("style");
      if (
        existingStyle &&
        existingStyle.textContent?.includes("@keyframes spin")
      ) {
        document.head.removeChild(existingStyle);
      }

      alert(
        `Error generating PDF: ${
          error.message || "Unknown error"
        }. Please try again.`
      );
    }
  };

  closeBtn.onclick = () => {
    document.body.removeChild(modalOverlay);
  };

  // Close on overlay click
  modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) {
      document.body.removeChild(modalOverlay);
    }
  };

  // Close on Escape key
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      document.body.removeChild(modalOverlay);
      document.removeEventListener("keydown", handleEscape);
    }
  };
  document.addEventListener("keydown", handleEscape);
};

// Function to generate PDF from appraisal data (for download)
export const generatePDFFromAppraisal = async (
  appraisal: Appraisal,
  orderData?: any
): Promise<void> => {
  try {
    console.log("📄 Generating PDF for appraisal:", appraisal.id);
    console.log("📄 Appraisal data:", appraisal);

    // Generate HTML content
    const htmlContent = generateJewelryReportHTML(appraisal, orderData);
    console.log("📄 HTML content generated, length:", htmlContent.length);

    // Create a temporary div with the HTML content (hidden)
    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "0";
    tempDiv.style.width = "830px";
    tempDiv.style.height = "auto";
    tempDiv.style.backgroundColor = "white";
    tempDiv.innerHTML = htmlContent;

    document.body.appendChild(tempDiv);
    console.log("📄 Temporary div added to DOM");

    // Wait for images to load
    console.log("📄 Waiting for images to load...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Convert to canvas with stable high resolution options
    console.log("📄 Starting html2canvas conversion...");
    const canvas = await html2canvas(tempDiv, {
      scale: 3, // Moderate increase for better resolution
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: 830,
      height: tempDiv.scrollHeight,
      logging: true,
      imageTimeout: 8000, // Reasonable timeout
      removeContainer: false,
    });
    console.log(
      "📄 Canvas created, dimensions:",
      canvas.width,
      "x",
      canvas.height
    );

    // Remove temporary div
    document.body.removeChild(tempDiv);
    console.log("📄 Temporary div removed from DOM");

    // Create PDF with good quality
    console.log("📄 Creating PDF...");
    const imgData = canvas.toDataURL("image/png", 0.95); // High quality but stable
    console.log("📄 Image data created, length:", imgData.length);

    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    console.log("📄 PDF pages added");

    // Save the PDF
    const fileName = `jewelry-report-${appraisal.stock_number}-${
      new Date(appraisal.created_at || "").toISOString().split("T")[0]
    }.pdf`;
    console.log("📄 Saving PDF with filename:", fileName);
    pdf.save(fileName);

    console.log("✅ PDF generated successfully:", fileName);
  } catch (error) {
    console.error("❌ Error generating PDF:", error);
    console.error("❌ Error stack:", error.stack);
    throw error;
  }
};
