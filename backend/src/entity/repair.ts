import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Mechanic } from "./mechanic";
import { Truck } from "./truck";
import { Employee } from "./employee";

@Entity("Repair")
export class Repair {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Truck, (truck) => truck.repairs)
  @JoinColumn({ name: "truckId" })
  truck!: Truck;

  @ManyToOne(() => Employee, (mechanic) => (mechanic as Mechanic).repairs)
  @JoinColumn({ name: "employeeId" })
  mechanic!: Mechanic;

  @Column()
  orderDate!: Date;

  @Column()
  daysToRepair!: number;
}