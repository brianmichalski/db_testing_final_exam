import { Express, Request, Response } from "express";
import { DataSource } from "typeorm";
import { Mechanic } from "../entity";
import { Repair } from "../entity/repair";
import { Truck } from "../entity/truck";

export class RepairApi {
  #dataSource: DataSource;
  #express: Express;

  constructor(dataSource: DataSource, express: Express) {
    this.#dataSource = dataSource;
    this.#express = express;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.#express.get("/repair", this.getAllRepairs.bind(this));
    this.#express.get("/repair/:id", this.getRepairById.bind(this));
    this.#express.post("/repair", this.createRepair.bind(this));
    this.#express.put("/repair/:id", this.updateRepair.bind(this));
    this.#express.delete("/repair/:id", this.deleteRepair.bind(this));
  }

  // Get all repairs
  private async getAllRepairs(req: Request, res: Response) {
    try {
      const repairs = await this.#dataSource.getRepository(Repair).find({
        relations: ["truck", "mechanic"], // Include related truck and mechanic details
      });
      res.json(repairs);
    } catch (error) {
      console.error("Error fetching repairs:", error);
      res.status(500).json({ error: "Error fetching repairs" });
    }
  }

  // Get a repair by ID
  private async getRepairById(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid repair ID" });
    }
    try {
      const repair = await this.#dataSource.getRepository(Repair).findOne({
        where: { id },
        relations: ["truck", "mechanic"], // Include related truck and mechanic details
      });
      if (!repair) {
        return res.status(404).json({ error: "Repair not found" });
      }
      res.json(repair);
    } catch (error) {
      console.error("Error fetching repair by ID:", error);
      res.status(500).json({ error: "Error fetching repair by ID" });
    }
  }

  // Create a new repair
  private async createRepair(req: Request, res: Response) {
    const { truckId, mechanicId, orderDate, daysToRepair } = req.body;

    if (!truckId || !mechanicId || !orderDate || !daysToRepair) {
      return res.status(400).json({ error: "truckId, mechanicId, orderDate, and daysToRepair are required" });
    }

    try {
      const truck = await this.#dataSource.getRepository(Truck).findOne({ where: { id: truckId } });
      const mechanic = await this.#dataSource.getRepository(Mechanic).findOne({ where: { id: mechanicId } });

      if (!truck || !mechanic) {
        return res.status(404).json({ error: "Truck or Mechanic not found" });
      }

      const repair = new Repair();
      repair.truck = truck;
      repair.mechanic = mechanic;
      repair.orderDate = new Date(orderDate);  // Convert string to Date
      repair.daysToRepair = daysToRepair;

      // Update the number of repairs of the truck
      await this.#dataSource.getTreeRepository(Truck).update(
        repair.truck.id,
        { numberOfRepairs: ++repair.truck.numberOfRepairs }
      );

      await this.#dataSource.getRepository(Repair).save(repair);
      res.status(201).json(repair);
    } catch (error) {
      console.error("Error creating repair:", error);
      res.status(500).json({ error: "Error creating repair" });
    }
  }

  // Update an existing repair
  private async updateRepair(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid repair ID" });
    }

    const { mechanicId, orderDate, daysToRepair } = req.body;

    try {
      const repair = await this.#dataSource.getRepository(Repair).findOne({ where: { id } });
      if (!repair) {
        return res.status(404).json({ error: "Repair not found" });
      }

      if (mechanicId) {
        const mechanic = await this.#dataSource.getRepository(Mechanic).findOne({ where: { id: mechanicId } });
        if (!mechanic) {
          return res.status(404).json({ error: "Mechanic not found" });
        }
        repair.mechanic = mechanic;
      }

      if (orderDate) {
        repair.orderDate = new Date(orderDate);  // Convert string to Date
      }

      if (daysToRepair) {
        repair.daysToRepair = daysToRepair;
      }

      await this.#dataSource.getRepository(Repair).save(repair);

      res.json(repair);
    } catch (error) {
      console.error("Error updating repair:", error);
      res.status(500).json({ error: "Error updating repair" });
    }
  }

  // Delete a repair
  private async deleteRepair(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid repair ID" });
    }

    try {
      const repair = await this.#dataSource.getRepository(Repair).findOne({ where: { id } });
      if (!repair) {
        return res.status(404).json({ error: "Repair not found" });
      }

      await this.#dataSource.getRepository(Repair).remove(repair);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting repair:", error);
      res.status(500).json({ error: "Error deleting repair" });
    }
  }
}
