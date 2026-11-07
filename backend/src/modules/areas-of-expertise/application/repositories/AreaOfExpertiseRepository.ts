export type AreaOfExpertiseInput = {
  name: string;
  description: string;
};

export type AreaOfExpertiseData = AreaOfExpertiseInput & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface AreaOfExpertiseRepository {
  create(input: AreaOfExpertiseInput): Promise<AreaOfExpertiseData>;
  findById(id: string): Promise<AreaOfExpertiseData | null>;
}
