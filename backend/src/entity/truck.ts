import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Brand } from "./brand";
import { Repair } from "./repair";
import { Trip } from "./trip";

@Entity("Truck")
export class Truck {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Brand, (brand) => brand.trucks)
  @JoinColumn({ name: "brandId" })
  brand!: Brand;

  @OneToMany(() => Repair, (repair) => repair.truck)
  repairs!: Repair[];

  @OneToMany(() => Trip, (trip) => trip.truck)
  trips!: Trip[];

  @Column()
  load!: number;

  @Column()
  capacity!: number;

  @Column()
  year!: number;

  @Column()
  numberOfRepairs!: number;
}