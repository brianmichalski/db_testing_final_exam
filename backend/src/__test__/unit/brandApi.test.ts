import { Request, Response } from "express";
import { DataSource, Repository } from "typeorm";
import { BrandApi } from "../../api";

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

describe("BrandApi", () => {
  let mockDataSource: DataSource;
  let brandApi: BrandApi;

  beforeEach(() => {
    mockDataSource = createMockDataSource();
    jest.clearAllMocks();
    brandApi = new BrandApi(mockDataSource, mockExpress);
  });

  describe("getAllBrands", () => {
    it("should return all brands", async () => {
      const mockBrands = [{ id: 1, name: "Brand A" }, { id: 2, name: "Brand B" }];
      const repoMock = { find: jest.fn().mockResolvedValue(mockBrands) };
      (mockDataSource.getRepository as jest.Mock).mockReturnValue(repoMock);

      const req = mockRequest();
      const res = mockResponse();

      await brandApi.getAllBrands(req, res);

      expect(repoMock.find).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(mockBrands);
    });
  });

  describe("getBrandById", () => {
    it("should return a brand by ID", async () => {
      const mockBrand = { id: 1, name: "Brand A", trucks: [] };
      const repoMock = { findOne: jest.fn().mockResolvedValue(mockBrand) };
      (mockDataSource.getRepository as jest.Mock).mockReturnValue(repoMock);

      const req = mockRequest({ id: "1" });
      const res = mockResponse();

      await brandApi.getBrandById(req, res);

      expect(repoMock.findOne).toHaveBeenCalledWith({ where: { id: 1 }, relations: ["trucks"] });
      expect(res.json).toHaveBeenCalledWith(mockBrand);
    });

    it("should return 400 if ID is invalid", async () => {
      const req = mockRequest({ id: "invalid" });
      const res = mockResponse();

      await brandApi.getBrandById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid brand ID" });
    });

    it("should return 404 if brand is not found", async () => {
      const repoMock = { findOne: jest.fn().mockResolvedValue(null) };
      (mockDataSource.getRepository as jest.Mock).mockReturnValue(repoMock);

      const req = mockRequest({ id: "1" });
      const res = mockResponse();

      await brandApi.getBrandById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Brand not found" });
    });
  });

  describe("createBrand", () => {
    it("should create a new brand", async () => {
      const mockBrand = { id: 1, name: "Brand A" };
      const repoMock = { save: jest.fn().mockResolvedValue(mockBrand) };
      (mockDataSource.getRepository as jest.Mock).mockReturnValue(repoMock);

      const req = mockRequest({}, { name: "Brand A" });
      const res = mockResponse();

      await brandApi.createBrand(req, res);

      expect(repoMock.save).toHaveBeenCalledWith({ name: "Brand A" });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockBrand);
    });

    it("should return 400 if name is missing", async () => {
      const req = mockRequest({}, {});
      const res = mockResponse();

      await brandApi.createBrand(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Brand name is required" });
    });
  });

  describe("updateBrand", () => {
    it("should update an existing brand", async () => {
      const mockBrand = { id: 1, name: "Brand A" };
      const repoMock = {
        findOne: jest.fn().mockResolvedValue(mockBrand),
        save: jest.fn().mockResolvedValue({ id: 1, name: "Updated Brand" }),
      };
      (mockDataSource.getRepository as jest.Mock).mockReturnValue(repoMock);

      const req = mockRequest({ id: "1" }, { name: "Updated Brand" });
      const res = mockResponse();

      await brandApi.updateBrand(req, res);

      expect(repoMock.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(repoMock.save).toHaveBeenCalledWith({ ...mockBrand, name: "Updated Brand" });
      expect(res.json).toHaveBeenCalledWith({ id: 1, name: "Updated Brand" });
    });

    it("should return 404 if brand is not found", async () => {
      const repoMock = { findOne: jest.fn().mockResolvedValue(null) };
      (mockDataSource.getRepository as jest.Mock).mockReturnValue(repoMock);

      const req = mockRequest({ id: "1" }, { name: "Updated Brand" });
      const res = mockResponse();

      await brandApi.updateBrand(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Brand not found" });
    });
  });

  describe("deleteBrand", () => {
    it("should delete an existing brand", async () => {
      const mockBrand = { id: 1, name: "Brand A" };
      const repoMock = {
        findOne: jest.fn().mockResolvedValue(mockBrand),
        find: jest.fn().mockResolvedValue([]),
        remove: jest.fn().mockResolvedValue(undefined),
      };
      (mockDataSource.getRepository as jest.Mock).mockReturnValue(repoMock);

      const req = mockRequest({ id: "1" });
      const res = mockResponse();

      await brandApi.deleteBrand(req, res);

      expect(repoMock.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(repoMock.remove).toHaveBeenCalledWith(mockBrand);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it("should return 400 if brand has associated trucks", async () => {
      const mockBrand = { id: 1, name: "Brand A" };
      const repoMock = {
        findOne: jest.fn().mockResolvedValue(mockBrand),
        find: jest.fn().mockResolvedValue([{ id: 1, brand: mockBrand }]),
      };
      (mockDataSource.getRepository as jest.Mock).mockReturnValue(repoMock);

      const req = mockRequest({ id: "1" });
      const res = mockResponse();

      await brandApi.deleteBrand(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Cannot delete brand with associated trucks",
      });
    });

    it("should return 404 if brand is not found", async () => {
      const repoMock = { findOne: jest.fn().mockResolvedValue(null) };
      (mockDataSource.getRepository as jest.Mock).mockReturnValue(repoMock);

      const req = mockRequest({ id: "1" });
      const res = mockResponse();

      await brandApi.deleteBrand(req, res);

      expect(repoMock.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Brand not found" });
    });
  });
})