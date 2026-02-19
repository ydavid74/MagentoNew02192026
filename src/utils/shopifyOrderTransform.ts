// Transform Shopify order data to invoice format
// This function now accepts both Shopify order data and database order items for images

export function transformShopifyOrderForInvoice(
  shopifyOrder: any,
  dbOrderItems?: any[]
) {
  // Extract line items and transform them
  const items = (shopifyOrder.line_items || []).map((item: any) => {
    // Try to find matching database item for image
    let imageUrl = "";

    console.log("🔍 Looking for image for Shopify item:", {
      sku: item.sku,
      variant_id: item.variant_id,
      title: item.title,
    });

    if (dbOrderItems && dbOrderItems.length > 0) {
      console.log(
        "📦 Available database items:",
        dbOrderItems.map((dbItem) => ({
          sku: dbItem.sku,
          hasImageUrl: !!dbItem.image_url,
          hasImage: !!dbItem.image,
          image_url: dbItem.image_url,
          image: dbItem.image,
        }))
      );

      const matchingDbItem = dbOrderItems.find(
        (dbItem) =>
          dbItem.sku === item.sku || dbItem.sku === item.variant_id?.toString()
      );

      console.log("🎯 Matching database item:", matchingDbItem);

      if (
        matchingDbItem &&
        (matchingDbItem.image_url || matchingDbItem.image)
      ) {
        imageUrl = matchingDbItem.image_url || matchingDbItem.image;
        console.log("✅ Found image:", imageUrl);
      } else {
        console.log("❌ No matching database item or no image URL");
      }
    } else {
      console.log("❌ No database items provided");
    }

    // If no image found, use placeholder
    if (!imageUrl) {
      imageUrl = "https://via.placeholder.com/150x150?text=No+Image";
      console.log("🖼️ Using placeholder image");
    }

    // Calculate total price including tax for this item
    const basePrice = parseFloat(item.price || "0");
    const itemTax = (item.tax_lines || []).reduce(
      (taxSum: number, taxLine: any) => {
        return taxSum + parseFloat(taxLine.price || "0");
      },
      0
    );
    const totalPriceWithTax = basePrice + itemTax;

    return {
      sku: item.sku || item.variant_id?.toString() || "",
      details: item.title || "",
      price: basePrice, // Base price before tax (for display)
      basePrice: basePrice, // Base price before tax
      tax: itemTax, // Tax amount for this item
      qty: item.quantity || 1,
      image: imageUrl,
    };
  });

  // Calculate totals using Shopify's calculated values
  const subTotal = parseFloat(shopifyOrder.subtotal_price || "0");
  const totalTax = parseFloat(shopifyOrder.total_tax || "0");
  const discountAmount = parseFloat(shopifyOrder.total_discounts || "0");
  const discountCodes = (shopifyOrder.discount_codes || []).map(
    (discount: any) => ({
      code: discount.code || "Discount",
      type: discount.type || "fixed_amount",
      amount: discount.amount || "0",
    })
  );

  // Get shipping cost
  const shippingCost = parseFloat(shopifyOrder.total_shipping || "0");

  // Calculate total using Shopify's total (which includes tax)
  const totalAmount = parseFloat(shopifyOrder.total_price || "0");

  // Transform addresses
  const billingAddress = shopifyOrder.billing_address
    ? {
        first_name: shopifyOrder.billing_address.first_name || "",
        last_name: shopifyOrder.billing_address.last_name || "",
        company: shopifyOrder.billing_address.company || "",
        street1: shopifyOrder.billing_address.address1 || "",
        street2: shopifyOrder.billing_address.address2 || "",
        city: shopifyOrder.billing_address.city || "",
        region: shopifyOrder.billing_address.province || "",
        postcode: shopifyOrder.billing_address.zip || "",
        country: shopifyOrder.billing_address.country || "",
        phone: shopifyOrder.billing_address.phone || "",
        email: shopifyOrder.email || "",
      }
    : null;

  const shippingAddress = shopifyOrder.shipping_address
    ? {
        first_name: shopifyOrder.shipping_address.first_name || "",
        last_name: shopifyOrder.shipping_address.last_name || "",
        company: shopifyOrder.shipping_address.company || "",
        street1: shopifyOrder.shipping_address.address1 || "",
        street2: shopifyOrder.shipping_address.address2 || "",
        city: shopifyOrder.shipping_address.city || "",
        region: shopifyOrder.shipping_address.province || "",
        postcode: shopifyOrder.shipping_address.zip || "",
        country: shopifyOrder.shipping_address.country || "",
        phone: shopifyOrder.shipping_address.phone || "",
        email: shopifyOrder.email || "",
      }
    : null;

  // Get order date
  const orderDate = shopifyOrder.created_at
    ? new Date(shopifyOrder.created_at).toISOString().split("T")[0]
    : "";

  // Get delivery method from shipping lines
  const deliveryMethod =
    shopifyOrder.shipping_lines?.[0]?.title || "Standard Shipping";

  return {
    id: shopifyOrder.id?.toString() || "",
    shopify_order_number: shopifyOrder.name || "",
    order_date: orderDate,
    delivery_method: deliveryMethod,
    billing_address: billingAddress,
    shipping_address: shippingAddress,
    items: items,
    sub_total: subTotal, // Subtotal before tax
    total_tax: totalTax, // Total tax amount
    total_amount: totalAmount, // Final total including tax
    discount_amount: discountAmount,
    discount_codes: discountCodes,
    shipping_cost: shippingCost,
    note: shopifyOrder.note || "",
    // Additional fields for invoice
    order_number: shopifyOrder.name || shopifyOrder.id?.toString() || "",
    bill_to: billingAddress
      ? `${billingAddress.first_name} ${billingAddress.last_name}`.trim()
      : "",
    ship_to: shippingAddress
      ? `${shippingAddress.first_name} ${shippingAddress.last_name}`.trim()
      : "",
  };
}
