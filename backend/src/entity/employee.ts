import { Column, Entity, PrimaryGeneratedColumn, TableInheritance } from "typeorm";

@Entity()
@TableInheritance({ column: { type: "char", name: "role" } })
export class Employee {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  role!: 'Driver' | 'Mechanic';

  @Column()
  name!: string;

  @Column({ length: 100 })
  surname!: string;

  @Column()
  seniorityLevel!: 'entry' | 'mid' | 'senior';
}