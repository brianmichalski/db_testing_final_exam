import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Driver } from "./driver";
import { Route } from "./route";
import { Shipment } from "./shipment";
import { Truck } from "./truck";
import { Employee } from "./employee";

@Entity("Trip")
export class Trip {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Truck, (truck) => truck.trips)
  @JoinColumn({ name: "truckId" })
  truck!: Truck;

  @ManyToOne(() => Employee, { nullable: false })
  @JoinColumn({ name: "driver1Id" })
  driver1!: Driver;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: "driver2Id" })
  driver2?: Driver;

  @Column()
  start!: Date;

  @Column({ nullable: true })
  end?: Date;

  @OneToMany(() => Shipment, (shipment) => shipment.trip)
  shipments!: Shipment[];

  @OneToMany(() => Route, (route) => route.trip)
  routes!: Route[];
}