-- Query de diagnóstico para ver datos de DOZ/Mendoza

-- 1. Ver todos los VHF únicos con sus FIRs y aeropuertos
SELECT DISTINCT fir, aeropuerto, sitio 
FROM vhf 
ORDER BY fir, aeropuerto;

-- 2. Buscar específicamente DOZ o Mendoza
SELECT DISTINCT fir, aeropuerto, sitio 
FROM vhf 
WHERE aeropuerto ILIKE '%DOZ%' 
   OR sitio ILIKE '%DOZ%'
   OR fir ILIKE '%Mendoza%'
   OR aeropuerto ILIKE '%Mendoza%'
   OR sitio ILIKE '%Mendoza%';

-- 3. Ver equipos relacionados a Mendoza
SELECT e.id, e.marca, e.modelo, v.fir, v.aeropuerto, v.sitio
FROM equipos e
JOIN vhf v ON e.vhf_id = v.id
WHERE v.fir ILIKE '%Mendoza%'
   OR v.aeropuerto ILIKE '%DOZ%'
   OR v.sitio ILIKE '%DOZ%'
LIMIT 10;

-- 4. Contar equipos por FIR
SELECT v.fir, COUNT(e.id) as total_equipos
FROM vhf v
LEFT JOIN equipos e ON v.id = e.vhf_id
GROUP BY v.fir
ORDER BY total_equipos DESC;

-- 5. Ver TODOS los FIRs que existen
SELECT DISTINCT fir FROM vhf ORDER BY fir;
