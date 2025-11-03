// src/supabase-config.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// УБИРАЕМ ВСЕ ОПЦИИ, ВОЗВРАЩАЕМ К ОРИГИНАЛУ
export const supabase = createClient(supabaseUrl, supabaseAnonKey)