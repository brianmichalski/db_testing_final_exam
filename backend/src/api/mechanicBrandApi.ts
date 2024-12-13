import { Request, Response } from "express";
import { DataSource } from "typeorm";
import { Brand, Mechanic } from "../entity";
import { MechanicBrand } from "../entity/mechanic-brand";
export class MechanicBrandApi {
  #dataSource: DataSource;
  #express: any;

  constructor(dataSource: DataSource, express: any) {
    this.#dataSource = dataSource;
    this.#express = express;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // GET all mechanic-brands for a specific employee
    this.#express.get("/employee/:id/mechanic-brand", this.getMechanicBrandsByEmployee.bind(this));

    // POST a new mechanic-brand association for a specific employee
    this.#express.post("/employee/:id/mechanic-brand", this.createMechanicBrand.bind(this));

    // DELETE a specific mechanic-brand association for a specific employee and brand
    this.#express.delete("/employee/:id/mechanic-brand/:brandId", this.deleteMechanicBrand.bind(this));
  }

  // GET all mechanic-brands for a specific employee
  private async getMechanicBrandsByEmployee(req: Request, res: Response) {
    const employeeId = parseInt(req.params.id);

    if (isNaN(employeeId)) {
      return res.status(400).json({ error: "Invalid employee ID" });
    }

    try {
      const employee = await this.#dataSource.getRepository(Mechanic).findOne({
        where: { id: employeeId },
        relations: ["repairs", "brands", "brands.brand"],
      });

      if (!employee) {
        return res.status(404).json({ error: "Mechanic not found" });
      }

      // Return the mechanic-brand associations
      res.json(employee.brands);
    } catch (error) {
      console.error("Error fetching mechanic brands:", error);
      res.status(500).json({ error: "Error fetching mechanic brands" });
    }
  }

  // POST a new mechanic-brand association for a specific employee
  private async createMechanicBrand(req: Request, res: Response) {
    const employeeId = parseInt(req.params.id);
    const { brandId } = req.body;

    if (isNaN(employeeId)) {
      return res.status(400).json({ error: "Invalid employee ID" });
    }

    if (!brandId) {
      return res.status(400).json({ error: "Brand ID is required" });
    }

    try {
      // Check if the employee exists
      const mechanic = await this.#dataSource.getRepository(Mechanic).findOne({ where: { id: employeeId } });
      if (!mechanic) {
        return res.status(404).json({ error: "Mechanic not found" });
      }

      // Check if the brand exists
      const brand = await this.#dataSource.getRepository(Brand).findOne({ where: { id: brandId } });
      if (!brand) {
        return res.status(404).json({ error: "Brand not found" });
      }

      // Create a new MechanicBrand association
      const mechanicBrand = new MechanicBrand();
      mechanicBrand.mechanic = mechanic;
      mechanicBrand.brand = brand;

      // Save the new mechanic-brand association
      await this.#dataSource.getRepository(MechanicBrand).save(mechanicBrand);

      // Return the created mechanic-brand association
      res.status(201).json(mechanicBrand);
    } catch (error) {
      console.error("Error creating mechanic-brand:", error);
      res.status(500).json({ error: "Error creating mechanic-brand" });
    }
  }

  // DELETE a specific mechanic-brand association for a specific employee and brand
  private async deleteMechanicBrand(req: Request, res: Response) {
    const employeeId = parseInt(req.params.id);
    const brandId = parseInt(req.params.brandId);

    if (isNaN(employeeId) || isNaN(brandId)) {
      return res.status(400).json({ error: "Invalid employee or brand ID" });
    }

    try {
      // Find the MechanicBrand association
      const mechanicBrand = await this.#dataSource.getRepository(MechanicBrand).findOne({
        where: { employeeId, brandId },
      });

      if (!mechanicBrand) {
        return res.status(404).json({ error: "Mechanic-Brand association not found" });
      }

      // Remove the association
      await this.#dataSource.getRepository(MechanicBrand).remove(mechanicBrand);

      // Respond with a success message
      res.status(204).send(); // No content
    } catch (error) {
      console.error("Error deleting mechanic-brand:", error);
      res.status(500).json({ error: "Error deleting mechanic-brand" });
    }
  }
}
