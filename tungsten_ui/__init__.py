"""
Tungsten UI - Une librairie de composants Django avec Cotton, HTMX et Alpine.js
"""

__version__ = "0.1.1"
__author__ = "Thibault HOUDON"
__email__ = "support@docstring.fr"

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