// supabase-config.js

// TODO: Reemplaza estos valores con tu URL y clave (anon/public) de Supabase
const supabaseUrl = 'https://yzajrlgxezudowsbirzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6YWpybGd4ZXp1ZG93c2JpcnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NTEwMjksImV4cCI6MjA5NzAyNzAyOX0.S4ASHMoXtGIfHA4uT9x_7K5QxLzChdEZ-j66gmN2GwU';

// Inicializar el cliente de Supabase y asignarlo al objeto global para evitar conflictos de redeclaración
window.supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Función asincrónica de prueba para verificar la comunicación
async function probarConexion() {
    try {
        const { data, error } = await supabase
            .from('viajes')
            .select('*')
            .limit(1);

        if (error) {
            console.error('Error al conectar con Supabase (tabla "viajes"):', error);
        } else {
            console.log('Conexión exitosa a Supabase. Datos de prueba obtenidos:', data);
        }
    } catch (err) {
        console.error('Excepción al probar la conexión con Supabase:', err);
    }
}

// Ejecutar la prueba en consola
probarConexion();