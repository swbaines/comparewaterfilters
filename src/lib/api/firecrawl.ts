import { supabase } from "@/integrations/supabase/client";

type FirecrawlResponse<T = any> = {
  success: boolean;
  error?: string;
  data?: T;
};

export const firecrawlApi = {
  async scrape(url: string, options?: { formats?: any[]; onlyMainContent?: boolean }): Promise<FirecrawlResponse> {
    const { data, error } = await supabase.functions.invoke("scrape-provider", {
      body: { url, options },
    });
    if (error) return { success: false, error: error.message };
    return data;
  },
};
