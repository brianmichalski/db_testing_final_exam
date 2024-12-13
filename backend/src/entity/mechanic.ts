import { ChildEntity, OneToMany } from "typeorm";
import { Employee } from "./employee";
import { MechanicBrand } from "./mechanic-brand";
import { Repair } from "./repair";

@ChildEntity()
export class Mechanic extends Employee {
  @OneToMany(() => Repair, (repair) => repair.mechanic)
  repairs!: Repair[];

  @OneToMany(() => MechanicBrand, (mechanicBrand) => mechanicBrand.mechanic)
  brands!: MechanicBrand[];

}