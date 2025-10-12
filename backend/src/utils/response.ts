import { Response } from "express";
import { classToPlain } from "class-transformer";
import { ApiResponseDto, PaginationMetaData } from "../types/response.types";

const isNil = (value: any): value is null | undefined => value == null;
const isEmpty = (value: any): boolean => {
  if (value == null) return true;
  if (typeof value === "string" || Array.isArray(value))
    return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
};

export class ResponseService {
  static json<T>(
    res: Response,
    statusCode: number,
    message?: string,
    data?: T,
    metadata?: PaginationMetaData
  ): Response {
    const response: ApiResponseDto<T> = {};

    if (!isNil(statusCode)) {
      response.code = statusCode;
    }

    if (!isEmpty(message)) {
      response.message = message;
    }

    if (!isNil(data)) {
      response.data = classToPlain(data) as T;
    }

    if (!isNil(metadata)) {
      response.metadata = metadata;
    }

    return res.status(statusCode).json(response);
  }
}
