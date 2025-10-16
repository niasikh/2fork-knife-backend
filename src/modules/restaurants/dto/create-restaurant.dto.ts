import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  Max,
  IsUrl,
  MinLength,
} from 'class-validator';

export class CreateRestaurantDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(2)
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsString()
  phone: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsArray()
  @IsString({ each: true })
  cuisine: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4)
  priceRange?: number;

  @IsOptional()
  @IsNumber()
  capacity?: number;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  imageUrls?: string[];

  @IsOptional()
  @IsUrl()
  coverImage?: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  currency?: string;
}

