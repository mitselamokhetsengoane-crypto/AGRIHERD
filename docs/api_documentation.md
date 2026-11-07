# AgriHerd API Documentation

Base URL: `http://localhost:8000/api/v1`

## Authentication

### POST /auth/register
Register a new user.

**Request:**
```json
{
  "full_name": "Thabo Mokoena",
  "email": "thabo@example.com",
  "password": "SecurePass123",
  "phone": "+266 5800 0000",
  "farm_name": "Mokoena Farm"
}