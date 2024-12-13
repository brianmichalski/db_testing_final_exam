import { Express, Request, Response } from "express";
import { DataSource } from "typeorm";
import { Customer } from "../entity/customer";
import { Shipment } from "../entity/shipment";
import { Trip } from "../entity/trip";

export class ShipmentApi {
  #dataSource: DataSource;
  #express: Express;

  constructor(dataSource: DataSource, express: Express) {
    this.#dataSource = dataSource;
    this.#express = express;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.#express.get("/shipment", this.getAllShipments.bind(this));
    this.#express.get("/shipment/:id", this.getShipmentById.bind(this));
    this.#express.post("/shipment", this.createShipment.bind(this));
    this.#express.put("/shipment/:id", this.updateShipment.bind(this));
    this.#express.delete("/shipment/:id", this.deleteShipment.bind(this));
  }

  // Get all shipments
  private async getAllShipments(req: Request, res: Response) {
    try {
      const shipments = await this.#dataSource.getRepository(Shipment).find({
        relations: ["trip", "customer"], // Include the related trip and customer entities
      });
      res.json(shipments);
    } catch (error) {
      console.error("Error fetching shipments:", error);
      res.status(500).json({ error: "Error fetching shipments" });
    }
  }

  // Get shipment by ID
  private async getShipmentById(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid shipment ID" });
    }
    try {
      const shipment = await this.#dataSource.getRepository(Shipment).findOne({
        where: { id },
        relations: ["trip", "customer"], // Include the related trip and customer entities
      });
      if (!shipment) {
        return res.status(404).json({ error: "Shipment not found" });
      }
      res.json(shipment);
    } catch (error) {
      console.error("Error fetching shipment by ID:", error);
      res.status(500).json({ error: "Error fetching shipment by ID" });
    }
  }

  // Create a new shipment
  private async createShipment(req: Request, res: Response) {
    const { tripId, customerId, weight, value, origin, destination } = req.body;

    if (!tripId || !customerId || weight === undefined || value === undefined || !origin || !destination) {
      return res.status(400).json({ error: "All fields are required" });
    }

    try {
      // Ensure trip and customer exist
      const trip = await this.#dataSource.getRepository(Trip).findOne({ where: { id: tripId } });
      const customer = await this.#dataSource.getRepository(Customer).findOne({ where: { id: customerId } });

      if (!trip || !customer) {
        return res.status(404).json({ error: "Trip or Customer not found" });
      }

      // Create and save shipment
      const shipment = new Shipment();
      shipment.trip = trip;
      shipment.customer = customer;
      shipment.weight = weight;
      shipment.value = value;
      shipment.origin = origin;
      shipment.destination = destination;

      await this.#dataSource.getRepository(Shipment).save(shipment);
      res.status(201).json(shipment);
    } catch (error) {
      console.error("Error creating shipment:", error);
      res.status(500).json({ error: "Error creating shipment" });
    }
  }

  // Update an existing shipment
  private async updateShipment(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid shipment ID" });
    }

    const { tripId, customerId, weight, value, origin, destination } = req.body;

    try {
      const shipment = await this.#dataSource.getRepository(Shipment).findOne({ where: { id } });
      if (!shipment) {
        return res.status(404).json({ error: "Shipment not found" });
      }

      // Update related entities if provided
      if (tripId) {
        const trip = await this.#dataSource.getRepository(Trip).findOne({ where: { id: tripId } });
        if (!trip) {
          return res.status(404).json({ error: "Trip not found" });
        }
        shipment.trip = trip;
      }

      if (customerId) {
        const customer = await this.#dataSource.getRepository(Customer).findOne({ where: { id: customerId } });
        if (!customer) {
          return res.status(404).json({ error: "Customer not found" });
        }
        shipment.customer = customer;
      }

      // Update the other fields
      shipment.weight = weight !== undefined ? weight : shipment.weight;
      shipment.value = value !== undefined ? value : shipment.value;
      shipment.origin = origin || shipment.origin;
      shipment.destination = destination || shipment.destination;

      await this.#dataSource.getRepository(Shipment).save(shipment);
      res.json(shipment);
    } catch (error) {
      console.error("Error updating shipment:", error);
      res.status(500).json({ error: "Error updating shipment" });
    }
  }

  // Delete a shipment
  private async deleteShipment(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid shipment ID" });
    }

    try {
      const shipment = await this.#dataSource.getRepository(Shipment).findOne({ where: { id } });
      if (!shipment) {
        return res.status(404).json({ error: "Shipment not found" });
      }

      await this.#dataSource.getRepository(Shipment).remove(shipment);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting shipment:", error);
      res.status(500).json({ error: "Error deleting shipment" });
    }
  }
}
