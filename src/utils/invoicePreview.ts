import { invoiceService, CreateInvoiceData } from "@/services/invoices";

// build and preview invoice HTML; PDF creation will be handled inline below

function generateInvoiceHTML(order: any): string {
  const fmt = (n: number) => `$${Number(n || 0).toFixed(2)}`;
  const items: any[] = order?.items || order?.order_items || [];
  const subTotal = items.reduce(
    (s, it) =>
      s + Number(it?.price || 0) * Number(it?.qty || it?.quantity || 1),
    0
  );
  const shipping = Number(order?.shipping_cost || order?.shipping_amount || 0);
  const discount = Number(order?.discount_amount || 0);
  const discountCodes = order?.discount_codes || [];
  // Use Shopify's total if available (includes tax), otherwise calculate
  const total = order?.total_amount || subTotal + shipping - discount;

  const bill = order?.billing_address || order?.bill_to || {};
  const ship = order?.shipping_address || order?.ship_to || {};

  const logo = "/invoice_files/logo.png";
  const fb = "/invoice_files/facebook.png";
  const ig = "/invoice_files/instagram.png";
  const pt = "/invoice_files/pinterest.png";
  const tw = "/invoice_files/twitter.png";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Invoice · ${order?.order_number || order?.id || ""} · Prime Style</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400&display=swap" rel="stylesheet">
<style>
  @page { 
    size: 8.5in 11in; 
    margin: 0.5in; 
  }
  body { 
    font-family: 'Montserrat', sans-serif;
    font-weight: 400;
    margin: 0; 
    padding: 0; 
    color: #333; 
    background: #ffffff;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }
  .pdf-container {
    width: 7.5in;
    min-height: 10in;
    background: white;
    // box-shadow: 0 0 20px rgba(0,0,0,0.15);
    margin-top: 20px;
    box-sizing: border-box;
  }
  .pdf-preview-text {
    text-align: center;
    color: hsl(var(--muted-foreground));
    font-size: 12px;
    margin-bottom: 10px;
    font-style: italic;
    background: hsl(var(--muted));
    padding: 8px;
    border-radius: 4px;
    border: 1px solid hsl(var(--border));
  }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .header-left img { height: 80px; }
  .header-left small { font-size: 9pt; color:#444; display:block; margin-top:4px; }
  .header-right { text-align: left; width: 48%; }
  h1 { margin: 0; font-size: 20px; color: #2F3336; }
  .invoice-meta h3 { margin: 2px 0; font-size: 10pt; font-weight: bold; }
  .invoice-meta h3 span { font-weight: normal; }
  .addresses { display: flex; justify-content: space-between; margin: 20px 0; }
  .addresses div { width: 48%; font-size: 10pt; }
  .addresses .bill-to { text-align: left; }
  .addresses .ship-to { text-align: left; margin-left: 4%; }
  h3 { margin: 0 0 5px; font-size: 11pt; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10pt; }
  th { border-top: 2px solid #2F3336; padding: 8px; text-align: left; font-weight: bold; background: #f9f9f9; }
  td { border-bottom: 1px solid #eee; padding: 8px; vertical-align: top; }
  td img { max-height: 50px; }
  .strike { text-decoration: line-through; color: #888; font-size: 9pt; }
  .totals { margin-top: 20px; width: 100%; }
  .totals td { padding: 5px; font-size: 10pt; }
  .totals tr td:last-child { text-align: right; }
  .notes { font-size: 10pt; }
  .footer { margin-top: 30px; display:flex; justify-content: center; align-items: flex-start; gap: 10px; }
  .footer-left { font-size: 9pt; text-align: right; }
  .footer-right h2 { margin: 0; font-size: 15pt; color: #2F3336; text-align: left; line-height: 0.5; font-weight: 700; }
  .center { text-align: center; margin-top: 20px; }
  .social-icons { margin-top: 10px; }
  .social-icons img { width:20px; height:20px; margin:0 6px; border-radius: 50%; }
</style>
</head>
<body>
<div class="pdf-container">

<div class="header">
  <div class="header-left">
    <img src="${logo}" alt="Prime Style Logo" onerror="this.style.display='none'">
  </div>
  <div class="header-right">
    <h1 style="font-size: 20pt;">PRIME STYLE LLC</h1>
     <div class="invoice-meta">
       <h3>INVOICE NO. <span>${(() => {
         const invoiceNumber =
           order?.shopify_order_number ||
           order?.order_id ||
           order?.id?.toString().slice(-6) ||
           Math.floor(Math.random() * 1000000)
             .toString()
             .padStart(6, "0");
         console.log("HTML Generation - Using invoice number:", invoiceNumber);
         console.log(
           "HTML Generation - Shopify order number:",
           order?.shopify_order_number
         );
         console.log("HTML Generation - Order ID:", order?.id);
         return invoiceNumber;
       })()}</span></h3>
       <h3>ORDER DATE <span>${
         order?.order_date
           ? new Date(order.order_date).toLocaleDateString("en-US", {
               month: "long",
               day: "numeric",
               year: "numeric",
             })
           : new Date().toLocaleDateString("en-US", {
               month: "long",
               day: "numeric",
               year: "numeric",
             })
       }</span></h3>
       <h3>PAYMENT <span>Shopify payments, Visa</span></h3>
       <h3>SHIPPING <span>${
         order?.delivery_method || "Free Shipping (3-5 business days)"
       }</span></h3>
     </div>
  </div>
</div>

<div class="addresses">
  <div class="bill-to">
    <h3>BILL TO</h3>
    ${[bill?.first_name, bill?.last_name].filter(Boolean).join(" ")}<br>
    ${bill?.street1 || ""}<br>
    ${[bill?.city, bill?.region, bill?.postcode].filter(Boolean).join(", ")}
  </div>
  <div class="ship-to">
    <h3>SHIP TO</h3>
    ${[ship?.first_name, ship?.last_name].filter(Boolean).join(" ")}<br>
    ${ship?.company || ""}<br>
    ${ship?.street1 || ""}<br>
    ${[ship?.city, ship?.region, ship?.postcode].filter(Boolean).join(", ")}
  </div>
</div>

<table>
  <tr>
    <th>ITEM DESCRIPTION</th><th>QTY</th><th>PRICE</th><th>TOTAL</th>
  </tr>
  ${items
    .map((it) => {
      const qty = Number(it?.qty || it?.quantity || 1);
      const price = Number(it?.price || 0);
      const total = qty * price;
      const title = [it?.details].filter(Boolean).join(" ") || "Item";
      return `
     <tr>
       <td>
         <div style="display: flex; align-items: center; gap: 10px;">
           <img src="${
             it?.image || ""
           }" alt="product" onerror="this.style.display='none'" style="max-height: 50px; max-width: 60px; object-fit: contain;">
           <div>
             <div style="font-weight: bold; margin-bottom: 2px;">${title}</div>
             <div style="font-size: 9pt; color: #666;">${it?.sku || ""}</div>
           </div>
         </div>
       </td>
      <td>×${qty}</td>
      <td>
        ${
          it?.original_price
            ? `<span class="strike">${fmt(it.original_price)}</span><br>`
            : ""
        }
        ${fmt(price)}
      </td>
      <td>${fmt(total)}</td>
    </tr>`;
    })
    .join("")}
</table>

 <div style="display: flex; justify-content: space-between; margin-top: 10px;">
   <div class="notes" style="width: 50%; border-bottom: 2px solid #000;">
     <div style="font-weight: bold; margin-bottom: 5px;">NOTES</div>
     ${
       order?.note
         ? order.note
             .split("\n")
             .map(
               (note) =>
                 `<div style="font-size: 10pt; color: #666;">${note}</div>`
             )
             .join("")
         : '<div style="font-size: 10pt; color: #666;">No notes</div>'
     }
   </div>
   <div style="width: 50%;">
     <table style="width: 100%; border-collapse: collapse;">
      ${
        discountCodes.length > 0
          ? discountCodes
              .map(
                (discountCode) => `
        <tr>
          <td style="text-align: left; padding-right: 10px; padding-bottom: 5px; border-bottom: 1px solid #eee; ">Discount ${
            discountCode.code || "Discount"
          }</td>
          <td style="text-align: right; padding-bottom: 5px; border-bottom: 1px solid #eee; ">-${fmt(
            parseFloat(discountCode.amount || "0")
          )}</td>
        </tr>
        `
              )
              .join("")
          : discount > 0
          ? `
        <tr>
          <td style="text-align: left; padding-right: 10px; padding-bottom: 5px; border-bottom: 1px solid #eee; ">Discount</td>
          <td style="text-align: right; padding-bottom: 5px; border-bottom: 1px solid #eee; ">-${fmt(
            discount
          )}</td>
        </tr>
        `
          : ""
      }
       <tr>
         <td style="text-align: left; padding-right: 10px; padding-bottom: 5px; border-bottom: 1px solid #eee;">Subtotal</td>
         <td style="text-align: right; padding-bottom: 5px; border-bottom: 1px solid #eee;">${fmt(
           subTotal
         )}</td>
       </tr>
       <tr>
         <td style="text-align: left; padding-right: 10px; padding-bottom: 5px; border-bottom: 1px solid #eee;">Shipping</td>
         <td style="text-align: right; padding-bottom: 5px; border-bottom: 1px solid #eee;">${fmt(
           shipping
         )}</td>
       </tr>
       ${
         order?.total_tax && order.total_tax > 0
           ? `
       <tr>
         <td style="text-align: left; padding-right: 10px; padding-bottom: 5px; border-bottom: 1px solid #eee;">Tax</td>
         <td style="text-align: right; padding-bottom: 5px; border-bottom: 1px solid #eee;">${fmt(
           order.total_tax
         )}</td>
       </tr>
       `
           : ""
       }
       
       <tr>
         <td style="text-align: left; padding-right: 10px; padding-top: 5px; font-weight: bold; border-bottom: 2px solid #000;">TOTAL</td>
         <td style="text-align: right; padding-top: 5px; font-weight: bold; border-bottom: 2px solid #000;">${fmt(
           total
         )}</td>
       </tr>
     </table>
   </div>
 </div>

 <p style="text-align: center; color: #666; font-size: 8pt; margin: 20px 0;">If you have any questions, please do get in contact.</p>
 
 <div class="footer">
   <div class="footer-left">
     1557 NE 164th street suite P<br>
     North Miami Beach, FL 33162<br>
     sales@primestyle.com<br>
     2123023377
   </div>
   <div class="footer-right">
     <h2>THANKS FOR YOUR</h2><br><h2>BUSINESS!</h2>
   </div>
 </div>
 
 <div class="center">
   <div style="font-weight: bold; font-size: 12pt; margin-bottom: 15px; color: #2F3336;">www.primestyle.com</div>
   <div class="social-icons">
     <a href="https://www.facebook.com/primestylestore/"><img src="${fb}" alt="Facebook" onerror="this.style.display='none'"></a>
     <a href="https://www.instagram.com/primestylecom/"><img src="${ig}" alt="Instagram" onerror="this.style.display='none'"></a>
     <a href="https://www.pinterest.com/PrimeStyle/_created/"><img src="${pt}" alt="Pinterest" onerror="this.style.display='none'"></a>
     <a href="https://twitter.com/primestylestore?lang=en"><img src="${tw}" alt="Twitter" onerror="this.style.display='none'"></a>
   </div>
 </div>
 
</div>
</body>
</html>
`;
}

// Function to save invoice HTML to database
export async function saveInvoiceToDatabase(order: any): Promise<string> {
  const htmlContent = generateInvoiceHTML(order);

  // Calculate invoice number
  const invoiceNumber =
    order?.shopify_order_number ||
    order?.order_id ||
    order?.id?.toString().slice(-6) ||
    Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0");

  // Calculate total amount
  const items: any[] = order?.items || order?.order_items || [];
  const subTotal = items.reduce(
    (s, it) =>
      s + Number(it?.price || 0) * Number(it?.qty || it?.quantity || 1),
    0
  );
  const shipping = Number(order?.shipping_cost || order?.shipping_amount || 0);
  const discount = Number(order?.discount_amount || 0);
  const discountCodes = order?.discount_codes || [];
  // Use Shopify's total if available (includes tax), otherwise calculate
  const totalAmount = order?.total_amount || subTotal + shipping - discount;

  const invoiceData: CreateInvoiceData = {
    order_id: order.id,
    invoice_number: invoiceNumber,
    html_content: htmlContent,
    total_amount: totalAmount,
    status: "generated",
    notes: order?.note || null,
  };

  const savedInvoice = await invoiceService.createInvoice(invoiceData);
  return savedInvoice.id;
}

// Function to show invoice preview from saved invoice
export function showSavedInvoicePreview(invoice: any): void {
  console.log("Invoice Preview - Saved invoice data:", invoice);

  // Preload fonts to ensure they're available
  const fontLink = document.createElement("link");
  fontLink.href =
    "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap";
  fontLink.rel = "stylesheet";
  document.head.appendChild(fontLink);

  const overlay = document.createElement("div");
  overlay.className =
    "fixed inset-0 bg-black/50 dark:bg-black/70 z-[10000] flex items-center justify-center p-6";
  const modal = document.createElement("div");
  modal.className =
    "bg-background border border-border rounded-lg w-[95%] max-w-[1100px] max-h-[95%] flex flex-col overflow-hidden shadow-lg text-foreground";
  const header = document.createElement("div");
  header.className =
    "flex justify-between items-center p-4 border-b border-border bg-muted/50";
  const title = document.createElement("div");
  title.textContent = `Invoice Preview - ${invoice.invoice_number}`;
  title.className = "font-semibold text-foreground";
  const buttons = document.createElement("div");
  buttons.className = "flex gap-2";

  const btnPrint = document.createElement("button");
  btnPrint.textContent = "Print";
  btnPrint.className =
    "px-3 py-2 border border-border rounded-md bg-background text-foreground hover:bg-muted cursor-pointer transition-colors";

  const btnDownload = document.createElement("button");
  btnDownload.textContent = "Download PDF";
  btnDownload.className =
    "px-3 py-2 border-0 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer transition-colors";

  const btnClose = document.createElement("button");
  btnClose.textContent = "Close";
  btnClose.className =
    "px-3 py-2 border-0 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer transition-colors";

  const body = document.createElement("div");
  body.className = "flex-1 overflow-auto bg-muted/30 p-4";
  const iframe = document.createElement("iframe");
  iframe.className =
    "w-full h-[80vh] border border-border bg-background rounded-sm";

  // Create complete HTML document with proper styling like showInvoicePreview
  const completeHtmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice Preview</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap" rel="stylesheet">
  <script>
    // Ensure fonts are loaded before rendering
    document.fonts.ready.then(() => {
      console.log('Fonts loaded in iframe');
    });
  </script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Montserrat', sans-serif;
      font-weight: 400;
      margin: 0;
      padding: 0;
      color: #333;
      background: #f5f5f5;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }
    .pdf-container {
      width: 7.5in;
      min-height: 10in;
      background: white;
      box-shadow: 0 0 20px rgba(0,0,0,0.15);
      margin: 20px;
      padding: 0.5in;
      box-sizing: border-box;
    }
    .pdf-preview-text {
      text-align: center;
      color: #666;
      font-size: 12px;
      margin-bottom: 10px;
      font-style: italic;
      background: #e8f4fd;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid #b3d9ff;
    }
  </style>
</head>
<body>
  <div class="">
${invoice.html_content}
  </div>
</body>
</html>`;

  iframe.srcdoc = completeHtmlContent;

  btnPrint.onclick = () => {
    // Create print-friendly HTML without shadow and preview styling
    const printHtmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice Print</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Montserrat', sans-serif;
      font-weight: 400;
      margin: 0;
      padding: 20px;
      color: #333;
      background: white;
    }
    .pdf-container {
      width: 100%;
      background: white;
      margin: 0;
      padding: 0;
      box-shadow: none !important;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .pdf-container {
        box-shadow: none !important;
        margin: 0;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="pdf-container">
${invoice.html_content}
  </div>
</body>
</html>`;

    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(printHtmlContent);
    w.document.close();
    w.onload = () => w.print();
  };

  btnDownload.onclick = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      // Wait for iframe to fully load
      await new Promise((resolve) => {
        if (iframe.contentDocument?.readyState === "complete") {
          resolve(true);
        } else {
          iframe.onload = () => resolve(true);
        }
      });

      // Wait for fonts to load in the iframe
      await new Promise((resolve) => {
        const iframeDoc =
          iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) {
          resolve(true);
          return;
        }

        if (iframeDoc.fonts && iframeDoc.fonts.ready) {
          iframeDoc.fonts.ready.then(() => {
            setTimeout(resolve, 500);
          });
        } else {
          setTimeout(resolve, 2000);
        }
      });

      const iframeDoc =
        iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error("Cannot access iframe content");
      }

      const pdfContainer = iframeDoc.querySelector(".pdf-container");
      const targetElement = pdfContainer || iframeDoc.body;

      const canvas = await html2canvas(targetElement as HTMLElement, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: targetElement.scrollWidth,
        height: targetElement.scrollHeight,
        onclone: (clonedDoc) => {
          const clonedBody = clonedDoc.body;
          if (clonedBody) {
            clonedBody.style.fontFamily = "'Montserrat', sans-serif";
            clonedBody.style.fontSize = "14px";
            clonedBody.style.lineHeight = "1.4";
            clonedBody.style.fontWeight = "400";
          }

          const allElements = clonedDoc.querySelectorAll("*");
          allElements.forEach((el) => {
            if (el instanceof HTMLElement && el.style) {
              el.style.fontFamily = "'Montserrat', sans-serif";
            }
          });
        },
      });

      const imgData = canvas.toDataURL("image/png", 0.95);
      const pdf = new jsPDF("p", "mm", "a4");
      const imgW = 210;
      const imgH = (canvas.height * imgW) / canvas.width;
      let hLeft = imgH;
      let pos = 0;

      pdf.addImage(imgData, "PNG", 0, pos, imgW, imgH);
      hLeft -= 295;

      while (hLeft > 0) {
        pos = hLeft - imgH;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, pos, imgW, imgH);
        hLeft -= 295;
      }

      const filename = `Invoice-${invoice.invoice_number}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  btnClose.onclick = () => document.body.removeChild(overlay);
  overlay.onclick = (e) => {
    if (e.target === overlay) document.body.removeChild(overlay);
  };

  buttons.appendChild(btnDownload);
  buttons.appendChild(btnPrint);
  buttons.appendChild(btnClose);
  header.appendChild(title);
  header.appendChild(buttons);
  body.appendChild(iframe);
  modal.appendChild(header);
  modal.appendChild(body);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

export function showInvoicePreview(order: any): void {
  console.log("Invoice Preview - Order data:", order);
  console.log(
    "Invoice Preview - Shopify order number:",
    order?.shopify_order_number
  );
  const htmlContent = generateInvoiceHTML(order);

  // Preload fonts to ensure they're available
  const fontLink = document.createElement("link");
  fontLink.href =
    "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap";
  fontLink.rel = "stylesheet";
  document.head.appendChild(fontLink);

  const overlay = document.createElement("div");
  overlay.className =
    "fixed inset-0 bg-black/50 dark:bg-black/70 z-[10000] flex items-center justify-center p-6";
  const modal = document.createElement("div");
  modal.className =
    "bg-background border border-border rounded-lg w-[95%] max-w-[1100px] max-h-[95%] flex flex-col overflow-hidden shadow-lg text-foreground";
  const header = document.createElement("div");
  header.className =
    "flex justify-between items-center p-4 border-b border-border bg-muted/50";
  const title = document.createElement("div");
  title.textContent = "Invoice Preview";
  title.className = "font-semibold text-foreground";
  const buttons = document.createElement("div");
  buttons.className = "flex gap-2";

  const btnPrint = document.createElement("button");
  btnPrint.textContent = "Print";
  btnPrint.className =
    "px-3 py-2 border border-border rounded-md bg-background text-foreground hover:bg-muted cursor-pointer transition-colors";

  const btnDownload = document.createElement("button");
  btnDownload.textContent = "Download PDF";
  btnDownload.className =
    "px-3 py-2 border-0 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer transition-colors";

  const btnClose = document.createElement("button");
  btnClose.textContent = "Close";
  btnClose.className =
    "px-3 py-2 border-0 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer transition-colors";

  const body = document.createElement("div");
  body.className = "flex-1 overflow-auto bg-muted/30 p-4";
  const iframe = document.createElement("iframe");
  iframe.className =
    "w-full h-[80vh] border border-border bg-background rounded-sm";

  // Create a complete HTML document with proper styling
  const completeHtmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice Preview</title>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap" rel="stylesheet">
      <script>
        // Ensure fonts are loaded before rendering
        document.fonts.ready.then(() => {
          console.log('Fonts loaded in iframe');
        });
      </script>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Montserrat', sans-serif;
          font-weight: 400;
          margin: 0;
          padding: 0;
          color: #333;
          background: #f5f5f5;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }
        .pdf-container {
          width: 7.5in;
          min-height: 10in;
          background: white;
          box-shadow: 0 0 20px rgba(0,0,0,0.15);
          margin: 20px;
          padding: 0.5in;
          box-sizing: border-box;
        }
        .pdf-preview-text {
          text-align: center;
          color: #666;
          font-size: 12px;
          margin-bottom: 10px;
          font-style: italic;
          background: #e8f4fd;
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #b3d9ff;
        }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .header-left img { height: 80px; }
        .header-left small { font-size: 9pt; color:#444; display:block; margin-top:4px; }
        .header-right { text-align: left; width: 48%; }
        h1 { margin: 0; font-size: 20px; color: #2F3336; }
        .invoice-meta h3 { margin: 2px 0; font-size: 10pt; font-weight: bold; }
        .invoice-meta h3 span { font-weight: normal; }
        .addresses { display: flex; justify-content: space-between; margin: 20px 0; }
        .addresses div { width: 48%; font-size: 10pt; }
        .addresses .bill-to { text-align: left; }
        .addresses .ship-to { text-align: left; margin-left: 4%; }
        h3 { margin: 0 0 5px; font-size: 11pt; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10pt; }
        th { border-top: 2px solid #2F3336; padding: 8px; text-align: left; font-weight: bold; background: #f9f9f9; }
        td { border-bottom: 1px solid #eee; padding: 8px; vertical-align: top; }
        td img { max-height: 50px; }
        .strike { text-decoration: line-through; color: #888; font-size: 9pt; }
        .totals { margin-top: 20px; width: 100%; }
        .totals td { padding: 5px; font-size: 10pt; }
        .totals tr td:last-child { text-align: right; }
        .notes { font-size: 10pt; }
        .footer { margin-top: 30px; display:flex; justify-content: center; align-items: flex-start; gap: 10px; }
        .footer-left { font-size: 9pt; text-align: right; }
        .footer-right h2 { margin: 0; font-size: 15pt; color: #2F3336; text-align: left; line-height: 0.5; font-weight: 700; }
        .center { text-align: center; margin-top: 20px; }
        .social-icons { margin-top: 10px; }
        .social-icons img { width:20px; height:20px; margin:0 6px; border-radius: 50%; }
      </style>
    </head>
    <body>
      ${htmlContent.split("<body>")[1]?.split("</body>")[0] || htmlContent}
    </body>
    </html>
  `;

  iframe.srcdoc = completeHtmlContent;

  btnPrint.onclick = () => {
    // Create print-friendly HTML without shadow and preview styling
    const printHtmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice Print</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Montserrat', sans-serif;
      font-weight: 400;
      margin: 0;
      padding: 20px;
      color: #333;
      background: white;
    }
    .pdf-container {
      width: 100%;
      background: white;
      margin: 0;
      padding: 0;
      box-shadow: none !important;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .pdf-container {
        box-shadow: none !important;
        margin: 0;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="pdf-container">
${htmlContent}
  </div>
</body>
</html>`;

    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(printHtmlContent);
    w.document.close();
    w.onload = () => w.print();
  };

  btnDownload.onclick = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      // Wait for iframe to fully load
      await new Promise((resolve) => {
        if (iframe.contentDocument?.readyState === "complete") {
          resolve(true);
        } else {
          iframe.onload = () => resolve(true);
        }
      });

      // Wait for fonts to load in the iframe
      await new Promise((resolve) => {
        const iframeDoc =
          iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) {
          resolve(true);
          return;
        }

        // Check if fonts are loaded
        if (iframeDoc.fonts && iframeDoc.fonts.ready) {
          iframeDoc.fonts.ready.then(() => {
            setTimeout(resolve, 500); // Additional delay after fonts are ready
          });
        } else {
          // Fallback: wait longer for fonts
          setTimeout(resolve, 2000);
        }
      });

      // Use the existing iframe that already has proper styling
      const iframeDoc =
        iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error("Cannot access iframe content");
      }

      // Find the pdf-container element for better capture
      const pdfContainer = iframeDoc.querySelector(".pdf-container");
      const targetElement = pdfContainer || iframeDoc.body;

      const canvas = await html2canvas(targetElement as HTMLElement, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: targetElement.scrollWidth,
        height: targetElement.scrollHeight,
        onclone: (clonedDoc) => {
          // Ensure fonts are properly loaded in the cloned document
          const clonedBody = clonedDoc.body;
          if (clonedBody) {
            clonedBody.style.fontFamily = "'Montserrat', sans-serif";
            clonedBody.style.fontSize = "14px";
            clonedBody.style.lineHeight = "1.4";
            clonedBody.style.fontWeight = "400";
          }

          // Also apply font to all elements
          const allElements = clonedDoc.querySelectorAll("*");
          allElements.forEach((el) => {
            if (el instanceof HTMLElement && el.style) {
              el.style.fontFamily = "'Montserrat', sans-serif";
            }
          });
        },
      });

      const imgData = canvas.toDataURL("image/png", 0.95);
      const pdf = new jsPDF("p", "mm", "a4");
      const imgW = 210;
      const imgH = (canvas.height * imgW) / canvas.width;
      let hLeft = imgH;
      let pos = 0;

      pdf.addImage(imgData, "PNG", 0, pos, imgW, imgH);
      hLeft -= 295;

      while (hLeft > 0) {
        pos = hLeft - imgH;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, pos, imgW, imgH);
        hLeft -= 295;
      }

      const filename = `Invoice-${
        order?.shopify_order_number ||
        order?.order_number ||
        order?.id ||
        Date.now()
      }.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);

      // Try alternative approach: create a temporary window with the content
      try {
        const tempWindow = window.open("", "_blank", "width=800,height=600");
        if (!tempWindow) throw new Error("Could not open window");

        tempWindow.document.write(completeHtmlContent);
        tempWindow.document.close();

        // Wait for fonts to load in the new window
        await new Promise((resolve) => {
          if (tempWindow.document.fonts && tempWindow.document.fonts.ready) {
            tempWindow.document.fonts.ready.then(() => {
              setTimeout(resolve, 1000);
            });
          } else {
            setTimeout(resolve, 2000);
          }
        });

        // Generate PDF from the new window
        const { jsPDF } = await import("jspdf");
        const html2canvas = (await import("html2canvas")).default;

        const canvas = await html2canvas(tempWindow.document.body, {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
          allowTaint: true,
          logging: false,
        });

        const imgData = canvas.toDataURL("image/png", 0.95);
        const pdf = new jsPDF("p", "mm", "a4");
        const imgW = 210;
        const imgH = (canvas.height * imgW) / canvas.width;
        let hLeft = imgH;
        let pos = 0;

        pdf.addImage(imgData, "PNG", 0, pos, imgW, imgH);
        hLeft -= 295;

        while (hLeft > 0) {
          pos = hLeft - imgH;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, pos, imgW, imgH);
          hLeft -= 295;
        }

        const filename = `Invoice-${
          order?.shopify_order_number ||
          order?.order_number ||
          order?.id ||
          Date.now()
        }.pdf`;
        pdf.save(filename);

        tempWindow.close();
      } catch (fallbackError) {
        console.error("Fallback PDF generation failed:", fallbackError);
        // Final fallback to HTML print
        const w = window.open("", "_blank");
        if (!w) return;
        w.document.write(completeHtmlContent);
        w.document.close();
        w.onload = () => w.print();
      }
    }
  };

  btnClose.onclick = () => document.body.removeChild(overlay);
  overlay.onclick = (e) => {
    if (e.target === overlay) document.body.removeChild(overlay);
  };

  buttons.appendChild(btnDownload);
  buttons.appendChild(btnPrint);
  buttons.appendChild(btnClose);
  header.appendChild(title);
  header.appendChild(buttons);
  body.appendChild(iframe);
  modal.appendChild(header);
  modal.appendChild(body);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}
