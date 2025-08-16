# Swagger API Documentation

This document provides comprehensive information about the Swagger/OpenAPI documentation for the ROMAPI Backend Core.

## Overview

The ROMAPI Backend Core provides a fully documented REST API using Swagger/OpenAPI 3.0 specification. The documentation includes:

- **16 endpoints** across 3 main controllers
- **15 schemas** with detailed validation rules
- **3 API tags** for logical grouping
- **JWT authentication** support
- **Comprehensive examples** for all operations

## Accessing the Documentation

### Development Environment
- **URL**: `http://localhost:3000/api/docs`
- **Format**: Interactive Swagger UI

### Production Environment
- **URL**: `https://api.romapi.com/api/docs`
- **Format**: Interactive Swagger UI

### OpenAPI JSON Specification
- **Development**: `http://localhost:3000/api/docs-json`
- **Production**: `https://api.romapi.com/api/docs-json`

## API Structure

### Base URL
All API endpoints are prefixed with `/api/v1`

### Authentication
Most endpoints require JWT Bearer token authentication:
```
Authorization: Bearer <your-jwt-token>
```

### Response Format
All responses follow a standardized format:
```json
{
  "success": true,
  "data": { /* actual response data */ },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "timestamp": "2024-01-15T10:30:00Z",
    "path": "/api/v1/endpoint",
    "method": "POST"
  }
}
```

## API Tags and Endpoints

### 1. Health (`/`)
System health and status endpoints.

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET    | `/`      | Health check | No |

### 2. API Resources (`/api-resources`)
Manage business resources, services, and data entries.

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET    | `/api-resources` | List resources with pagination | No |
| GET    | `/api-resources/search` | Search resources | No |
| GET    | `/api-resources/:id` | Get resource by ID | No |
| GET    | `/api-resources/slug/:slug` | Get resource by slug | No |
| GET    | `/api-resources/user/:userId` | Get user's resources | No |
| GET    | `/api-resources/category/:categoryId` | Get category resources | No |
| GET    | `/api-resources/statistics/overview` | Get statistics | No |
| POST   | `/api-resources` | Create new resource | Yes |
| PUT    | `/api-resources/:id` | Update resource | Yes |
| DELETE | `/api-resources/:id` | Delete resource | Yes |
| POST   | `/api-resources/ingest` | Bulk import resources | Yes |

### 3. Categories (`/categories`)
Hierarchical category management system.

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET    | `/categories` | List all categories | No |
| GET    | `/categories/search` | Search categories | No |
| GET    | `/categories/statistics` | Get category statistics | No |
| GET    | `/categories/:id` | Get category by ID | No |
| GET    | `/categories/slug/:slug` | Get category by slug | No |
| GET    | `/categories/:id/children` | Get category children | No |
| GET    | `/categories/:id/path` | Get category path | No |
| POST   | `/categories` | Create new category | Yes |
| PUT    | `/categories/:id` | Update category | Yes |
| DELETE | `/categories/:id` | Delete category | Yes |

## Key Features

### 1. Comprehensive Validation
All DTOs include detailed validation rules:
- **String length limits**
- **Email format validation**
- **URL format validation**
- **UUID format validation**
- **Enum value validation**
- **Nested object validation**

### 2. Rich Examples
Every endpoint includes:
- **Request examples** with realistic data
- **Response examples** showing expected format
- **Error response examples** for common scenarios

### 3. Advanced Search and Filtering
The API supports:
- **Full-text search** across name and description
- **Location-based search** with radius filtering
- **Multi-field filtering** (status, plan, type, etc.)
- **Pagination** with limit/offset
- **Sorting** by multiple fields

### 4. Bulk Operations
Efficient bulk operations with:
- **Batch processing** with configurable batch sizes
- **Error handling** with detailed error reports
- **Duplicate detection** and skipping
- **Progress tracking** with processing times

## Schema Documentation

### Core Entities

