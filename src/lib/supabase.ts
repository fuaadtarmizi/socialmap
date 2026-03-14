import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zqmqxhmbakukcgptfrsv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxbXF4aG1iYWt1a2NncHRmcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyOTEyNjcsImV4cCI6MjA4ODg2NzI2N30.DHYIP0uXynql_NH3r9shPx_01etmzfbNPf-a9yedpSs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


