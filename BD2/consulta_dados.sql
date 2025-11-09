-- (1.1 JOIN com 3 tabelas) Busca por produtores que o varejista com id 1 favoritou:
SELECT 
    P.id, 
    P.farm_name, 
    U.name AS nome_produtor, 
    U.city, 
    U.state
FROM 
    Producer P
JOIN 
    Favorite F ON P.id = F.producer_id
JOIN 
    User U ON P.user_id = U.id
WHERE 
    F.retailer_id = 1;

-- (1.2 JOIN) Busca dados de contato do produtor com id 1:
SELECT 
    U.name, 
    U.email, 
    U.phone, 
    U.city, 
    U.state, 
    P.farm_name
FROM 
    User U
JOIN 
    Producer P ON U.id = P.user_id
WHERE 
    P.id = 1;

-- (2) Busca a quantidade de produtos que um produtor possui, filtrando aqueles que possuem mais que 2:
SELECT 
    P.farm_name,
    U.name AS nome_produtor,
    COUNT(Prod.id) AS total_produtos_disponiveis
FROM 
    Producer P
JOIN 
    User U ON P.user_id = U.id
JOIN 
    Product Prod ON P.id = Prod.producer_id
WHERE 
    Prod.available_inventory > 0
GROUP BY 
    P.id, P.farm_name, U.name
HAVING 
    total_produtos_disponiveis > 2;

-- (3) Filtra produtores de acordo com produto:
SELECT 
    P.id, 
    P.farm_name, 
    U.name
FROM 
    Producer P
JOIN 
    User U ON P.user_id = U.id
WHERE 
    P.id IN (
        SELECT DISTINCT producer_id 
        FROM Product 
        WHERE name LIKE '%Tomate%'
    );
    
-- (4) Busca o valor total em estoque de cada produtor em ordem descrescente:
SELECT 
    producer_id,
    SUM(unit_price * available_inventory) AS valor_total_estoque
FROM
    Product
GROUP BY 
    producer_id
ORDER BY 
    valor_total_estoque DESC;

-- (5) Retorna a quantidade de produtos que foram cadastrados no dia atual:
SELECT 
    COUNT(id) AS novos_produtos_hoje
FROM 
    Product
WHERE 
    created_at >= CURDATE() 
    AND created_at < (CURDATE() + INTERVAL 1 DAY);