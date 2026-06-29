import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { Response } from "express";

/**
 * Turns Prisma known-request errors into clean HTTP responses so callers get
 * sensible status codes (404/409/400) instead of raw 500s with DB internals.
 * Registered globally in main.ts. Only catches Prisma errors — Nest's default
 * exception handling still handles everything else.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(
    exception: Prisma.PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ) {
    const response = host.switchToHttp().getResponse<Response>();

    const byCode: Record<string, { status: number; message: string }> = {
      // Unique constraint violation
      "2002": { status: HttpStatus.CONFLICT, message: "ข้อมูลซ้ำ กรุณาตรวจสอบ" },
      // Foreign key constraint failure
      "2003": {
        status: HttpStatus.BAD_REQUEST,
        message: "อ้างอิงข้อมูลที่เกี่ยวข้องไม่ได้",
      },
      // Record not found (update/delete on missing row)
      "2025": { status: HttpStatus.NOT_FOUND, message: "ไม่พบข้อมูลที่ระบุ" },
    };

    const hit = byCode[exception.code];
    if (hit) {
      return response.status(hit.status).json({
        statusCode: hit.status,
        message: hit.message,
      });
    }

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "เกิดข้อผิดพลาดในฐานข้อมูล",
    });
  }
}
