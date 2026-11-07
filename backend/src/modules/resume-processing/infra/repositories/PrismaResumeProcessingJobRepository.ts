import { PrismaClient } from "../../../../generated/prisma/client";
import {
  ResumeProcessingJobRepository,
  ResumeProcessingJobData,
} from "../../application/repositories/ResumeProcessingJobRepository";

function mapJob(job: {
  id: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): ResumeProcessingJobData {
  if (job.status !== "Processing" && job.status !== "Finished")
    throw new Error("Invalid persisted job status.");
  return { ...job, status: job.status };
}
export class PrismaResumeProcessingJobRepository implements ResumeProcessingJobRepository {
  constructor(private readonly client: PrismaClient) {}
  async create(): Promise<ResumeProcessingJobData> {
    return mapJob(await this.client.resumeProcessingJob.create({ data: {} }));
  }
  async finish(id: string): Promise<ResumeProcessingJobData> {
    return mapJob(
      await this.client.resumeProcessingJob.update({
        where: { id },
        data: { status: "Finished" },
      }),
    );
  }
  async findById(id: string): Promise<ResumeProcessingJobData | null> {
    const job = await this.client.resumeProcessingJob.findUnique({
      where: { id },
    });
    return job ? mapJob(job) : null;
  }
}
