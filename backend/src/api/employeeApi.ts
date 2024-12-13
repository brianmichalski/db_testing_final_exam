import { Express, Request, Response } from "express";
import { DataSource } from "typeorm";
import { Driver, Mechanic } from "../entity";
import { Employee } from "../entity/employee";
import { Repair } from "../entity/repair";

export class EmployeeApi {
  #dataSource: DataSource;
  #express: Express;

  constructor(dataSource: DataSource, express: Express) {
    this.#dataSource = dataSource;
    this.#express = express;
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.#express.get("/employee", this.getAllEmployees.bind(this));
    this.#express.get("/employee/:id", this.getEmployeeById.bind(this));
    this.#express.post("/employee", this.createEmployee.bind(this));
    this.#express.put("/employee/:id", this.updateEmployee.bind(this));
    this.#express.delete("/employee/:id", this.deleteEmployee.bind(this));
  }

  // Get all employees
  public async getAllEmployees(req: Request, res: Response) {
    try {
      const employees = await this.#dataSource.getRepository(Employee).find();
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ error: "Error fetching employees" });
    }
  }

  // Get employee by ID
  public async getEmployeeById(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid employee ID" });
    }
    try {
      const employee = await this.#dataSource.getRepository(Employee).findOne({
        where: { id },
        relations: ["repairs"], // Include repairs if needed
      });
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      console.error("Error fetching employee by ID:", error);
      res.status(500).json({ error: "Error fetching employee by ID" });
    }
  }

  // Create a new employee
  public async createEmployee(req: Request, res: Response) {
    let { role, name, surname, seniorityLevel, driverCategory } = req.body;
    if (!role || !name || !surname || !seniorityLevel) {
      return res.status(400).json({ error: "Role, name, surname, and seniorityLevel are required" });
    }
    const rolesAccepted = ['Driver', 'Mechanic'];
    if (!rolesAccepted.includes(role)) {
      return res.status(400).json({ error: "Role must be 'Driver' or 'Mechanic'" });
    }

    seniorityLevel = seniorityLevel.toLowerCase();
    const senioritiesAccepted = ['entry', 'mid', 'senior'];
    if (!senioritiesAccepted.includes(seniorityLevel)) {
      return res.status(400).json({ error: "seniorityLevel must be 'entry', 'mid', or 'senior'" });
    }
    try {
      const employee = new Employee();
      employee.role = role;
      employee.name = name;
      employee.surname = surname;
      employee.seniorityLevel = seniorityLevel;

      let result: Employee;
      if (employee.role === 'Driver') {
        (employee as Driver).driverCategory = driverCategory || undefined;
        result = await this.#dataSource.getRepository(Driver).save(employee);
      } else {
        result = await this.#dataSource.getRepository(Mechanic).save(employee);
      }
      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating employee:", error);
      res.status(500).json({ error: "Error creating employee" });
    }
  }

  // Update an existing employee
  public async updateEmployee(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid employee ID" });
    }
    const { role, name, surname, seniorityLevel, driverCategory } = req.body;
    try {
      const employee = await this.#dataSource.getRepository(Employee).findOne({ where: { id } });
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      employee.role = role || employee.role;
      employee.name = name || employee.name;
      employee.surname = surname || employee.surname;
      employee.seniorityLevel = seniorityLevel || employee.seniorityLevel;

      let result: Employee;
      if (employee.role === 'Driver') {
        (employee as Driver).driverCategory = driverCategory || (employee as Driver).driverCategory;
        result = await this.#dataSource.getRepository(Driver).save(employee);
      } else {
        result = await this.#dataSource.getRepository(Mechanic).save(employee);
      }
      res.json(result);
    } catch (error) {
      console.error("Error updating employee:", error);
      res.status(500).json({ error: "Error updating employee" });
    }
  }

  // Delete an employee
  public async deleteEmployee(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid employee ID" });
    }
    try {
      const employee = await this.#dataSource.getRepository(Employee).findOne({ where: { id } });
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      // Check if the employee has any associated repairs
      const repairs = await this.#dataSource.getRepository(Repair).find({ where: { mechanic: { id } } });
      if (repairs.length > 0) {
        return res.status(400).json({ error: "Cannot delete employee with associated repairs" });
      }

      await this.#dataSource.getRepository(Employee).remove(employee);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ error: "Error deleting employee" });
    }
  }
}
