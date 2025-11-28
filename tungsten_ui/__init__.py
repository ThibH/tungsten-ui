"""
Tungsten UI - Une librairie de composants Django avec Cotton, HTMX et Alpine.js
"""

__version__ = "0.1.0"
__author__ = "Your Name"
__email__ = "your.email@example.com"

default_app_config = "tungsten_ui.apps.TungstenUIConfig"

# Importer les utilitaires pour les rendre facilement accessibles
from .utils import Toast, ToastSuccess, ToastError, ToastWarning, ToastInfo

__all__ = [
    'Toast',
    'ToastSuccess', 
    'ToastError',
    'ToastWarning',
    'ToastInfo',
]