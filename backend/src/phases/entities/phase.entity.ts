import { Entity, ObjectIdColumn, Column } from 'typeorm';
import { ObjectId } from 'mongodb';

export class PhaseImage {
  @Column()
  url!: string;
}

@Entity('phases')
export class Phase {
  @ObjectIdColumn()
  _id!: ObjectId;

  @Column()
  title!: string;

  @Column({ nullable: true })
  description!: string;

  @Column({ default: 0 })
  done!: number; // 0 or 1

  @Column(() => PhaseImage)
  images!: PhaseImage[];
}
