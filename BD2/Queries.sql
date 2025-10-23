DROP DATABASE IF EXISTS agrolink;
CREATE DATABASE agrolink;
USE agrolink;

CREATE TABLE Users (
	id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
	email VARCHAR(150) NOT NULL UNIQUE,
    phone CHAR(11) NOT NULL,
    zip_code CHAR(8) NOT NULL,
    city VARCHAR(200) NOT NULL,
    state VARCHAR(200) NOT NULL,
	name VARCHAR(250) NOT NULL	
);

CREATE TABLE Retailer (
	id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    store_name VARCHAR(250) NOT NULL,
    user_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(id)
);

CREATE TABLE Producer (
	id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    farm_name VARCHAR(250) NOT NULL,
    user_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(id)
);

CREATE TABLE Favoritos (
    producer_id INT NOT NULL PRIMARY KEY,
	FOREIGN KEY (producer_id) REFERENCES Producer (id),
    retailer_id INT NOT NULL,
	FOREIGN KEY (retailer_id) REFERENCES Retailer (id)
);

CREATE TABLE Produtos (
	id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    unit_measure VARCHAR(10) NOT NULL,
    description VARCHAR(200) NOT NULL,
    available_inventory DOUBLE NOT NULL,
   
    producer_id INT NOT NULL,
    FOREIGN KEY (producer_id) REFERENCES Producer(id)
);

CREATE TABLE Contato (
	id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(150) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    message VARCHAR(1000) NOT NULL
);