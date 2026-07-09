export class CreateStepDto {
  phase_id: string;
  title: string;
  task_type?: string; // NONE, ASSET, CODE
  details?: string; // Serialized JSON array of StepDetail objects
}
