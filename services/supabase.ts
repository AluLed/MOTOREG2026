import { createClient } from '@supabase/supabase-js';

// DEJA ESTOS CAMPOS VACÍOS PARA DESCONECTAR. 
// Cuando tengas tu nuevo proyecto, pega aquí la URL y la Key.
const supabaseUrl = ''; 
const supabaseKey = '';

// El cliente solo se inicializa si hay credenciales válidas
export const supabase = (supabaseUrl && supabaseKey) 
    ? createClient(supabaseUrl, supabaseKey) 
    : null;

/**
 * Mapea datos de Supabase (snake_case) a la aplicación (camelCase)
 */
export const mapFromDb = (data: any): any => {
    if (!data) return data;
    if (Array.isArray(data)) return data.map(mapFromDb);
    
    const mapped: any = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const camelKey = key.replace(/([-_][a-z])/ig, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));
            mapped[camelKey] = data[key];
            if (camelKey !== key) mapped[key] = data[key];
        }
    }
    return mapped;
};

/**
 * Mapea datos de la aplicación a Supabase
 */
export const mapToDb = (data: any): any => {
    if (!data) return data;
    const mapped: any = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            mapped[snakeKey] = data[key];
        }
    }
    return mapped;
};