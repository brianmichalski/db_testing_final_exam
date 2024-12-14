import { Request, Response } from "express";
import { DataSource, Repository } from "typeorm";
import { RepairApi } from "../../api";

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

describe("RepairApi", () => {
  let mockDataSource: DataSource;
  let repairApi: RepairApi;

  beforeEach(() => {
    mockDataSource = createMockDataSource();
    jest.clearAllMocks();
    repairApi = new RepairApi(mockDataSource, mockExpress);
  });

  describe("getAllRepairs", () => {
    it("should return all repairs with related truck and mechanic", async () => {
      const mockRepairs = [
        { id: 1, truck: { id: 1, model: "Truck A" }, mechanic: { id: 1, name: "Mechanic A" }, orderDate: new Date(), daysToRepair: 5 },
        { id: 2, truck: { id: 2, model: "Truck B" }, mechanic: { id: 2, name: "Mechanic B" }, orderDate: new Date(), daysToRepair: 3 }
      ];
      const repoMock = { find: jest.fn().mockResolvedValue(mockRepairs) };
      (mockDataSource.getRepository as jest.Mock).mockReturnValue(repoMock);

      const req = mockRequest();
      const res = mockResponse();

      await repairApi.getAllRepairs(req, res);

      expect(repoMock.find).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(mockRepairs);
    });

    describe("getRepairById", () => {
      it("should return repair by ID", async () => {
        const mockRepair = { id: 1, truck: { id: 1, model: "Truck A" }, mechanic: { id: 1, name: "Mechanic A" }, orderDate: new Date(), daysToRepair: 5 };
        const repoMock = { findOne: jest.fn().mockResolvedValue(mockRepair) };
        (mockDataSource.getRepository as jest.Mock).mockReturnValue(repoMock);

        const req = mockRequest({ id: "1" });
        const res = mockResponse();

        await repairApi.getRepairById(req, res);

        expect(repoMock.findOne).toHaveBeenCalledWith({ where: { id: 1 }, relations: ["truck", "mechanic"] });
        expect(res.json).toHaveBeenCalledWith(mockRepair);
      });

      it("should return 400 if ID is invalid", async () => {
        const req = mockRequest({ id: "invalid" });
        const res = mockResponse();

        await repairApi.getRepairById(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Invalid repair ID" });
      });

      it("should return 404 if repair is not found", async () => {
        const repoMock = { findOne: jest.fn().mockResolvedValue(null) };
        (mockDataSource.getRepository as jest.Mock).mockReturnValue(repoMock);

        const req = mockRequest({ id: "1" });
        const res = mockResponse();

        await repairApi.getRepairById(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: "Repair not found" });
      });
    });

    describe("createRepair", () => {
      it("should create a new repair", async () => {
        const mockRepair = { id: 1, truck: { id: 1, model: "Truck A" }, mechanic: { id: 1, name: "Mechanic A" }, orderDate: new Date(), daysToRepair: 5 };

        // Mock the repository for the truck and mechanic lookups
        const truckMock = { id: 1, model: "Truck A" };
        const mechanicMock = { id: 1, name: "Mechanic A" };

        const repoMock = {
          findOne: jest.fn()
            .mockResolvedValueOnce(truckMock)  // Find truck by ID
            .mockResolvedValueOnce(mechanicMock),  // Find mechanic by ID
          update: jest.fn().mockResolvedValue(undefined), // Mock update method for Truck repository
          save: jest.fn().mockResolvedValue(mockRepair)
        };

        (mockDataSource.getRepository as jest.Mock).mockReturnValue(repoMock);

        const req = mockRequest({}, { truckId: 1, mechanicId: 1, orderDate: "2024-01-01", daysToRepair: 5 });
        const res = mockResponse();

        await repairApi.createRepair(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(mockRepair);
      });

      it("should return 400 if required fields are missing", async () => {
        const req = mockRequest({}, { truckId: 1, mechanicId: 1 });
        const res = mockResponse();

        await repairApi.createRepair(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "truckId, mechanicId, orderDate, and daysToRepair are required" });
      });

      it("should return 404 if truck or mechanic is not found", async () => {
        const repoMock = { findOne: jest.fn().mockResolvedValue(null) };
        (mockDataSource.getRepository as jest.Mock).mockReturnValue(repoMock);

        const req = mockRequest({}, { truckId: 999, mechanicId: 999, orderDate: "2024-01-01", daysToRepair: 5 });
        const res = mockResponse();

        await repairApi.createRepair(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: "Truck or Mechanic not found" });
      });
    });

    describe("updateRepair", () => {
      it("should update an existing repair", async () => {
        const mockRepair = { id: 1, truck: { id: 1, model: "Truck A" }, mechanic: { id: 1, name: "Mechanic A" }, orderDate: new Date(), daysToRepair: 5 };
        const repoMock = {
          findOne: jest.fn().mockResolvedValue(mockRepair),
          save: jest.fn().mockResolvedValue({ ...mockRepair, daysToRepair: 7 })
        };
        (mockDataSource.getRepository as jest.Mock).mockReturnValue(repoMock);

        const req = mockRequest({ id: "1" }, { daysToRepair: 7 });
        const res = mockResponse();

        await repairApi.updateRepair(req, res);

        expect(repoMock.save).toHaveBeenCalledWith({ ...mockRepair, daysToRepair: 7 });
        expect(res.json).toHaveBeenCalledWith({ ...mockRepair, daysToRepair: 7 });
      });

      it("should return 404 if repair is not found", async () => {
        const repoMock = { findOne: jest.fn().mockResolvedValue(null) };
        (mockDataSource.getRepository as jest.Mock).mockReturnValue(repoMock);

        const req = mockRequest({ id: "1" }, { daysToRepair: 7 });
        const res = mockResponse();

        await repairApi.updateRepair(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: "Repair not found" });
      });
    });

    describe("deleteRepair", () => {
      it("should delete an existing repair", async () => {
        const mockRepair = { id: 1, truck: { id: 1, model: "Truck A" }, mechanic: { id: 1, name: "Mechanic A" }, orderDate: new Date(), daysToRepair: 5 };
        const repoMock = {
          findOne: jest.fn().mockResolvedValue(mockRepair),
          update: jest.fn().mockResolvedValue(undefined),
          remove: jest.fn().mockResolvedValue(undefined)
        };
        (mockDataSource.getRepository as jest.Mock).mockReturnValue(repoMock);

        const req = mockRequest({ id: "1" });
        const res = mockResponse();

        await repairApi.deleteRepair(req, res);

        expect(repoMock.remove).toHaveBeenCalledWith(mockRepair);
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.send).toHaveBeenCalled();
      });

      it("should return 400 if repair is not found", async () => {
        const repoMock = { findOne: jest.fn().mockResolvedValue(null) };
        (mockDataSource.getRepository as jest.Mock).mockReturnValue(repoMock);

        const req = mockRequest({ id: "1" });
        const res = mockResponse();

        await repairApi.deleteRepair(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: "Repair not found" });
      });
    });
  });

});
