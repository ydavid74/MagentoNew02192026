// supabase/functions/create-shipping-label/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const log = (tag: string, data: Record<string, unknown>) =>
  console.log(
    JSON.stringify({ ts: new Date().toISOString(), tag: `se.${tag}`, ...data })
  );

type GenerateRequest = { order_id: string };
type OrderRecord = {
  id: string;
  order_date: string | null;
  total_amount: number;
  delivery_method?: string | null;
  bill_to_name?: string | null;
  ship_to_name?: string | null;
};
type AddressRecord = {
  first_name: string;
  last_name: string;
  company?: string | null;
  street1: string;
  street2?: string | null;
  city: string;
  region: string;
  postcode: string;
  country: string;
  phone?: string | null;
  email?: string | null;
};
type ShopifyOrder = { id: number; name: string };

/* ---------- Signing helpers ---------- */
async function hmacSha256Hex(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// URL encode compatible with ShippingEasy expectations
function urlEncode(s: string): string {
  return encodeURIComponent(s);
}

function canonicalQuery(
  params: Record<string, string | number | undefined | null>
): string {
  return Object.keys(params)
    .sort()
    .map((k) => {
      const v = params[k];
      if (v === undefined || v === null) return "";
      return `${urlEncode(k)}=${urlEncode(String(v))}`;
    })
    .filter(Boolean)
    .join("&");
}

// Deterministic JSON without null/undefined, sorted keys
function stableStringify(x: unknown): string {
  if (x === null || x === undefined) return "";
  if (typeof x !== "object") return JSON.stringify(x);
  if (Array.isArray(x)) return "[" + x.map(stableStringify).join(",") + "]";
  const obj = x as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const parts: string[] = [];
  for (const k of keys) {
    const v = (obj as any)[k];
    if (v === undefined || v === null) continue;
    parts.push(`"${k}":${stableStringify(v)}`);
  }
  return "{" + parts.join(",") + "}";
}

async function buildSignedUrl(
  baseUrl: string,
  path: string, // keep leading slash
  apiKey: string,
  apiSecret: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  bodyObj?: unknown,
  extraQuery?: Record<string, string | number | undefined | null>
): Promise<string> {
  const api_timestamp =
    (extraQuery?.api_timestamp as number) || Math.floor(Date.now() / 1000);
  const query = canonicalQuery({ api_key: apiKey, api_timestamp });
  const bodyString =
    method === "POST" && bodyObj ? stableStringify(bodyObj) : "";
  const verb = method.toUpperCase();
  // For signature calculation, ensure path has leading slash (as per ShippingEasy docs)
  const pathForSig = path.startsWith("/") ? path : `/${path}`;
  const signaturePlain = bodyString
    ? `${verb}&${pathForSig}&${query}&${bodyString}`
    : `${verb}&${pathForSig}&${query}`;
  log("sig.plain", {
    plain: signaturePlain.slice(0, 500),
    fullLength: signaturePlain.length,
    method: verb,
    path: pathForSig,
    query: query,
    bodyLength: bodyString.length,
  });
  const api_signature = await hmacSha256Hex(apiSecret, signaturePlain);
  log("sig.result", {
    signature: api_signature,
    finalUrl:
      `${baseUrl}${path}?${query}&api_signature=${api_signature}`.slice(
        0,
        200
      ) + "...",
  });
  return `${baseUrl}${path}?${query}&api_signature=${api_signature}`;
}

/* ---------- Domain helpers ---------- */
function computeInsurance(total: number): number {
  return Math.min(Math.round((total || 0) * 0.7), 500);
}
function mapService(method: string | null | undefined): {
  carrier: "fedex" | "usps";
  service_hint: string;
  pkg: string;
} {
  const m = (method || "").toLowerCase();
  if (m.includes("overnight"))
    return {
      carrier: "fedex",
      service_hint: "FEDEX_OVERNIGHT",
      pkg: "FEDEX_PAK",
    };
  if (
    m.includes("2-day") ||
    (m.includes("2") && m.includes("day")) ||
    m.includes("second")
  )
    return { carrier: "fedex", service_hint: "FEDEX_2DAY", pkg: "FEDEX_PAK" };
  return { carrier: "usps", service_hint: "USPS_PRIORITY", pkg: "PACKAGE" };
}

async function fetchShopifyOrderByNote(
  supabase: any,
  shopifyDomain: string,
  apiVersion: string,
  accessToken: string,
  orderId: string
): Promise<ShopifyOrder | null> {
  const { data: noteRow, error } = await supabase
    .from("order_customer_notes")
    .select("content")
    .eq("order_id", orderId)
    .like("content", "Shopify Order:%")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  const content: string | undefined = noteRow?.content;
  const match = content && /Shopify Order:\s*(\d+)/.exec(content);
  const shopifyId = match?.[1];
  if (!shopifyId) return null;
  const url = `https://${shopifyDomain}/admin/api/${apiVersion}/orders/${shopifyId}.json`;
  const res = await fetch(url, {
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`Shopify fetch failed: ${res.status}`);
  const json = (await res.json()) as { order?: ShopifyOrder };
  return json.order ?? null;
}

/* ---------- ShippingEasy orchestrator ---------- */
async function createShippingEasyOrderAndLabel(
  seBaseUrl: string,
  apiKey: string,
  apiSecret: string,
  orderPayload: any,
  opts: { useHeadersAuth: boolean; storeApiKey: string }
): Promise<{ label_pdf_url?: string; label_pdf_base64?: string }> {
  if (!opts.storeApiKey)
    throw new Error("store_api_key is required for order creation");
  const ordersPath = `/api/stores/${opts.storeApiKey}/orders`;
  const labelsPath = `/api/stores/${opts.storeApiKey}/shipments/labels`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": "primestyle-admin/1.0 (Supabase Edge)",
  };

  let ordersUrl: string;
  if (opts.useHeadersAuth) {
    headers["X-ShippingEasy-API-Key"] = apiKey;
    headers["X-ShippingEasy-API-Secret"] = apiSecret;
    ordersUrl = `${seBaseUrl}${ordersPath}`;
  } else {
    ordersUrl = await buildSignedUrl(
      seBaseUrl,
      ordersPath,
      apiKey,
      apiSecret,
      "POST",
      orderPayload,
      { api_timestamp: Math.floor(Date.now() / 1000) }
    );
  }

  const bodyStr = stableStringify(orderPayload);
  log("order.req", {
    url: ordersUrl,
  });
  const createRes = await fetch(ordersUrl, {
    method: "POST",
    headers,
    body: bodyStr,
  });

  if (!createRes.ok) {
    const txt = await createRes.text();
    log("order.err", { status: createRes.status, body: txt.slice(0, 1500) });

    // If order already exists, we cannot derive the ShippingEasy order ID here without a separate lookup.
    // Return a clear error so the caller can decide how to proceed (e.g., store the ID when first created).
    if (createRes.status === 400 && txt.includes("order already exists")) {
      throw new Error(
        "Order already exists in ShippingEasy; missing se_order_id to buy label."
      );
    }
    throw new Error(`ShippingEasy order creation failed: ${createRes.status}`);
  } else {
    log("order.created", { message: "Order created successfully" });
  }

  // Parse created order response to extract ShippingEasy order ID
  const createdJson = await createRes.json();
  const seOrderId =
    (createdJson && (createdJson.id || createdJson.order?.id)) || null;
  if (!seOrderId) {
    log("order.create.parse_fail", {
      bodyPreview: JSON.stringify(createdJson).slice(0, 300),
    });
    throw new Error(
      "Could not parse ShippingEasy order ID from create response"
    );
  }

  // Use the correct ShippingEasy API endpoint: POST /api/stores/{store_id}/orders/{order_id}/labels
  const labelPayload = {
    label: {
      carrier:
        orderPayload?.order?.recipients?.[0]?.shipment?.carrier || "FEDEX",
      service:
        orderPayload?.order?.recipients?.[0]?.shipment?.service || "FEDEX_2DAY",
      package_type:
        orderPayload?.order?.recipients?.[0]?.shipment?.package_type ||
        "FEDEX_PAK",
    },
  };

  const approaches = [
    {
      name: "correct_endpoint",
      payload: labelPayload,
      path: `/api/stores/${opts.storeApiKey}/orders/${seOrderId}/labels`,
    },
    // Fallback with minimal payload
    {
      name: "minimal_payload",
      payload: { label: {} },
      path: `/api/stores/${opts.storeApiKey}/orders/${seOrderId}/labels`,
    },
  ];

  for (const approach of approaches) {
    try {
      log("label.try", { approach: approach.name, path: approach.path });

      let labelsUrl: string;
      if (opts.useHeadersAuth) {
        labelsUrl = `${seBaseUrl}${approach.path}`;
      } else {
        labelsUrl = await buildSignedUrl(
          seBaseUrl,
          approach.path,
          apiKey,
          apiSecret,
          "POST",
          approach.payload
        );
      }

      const labelStr = stableStringify(approach.payload);
      const buyRes = await fetch(labelsUrl, {
        method: "POST",
        headers,
        body: labelStr,
      });

      if (buyRes.ok) {
        const buyJson = await buyRes.json();
        log("label.success", { approach: approach.name, response: buyJson });
        return {
          label_pdf_url:
            buyJson?.label_url ||
            buyJson?.pdf_url ||
            buyJson?.shipment?.label_url,
          label_pdf_base64: buyJson?.label_pdf || buyJson?.label_pdf_base64,
        };
      } else {
        const txt = await buyRes.text();
        log("label.fail", {
          approach: approach.name,
          status: buyRes.status,
          body: txt.slice(0, 500),
        });
      }
    } catch (error) {
      log("label.error", {
        approach: approach.name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  throw new Error("All label creation approaches failed");
}

/* ---------- HTTP entry ---------- */
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

    const shopifyDomain = Deno.env.get("SHOPIFY_STORE_DOMAIN");
    const shopifyApiVersion = Deno.env.get("SHOPIFY_API_VERSION");
    const shopifyAccessToken = Deno.env.get("SHOPIFY_ADMIN_ACCESS_TOKEN");
    const seBaseUrl =
      Deno.env.get("SHIPPINGEASY_BASE_URL") || "https://api.shippingeasy.com"; // IMPORTANT
    const seKey = Deno.env.get("SHIPPINGEASY_API_KEY");
    const seSecret = Deno.env.get("SHIPPINGEASY_API_SECRET");
    const seStoreKey = Deno.env.get("SHIPPINGEASY_STORE_API_KEY");
    const useHeadersAuth =
      (Deno.env.get("SHIPPINGEASY_AUTH_STYLE") || "query").toLowerCase() ===
      "headers";

    if (
      !shopifyDomain ||
      !shopifyApiVersion ||
      !shopifyAccessToken ||
      !seKey ||
      !seSecret ||
      !seStoreKey
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required API credentials" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", body.order_id)
      .single<OrderRecord>();
    if (orderErr || !order) throw orderErr || new Error("Order not found");

    const { data: billing } = await supabase
      .from("order_billing_address")
      .select("*")
      .eq("order_id", body.order_id)
      .maybeSingle<AddressRecord>();
    const { data: shipping } = await supabase
      .from("order_shipping_address")
      .select("*")
      .eq("order_id", body.order_id)
      .maybeSingle<AddressRecord>();
    const toAddr = shipping || billing;
    if (!toAddr) throw new Error("No destination address available");

    const shopifyOrder = await fetchShopifyOrderByNote(
      supabase,
      shopifyDomain,
      shopifyApiVersion,
      shopifyAccessToken,
      body.order_id
    );

    const declaredValue = computeInsurance(order.total_amount || 0);
    const { carrier, service_hint, pkg } = mapService(order.delivery_method);

    const payload = {
      order: {
        external_order_identifier: shopifyOrder?.id
          ? String(shopifyOrder.id)
          : order.id,
        order_number: shopifyOrder?.name || order.id,
        ordered_at: (order.order_date ? new Date(order.order_date) : new Date())
          .toISOString()
          .replace("T", " ")
          .replace("Z", " -0000"),
        order_status: "awaiting_shipment",
        total_including_tax: String(order.total_amount || "0.00"),
        total_excluding_tax: String(order.total_amount || "0.00"),
        subtotal_including_tax: String(order.total_amount || "0.00"),
        subtotal_excluding_tax: String(order.total_amount || "0.00"),
        subtotal_tax: "0.00",
        total_tax: "0.00",
        discount_amount: "0.00",
        coupon_discount: "0.00",
        base_shipping_cost: "0.00",
        shipping_cost_including_tax: "0.00",
        shipping_cost_excluding_tax: "0.00",
        shipping_cost_tax: "0.00",
        base_handling_cost: "0.00",
        handling_cost_excluding_tax: "0.00",
        handling_cost_including_tax: "0.00",
        handling_cost_tax: "0.00",
        base_wrapping_cost: "0.00",
        wrapping_cost_excluding_tax: "0.00",
        wrapping_cost_including_tax: "0.00",
        wrapping_cost_tax: "0.00",
        notes: "",
        billing_company: billing?.company || toAddr.company || "",
        billing_first_name: billing?.first_name || toAddr.first_name,
        billing_last_name: billing?.last_name || toAddr.last_name,
        billing_address: billing?.street1 || toAddr.street1,
        billing_address2: billing?.street2 || toAddr.street2 || "",
        billing_city: billing?.city || toAddr.city,
        billing_state: billing?.region || toAddr.region,
        billing_postal_code: billing?.postcode || toAddr.postcode,
        billing_country: billing?.country || toAddr.country || "USA",
        billing_phone_number: billing?.phone || toAddr.phone || "",
        billing_email: billing?.email || toAddr.email || "",
        recipients: [
          {
            first_name: toAddr.first_name,
            last_name: toAddr.last_name,
            company: toAddr.company || "",
            email: toAddr.email || "",
            phone_number: toAddr.phone || "",
            residential: "true",
            address: toAddr.street1,
            address2: toAddr.street2 || "",
            province: "",
            state: toAddr.region,
            city: toAddr.city,
            postal_code: toAddr.postcode,
            postal_code_plus_4: "",
            country: toAddr.country || "USA",
            shipping_method: order.delivery_method || "Ground",
            base_cost: String(order.total_amount || "0.00"),
            cost_excluding_tax: String(order.total_amount || "0.00"),
            cost_tax: "0.00",
            base_handling_cost: "0.00",
            handling_cost_excluding_tax: "0.00",
            handling_cost_including_tax: "0.00",
            handling_cost_tax: "0.00",
            items_total: "1",
            items_shipped: "0",
            line_items: [
              {
                item_name: "Jewelry Shipment",
                sku: "LABEL-ONLY",
                bin_picking_number: "7",
                unit_price: String(order.total_amount || "0.00"),
                total_excluding_tax: String(order.total_amount || "0.00"),
                weight_in_ounces: "10",
                product_options: { pa_size: "large", Colour: "Blue" },
                quantity: "1",
              },
            ],
            shipment: {
              carrier: carrier.toUpperCase(),
              service: service_hint,
              package_type: pkg,
              insurance: {
                provider:
                  carrier === "fedex" ? "FEDEX_DECLARED_VALUE" : "CARRIER",
                amount: declaredValue,
                currency: "USD",
              },
              signature_confirmation:
                carrier === "usps" ? "ADULT_SIGNATURE" : undefined,
            },
          },
        ],
      },
    };

    const { label_pdf_url, label_pdf_base64 } =
      await createShippingEasyOrderAndLabel(
        seBaseUrl,
        seKey,
        seSecret,
        payload,
        { useHeadersAuth, storeApiKey: seStoreKey }
      );

    // Download or decode label
    let pdfBytes: Uint8Array | null = null;
    if (label_pdf_base64)
      pdfBytes = Uint8Array.from(atob(label_pdf_base64), (c) =>
        c.charCodeAt(0)
      );
    else if (label_pdf_url) {
      const r = await fetch(label_pdf_url);
      if (!r.ok) throw new Error(`Failed to download label PDF: ${r.status}`);
      pdfBytes = new Uint8Array(await r.arrayBuffer());
    }
    if (!pdfBytes)
      throw new Error("No label content returned from ShippingEasy");

    // Upload to storage and record
    const fileName = `labels/${body.order_id}/${Date.now()}-label.pdf`;
    const { data: upload, error: upErr } = await supabase.storage
      .from("documents")
      .upload(fileName, new Blob([pdfBytes], { type: "application/pdf" }), {
        upsert: false,
      });
    if (upErr) throw upErr;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: doc, error: docErr } = await supabase
      .from("documents")
      .insert({
        order_id: body.order_id,
        type: "label",
        filename: `ShippingLabel-${body.order_id}.pdf`,
        size: pdfBytes.byteLength,
        content_type: "application/pdf",
        file_url: upload.path,
        uploaded_by: user?.id || null,
      })
      .select("*")
      .single();
    if (docErr) throw docErr;

    return new Response(JSON.stringify({ status: "ok", document: doc }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    log("unhandled", { err: e?.message, stack: e?.stack });
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
