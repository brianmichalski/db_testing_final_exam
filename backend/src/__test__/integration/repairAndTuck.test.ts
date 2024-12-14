import { Request, Response } from "express";
import { DataSource, Repository } from "typeorm";
import { RepairApi } from "../../api";

// Mock repositories
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

// Mock data source
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

// Mock express methods
const mockExpress = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
} as any;

// Mock request and response
const mockRequest = (params = {}, body = {}) => ({ params, body } as Request);
const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe("RepairApi - Truck.numberOfRepairs", () => {
  let mockDataSource: DataSource;
  let repairApi: RepairApi;

  let mockTruck;
  const mockMechanic = { id: 1, name: "Mechanic A" };

  beforeEach(() => {
    mockTruck = { id: 1, model: "Truck A", numberOfRepairs: 2 };
    mockDataSource = createMockDataSource();
    jest.clearAllMocks();
    repairApi = new RepairApi(mockDataSource, mockExpress);
  });

  describe("createRepair", () => {
    it("should increment truck.numberOfRepairs by 1 when a repair is created", async () => {
      const repoMock = {
        findOne: jest.fn()
          .mockResolvedValueOnce(mockTruck)   // Find truck by ID
          .mockResolvedValueOnce(mockMechanic),  // Find mechanic by ID
        update: jest.fn().mockResolvedValue(undefined), // Mock update method for Truck repository
        save: jest.fn().mockResolvedValue({ id: 1, truck: mockTruck, mechanic: mockMechanic, orderDate: new Date(), daysToRepair: 5 })
      };
      (mockDataSource.getRepository as jest.Mock).mockReturnValue(repoMock);

      const req = mockRequest({}, { truckId: 1, mechanicId: 1, orderDate: "2024-01-01", daysToRepair: 5 });
      const res = mockResponse();

      await repairApi.createRepair(req, res);

      // Ensure truck's numberOfRepairs is incremented by 1
      expect(repoMock.update).toHaveBeenCalledWith(1, { numberOfRepairs: 3 });  // Initial numberOfRepairs was 2, should be 3 now
      expect(res.status).toHaveBeenCalledWith(201);
    });

  });

  describe("deleteRepair", () => {
    it("should decrement truck.numberOfRepairs by 1 when a repair is deleted", async () => {
      const mockRepair = { id: 1, truck: mockTruck, mechanic: mockMechanic, orderDate: new Date(), daysToRepair: 5 };

      const repoMock = {
        findOne: jest.fn().mockResolvedValue(mockRepair), // Return repair to delete
        remove: jest.fn().mockResolvedValue(undefined),  // Simulate removal of repair
        update: jest.fn().mockResolvedValue(undefined)   // Mock update method for Truck repository
      };
      (mockDataSource.getRepository as jest.Mock).mockReturnValue(repoMock);

      const req = mockRequest({ id: "1" });
      const res = mockResponse();

      await repairApi.deleteRepair(req, res);

      // Ensure truck's numberOfRepairs is decremented by 1
      expect(repoMock.update).toHaveBeenCalledWith(1, { numberOfRepairs: 1 });  // Initial numberOfRepairs was 2, should be 1 now
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });
});
