import { Request, Response } from 'express';
export declare class BusinessController {
    /**
     * Create a new business
     * POST /api/businesses
     */
    static create(req: Request, res: Response): Promise<void>;
    /**
     * Get business by ID
     * GET /api/businesses/:id
     */
    static getById(req: Request, res: Response): Promise<void>;
    /**
     * Get business with full details
     * GET /api/businesses/:id/details
     */
    static getDetails(req: Request, res: Response): Promise<void>;
    /**
     * Get all businesses for the authenticated user
     * GET /api/businesses
     */
    static getAll(req: Request, res: Response): Promise<void>;
    /**
     * Get businesses by status
     * GET /api/businesses/status/:status
     */
    static getByStatus(req: Request, res: Response): Promise<void>;
    /**
     * Update business
     * PUT /api/businesses/:id
     */
    static update(req: Request, res: Response): Promise<void>;
    /**
     * Update business status
     * PATCH /api/businesses/:id/status
     */
    static updateStatus(req: Request, res: Response): Promise<void>;
    /**
     * Delete business
     * DELETE /api/businesses/:id
     */
    static delete(req: Request, res: Response): Promise<void>;
    /**
     * Search businesses
     * GET /api/businesses/search?q=query
     */
    static search(req: Request, res: Response): Promise<void>;
    /**
     * Get business statistics
     * GET /api/businesses/statistics
     */
    static getStatistics(req: Request, res: Response): Promise<void>;
    /**
     * Get active businesses (for admin/monitoring)
     * GET /api/businesses/active
     */
    static getActive(req: Request, res: Response): Promise<void>;
}
