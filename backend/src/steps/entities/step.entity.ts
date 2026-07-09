import { Entity, ObjectIdColumn, Column } from 'typeorm';
import { ObjectId } from 'mongodb';

export class StepImage {
  @Column()
  url: string;
}

@Entity('steps')
export class Step {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  phase_id: string; // Stored as string reference to Phase ObjectId

  @Column()
  title: string;

  @Column({ default: 'NONE' })
  task_type: string; // NONE, ASSET, CODE

  @Column('text')
  details: string; // Serialized JSON details array of objects containing text and task_type

  @Column({ default: 0 })
  done: number; // 0 or 1

  @Column(() => StepImage)
  images: StepImage[];
}
