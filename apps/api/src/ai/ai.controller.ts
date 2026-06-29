import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { AiService } from "./ai.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

class ChatMessageDto {
  @IsIn(["user", "model"])
  role!: "user" | "model";

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  text!: string;
}

class ChatDto {
  @IsArray()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages!: ChatMessageDto[];

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  lessonContext?: string;
}

@Controller("ai")
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post("chat")
  async chat(@Body() dto: ChatDto) {
    const text = await this.ai.chat(dto.messages, dto.lessonContext);
    return { text };
  }
}
