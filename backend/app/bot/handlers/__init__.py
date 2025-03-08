"""
Bot command handlers initialization
"""

from .admin import register_admin_handlers
from .user import register_user_handlers
from .server import register_server_handlers
from .subscription import register_subscription_handlers

def register_all_handlers(application):
    """Register all bot command handlers"""
    register_admin_handlers(application)
    register_user_handlers(application)
    register_server_handlers(application)
    register_subscription_handlers(application) 