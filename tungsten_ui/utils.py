from django.http import HttpResponse
import json


def Toast(content, variant="info", status=204, **kwargs):
    """
    Utilitaire pour créer facilement des réponses de toast HTMX.
    
    Args:
        content (str): Le contenu du message toast
        variant (str): Le type de toast ("success", "error", "warning", "info")
        status (int): Le code de statut HTTP (par défaut 204)
        **kwargs: Arguments supplémentaires pour le toast
    
    Returns:
        HttpResponse: Une réponse HTTP avec le header HX-Trigger approprié
    
    Exemple:
        return Toast(content="Opération réussie !", variant="success")
    """
    # Préparer les données du toast
    toast_data = {
        "content": content,
        "type": variant,
        **kwargs
    }
    
    # Créer la réponse HTTP
    response = HttpResponse("", status=status)
    
    # Ajouter le header HX-Trigger avec les données du toast
    response['HX-Trigger'] = json.dumps({
        "toast": toast_data
    })
    
    return response


def ToastSuccess(content, **kwargs):
    """Raccourci pour créer un toast de succès."""
    return Toast(content=content, variant="success", **kwargs)


def ToastError(content, **kwargs):
    """Raccourci pour créer un toast d'erreur."""
    return Toast(content=content, variant="error", **kwargs)


def ToastWarning(content, **kwargs):
    """Raccourci pour créer un toast d'avertissement."""
    return Toast(content=content, variant="warning", **kwargs)


def ToastInfo(content, **kwargs):
    """Raccourci pour créer un toast d'information."""
    return Toast(content=content, variant="info", **kwargs) 