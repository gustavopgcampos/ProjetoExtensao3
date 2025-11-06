-- (1) View de Relatório
-- Desempenho de cada produtor: quantos produtos ele tem, o valor total do seu estoque e quantos varejistas o favoritaram.
CREATE VIEW Vw_Relatorio_Produtores AS
SELECT 
    P.id AS id_produtor,
    P.farm_name AS nome_fazenda,
    U.state AS estado,
    
    COUNT(DISTINCT Prod.id) AS total_produtos_ofertados,
    COALESCE(SUM(Prod.unit_price * Prod.available_inventory), 0) AS valor_total_estoque,
    (SELECT COUNT(*) FROM Favorite F WHERE F.producer_id = P.id) AS total_favoritos
FROM 
    Producer P
JOIN 
    User U ON P.user_id = U.id
LEFT JOIN 
    Product Prod ON P.id = Prod.producer_id
GROUP BY 
    P.id, P.farm_name, U.state;

SELECT * FROM Vw_Relatorio_Produtores
ORDER BY valor_total_estoque DESC;

-- (2) View de Conveniência
-- Simplifica uma consulta que seria complexa e repetitiva, como buscar a lista completa de produtos com todos os detalhes do produtor:
CREATE VIEW Vw_Full_Product_Details AS
SELECT 
    Prod.id AS product_id,
    Prod.name AS product_name,
    Prod.unit_price,
    Prod.unit_measure,
    Prod.available_inventory,
    Prod.description,
    P.id AS producer_id,
    P.farm_name,
    U.name AS producer_name,
    U.city,
    U.state
FROM 
    Product Prod
JOIN 
    Producer P ON Prod.producer_id = P.id
JOIN 
    User U ON P.user_id = U.id;
    
-- (3) View Parametrizável
-- 

-- (4) View de Segurança
-- Expõe informações da tabela User, mas oculta colunas sensíveis (email, telefone e cep)
CREATE VIEW Vw_Public_User_Directory AS
SELECT 
    id,
    name,
    city,
    state,
    created_at
FROM 
    User;