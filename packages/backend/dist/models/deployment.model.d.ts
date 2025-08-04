import { Deployment, DeploymentStatus } from '@prisma/client';
export interface CreateDeploymentData {
    businessId: string;
    version: string;
    environment?: string;
    url?: string;
    commitHash?: string;
    buildLogs?: string;
}
export interface UpdateDeploymentData {
    status?: DeploymentStatus;
    url?: string;
    buildLogs?: string;
    errorLogs?: string;
    startedAt?: Date;
    completedAt?: Date;
}
export interface DeploymentWithBusiness extends Deployment {
    business?: {
        id: string;
        name: string;
        status: string;
    };
}
export declare class DeploymentModel {
    /**
     * Create a new deployment record
     */
    static create(data: CreateDeploymentData): Promise<Deployment>;
    /**
     * Find deployment by ID
     */
    static findById(id: string): Promise<Deployment | null>;
    /**
     * Find deployment by ID with business data
     */
    static findByIdWithBusiness(id: string): Promise<DeploymentWithBusiness | null>;
    /**
     * Find all deployments by business ID
     */
    static findByBusinessId(businessId: string): Promise<Deployment[]>;
    /**
     * Find latest deployment for a business
     */
    static findLatestByBusinessId(businessId: string): Promise<Deployment | null>;
    /**
     * Find deployments by status
     */
    static findByStatus(status: DeploymentStatus): Promise<DeploymentWithBusiness[]>;
    /**
     * Find active/in-progress deployments
     */
    static findActiveDeployments(): Promise<DeploymentWithBusiness[]>;
    /**
     * Update deployment data
     */
    static update(id: string, data: UpdateDeploymentData): Promise<Deployment>;
    /**
     * Update deployment status
     */
    static updateStatus(id: string, status: DeploymentStatus): Promise<Deployment>;
    /**
     * Start deployment (set status to IN_PROGRESS and startedAt)
     */
    static startDeployment(id: string): Promise<Deployment>;
    /**
     * Complete deployment successfully
     */
    static completeDeployment(id: string, url?: string): Promise<Deployment>;
    /**
     * Fail deployment with error logs
     */
    static failDeployment(id: string, errorLogs?: string): Promise<Deployment>;
    /**
     * Cancel deployment
     */
    static cancelDeployment(id: string): Promise<Deployment>;
    /**
     * Delete deployment
     */
    static delete(id: string): Promise<Deployment>;
    /**
     * Check if deployment has started
     */
    private static hasStarted;
    /**
     * Get deployment statistics
     */
    static getStatistics(businessId?: string): Promise<{
        total: number;
        pending: number;
        inProgress: number;
        completed: number;
        failed: number;
        cancelled: number;
        successRate: number;
        avgDeploymentTime: number;
    }>;
    /**
     * Get recent deployments with performance data
     */
    static getRecentDeployments(limit?: number): Promise<Array<DeploymentWithBusiness & {
        duration?: number;
    }>>;
    /**
     * Find deployments that have been running too long (potentially stuck)
     */
    static findStuckDeployments(timeoutMinutes?: number): Promise<DeploymentWithBusiness[]>;
    /**
     * Get successful deployment for business (for URL retrieval)
     */
    static getSuccessfulDeployment(businessId: string): Promise<Deployment | null>;
}
