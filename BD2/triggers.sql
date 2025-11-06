-- (1) Integridade
-- Não será permitido excluir um produto enquanto ele ainda tiver estoque:
DELIMITER //
CREATE TRIGGER Trg_Prevent_Product_Deletion
BEFORE DELETE ON Product
FOR EACH ROW
BEGIN
    IF OLD.available_inventory > 0 THEN
        SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Não é permitido excluir um produto que ainda possui estoque disponível.';
    END IF;
END //
DELIMITER ;

SELECT name, available_inventory FROM Product WHERE id = 1;
DELETE FROM Product WHERE id = 1;

-- (2) Auditoria
-- Armazena na tabela de log quando o preço de um produto é atualizado:
DELIMITER //
CREATE TRIGGER Trg_Audit_Product_Price_Change
AFTER UPDATE ON Product
FOR EACH ROW
BEGIN
    IF OLD.unit_price <> NEW.unit_price THEN
        INSERT INTO Product_Price_Log 
            (product_id, old_price, new_price, changed_at)
        VALUES
            (NEW.id, OLD.unit_price, NEW.unit_price, NOW());
    END IF;
END //
DELIMITER ;

SELECT name, unit_price FROM Product WHERE id = 1;
UPDATE Product SET unit_price = 5.20 WHERE id = 1;
SELECT * FROM Product_Price_Log;