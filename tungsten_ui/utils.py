from django.http import HttpResponse
import json


class HtmxAction:
    """
    Classe de base pour les actions HTMX.
    Chaque action représente un événement à déclencher via HX-Trigger.
    """

    def get_trigger_data(self):
        """Retourne un dict avec les données du trigger."""
        raise NotImplementedError

    def __add__(self, other):
        """Permet de combiner des actions avec l'opérateur +"""
        if isinstance(other, HtmxAction):
            return HtmxResponse(actions=[self, other])
        elif isinstance(other, HtmxResponse):
            return HtmxResponse(actions=[self] + other.actions)
        raise TypeError(f"Cannot add HtmxAction with {type(other)}")

    def __radd__(self, other):
        """Support pour other + self"""
        if isinstance(other, HtmxResponse):
            return HtmxResponse(actions=other.actions + [self])
        raise TypeError(f"Cannot add {type(other)} with HtmxAction")

    def to_response(self, status=204):
        """Convertit l'action en HttpResponse."""
        return HtmxResponse(actions=[self], status=status)

    # Permet d'utiliser directement l'action comme réponse Django
    def __class_getitem__(cls, item):
        return cls


class HtmxResponse(HttpResponse):
    """
    Réponse HTTP avec support pour plusieurs actions HTMX combinées.

    Exemple:
        return HtmxResponse(actions=[ToastAction("Succès!", "success"), ModalCloseAction("myModal")])

    Ou plus simplement avec l'opérateur +:
        return ToastSuccess("Succès!") + ModalClose("myModal")
    """

    def __init__(self, actions=None, status=204, **kwargs):
        super().__init__("", status=status, **kwargs)
        self.actions = actions or []
        self._update_trigger_header()

    def _update_trigger_header(self):
        """Met à jour le header HX-Trigger avec toutes les actions."""
        if not self.actions:
            return

        trigger_data = {}
        for action in self.actions:
            trigger_data.update(action.get_trigger_data())

        self['HX-Trigger'] = json.dumps(trigger_data)

    def add(self, action):
        """Ajoute une action à la réponse."""
        self.actions.append(action)
        self._update_trigger_header()
        return self

    def __add__(self, other):
        """Permet de combiner des réponses/actions avec l'opérateur +"""
        if isinstance(other, HtmxAction):
            return HtmxResponse(actions=self.actions + [other], status=self.status_code)
        elif isinstance(other, HtmxResponse):
            return HtmxResponse(actions=self.actions + other.actions, status=self.status_code)
        raise TypeError(f"Cannot add HtmxResponse with {type(other)}")


# =============================================================================
# Actions Toast
# =============================================================================

class ToastAction(HtmxAction):
    """Action pour afficher un toast."""

    def __init__(self, content, variant="info", **kwargs):
        self.content = content
        self.variant = variant
        self.extra = kwargs

    def get_trigger_data(self):
        return {
            "toast": {
                "content": self.content,
                "type": self.variant,
                **self.extra
            }
        }


class ToastSuccessAction(ToastAction):
    """Action toast de succès."""
    def __init__(self, content, **kwargs):
        super().__init__(content, variant="success", **kwargs)


class ToastErrorAction(ToastAction):
    """Action toast d'erreur."""
    def __init__(self, content, **kwargs):
        super().__init__(content, variant="error", **kwargs)


class ToastWarningAction(ToastAction):
    """Action toast d'avertissement."""
    def __init__(self, content, **kwargs):
        super().__init__(content, variant="warning", **kwargs)


class ToastInfoAction(ToastAction):
    """Action toast d'information."""
    def __init__(self, content, **kwargs):
        super().__init__(content, variant="info", **kwargs)


# =============================================================================
# Actions Modal
# =============================================================================

class ModalCloseAction(HtmxAction):
    """Action pour fermer un modal."""

    def __init__(self, modal_id, reset_form=False):
        self.modal_id = modal_id
        self.reset_form = reset_form

    def get_trigger_data(self):
        data = {"id": self.modal_id}
        if self.reset_form:
            data["resetForm"] = True
        return {"modalClose": data}


# =============================================================================
# Fonctions de commodité (API simplifiée)
# =============================================================================

def Toast(content, variant="info", status=204, **kwargs):
    """
    Crée une réponse HTTP avec un toast HTMX.

    Args:
        content (str): Le contenu du message toast
        variant (str): Le type de toast ("success", "error", "warning", "info")
        status (int): Le code de statut HTTP (par défaut 204)
        **kwargs: Arguments supplémentaires pour le toast

    Returns:
        HtmxResponse: Une réponse HTTP avec le header HX-Trigger approprié

    Exemple:
        return Toast(content="Opération réussie !", variant="success")
    """
    return ToastAction(content, variant, **kwargs).to_response(status=status)


def ToastSuccess(content, **kwargs):
    """
    Crée un toast de succès.

    Peut être utilisé seul ou combiné avec d'autres actions:
        return ToastSuccess("Sauvegardé !")
        return ToastSuccess("Sauvegardé !") + ModalClose("myModal")
    """
    return ToastSuccessAction(content, **kwargs).to_response()


def ToastError(content, **kwargs):
    """Crée un toast d'erreur."""
    return ToastErrorAction(content, **kwargs).to_response()


def ToastWarning(content, **kwargs):
    """Crée un toast d'avertissement."""
    return ToastWarningAction(content, **kwargs).to_response()


def ToastInfo(content, **kwargs):
    """Crée un toast d'information."""
    return ToastInfoAction(content, **kwargs).to_response()


def ModalClose(modal_id, reset_form=False):
    """
    Crée une réponse HTTP pour fermer un modal.

    Args:
        modal_id (str): L'ID du modal à fermer
        reset_form (bool): Si True, reset le formulaire contenu dans le modal

    Returns:
        HtmxResponse: Une réponse HTTP avec le header HX-Trigger approprié

    Exemple:
        return ModalClose("myModal")
        return ModalClose("myModal", reset_form=True)
        return ToastSuccess("Formulaire validé !") + ModalClose("myModal", reset_form=True)
    """
    return ModalCloseAction(modal_id, reset_form=reset_form).to_response()
