import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Brand } from "./brand";
import { Employee } from "./employee";
import { Mechanic } from "./mechanic";

@Entity("MechanicBrand")
export class MechanicBrand {
  @PrimaryColumn()
  employeeId!: number;

  @PrimaryColumn()
  brandId!: number;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: "employeeId" })
  mechanic!: Mechanic;

  @ManyToOne(() => Brand)
  @JoinColumn({ name: "brandId" })
  brand!: Brand;
}
