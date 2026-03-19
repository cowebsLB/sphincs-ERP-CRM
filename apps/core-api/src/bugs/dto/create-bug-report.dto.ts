import {
  ArrayMinSize,
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength
} from "class-validator";

enum BugSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical"
}

enum SourceApp {
  ERP = "ERP",
  CRM = "CRM"
}

export class CreateBugReportDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(4000)
  summary!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MinLength(2, { each: true })
  @MaxLength(300, { each: true })
  steps!: string[];

  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  expected!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  actual!: string;

  @IsEnum(BugSeverity)
  severity!: "low" | "medium" | "high" | "critical";

  @IsEnum(SourceApp)
  sourceApp!: "ERP" | "CRM";

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  module!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(300)
  route!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  appVersion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  userAgent?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsUrl()
  screenshotUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  pageUrl?: string;
}
