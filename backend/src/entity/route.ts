import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Trip } from "./trip";

@Entity("Route")
export class Route {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Trip, (trip) => trip.routes)
  @JoinColumn({ name: "tripId" })
  trip!: Trip;

  @Column()
  from!: string;

  @Column()
  to!: string;
}
