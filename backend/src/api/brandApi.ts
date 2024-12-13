import { Express, Request, Response } from "express";
import { DataSource } from "typeorm"; // Adjust path if necessary
import { Brand } from "../entity";
import { Truck } from "../entity/truck";

export class BrandApi {
  #dataSource: DataSource;
  #express: Express;

  constructor(dataSource: DataSource, express: Express) {
    this.#dataSource = dataSource;
    this.#express = express;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Binding the methods to the current class instance
    this.#express.get("/brand", this.getAllBrands.bind(this));
    this.#express.get("/brand/:id", this.getBrandById.bind(this));
    this.#express.post("/brand", this.createBrand.bind(this));
    this.#express.put("/brand/:id", this.updateBrand.bind(this));
    this.#express.delete("/brand/:id", this.deleteBrand.bind(this));
  }

  // Get all brands
  public async getAllBrands(req: Request, res: Response) {
    try {
      const brands = await this.#dataSource.getRepository(Brand).find();
      res.json(brands);
    } catch (error) {
      console.error("Error fetching brands:", error);
      res.status(500).json({ error: "Error fetching brands" });
    }
  }

  // Get brand by ID
  public async getBrandById(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid brand ID" });
    }
    try {
      const brand = await this.#dataSource.getRepository(Brand).findOne({
        where: { id },
        relations: ["trucks"],
      });
      if (!brand) {
        return res.status(404).json({ error: "Brand not found" });
      }
      res.json(brand);
    } catch (error) {
      console.error("Error fetching brand by ID:", error);
      res.status(500).json({ error: "Error fetching brand by ID" });
    }
  }

  // Create a new brand
  public async createBrand(req: Request, res: Response) {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Brand name is required" });
    }
    try {
      const brand = new Brand();
      brand.name = name;
      
      const result = await this.#dataSource.getRepository(Brand).save(brand);
      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating brand:", error);
      res.status(500).json({ error: "Error creating brand" });
    }
  }

  // Update a brand
  public async updateBrand(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid brand ID" });
    }
    const { name } = req.body;
    try {
      const brand = await this.#dataSource.getRepository(Brand).findOne({ where: { id } });
      if (!brand) {
        return res.status(404).json({ error: "Brand not found" });
      }
      brand.name = name || brand.name;
      await this.#dataSource.getRepository(Brand).save(brand);
      res.json(brand);
    } catch (error) {
      console.error("Error updating brand:", error);
      res.status(500).json({ error: "Error updating brand" });
    }
  }

  // Delete a brand
  public async deleteBrand(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid brand ID" });
    }
    try {
      const brand = await this.#dataSource.getRepository(Brand).findOne({ where: { id } });
      if (!brand) {
        return res.status(404).json({ error: "Brand not found" });
      }

      const trucks = await this.#dataSource.getRepository(Truck).find({ where: { brand: { id } } });
      if (trucks.length > 0) {
        return res.status(400).json({ error: "Cannot delete brand with associated trucks" });
      }

      await this.#dataSource.getRepository(Brand).remove(brand);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting brand:", error);
      res.status(500).json({ error: "Error deleting brand" });
    }
  }
}
