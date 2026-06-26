import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const secretKey = process.env.SUPABASE_SECRET_KEY!;

// Server-only admin client — never import this in client components
export const supabaseAdmin = createClient(url, secretKey);
