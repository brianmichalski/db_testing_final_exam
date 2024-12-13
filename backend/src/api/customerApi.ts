import { Express, Request, Response } from "express";
import { DataSource } from "typeorm";
import { Customer } from "../entity/customer";
import { Shipment } from "../entity/shipment";

export class CustomerApi {
  #dataSource: DataSource;
  #express: Express;

  constructor(dataSource: DataSource, express: Express) {
    this.#dataSource = dataSource;
    this.#express = express;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.#express.get("/customer", this.getAllCustomers.bind(this));
    this.#express.get("/customer/:id", this.getCustomerById.bind(this));
    this.#express.post("/customer", this.createCustomer.bind(this));
    this.#express.put("/customer/:id", this.updateCustomer.bind(this));
    this.#express.delete("/customer/:id", this.deleteCustomer.bind(this));
  }

  // Get all customers
  private async getAllCustomers(req: Request, res: Response) {
    try {
      const customers = await this.#dataSource.getRepository(Customer).find();
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ error: "Error fetching customers" });
    }
  }

  // Get customer by ID
  private async getCustomerById(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid customer ID" });
    }
    try {
      const customer = await this.#dataSource.getRepository(Customer).findOne({
        where: { id },
        relations: ["shipments"],
      });
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer by ID:", error);
      res.status(500).json({ error: "Error fetching customer by ID" });
    }
  }

  // Create a new customer
  private async createCustomer(req: Request, res: Response) {
    const { name, address, phone1, phone2 } = req.body;
    if (!name || !address || !phone1) {
      return res.status(400).json({ error: "Customer name, address, and phone1 are required" });
    }
    try {
      const customer = new Customer();
      customer.name = name;
      customer.address = address;
      customer.phone1 = phone1;
      customer.phone2 = phone2 || undefined; // phone2 is optional

      await this.#dataSource.getRepository(Customer).save(customer);
      res.status(201).json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ error: "Error creating customer" });
    }
  }

  // Update an existing customer
  private async updateCustomer(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid customer ID" });
    }
    const { name, address, phone1, phone2 } = req.body;
    try {
      const customer = await this.#dataSource.getRepository(Customer).findOne({ where: { id } });
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      customer.name = name || customer.name;
      customer.address = address || customer.address;
      customer.phone1 = phone1 || customer.phone1;
      customer.phone2 = phone2 || customer.phone2;

      await this.#dataSource.getRepository(Customer).save(customer);
      res.json(customer);
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).json({ error: "Error updating customer" });
    }
  }

  // Delete a customer
  private async deleteCustomer(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid customer ID" });
    }
    try {
      const customer = await this.#dataSource.getRepository(Customer).findOne({ where: { id } });
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      // Check if there are any shipments associated with the customer
      const shipments = await this.#dataSource.getRepository(Shipment).find({ where: { customer: { id } } });
      if (shipments.length > 0) {
        return res.status(400).json({ error: "Cannot delete customer with associated shipments" });
      }

      await this.#dataSource.getRepository(Customer).remove(customer);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ error: "Error deleting customer" });
    }
  }
}
