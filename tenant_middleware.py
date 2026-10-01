# tenant_middleware.py
from fastapi import Request, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db

async def get_current_tenant_id(request: Request, db: Session = Depends(get_db)) -> str:
    # 1. Resolve tenant from header or subdomain
    tenant_slug = request.headers.get("X-Tenant-Slug")
    
    if not tenant_slug:
        # Fallback to host parsing: alacio.yubiflo.com -> alacio
        host = request.headers.get("host", "")
        if "." in host:
            subdomain = host.split(".")[0]
            if subdomain not in ["api", "www", "app"]:
                tenant_slug = subdomain

    if not tenant_slug:
        raise HTTPException(status_code=400, detail="Missing X-Tenant-Slug header or invalid subdomain.")

    # 2. Look up Tenant ID
    query = text("SELECT id FROM tenants WHERE slug = :slug AND is_active = true")
    result = db.execute(query, {"slug": tenant_slug}).fetchone()
    
    if not result:
        raise HTTPException(status_code=404, detail="Tenant workspace not found.")

    tenant_id = str(result[0])

    # 3. Inject Tenant Context into PostgreSQL Session for RLS
    db.execute(text(f"SET LOCAL app.current_tenant_id = '{tenant_id}'"))
    
    return tenant_id
