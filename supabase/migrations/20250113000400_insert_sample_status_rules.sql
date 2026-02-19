-- Insert actual status rules for PrimeStyle automation
INSERT INTO public.statuses_model (
    status,
    new_status,
    wait_time_business_days,
    description,
    private_email,
    email_subject,
    email_custom_message,
    additional_recipients,
    is_active
) VALUES 
(
    'Casting Order',
    'Casting Order Email Sent',
    0,
    'Casting order has been placed and customer notified',
    NULL,
    'Your PrimeStyle Order: Stage 1 Completed! 🎉',
    'Order progress update! We are excited to inform you that the first of three stages in processing your order is now complete. The casting for your item(s) has been ordered according to your specifications.',
    NULL,
    true
),
(
    'Casting Received',
    'Casting Received Email Sent',
    0,
    'Casting has been received and customer notified',
    NULL,
    'Your PrimeStyle Order: Stage 2 Completed! 🎉',
    'Order progress update! We are excited to inform you that the first of three stages in processing your order is now complete. The casting for your item(s) has been ordered according to your specifications.',
    NULL,
    true
),
(
    'Polishing & Finishing',
    'Polishing & Finishing Email Sent',
    0,
    'Polishing and finishing stage completed and customer notified',
    NULL,
    'Your PrimeStyle Order: Stage 3 Completed! 🎉',
    'Order progress update! Your order has reached its final stage. The stones have been set, and your items are being polished and finished for shipping. The appraisal is also being prepared. We will notify you with the tracking number as soon as your items are shipped out.',
    NULL,
    true
),
(
    'Return For Refund Instructions',
    'Return For Refund Instructions Email Sent',
    0,
    'Return for refund instructions sent to customer',
    NULL,
    'Your PrimeStyle Order: Return Instructions',
    'PLEASE NOTE! Items that have been worn, resized, engraved, altered or damaged in any way will not be accepted (refer to our return policy).

To return your item please follow these instructions:

1. Ship the item and the invoice (packing list) to:

Prime Style LLC
Returns Department
18117 Biscayne Blvd, UNIT 2867
Miami, FL 33160

*It is a MUST to include the unit number on your label otherwise package would be rejected or lost.

2. It is required that you insure the shipment

3. On the outside of the package/envelope write down the following: RMA: REF- {{ order_number }}  It is very important that the RMA# is visible, otherwise the shipment will not be accepted.

In order for International Customers, to comply with the return process and allow the return process to go smoothly without rejection of the package please make sure you do the following:

1. Make sure that on the shipping label the "bill duties & customs" is marked to the sender AND NOT the recipient.

2. Please MAKE SURE to include the attached two forms (signed by you) together with the return shipping label. Also, when filling up your shipping label commercial invoice, MAKE SURE to indicate in the proper fields (product manufacture OR origin) that it is "USA" and also indicate that this item is a "return to the merchant". Doing so is IMPORTANT as OTHERWISE, you will be subject to additional customs fees.',
    NULL,
    true
),
(
    'Return for replacement instructions',
    'Return for replacement instructions Email Sent',
    0,
    'Return for replacement instructions sent to customer',
    NULL,
    NULL,
    NULL,
    NULL,
    true
),
(
    'Return For Refund Received',
    'Return For Refund Received Email Sent',
    0,
    'Return for refund received and customer notified',
    NULL,
    NULL,
    NULL,
    NULL,
    true
),
(
    'Return for replacement received',
    'Return for replacement received Email Sent',
    0,
    'Return for replacement received and customer notified',
    NULL,
    NULL,
    NULL,
    NULL,
    true
),
(
    'Item Shipped',
    'Item Shipped Email Sent',
    0,
    'Item has been shipped and customer notified',
    NULL,
    NULL,
    NULL,
    NULL,
    true
),
(
    'Casting Order Email Sent',
    'Casting Order Delay - Jenny',
    3,
    'Casting order delay notification to Jenny after 3 business days',
    'primestyle11@gmail.com',
    NULL,
    NULL,
    NULL,
    true
),
(
    'Casting Order Delay - Jenny',
    'Casting Order Delay - David',
    1,
    'Casting order delay escalation to David after 1 business day',
    'ydavid74@gmail.com',
    NULL,
    NULL,
    NULL,
    true
);
