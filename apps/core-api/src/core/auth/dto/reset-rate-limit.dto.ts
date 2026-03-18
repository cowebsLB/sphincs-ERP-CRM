import { IsEmail } from "class-validator";

export class ResetRateLimitDto {
  @IsEmail()
  email!: string;
}

