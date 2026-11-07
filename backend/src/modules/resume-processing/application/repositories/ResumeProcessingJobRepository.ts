export type ProcessingStatus = "Processing" | "Finished";
export type ResumeProcessingJobData = {
  id: string;
  status: ProcessingStatus;
  createdAt: Date;
  updatedAt: Date;
};
export interface ResumeProcessingJobRepository {
  create(): Promise<ResumeProcessingJobData>;
  finish(id: string): Promise<ResumeProcessingJobData>;
  findById(id: string): Promise<ResumeProcessingJobData | null>;
}
