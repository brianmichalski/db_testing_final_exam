import { Express, Request, Response } from "express";
import { DataSource } from "typeorm";
import { Brand } from "../entity";
import { Truck } from "../entity/truck";

export class TruckApi {
  #dataSource: DataSource;
  #express: Express;

  constructor(dataSource: DataSource, express: Express) {
    this.#dataSource = dataSource;
    this.#express = express;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.#express.get("/truck", this.getAllTrucks.bind(this));
    this.#express.get("/truck/:id", this.getTruckById.bind(this));
    this.#express.post("/truck", this.createTruck.bind(this));
    this.#express.put("/truck/:id", this.updateTruck.bind(this));
    this.#express.delete("/truck/:id", this.deleteTruck.bind(this));
  }

  // Get all trucks
  private async getAllTrucks(req: Request, res: Response) {
    try {
      const trucks = await this.#dataSource.getRepository(Truck).find({
        relations: ["brand", "repairs", "trips"],  // Including related entities
      });
      res.json(trucks);
    } catch (error) {
      console.error("Error fetching trucks:", error);
      res.status(500).json({ error: "Error fetching trucks" });
    }
  }

  // Get truck by ID
  private async getTruckById(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid truck ID" });
    }
    try {
      const truck = await this.#dataSource.getRepository(Truck).findOne({
        where: { id },
        relations: ["brand", "repairs", "trips"], // Including related entities
      });
      if (!truck) {
        return res.status(404).json({ error: "Truck not found" });
      }
      res.json(truck);
    } catch (error) {
      console.error("Error fetching truck by ID:", error);
      res.status(500).json({ error: "Error fetching truck by ID" });
    }
  }

  // Create a new truck
  private async createTruck(req: Request, res: Response) {
    const { brandId, load, capacity, year } = req.body;

    if (!brandId || load === undefined || capacity === undefined || !year) {
      return res.status(400).json({ error: "Brand ID, load, capacity, year, and number of repairs are required" });
    }

    try {
      // Ensure the brand exists
      const brand = await this.#dataSource.getRepository(Brand).findOne({ where: { id: brandId } });
      if (!brand) {
        return res.status(404).json({ error: "Brand not found" });
      }

      // Create and save the new truck
      const truck = new Truck();
      truck.brand = brand;
      truck.load = load;
      truck.capacity = capacity;
      truck.year = year;

      await this.#dataSource.getRepository(Truck).save(truck);
      res.status(201).json(truck);
    } catch (error) {
      console.error("Error creating truck:", error);
      res.status(500).json({ error: "Error creating truck" });
    }
  }

  // Update an existing truck
  private async updateTruck(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid truck ID" });
    }

    const { brandId, load, capacity, year } = req.body;

    try {
      const truck = await this.#dataSource.getRepository(Truck).findOne({ where: { id } });
      if (!truck) {
        return res.status(404).json({ error: "Truck not found" });
      }

      // Update related brand if provided
      if (brandId) {
        const brand = await this.#dataSource.getRepository(Brand).findOne({ where: { id: brandId } });
        if (!brand) {
          return res.status(404).json({ error: "Brand not found" });
        }
        truck.brand = brand;
      }

      // Update other properties
      truck.load = load !== undefined ? load : truck.load;
      truck.capacity = capacity !== undefined ? capacity : truck.capacity;
      truck.year = year !== undefined ? year : truck.year;

      await this.#dataSource.getRepository(Truck).save(truck);
      res.json(truck);
    } catch (error) {
      console.error("Error updating truck:", error);
      res.status(500).json({ error: "Error updating truck" });
    }
  }

  // Delete a truck
  private async deleteTruck(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid truck ID" });
    }

    try {
      const truck = await this.#dataSource.getRepository(Truck).findOne({ where: { id } });
      if (!truck) {
        return res.status(404).json({ error: "Truck not found" });
      }

      await this.#dataSource.getRepository(Truck).remove(truck);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting truck:", error);
      res.status(500).json({ error: "Error deleting truck" });
    }
  }
}
