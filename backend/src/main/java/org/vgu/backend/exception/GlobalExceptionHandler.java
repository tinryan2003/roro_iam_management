package org.vgu.backend.exception;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Handle validation errors from @Valid annotations
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(
            MethodArgumentNotValidException ex, HttpServletRequest request) {

        logger.warn("Validation error on {}: {}", request.getRequestURI(), ex.getMessage());

        Map<String, Object> errorResponse = new HashMap<>();
        Map<String, String> fieldErrors = new HashMap<>();

        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            fieldErrors.put(fieldName, errorMessage);
        });

        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("status", HttpStatus.BAD_REQUEST.value());
        errorResponse.put("error", "Validation Failed");
        errorResponse.put("message", "Invalid input data");
        errorResponse.put("fieldErrors", fieldErrors);
        errorResponse.put("path", request.getRequestURI());

        return ResponseEntity.badRequest().body(errorResponse);
    }

    /**
     * Handle constraint violations from method-level validation
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolation(
            ConstraintViolationException ex, HttpServletRequest request) {

        logger.warn("Constraint violation on {}: {}", request.getRequestURI(), ex.getMessage());

        Map<String, Object> errorResponse = new HashMap<>();
        List<String> violations = new ArrayList<>();

        for (ConstraintViolation<?> violation : ex.getConstraintViolations()) {
            violations.add(violation.getPropertyPath() + ": " + violation.getMessage());
        }

        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("status", HttpStatus.BAD_REQUEST.value());
        errorResponse.put("error", "Constraint Violation");
        errorResponse.put("message", "Request validation failed");
        errorResponse.put("violations", violations);
        errorResponse.put("path", request.getRequestURI());

        return ResponseEntity.badRequest().body(errorResponse);
    }

    /**
     * Handle missing request parameters
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<Map<String, Object>> handleMissingParams(
            MissingServletRequestParameterException ex, HttpServletRequest request) {

        logger.warn("Missing parameter on {}: {}", request.getRequestURI(), ex.getMessage());

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("status", HttpStatus.BAD_REQUEST.value());
        errorResponse.put("error", "Missing Required Parameter");
        errorResponse.put("message", "Required parameter '" + ex.getParameterName() + "' is missing");
        errorResponse.put("parameter", ex.getParameterName());
        errorResponse.put("parameterType", ex.getParameterType());
        errorResponse.put("path", request.getRequestURI());

        return ResponseEntity.badRequest().body(errorResponse);
    }

    /**
     * Handle type mismatch errors (e.g., passing string when expecting number)
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex, HttpServletRequest request) {

        logger.warn("Type mismatch on {}: {}", request.getRequestURI(), ex.getMessage());

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("status", HttpStatus.BAD_REQUEST.value());
        errorResponse.put("error", "Invalid Parameter Type");
        errorResponse.put("message", "Parameter '" + ex.getName() + "' should be of type " +
                ex.getRequiredType().getSimpleName() + " but received: " + ex.getValue());
        errorResponse.put("parameter", ex.getName());
        errorResponse.put("expectedType", ex.getRequiredType().getSimpleName());
        errorResponse.put("actualValue", ex.getValue());
        errorResponse.put("path", request.getRequestURI());

        return ResponseEntity.badRequest().body(errorResponse);
    }

    /**
     * Handle malformed JSON requests
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex, HttpServletRequest request) {

        logger.warn("Malformed request body on {}: {}", request.getRequestURI(), ex.getMessage());

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("status", HttpStatus.BAD_REQUEST.value());
        errorResponse.put("error", "Malformed Request");
        errorResponse.put("message", "Request body is malformed or invalid JSON");
        errorResponse.put("path", request.getRequestURI());

        return ResponseEntity.badRequest().body(errorResponse);
    }

    /**
     * Handle business exceptions (custom)
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Map<String, Object>> handleBusinessException(
            BusinessException ex, HttpServletRequest request) {

        logger.warn("Business logic error on {}: {}", request.getRequestURI(), ex.getMessage());

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("status", HttpStatus.CONFLICT.value());
        errorResponse.put("error", "Business Rule Violation");
        errorResponse.put("message", ex.getMessage());
        errorResponse.put("errorCode", ex.getErrorCode());
        errorResponse.put("path", request.getRequestURI());

        return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
    }

    /**
     * Handle data not found exceptions
     */
    @ExceptionHandler(DataNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleDataNotFound(
            DataNotFoundException ex, HttpServletRequest request) {

        logger.warn("Data not found on {}: {}", request.getRequestURI(), ex.getMessage());

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("status", HttpStatus.NOT_FOUND.value());
        errorResponse.put("error", "Resource Not Found");
        errorResponse.put("message", ex.getMessage());
        errorResponse.put("path", request.getRequestURI());

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    /**
     * Handle access denied (authorization) errors
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(
            AccessDeniedException ex, HttpServletRequest request) {

        logger.warn("Access denied on {}: {}", request.getRequestURI(), ex.getMessage());

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("status", HttpStatus.FORBIDDEN.value());
        errorResponse.put("error", "Access Denied");
        errorResponse.put("message", "You don't have permission to access this resource");
        errorResponse.put("path", request.getRequestURI());

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
    }

    /**
     * Handle 404 - endpoint not found
     */
    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(
            NoHandlerFoundException ex, HttpServletRequest request) {

        logger.warn("Endpoint not found: {} {}", ex.getHttpMethod(), ex.getRequestURL());

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("status", HttpStatus.NOT_FOUND.value());
        errorResponse.put("error", "Endpoint Not Found");
        errorResponse.put("message", "The requested endpoint does not exist");
        errorResponse.put("method", ex.getHttpMethod());
        errorResponse.put("path", ex.getRequestURL());

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    /**
     * Handle all other exceptions (fallback)
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(
            Exception ex, HttpServletRequest request) {

        logger.error("Unexpected error on {}: {}", request.getRequestURI(), ex.getMessage(), ex);

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        errorResponse.put("error", "Internal Server Error");
        errorResponse.put("message", "An unexpected error occurred. Please contact support if the problem persists.");
        errorResponse.put("path", request.getRequestURI());

        // Only include exception details in development
        if (logger.isDebugEnabled()) {
            errorResponse.put("exceptionType", ex.getClass().getSimpleName());
            errorResponse.put("exceptionMessage", ex.getMessage());
        }

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }
}
