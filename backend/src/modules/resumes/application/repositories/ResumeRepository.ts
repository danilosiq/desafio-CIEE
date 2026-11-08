export type ResumeInput = {
    fullName: string;
    email: string;
    phone?: string | null;
    areaOfExpertise?: string | null;
    areaOfExpertiseId?: string | null;
    professionalSummary?: string | null;
};
export type ResumeData = {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    areaOfExpertise: string | null;
    areaOfExpertiseId?: string | null;
    professionalSummary: string | null;
    createdAt: Date;
    updatedAt: Date;
};
export type ResumeListInput = {
    page: number;
    limit: number;
    search?: string;
    areaOfExpertiseId?: string;
};
export type ResumeListData = {
    items: ResumeData[];
    total: number;
};
export interface ResumeRepository {
    list(input: ResumeListInput): Promise<ResumeListData>;
    create(input: ResumeInput): Promise<ResumeData>;
    findById(id: string): Promise<ResumeData | null>;
    findByEmail(email: string): Promise<ResumeData | null>;
    update(id: string, input: ResumeInput): Promise<ResumeData>;
    delete(id: string): Promise<void>;
}
