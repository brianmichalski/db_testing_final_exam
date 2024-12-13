import { Request, Response } from "express";
import { DataSource, Repository } from "typeorm";
import { EmployeeApi } from "../../api";

// Mock dependencies
export const createMockRepository = <T = any>(): jest.Mocked<Repository<T>> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  create: jest.fn(),
  createQueryBuilder: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
} as any);

export const createMockDataSource = (): jest.Mocked<DataSource> => {
  const mockRepository = createMockRepository();

  return {
    getRepository: jest.fn().mockImplementation(() => mockRepository),
    initialize: jest.fn(),
    destroy: jest.fn(),
    query: jest.fn(),
    manager: {},
  } as unknown as jest.Mocked<DataSource>;
};

const mockExpress = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
} as any;

const mockRequest = (params = {}, body = {}) => ({ params, body } as Request);
const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe("EmployeeApi", () => {
  let mockDataSource: DataSource;
  let employeeApi: EmployeeApi;

  beforeEach(() => {
    mockDataSource = createMockDataSource();
    jest.clearAllMocks();
    employeeApi = new EmployeeApi(mockDataSource, mockExpress);
  });

  describe("getAllEmployees", () => {
    it("should return all employees", async () => {
      const mockEmployees = [
        { id: 1, name: "John", surname: "Doe", role: "Driver" },
        { id: 2, name: "Jane", surname: "Smith", role: "Mechanic" }
      ];
      const repoMock = { find: jest.fn().mockResolvedValue(mockEmployees) };
      (mockDataSource.getRepository as jest.Mock).mockReturnValue(repoMock);

      const req = mockRequest();
      const res = mockResponse();

      await employeeApi.getAllEmployees(req, res);

      expect(repoMock.find).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(mockEmployees);
    });
  });
  describe("getEmployeeById", () => {
    it("should return employee by ID", async () => {
      const mockEmployee = { id: 1, name: "John", surname: "Doe", role: "Driver" };
      const repoMock = { findOne: jest.fn().mockResolvedValue(mockEmployee) };
      (mockDataSource.getRepository as jest.Mock).mockReturnValue(repoMock);

      const req = mockRequest({ id: "1" });
      const res = mockResponse();

      await employeeApi.getEmployeeById(req, res);

      expect(repoMock.findOne).toHaveBeenCalledWith({ where: { id: 1 }, relations: ["repairs"] });
      expect(res.json).toHaveBeenCalledWith(mockEmployee);
    });

    it("should return 400 if ID is invalid", async () => {
      const req = mockRequest({ id: "invalid" });
      const res = mockResponse();

      await employeeApi.getEmployeeById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid employee ID" });
    });

    it("should return 404 if employee is not found", async () => {
      const repoMock = { findOne: jest.fn().mockResolvedValue(null) };
      (mockDataSource.getRepository as jest.Mock).mockReturnValue(repoMock);

      const req = mockRequest({ id: "1" });
      const res = mockResponse();

      await employeeApi.getEmployeeById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Employee not found" });
    });
  });
  describe("createEmployee", () => {
    it("should create a new driver employee", async () => {
      const mockEmployee = { id: 1, name: "John", surname: "Doe", role: "Driver", seniorityLevel: "entry", driverCategory: "B" };
      const repoMock = { save: jest.fn().mockResolvedValue(mockEmployee) };
      (mockDataSource.getRepository as jest.Mock).mockReturnValue(repoMock);

      const req = mockRequest({}, { role: "Driver", name: "John", surname: "Doe", seniorityLevel: "entry", driverCategory: "B" });
      const res = mockResponse();

      await employeeApi.createEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockEmployee);
    });

    it("should return 400 if required fields are missing", async () => {
      const req = mockRequest({}, { name: "John", surname: "Doe" });
      const res = mockResponse();

      await employeeApi.createEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Role, name, surname, and seniorityLevel are required" });
    });

    it("should return 400 if role is invalid", async () => {
      const req = mockRequest({}, { role: "InvalidRole", name: "John", surname: "Doe", seniorityLevel: "entry" });
      const res = mockResponse();

      await employeeApi.createEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Role must be 'Driver' or 'Mechanic'" });
    });

    it("should return 400 if seniorityLevel is invalid", async () => {
      const req = mockRequest({}, { role: "Driver", name: "John", surname: "Doe", seniorityLevel: "junior" });
      const res = mockResponse();

      await employeeApi.createEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "seniorityLevel must be 'entry', 'mid', or 'senior'" });
    });
  });
  describe("updateEmployee", () => {
    it("should update an existing employee", async () => {
      const mockEmployee = { id: 1, name: "John", surname: "Doe", role: "Driver", seniorityLevel: "mid" };
      const repoMock = {
        findOne: jest.fn().mockResolvedValue(mockEmployee),
        save: jest.fn().mockResolvedValue({ ...mockEmployee, name: "Jane" })
      };
      (mockDataSource.getRepository as jest.Mock).mockReturnValue(repoMock);

      const req = mockRequest({ id: "1" }, { name: "Jane" });
      const res = mockResponse();

      await employeeApi.updateEmployee(req, res);

      expect(repoMock.save).toHaveBeenCalledWith({ ...mockEmployee, name: "Jane" });
      expect(res.json).toHaveBeenCalledWith({ ...mockEmployee, name: "Jane" });
    });

    it("should return 404 if employee is not found", async () => {
      const repoMock = { findOne: jest.fn().mockResolvedValue(null) };
      (mockDataSource.getRepository as jest.Mock).mockReturnValue(repoMock);

      const req = mockRequest({ id: "1" }, { name: "Jane" });
      const res = mockResponse();

      await employeeApi.updateEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Employee not found" });
    });
  });

  describe("deleteEmployee", () => {
    it("should delete an existing employee", async () => {
      const mockEmployee = { id: 1, name: "John", surname: "Doe", role: "Driver" };
      const repoMock = {
        findOne: jest.fn().mockResolvedValue(mockEmployee),
        find: jest.fn().mockResolvedValue([]),
        remove: jest.fn().mockResolvedValue(undefined)
      };
      (mockDataSource.getRepository as jest.Mock).mockReturnValue(repoMock);

      const req = mockRequest({ id: "1" });
      const res = mockResponse();

      await employeeApi.deleteEmployee(req, res);

      expect(repoMock.remove).toHaveBeenCalledWith(mockEmployee);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it("should return 400 if employee has associated repairs", async () => {
      const mockEmployee = { id: 1, name: "John", surname: "Doe", role: "Driver" };
      const repoMock = {
        findOne: jest.fn().mockResolvedValue(mockEmployee),
        find: jest.fn().mockResolvedValue([{ id: 1, mechanic: { id: 1 } }])
      };
      (mockDataSource.getRepository as jest.Mock).mockReturnValue(repoMock);

      const req = mockRequest({ id: "1" });
      const res = mockResponse();

      await employeeApi.deleteEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Cannot delete employee with associated repairs" });
    });

    it("should return 404 if employee is not found", async () => {
      const repoMock = { findOne: jest.fn().mockResolvedValue(null) };
      (mockDataSource.getRepository as jest.Mock).mockReturnValue(repoMock);

      const req = mockRequest({ id: "1" });
      const res = mockResponse();

      await employeeApi.deleteEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Employee not found" });
    });
  });

});