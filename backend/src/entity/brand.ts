import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Truck } from "./truck";

@Entity("Brand")
export class Brand {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @OneToMany(() => Truck, (truck) => truck.brand)
  trucks!: Truck[];
}