import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Customer } from "./customer";
import { Trip } from "./trip";

@Entity("Shipment")
export class Shipment {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Trip, (trip) => trip.shipments)
  @JoinColumn({ name: "tripId" })
  trip!: Trip;

  @ManyToOne(() => Customer, (customer) => customer.shipments)
  @JoinColumn({ name: "customerId" })
  customer!: Customer;

  @Column("decimal", { precision: 12, scale: 2 })
  weight!: number;

  @Column("decimal", { precision: 12, scale: 2 })
  value!: number;

  @Column()
  origin!: string;

  @Column()
  destination!: string;
}