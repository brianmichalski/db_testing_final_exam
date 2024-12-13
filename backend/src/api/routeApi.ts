import { Express, Request, Response } from "express";
import { DataSource } from "typeorm"; // Adjust the path as necessary
import { Route } from "../entity/route";
import { Trip } from "../entity/trip";

export class RouteApi {
  #dataSource: DataSource;
  #express: Express;

  constructor(dataSource: DataSource, express: Express) {
    this.#dataSource = dataSource;
    this.#express = express;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.#express.get("/route", this.getAllRoutes.bind(this));
    this.#express.get("/route/:id", this.getRouteById.bind(this));
    this.#express.post("/route", this.createRoute.bind(this));
    this.#express.put("/route/:id", this.updateRoute.bind(this));
    this.#express.delete("/route/:id", this.deleteRoute.bind(this));
  }

  // Get all routes
  private async getAllRoutes(req: Request, res: Response) {
    try {
      const routes = await this.#dataSource.getRepository(Route).find({
        relations: ["trip"], // Include the associated trip details
      });
      res.json(routes);
    } catch (error) {
      console.error("Error fetching routes:", error);
      res.status(500).json({ error: "Error fetching routes" });
    }
  }

  // Get a route by ID
  private async getRouteById(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid route ID" });
    }
    try {
      const route = await this.#dataSource.getRepository(Route).findOne({
        where: { id },
        relations: ["trip"], // Include the associated trip details
      });
      if (!route) {
        return res.status(404).json({ error: "Route not found" });
      }
      res.json(route);
    } catch (error) {
      console.error("Error fetching route by ID:", error);
      res.status(500).json({ error: "Error fetching route by ID" });
    }
  }

  // Create a new route
  private async createRoute(req: Request, res: Response) {
    const { tripId, from, to } = req.body;
    if (!tripId || !from || !to) {
      return res.status(400).json({ error: "tripId, from, and to are required" });
    }
    try {
      const trip = await this.#dataSource.getRepository(Trip).findOne({ where: { id: tripId } });
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      const route = new Route();
      route.trip = trip;
      route.from = from;
      route.to = to;

      await this.#dataSource.getRepository(Route).save(route);
      res.status(201).json(route);
    } catch (error) {
      console.error("Error creating route:", error);
      res.status(500).json({ error: "Error creating route" });
    }
  }

  // Update an existing route
  private async updateRoute(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid route ID" });
    }
    const { tripId, from, to } = req.body;

    try {
      const route = await this.#dataSource.getRepository(Route).findOne({ where: { id } });
      if (!route) {
        return res.status(404).json({ error: "Route not found" });
      }

      if (tripId) {
        const trip = await this.#dataSource.getRepository(Trip).findOne({ where: { id: tripId } });
        if (!trip) {
          return res.status(404).json({ error: "Trip not found" });
        }
        route.trip = trip;
      }

      route.from = from || route.from;
      route.to = to || route.to;

      await this.#dataSource.getRepository(Route).save(route);
      res.json(route);
    } catch (error) {
      console.error("Error updating route:", error);
      res.status(500).json({ error: "Error updating route" });
    }
  }

  // Delete a route
  private async deleteRoute(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid route ID" });
    }

    try {
      const route = await this.#dataSource.getRepository(Route).findOne({ where: { id } });
      if (!route) {
        return res.status(404).json({ error: "Route not found" });
      }

      await this.#dataSource.getRepository(Route).remove(route);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting route:", error);
      res.status(500).json({ error: "Error deleting route" });
    }
  }
}
