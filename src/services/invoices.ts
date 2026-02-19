import { supabase } from "@/integrations/supabase/client";

export interface InvoiceData {
  id: string;
  order_id: string;
  invoice_number: string;
  html_content: string;
  total_amount: number | null;
  status: string | null;
  generated_at: string | null;
  generated_by: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateInvoiceData {
  order_id: string;
  invoice_number: string;
  html_content: string;
  total_amount?: number | null;
  status?: string;
  notes?: string | null;
}

export interface InvoiceService {
  createInvoice(data: CreateInvoiceData): Promise<InvoiceData>;
  getInvoicesByOrderId(orderId: string): Promise<InvoiceData[]>;
  getInvoiceById(invoiceId: string): Promise<InvoiceData | null>;
  updateInvoiceStatus(invoiceId: string, status: string): Promise<InvoiceData>;
  deleteInvoice(invoiceId: string): Promise<void>;
}

export const invoiceService: InvoiceService = {
  async createInvoice(data: CreateInvoiceData): Promise<InvoiceData> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: invoice, error } = await supabase
      .from("order_invoice")
      .insert({
        ...data,
        generated_by: user.id,
        status: data.status || "generated",
      })
      .select()
      .single();

    if (error) throw error;
    return invoice;
  },

  async getInvoicesByOrderId(orderId: string): Promise<InvoiceData[]> {
    const { data, error } = await supabase
      .from("order_invoice")
      .select("*")
      .eq("order_id", orderId)
      .order("generated_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getInvoiceById(invoiceId: string): Promise<InvoiceData | null> {
    const { data, error } = await supabase
      .from("order_invoice")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  },

  async updateInvoiceStatus(
    invoiceId: string,
    status: string
  ): Promise<InvoiceData> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("order_invoice")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteInvoice(invoiceId: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("order_invoice")
      .delete()
      .eq("id", invoiceId);

    if (error) throw error;
  },
};
