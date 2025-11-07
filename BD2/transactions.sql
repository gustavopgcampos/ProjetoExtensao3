-- (1) Transaction para criar um varejista.
DELIMITER //
CREATE PROCEDURE Proc_Create_Retailer()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Erro detectado! Transação revertida.' AS Resultado;
    END;

    START TRANSACTION;

    INSERT INTO User (email, phone, zip_code, city, state, name)
    VALUES ('usuario_teste@example.com', '11988887777', '12345678', 'São Paulo', 'SP', 'Usuário Transaction');

    INSERT INTO Retailer (store_name, user_id)
    VALUES ('Loja Inválida', 999999); -- Simulando erro informando user_id que não existe

    COMMIT;
    SELECT 'Transação concluída com sucesso.' AS Resultado;
END //

DELIMITER ;

CALL Proc_Create_Retailer();
SELECT * FROM User WHERE email = 'usuario_teste@example.com'; -- Usuário não criado
