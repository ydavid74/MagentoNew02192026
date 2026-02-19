import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type GenerateRequest = { order_id: string };

function padLeft(num: number, size = 2): string {
  let s = String(num);
  while (s.length < size) s = "0" + s;
  return s;
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${padLeft(d.getMonth() + 1)}-${padLeft(
    d.getDate()
  )}`;
}

// Create a minimal, valid PDF document with plain text content
function createMinimalPdf(title: string, lines: string[]): Uint8Array {
  // Very small PDF with one page and simple text stream
  const text = [title, "", ...lines].join("\n");
  const encoded = new TextEncoder().encode(text);
  const streamHeader = `<< /Length ${encoded.byteLength} >>\nstream\n`;
  const streamFooter = "\nendstream\n";
  const objects: string[] = [];
  let xref: number[] = [];
  let offset = 0;

  function add(obj: string): void {
    xref.push(offset);
    offset += obj.length;
    objects.push(obj);
  }

  const header = "%PDF-1.4\n";
  offset += header.length;

  // 1: Catalog
  add("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  // 2: Pages
  add("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  // 3: Page
  add(
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
  );
  // 4: Contents (text stream)
  const content = `BT /F1 12 Tf 50 740 Td (${title.replace(
    /([()\\])/g,
    "\\$1"
  )}) Tj T* ${lines
    .map((l) => `(${l.replace(/([()\\])/g, "\\$1")}) Tj T* `)
    .join("")}ET`;
  const contentBytes = new TextEncoder().encode(content);
  const contents = `4 0 obj\n${streamHeader}${new TextDecoder().decode(
    contentBytes
  )}${streamFooter}endobj\n`;
  add(contents);
  // 5: Font
  add(
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
  );

  // xref table
  const xrefOffset = offset;
  let xrefTable = "xref\n0 " + (xref.length + 1) + "\n";
  xrefTable += "0000000000 65535 f \n";
  for (const off of xref) {
    xrefTable += ("0000000000" + off).slice(-10) + " 00000 n \n";
  }
  const trailer = `trailer\n<< /Size ${
    xref.length + 1
  } /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const parts = [header, ...objects, xrefTable, trailer];
  const full = parts.join("");
  return new TextEncoder().encode(full);
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: { ...corsHeaders } });
  try {
    if (req.method !== "POST")
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { ...corsHeaders },
      });

    const body = (await req.json()) as GenerateRequest;
    if (!body?.order_id)
      return new Response(JSON.stringify({ error: "order_id required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch order basics and items
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select(
        "id, order_date, total_amount, delivery_method, bill_to_name, ship_to_name, shopify_order_number"
      )
      .eq("id", body.order_id)
      .maybeSingle();
    if (orderErr || !order) throw orderErr || new Error("Order not found");

    const { data: items } = await supabase
      .from("order_items")
      .select("sku, details, qty, price")
      .eq("order_id", body.order_id);

    // Build PDF
    const today = formatDate(new Date());
    const invoiceNumber = order.shopify_order_number || order.id;
    const title = `Invoice #${invoiceNumber} - ${today}`;
    const lines: string[] = [];
    lines.push(`INVOICE NO. ${invoiceNumber}`);
    lines.push(`ORDER DATE ${order.order_date || today}`);
    lines.push(`PAYMENT Shopify payments, Visa`);
    lines.push(
      `SHIPPING ${order.delivery_method || "Free Shipping (3-5 business days)"}`
    );
    lines.push("");
    lines.push(`Ship To: ${order.ship_to_name || ""}`);
    lines.push("");
    lines.push("Items:");
    for (const it of items || []) {
      lines.push(
        `- ${it.sku || ""} ${it.details || ""} x${it.qty} @ $${Number(
          it.price || 0
        ).toFixed(2)}`
      );
    }
    lines.push("");
    lines.push(`Total: $${Number(order.total_amount || 0).toFixed(2)}`);

    const pdfBytes = createMinimalPdf(title, lines);

    // Upload to storage
    const fileName = `invoices/${body.order_id}/${Date.now()}-invoice.pdf`;
    const { data: upload, error: upErr } = await supabase.storage
      .from("documents")
      .upload(fileName, new Blob([pdfBytes], { type: "application/pdf" }), {
        upsert: false,
      });
    if (upErr) throw upErr;

    // Record in invoices
    const { data: userData } = await supabase.auth.getUser();
    const { data: inv, error: invErr } = await supabase
      .from("invoices")
      .insert({
        order_id: body.order_id,
        filename: `Invoice-${invoiceNumber}.pdf`,
        size: pdfBytes.byteLength,
        content_type: "application/pdf",
        file_url: upload.path,
        created_by: userData?.user?.id || null,
      })
      .select("*")
      .single();
    if (invErr) throw invErr;

    return new Response(JSON.stringify({ status: "ok", invoice: inv }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        tag: "invoice.unhandled",
        err: e?.message,
      })
    );
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
