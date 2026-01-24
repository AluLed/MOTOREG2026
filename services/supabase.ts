import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://greelqkztddhnzanfyml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZWVscWt6dGRkaG56YW5meW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyODU2NjYsImV4cCI6MjA4NDg2MTY2Nn0.O77f1T_yEFOkPeGYi4GXjCUh9RkAQ5X7OfMdPsE5P1Y';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper para transformar nombres de columnas de snake_case a camelCase
export const mapFromDb = (data: any) => {
    if (!data) return data;
    if (Array.isArray(data)) return data.map(mapFromDb);
    
    const mapped: any = {};
    for (const key in data) {
        const camelKey = key.replace(/([-_][a-z])/ig, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));
        mapped[camelKey] = data[key];
    }
    return mapped;
};

// Helper para transformar de camelCase a snake_case
export const mapToDb = (data: any) => {
    const mapped: any = {};
    for (const key in data) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        mapped[snakeKey] = data[key];
    }
    return mapped;
};