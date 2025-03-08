"""
Server management API endpoints
"""
from typing import Any, List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from ....db.session import get_db
from ....db.crud.server import server as server_crud
from ....models.server import Server, ServerCreate, ServerUpdate, ServerWithStats
from ...deps import get_current_active_superuser, get_current_active_user
from ....models.user import User
from ....core.monitoring.server_health import monitor
from ....core.balancer.load_balancer import balancer
from ....core.backup.backup_manager import backup_manager
from ....core.failover.failover_manager import failover_manager

router = APIRouter()

@router.get("/", response_model=List[Server])
async def get_servers(
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Retrieve servers.
    Only superusers can access this endpoint.
    """
    servers = await server_crud.get_multi(db, skip=skip, limit=limit)
    return servers

@router.get("/active", response_model=List[Server])
async def get_active_servers(
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Retrieve active servers.
    """
    servers = await server_crud.get_active_servers(db, skip=skip, limit=limit)
    return servers

@router.post("/", response_model=Server)
async def create_server(
    *,
    db: AsyncSession = Depends(get_db),
    server_in: ServerCreate,
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Create new server.
    Only superusers can create servers.
    """
    # Test connection before creating
    connector = server_crud._get_connector(Server(**server_in.dict()))
    try:
        if not await connector.login(server_in.username, server_in.password):
            raise HTTPException(
                status_code=400,
                detail="Could not connect to server panel"
            )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Server connection error: {str(e)}"
        )
    
    server = await server_crud.create(db=db, obj_in=server_in)
    return server

@router.put("/{server_id}", response_model=Server)
async def update_server(
    *,
    db: AsyncSession = Depends(get_db),
    server_id: int,
    server_in: ServerUpdate,
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Update server.
    Only superusers can update servers.
    """
    server = await server_crud.get(db=db, id=server_id)
    if not server:
        raise HTTPException(
            status_code=404,
            detail="Server not found"
        )
    
    # If credentials are being updated, test the new connection
    if server_in.username or server_in.password:
        connector = server_crud._get_connector(
            Server(
                **{
                    **server.dict(),
                    **({"username": server_in.username} if server_in.username else {}),
                    **({"password": server_in.password} if server_in.password else {})
                }
            )
        )
        try:
            if not await connector.login(
                server_in.username or server.username,
                server_in.password or server.password
            ):
                raise HTTPException(
                    status_code=400,
                    detail="Could not connect to server panel with new credentials"
                )
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Server connection error: {str(e)}"
            )
    
    server = await server_crud.update(db=db, db_obj=server, obj_in=server_in)
    return server

@router.delete("/{server_id}", response_model=Server)
async def delete_server(
    *,
    db: AsyncSession = Depends(get_db),
    server_id: int,
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Delete server.
    Only superusers can delete servers.
    """
    server = await server_crud.get(db=db, id=server_id)
    if not server:
        raise HTTPException(
            status_code=404,
            detail="Server not found"
        )
    server = await server_crud.delete(db=db, id=server_id)
    return server

@router.get("/{server_id}", response_model=ServerWithStats)
async def get_server_stats(
    *,
    db: AsyncSession = Depends(get_db),
    server_id: int,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get server statistics.
    """
    server = await server_crud.get(db=db, id=server_id)
    if not server:
        raise HTTPException(
            status_code=404,
            detail="Server not found"
        )
    
    stats = await server_crud.get_server_stats(db=db, server_id=server_id)
    if not stats:
        raise HTTPException(
            status_code=500,
            detail="Failed to get server statistics"
        )
    
    if "error" in stats:
        raise HTTPException(
            status_code=500,
            detail=f"Server error: {stats['error']}"
        )
    
    return {**server.dict(), "stats": stats}

@router.post("/{server_id}/test", response_model=bool)
async def test_server_connection(
    *,
    db: AsyncSession = Depends(get_db),
    server_id: int,
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Test server connection.
    Only superusers can test server connections.
    """
    server = await server_crud.get(db=db, id=server_id)
    if not server:
        raise HTTPException(
            status_code=404,
            detail="Server not found"
        )
    
    is_connected = await server_crud.test_connection(db=db, server_id=server_id)
    return is_connected

@router.post("/{server_id}/update-load", response_model=bool)
async def update_server_load(
    *,
    db: AsyncSession = Depends(get_db),
    server_id: int,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Update server load information.
    """
    server = await server_crud.get(db=db, id=server_id)
    if not server:
        raise HTTPException(
            status_code=404,
            detail="Server not found"
        )
    
    success = await server_crud.update_server_load(db=db, server_id=server_id)
    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to update server load"
        )
    return success

@router.get("/{server_id}/health", response_model=Dict[str, Any])
async def get_server_health(
    *,
    db: AsyncSession = Depends(get_db),
    server_id: int,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get server health status and alerts.
    """
    server = await server_crud.get(db=db, id=server_id)
    if not server:
        raise HTTPException(
            status_code=404,
            detail="Server not found"
        )
    
    health = await monitor.check_server_health(db, server_id)
    return health

@router.get("/{server_id}/alerts", response_model=List[str])
async def get_server_alerts(
    *,
    db: AsyncSession = Depends(get_db),
    server_id: int,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get current server alerts.
    """
    server = await server_crud.get(db=db, id=server_id)
    if not server:
        raise HTTPException(
            status_code=404,
            detail="Server not found"
        )
    
    alerts = await monitor.get_system_alerts(db, server_id)
    return alerts

@router.get("/best", response_model=Server)
async def get_best_server(
    *,
    db: AsyncSession = Depends(get_db),
    required_traffic: Optional[int] = Query(None, description="Required traffic in bytes"),
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Get the best server for new user based on current load.
    Only superusers can access this endpoint.
    """
    server = await balancer.get_best_server(db, required_traffic)
    if not server:
        raise HTTPException(
            status_code=404,
            detail="No suitable server found"
        )
    return server

@router.get("/rebalance", response_model=List[Dict[str, Any]])
async def get_rebalance_suggestions(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Get suggestions for rebalancing users across servers.
    Only superusers can access this endpoint.
    """
    moves = await balancer.rebalance_if_needed(db)
    return moves

@router.post("/{server_id}/backup", response_model=Dict[str, Any])
async def create_server_backup(
    *,
    db: AsyncSession = Depends(get_db),
    server_id: int,
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Create server backup.
    Only superusers can create backups.
    """
    server = await server_crud.get(db=db, id=server_id)
    if not server:
        raise HTTPException(
            status_code=404,
            detail="Server not found"
        )
    
    result = await backup_manager.create_backup(db, server_id)
    if result.get("status") == "error":
        raise HTTPException(
            status_code=500,
            detail=result["message"]
        )
    return result

@router.post("/{server_id}/restore", response_model=Dict[str, Any])
async def restore_server_backup(
    *,
    db: AsyncSession = Depends(get_db),
    server_id: int,
    backup_file: str,
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Restore server from backup.
    Only superusers can restore backups.
    """
    server = await server_crud.get(db=db, id=server_id)
    if not server:
        raise HTTPException(
            status_code=404,
            detail="Server not found"
        )
    
    result = await backup_manager.restore_backup(db, server_id, backup_file)
    if result.get("status") == "error":
        raise HTTPException(
            status_code=500,
            detail=result["message"]
        )
    return result

@router.get("/{server_id}/backups", response_model=List[Dict[str, Any]])
async def list_server_backups(
    *,
    db: AsyncSession = Depends(get_db),
    server_id: int,
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    List available server backups.
    Only superusers can view backups.
    """
    server = await server_crud.get(db=db, id=server_id)
    if not server:
        raise HTTPException(
            status_code=404,
            detail="Server not found"
        )
    
    return await backup_manager.list_backups(server_id)

@router.get("/{server_id}/failover", response_model=Dict[str, Any])
async def get_server_failover_status(
    *,
    db: AsyncSession = Depends(get_db),
    server_id: int,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get server failover status.
    """
    server = await server_crud.get(db=db, id=server_id)
    if not server:
        raise HTTPException(
            status_code=404,
            detail="Server not found"
        )
    
    return await failover_manager.get_failover_status(db, server_id)

@router.post("/failover/start", response_model=Dict[str, str])
async def start_failover_monitoring(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Start failover monitoring.
    Only superusers can start monitoring.
    """
    await failover_manager.start_monitoring(db)
    return {"status": "Failover monitoring started"}

@router.post("/failover/stop", response_model=Dict[str, str])
async def stop_failover_monitoring(
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Stop failover monitoring.
    Only superusers can stop monitoring.
    """
    await failover_manager.stop_monitoring()
    return {"status": "Failover monitoring stopped"} 