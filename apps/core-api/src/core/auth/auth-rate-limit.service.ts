import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

type RateEntry = {
  count: number;
  firstFailureAt: number;
  blockedUntil: number;
};

@Injectable()
export class AuthRateLimitService {
  private readonly failures = new Map<string, RateEntry>();
  private readonly maxAttempts = Number(process.env.AUTH_LOGIN_MAX_ATTEMPTS ?? 5);
  private readonly windowMs = Number(process.env.AUTH_LOGIN_WINDOW_MS ?? 10 * 60 * 1000);
  private readonly blockMs = Number(process.env.AUTH_LOGIN_BLOCK_MS ?? 15 * 60 * 1000);

  consume(key: string): void {
    const entry = this.failures.get(key);
    if (!entry) {
      return;
    }
    const now = Date.now();
    if (entry.blockedUntil > now) {
      const retryAfterSeconds = Math.max(1, Math.ceil((entry.blockedUntil - now) / 1000));
      throw new HttpException(
        `Too many login attempts. Retry in ${retryAfterSeconds}s`,
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
    if (now - entry.firstFailureAt > this.windowMs) {
      this.failures.delete(key);
    }
  }

  recordFailure(key: string): void {
    const now = Date.now();
    const existing = this.failures.get(key);
    if (!existing || now - existing.firstFailureAt > this.windowMs) {
      this.failures.set(key, {
        count: 1,
        firstFailureAt: now,
        blockedUntil: 0
      });
      return;
    }

    existing.count += 1;
    if (existing.count >= this.maxAttempts) {
      existing.blockedUntil = now + this.blockMs;
      existing.count = 0;
      existing.firstFailureAt = now;
    }
    this.failures.set(key, existing);
  }

  reset(key: string): void {
    this.failures.delete(key);
  }
}
