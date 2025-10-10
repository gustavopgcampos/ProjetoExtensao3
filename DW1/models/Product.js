export class Product {
  constructor(id, producerId, unit, name, description, stock, createdAt, price) {
    this.id = id;
    this.producerId = producerId;
    this.unit = unit;
    this.name = name;
    this.description = description;
    this.stock = stock;
    this.createdAt = createdAt;
    this.price = price;
  }
}