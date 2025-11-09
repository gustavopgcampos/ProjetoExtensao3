-- (1) Procedure de CRUD Transacional
-- Varejista favorita um produtor
DELIMITER //	
CREATE PROCEDURE Proc_Favoritar_Produtor(
    IN p_retailer_id INT,
    IN p_producer_id INT
)
BEGIN
	DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
    END;
    
	START TRANSACTION;
    
    INSERT INTO Favorite (retailer_id, producer_id)
    VALUES (p_retailer_id, p_producer_id)
    ON DUPLICATE KEY UPDATE producer_id = p_producer_id;
    
    COMMIT;
END //
DELIMITER ;

CALL Proc_Favoritar_Produtor(1, 2);

-- (2) Função derivada
-- Esta função classifica um produto com base em seu preço, retornando uma "faixa de preço".
DELIMITER //
CREATE FUNCTION Fn_Get_Price_Range(
    p_price DECIMAL(10, 2)
)
RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
    DECLARE v_range VARCHAR(20);

    IF p_price IS NULL THEN
        SET v_range = 'Indefinido';
    ELSEIF p_price <= 5.00 THEN
        SET v_range = 'Barato';
    ELSEIF p_price <= 15.00 THEN
        SET v_range = 'Médio';
    ELSE
        SET v_range = 'Caro';
    END IF;

    RETURN v_range;
END //
DELIMITER ;

SELECT 
    name, 
    unit_price,
    Fn_Get_Price_Range(unit_price) AS faixa_preco
FROM 
    Product;
    
-- (3) Rotina Relatorial
-- Armazena em uma tabela temporária o estoque e preço de cada produto vinculado a um produtor:
DELIMITER //
CREATE PROCEDURE Proc_Relatorio_Produtos_Produtor(
    IN p_producer_id INT
)
BEGIN
    DROP TEMPORARY TABLE IF EXISTS Temp_Relatorio_Produtos;

    CREATE TEMPORARY TABLE Temp_Relatorio_Produtos (
        nome_produto VARCHAR(150),
        estoque DOUBLE,
        preco DECIMAL(10, 2)
    );

    INSERT INTO Temp_Relatorio_Produtos (nome_produto, estoque, preco)
    SELECT 
        name, 
        available_inventory, 
        unit_price
    FROM 
        Product
    WHERE 
        producer_id = p_producer_id;

    SELECT * FROM Temp_Relatorio_Produtos;
END //
DELIMITER ;

CALL Proc_Relatorio_Produtos_Produtor(1);

-- (4) Rotina de Negócio:
-- Atualiza o estoque, garantindo que ele não fique negativo:
DELIMITER //
CREATE PROCEDURE Proc_Atualizar_Estoque(
    IN p_product_id INT,
    IN p_quantidade_mudanca DOUBLE
)
BEGIN
    DECLARE v_estoque_atual DOUBLE;
    DECLARE v_estoque_novo DOUBLE;

    SELECT available_inventory INTO v_estoque_atual
    FROM Product 
    WHERE id = p_product_id;

    SET v_estoque_novo = v_estoque_atual + p_quantidade_mudanca;

    IF v_estoque_novo >= 0 THEN
        UPDATE Product 
        SET available_inventory = v_estoque_novo
        WHERE id = p_product_id;
    ELSE
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Mudança no estoque não permitida. Valor inferior a 0.';
    END IF;
END //
DELIMITER ;

CALL Proc_Atualizar_Estoque(1, 49.0);
CALL Proc_Atualizar_Estoque(1, -550.0);