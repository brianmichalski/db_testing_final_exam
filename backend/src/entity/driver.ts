import { ChildEntity, Column } from "typeorm";
import { Employee } from "./employee";

@ChildEntity()
export class Driver extends Employee {
  @Column({ nullable: true })
  driverCategory?: string;
}