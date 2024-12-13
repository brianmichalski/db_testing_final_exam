import { Express, Request, Response } from "express";
import { DataSource } from "typeorm";
import { Driver } from "../entity";
import { Trip } from "../entity/trip";
import { Truck } from "../entity/truck";

export class TripApi {
  #dataSource: DataSource;
  #express: Express;

  constructor(dataSource: DataSource, express: Express) {
    this.#dataSource = dataSource;
    this.#express = express;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.#express.get("/trip", this.getAllTrips.bind(this));
    this.#express.get("/trip/:id", this.getTripById.bind(this));
    this.#express.post("/trip", this.createTrip.bind(this));
    this.#express.put("/trip/:id", this.updateTrip.bind(this));
    this.#express.delete("/trip/:id", this.deleteTrip.bind(this));
  }

  // Get all trips
  private async getAllTrips(req: Request, res: Response) {
    try {
      const trips = await this.#dataSource.getRepository(Trip).find({
        relations: ["truck", "driver1", "driver2", "shipments", "routes"], // Including related entities
      });
      res.json(trips);
    } catch (error) {
      console.error("Error fetching trips:", error);
      res.status(500).json({ error: "Error fetching trips" });
    }
  }

  // Get trip by ID
  private async getTripById(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid trip ID" });
    }
    try {
      const trip = await this.#dataSource.getRepository(Trip).findOne({
        where: { id },
        relations: ["truck", "driver1", "driver2", "shipments", "routes"],
      });
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }
      res.json(trip);
    } catch (error) {
      console.error("Error fetching trip by ID:", error);
      res.status(500).json({ error: "Error fetching trip by ID" });
    }
  }

  // Create a new trip
  private async createTrip(req: Request, res: Response) {
    const { truckId, driver1Id, driver2Id, start, end } = req.body;

    if (!truckId || !driver1Id || !start) {
      return res.status(400).json({ error: "Truck ID, Driver 1 ID, and start date are required" });
    }

    try {
      // Ensure the truck and drivers exist
      const truck = await this.#dataSource.getRepository(Truck).findOne({ where: { id: truckId } });
      const driver1 = await this.#dataSource.getRepository(Driver).findOne({ where: { id: driver1Id } });
      const driver2 = driver2Id ? await this.#dataSource.getRepository(Driver).findOne({ where: { id: driver2Id } }) : null;

      if (!truck || !driver1) {
        return res.status(404).json({ error: "Truck or Driver1 not found" });
      }

      if (driver2Id && !driver2) {
        return res.status(404).json({ error: "Driver2 not found" });
      }

      // Create and save the new trip
      const trip = new Trip();
      trip.truck = truck;
      trip.driver1 = driver1;
      trip.driver2 = driver2 || undefined;  // Allow driver2 to be optional
      trip.start = new Date(start);
      trip.end = end ? new Date(end) : undefined;

      await this.#dataSource.getRepository(Trip).save(trip);
      res.status(201).json(trip);
    } catch (error) {
      console.error("Error creating trip:", error);
      res.status(500).json({ error: "Error creating trip" });
    }
  }

  // Update an existing trip
  private async updateTrip(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid trip ID" });
    }

    const { truckId, driver1Id, driver2Id, start, end } = req.body;

    try {
      const trip = await this.#dataSource.getRepository(Trip).findOne({ where: { id } });
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      // Update related entities if provided
      if (truckId) {
        const truck = await this.#dataSource.getRepository(Truck).findOne({ where: { id: truckId } });
        if (!truck) {
          return res.status(404).json({ error: "Truck not found" });
        }
        trip.truck = truck;
      }

      if (driver1Id) {
        const driver1 = await this.#dataSource.getRepository(Driver).findOne({ where: { id: driver1Id } });
        if (!driver1) {
          return res.status(404).json({ error: "Driver 1 not found" });
        }
        trip.driver1 = driver1;
      }

      if (driver2Id) {
        const driver2 = await this.#dataSource.getRepository(Driver).findOne({ where: { id: driver2Id } });
        if (!driver2) {
          return res.status(404).json({ error: "Driver 2 not found" });
        }
        trip.driver2 = driver2;
      }

      trip.start = start ? new Date(start) : trip.start;
      trip.end = end ? new Date(end) : trip.end;

      await this.#dataSource.getRepository(Trip).save(trip);
      res.json(trip);
    } catch (error) {
      console.error("Error updating trip:", error);
      res.status(500).json({ error: "Error updating trip" });
    }
  }

  // Delete a trip
  private async deleteTrip(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid trip ID" });
    }

    try {
      const trip = await this.#dataSource.getRepository(Trip).findOne({ where: { id } });
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      await this.#dataSource.getRepository(Trip).remove(trip);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting trip:", error);
      res.status(500).json({ error: "Error deleting trip" });
    }
  }
}
