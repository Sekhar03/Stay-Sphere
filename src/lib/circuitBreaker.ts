/**
 * Circuit Breaker implementation for external service calls (Razorpay, Google Maps, SMTP).
 * Prevents cascading outages when downstream third parties experience degradation or downtime.
 * Conforms to Section 2.7 of StaySphere System Design.
 */

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerOptions {
  name: string;
  timeoutMs?: number;            // Max execution time before timing out (default: 8000ms)
  failureThreshold?: number;     // Number of failures before tripping circuit (default: 5)
  resetTimeoutMs?: number;       // Time in OPEN state before trying HALF_OPEN (default: 30000ms)
}

export class CircuitBreakerOpenError extends Error {
  constructor(serviceName: string) {
    super(`Service '${serviceName}' circuit breaker is OPEN. Service temporarily unavailable.`);
    this.name = "CircuitBreakerOpenError";
  }
}

export class CircuitBreaker {
  public state: CircuitState = "CLOSED";
  public failureCount = 0;
  public successCount = 0;
  public lastFailureTime = 0;

  private readonly name: string;
  private readonly timeoutMs: number;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;

  constructor(options: CircuitBreakerOptions) {
    this.name = options.name;
    this.timeoutMs = options.timeoutMs ?? 8000;
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 30000;
  }

  public async execute<T>(action: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
    const now = Date.now();

    // Check if circuit can move from OPEN to HALF_OPEN
    if (this.state === "OPEN") {
      if (now - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = "HALF_OPEN";
      } else {
        if (fallback) return fallback();
        throw new CircuitBreakerOpenError(this.name);
      }
    }

    try {
      // Execute action with timeout promise race
      const result = await Promise.race([
        action(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`[CircuitBreaker: ${this.name}] Request timed out after ${this.timeoutMs}ms`)), this.timeoutMs)
        ),
      ]);

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      if (fallback) {
        return fallback();
      }
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    if (this.state === "HALF_OPEN") {
      this.successCount++;
      if (this.successCount >= 2) {
        this.state = "CLOSED";
        this.successCount = 0;
      }
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.state === "HALF_OPEN" || this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
      console.warn(`[CircuitBreaker: ${this.name}] Tripped to OPEN state due to repeated failures.`);
    }
  }
}

// Singletons for primary external services
export const paymentCircuitBreaker = new CircuitBreaker({
  name: "PaymentGateway",
  timeoutMs: 8000,
  failureThreshold: 5,
  resetTimeoutMs: 30000,
});

export const mapsCircuitBreaker = new CircuitBreaker({
  name: "GoogleMapsAPI",
  timeoutMs: 5000,
  failureThreshold: 3,
  resetTimeoutMs: 20000,
});

export const mailerCircuitBreaker = new CircuitBreaker({
  name: "EmailMailer",
  timeoutMs: 10000,
  failureThreshold: 5,
  resetTimeoutMs: 30000,
});
