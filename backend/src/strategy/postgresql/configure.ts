import { DataSource } from "typeorm";
import { Brand, Driver, Mechanic } from "../../entity";
import { Customer } from "../../entity/customer";
import { Employee } from "../../entity/employee";
import { MechanicBrand } from "../../entity/mechanic-brand";
import { Repair } from "../../entity/repair";
import { Route } from "../../entity/route";
import { Shipment } from "../../entity/shipment";
import { Trip } from "../../entity/trip";
import { Truck } from "../../entity/truck";
;

export const postgresDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [
    Brand,
    Customer,
    Driver,
    Employee,
    Mechanic,
    MechanicBrand,
    Repair,
    Route,
    Shipment,
    Trip,
    Truck
  ],
  synchronize: true,
  logging: false,
});
