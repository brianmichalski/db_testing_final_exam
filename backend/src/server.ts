import cors from "cors";
import 'dotenv/config';
import express, { json } from "express";
import { BrandApi, CustomerApi, EmployeeApi, RepairApi, RouteApi, ShipmentApi, TripApi, TruckApi } from './api';
import postgresDataSource from "./strategy/postgresql";
import { MechanicBrandApi } from "./api/mechanicBrandApi";

(async () => {
  const app = express();
  app.use(cors());
  app.use(json());

  const dataSource = await postgresDataSource.initialize();

  new BrandApi(dataSource, app);
  new CustomerApi(dataSource, app);
  new EmployeeApi(dataSource, app);
  new MechanicBrandApi(dataSource, app);
  new RepairApi(dataSource, app);
  new RouteApi(dataSource, app);
  new ShipmentApi(dataSource, app);
  new TripApi(dataSource, app);
  new TruckApi(dataSource, app);

  app.listen(8000, () => {
    console.log(`express server started on 8000`);
  });
})().catch((err) => console.log(err));
