import { Response } from "express";

export interface ErrorDetail {
	field?: string;
	message: string;
	required?: string[];
	optional?: string[];
	schema?: string;
	example?: Record<string, any>;
}

export interface ErrorResponse {
	status: "error";
	message: string;
	code: number;
	errors?: ErrorDetail[];
	timestamp: string;
}

export function buildErrorResponse(
	message: string,
	code: number = 500,
	errors?: ErrorDetail[],
): ErrorResponse {
	return {
		status: "error",
		message,
		code,
		errors,
		timestamp: new Date().toISOString(),
	};
}

/**
 * Formats Zod errors from either raw ZodError or formatted error object
 * Handles custom params from superRefine for enhanced error messages
 */
export function formatZodErrors(zodError: any): ErrorDetail[] {
	if (!zodError) return [];

	// Check if this is a raw ZodError with issues array (preferred for custom params)
	if (zodError.issues && Array.isArray(zodError.issues)) {
		return zodError.issues.map((issue: any) => {
			const errorDetail: ErrorDetail = {
				field: issue.path.join(".") || "unknown",
				message: issue.message,
			};

			// Extract custom params if they exist (from superRefine)
			if (issue.params) {
				if (issue.params.required) {
					errorDetail.required = issue.params.required;
				}
				if (issue.params.optional) {
					errorDetail.optional = issue.params.optional;
				}
				if (issue.params.schema) {
					errorDetail.schema = issue.params.schema;
				}
				if (issue.params.example) {
					errorDetail.example = issue.params.example;
				}
			}

			return errorDetail;
		});
	}

	// Fallback: handle formatted error structure (for backward compatibility)
	const errors: ErrorDetail[] = [];
	Object.entries(zodError).forEach(([field, error]: [string, any]) => {
		if (field === "_errors") return; // Skip top-level _errors

		// Handle both string and object error formats
		let message: string;
		if (typeof error === "string") {
			message = error;
		} else if (error._errors && Array.isArray(error._errors)) {
			message = error._errors[0] || "Validation error";
		} else {
			message = "Validation error";
		}

		const errorDetail: ErrorDetail = {
			field,
			message,
		};

		if (errorDetail.message && errorDetail.message !== "Validation error") {
			errors.push(errorDetail);
		}
	});

	return errors;
}
