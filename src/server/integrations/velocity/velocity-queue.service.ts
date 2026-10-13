/**
 * LEZIVA — Velocity Asynchronous Shipment Queue & Worker Service
 * 
 * Handles background shipment orchestration, bounded retries with exponential backoff & jitter,
 * ambiguous timeout reconciliation tagging, and duplicate prevention.
 */

import { velocityShipmentService } from "./velocity-shipment.service";
import { shipmentRepository } from "@/server/repositories/shipment.repository";
import { logger } from "@/utils/logger";
import { ShipmentStatus, CreateForwardShipmentResult } from "./velocity.types";

export interface ShipmentJob {
  id: string;
  orderId: string;
  carrierId?: string;
  attempts: number;
  maxAttempts: number;
  nextRunAt: number;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "RECONCILIATION_REQUIRED";
  lastError?: string;
  createdAt: number;
}

export class VelocityQueueService {
  private static instance: VelocityQueueService;
  private jobs = new Map<string, ShipmentJob>();
  private isProcessing = false;
  private timer: NodeJS.Timeout | null = null;

  private constructor() {
    this.startWorker();
  }

  public static getInstance(): VelocityQueueService {
    if (!VelocityQueueService.instance) {
      VelocityQueueService.instance = new VelocityQueueService();
    }
    return VelocityQueueService.instance;
  }

  /**
   * Enqueues an order for background shipment creation.
   */
  public async enqueueShipment(orderId: string, carrierId?: string): Promise<ShipmentJob> {
    const existing = Array.from(this.jobs.values()).find(
      (j) => j.orderId === orderId && (j.status === "QUEUED" || j.status === "PROCESSING")
    );

    if (existing) {
      logger.info(`[VelocityQueue] Order ${orderId} already in queue with job ID ${existing.id}`);
      return existing;
    }

    const jobId = `job_shp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const job: ShipmentJob = {
      id: jobId,
      orderId,
      carrierId,
      attempts: 0,
      maxAttempts: 3,
      nextRunAt: Date.now(),
      status: "QUEUED",
      createdAt: Date.now(),
    };

    this.jobs.set(jobId, job);
    logger.info(`[VelocityQueue] Enqueued shipment job ${jobId} for order ${orderId}`);

    // Trigger immediate pass
    setTimeout(() => this.processNextBatch(), 50);

    return job;
  }

  /**
   * Worker loop to process eligible jobs with backoff.
   */
  public async processNextBatch(): Promise<number> {
    if (this.isProcessing) return 0;
    this.isProcessing = true;

    let processedCount = 0;
    const now = Date.now();

    try {
      const pendingJobs = Array.from(this.jobs.values()).filter(
        (j) => j.status === "QUEUED" && j.nextRunAt <= now
      );

      for (const job of pendingJobs) {
        job.status = "PROCESSING";
        job.attempts++;
        processedCount++;

        try {
          logger.info(`[VelocityQueue] Executing shipment job ${job.id} for order ${job.orderId} (attempt ${job.attempts}/${job.maxAttempts})`);
          
          const result: CreateForwardShipmentResult = await velocityShipmentService.createForwardShipment({
            orderId: job.orderId,
            carrierId: job.carrierId,
          });

          job.status = "COMPLETED";
          logger.info(`[VelocityQueue] Job ${job.id} succeeded. AWB: ${result.awb}, Courier: ${result.courierName}`);
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          job.lastError = errMsg;

          const isTimeout = errMsg.toLowerCase().includes("timeout");

          if (isTimeout) {
            // Ambiguous timeout: Do not blindly retry non-idempotent creations.
            // Mark job and local shipment as RECONCILIATION_REQUIRED for safety.
            logger.warn(`[VelocityQueue] Job ${job.id} encountered timeout. Marking as RECONCILIATION_REQUIRED to prevent duplicate AWB.`);
            job.status = "RECONCILIATION_REQUIRED";

            const shipments = await shipmentRepository.findByOrderId(job.orderId);
            const activeShipment = shipments[0];
            if (activeShipment) {
              await shipmentRepository.update(activeShipment.id, {
                status: ShipmentStatus.EXCEPTION,
                lastProviderError: `Ambiguous request timeout: Manual reconciliation required (${errMsg})`,
              });
            }
          } else if (job.attempts < job.maxAttempts) {
            // Bounded retry with exponential backoff and jitter
            const backoffMs = Math.pow(2, job.attempts) * 1000 + Math.random() * 500;
            job.nextRunAt = Date.now() + backoffMs;
            job.status = "QUEUED";
            logger.warn(`[VelocityQueue] Job ${job.id} failed (${errMsg}). Retrying in ${Math.round(backoffMs)}ms.`);
          } else {
            job.status = "FAILED";
            logger.error(`[VelocityQueue] Job ${job.id} exhausted all ${job.maxAttempts} attempts. Error: ${errMsg}`);
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }

    return processedCount;
  }

  /**
   * Retries an eligible failed or reconciliation-required job manually.
   */
  public async retryJob(jobId: string): Promise<ShipmentJob> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job '${jobId}' not found`);
    }

    job.status = "QUEUED";
    job.attempts = 0;
    job.nextRunAt = Date.now();
    job.lastError = undefined;

    setTimeout(() => this.processNextBatch(), 50);
    return job;
  }

  public getJobs(): ShipmentJob[] {
    return Array.from(this.jobs.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  public getJob(jobId: string): ShipmentJob | null {
    return this.jobs.get(jobId) || null;
  }

  private startWorker(): void {
    if (!this.timer) {
      this.timer = setInterval(() => {
        this.processNextBatch().catch((err) => {
          logger.warn("[VelocityQueue] Background queue run error:", err);
        });
      }, 5000);
    }
  }

  public stopWorker(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const velocityQueueService = VelocityQueueService.getInstance();
