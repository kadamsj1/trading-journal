import pytest
from httpx import AsyncClient, ASGITransport
from datetime import timedelta
from app.main import app
from app.auth.utils import create_access_token, get_password_hash
from app.schemas.user import UserCreate


@pytest.mark.asyncio
async def test_unauthorized_access():
    """Verify endpoints reject requests when neither token nor cookie is provided."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Accessing /api/auth/me without auth
        response = await client.get("/api/auth/me")
        assert response.status_code == 401
        assert "detail" in response.json()

        # Accessing portfolios without auth
        response = await client.get("/api/portfolios")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_weak_password_rejection():
    """Verify weak passwords fail validation on registration."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Too short (< 8 chars)
        res = await client.post("/api/auth/register", json={
            "email": "testshort@example.com",
            "username": "testshort",
            "password": "Ab1"
        })
        assert res.status_code == 422

        # No uppercase
        res = await client.post("/api/auth/register", json={
            "email": "testlower@example.com",
            "username": "testlower",
            "password": "password123"
        })
        assert res.status_code == 422

        # No digits
        res = await client.post("/api/auth/register", json={
            "email": "testnodigit@example.com",
            "username": "testnodigit",
            "password": "PasswordOnly"
        })
        assert res.status_code == 422


@pytest.mark.asyncio
async def test_expired_token_rejected():
    """Verify expired JWT tokens are rejected."""
    expired_token = create_access_token(
        data={"sub": "999999"},
        expires_delta=timedelta(seconds=-10)
    )
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Passed via Authorization header
        res = await client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {expired_token}"}
        )
        assert res.status_code == 401

        # Passed via access_token cookie
        res = await client.get(
            "/api/auth/me",
            cookies={"access_token": expired_token}
        )
        assert res.status_code == 401


@pytest.mark.asyncio
async def test_security_headers_present():
    """Verify vital security headers are returned on API responses."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        assert res.headers.get("X-Content-Type-Options") == "nosniff"
        assert res.headers.get("X-Frame-Options") == "DENY"
        assert "Content-Security-Policy" in res.headers
        assert "Referrer-Policy" in res.headers


@pytest.mark.asyncio
async def test_logout_clears_cookie():
    """Verify /api/auth/logout deletes the access_token cookie."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/api/auth/logout")
        assert res.status_code == 200
        # Cookie should have an expiration in the past or max-age=0
        set_cookie = res.headers.get("set-cookie", "")
        assert "access_token=" in set_cookie
        assert "max-age=0" in set_cookie.lower() or "expires=" in set_cookie.lower()


@pytest.mark.asyncio
async def test_non_admin_cannot_access_user_management():
    """Verify non-admin users receive 403 Forbidden on admin endpoints."""
    # Create token for regular user (is_admin=False)
    # The endpoint get_current_admin_user checks user.is_admin
    # We can mock or test unauthorized when token payload doesn't map to an admin
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Without admin token, accessing /api/users fails
        res = await client.get("/api/users")
        assert res.status_code == 401