#### ApiResourceResponseDto
Complete resource information including:
- Basic details (name, description, type)
- Location data (address, coordinates)
- Contact information (phone, email, website)
- Business metadata (hours, images, SEO)
- System fields (status, plan, timestamps)

#### CreateApiResourceDto
Resource creation payload with:
- Required fields validation
- Optional nested objects
- Business hours array
- Image attachments
- SEO metadata

#### CategoryResponseDto
Category information with:
- Hierarchical structure support
- Parent-child relationships
- Resource counts
- Icon and description

### Supporting DTOs

#### AddressDto
Standardized address format:
- Multi-line address support
- Country code validation (ISO 3166-1)
- GPS coordinates (latitude/longitude)
- Postal code support

#### ContactDto
Contact information:
- Phone number validation
- Email format validation
- Website URL validation

#### BusinessHourDto
Operating hours:
- Day of week (0-6, Sunday-Saturday)
- Time format validation (HH:MM)
- Closed day support

## Rate Limiting

The API implements rate limiting:
- **Anonymous users**: 100 requests/hour
- **Authenticated users**: 1000 requests/hour
- **Bulk operations**: 10 requests/hour

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642262400
```

## Error Codes

Common error codes and their meanings:

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

## Testing the API

### Using Swagger UI
1. Navigate to the documentation URL
2. Click "Authorize" to set your JWT token
3. Expand any endpoint section
4. Click "Try it out"
5. Fill in the parameters
6. Click "Execute"

### Using cURL
```bash
# Get all resources
curl -X GET "http://localhost:3000/api/v1/api-resources" \
  -H "accept: application/json"

# Create a resource (requires auth)
curl -X POST "http://localhost:3000/api/v1/api-resources" \
  -H "accept: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Restaurant",
    "description": "A test restaurant",
    "resourceType": "BUSINESS",
    "categoryId": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

### Using Postman
1. Import the OpenAPI specification from `/api/docs-json`
2. Set up environment variables for base URL and auth token
3. Use the generated collection to test endpoints

## Development Tools

### Swagger Test Script
Run the documentation validation:
```bash
npm run swagger:test
```

This script validates:
- All endpoints are documented
- All schemas are present
- Documentation completeness
- OpenAPI specification validity

### Generate OpenAPI Spec
Generate the OpenAPI JSON file:
```bash
npm run swagger:generate
```

The generated file is saved to `dist/openapi.json`.

## Best Practices

### For API Consumers
1. **Always check the response format** - all responses follow the standard format
2. **Handle errors gracefully** - check the `success` field and `error` object
3. **Use pagination** - large datasets are paginated for performance
4. **Implement rate limiting** - respect the rate limits to avoid 429 errors
5. **Cache responses** - use appropriate caching for read-heavy operations

### For API Developers
1. **Keep documentation updated** - update Swagger annotations when changing endpoints
2. **Provide examples** - include realistic examples in all DTOs
3. **Validate thoroughly** - use class-validator for comprehensive validation
4. **Follow naming conventions** - use consistent naming across endpoints
5. **Test documentation** - run the swagger test script regularly

## Troubleshooting

### Common Issues

#### Documentation Not Loading
- Check if the application is running
- Verify the correct URL (`/api/docs`)
- Check browser console for errors

#### Authentication Issues
- Ensure JWT token is valid and not expired
- Check the token format (Bearer prefix)
- Verify the token is set in Swagger UI

#### Validation Errors
- Check the request format against the schema
- Ensure all required fields are provided
- Verify data types match the schema

#### Rate Limiting
- Check rate limit headers in responses
- Implement exponential backoff for retries
- Consider upgrading to authenticated access

### Getting Help

For issues with the API documentation:
1. Check this documentation first
2. Review the interactive Swagger UI
3. Check the application logs
4. Contact the development team

## Changelog

### Version 1.0.0
- Initial API documentation
- Complete endpoint coverage
- Comprehensive schema documentation
- Interactive Swagger UI
- Authentication support
- Rate limiting documentation
- Error handling documentation