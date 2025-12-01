from django.http import HttpResponse
from django.template.loader import render_to_string
import json


class HtmxAction:
    """
    Classe de base pour les actions HTMX.
    Chaque action représente un événement à déclencher via HX-Trigger.
    """

    def get_trigger_data(self):
        """Retourne un dict avec les données du trigger."""
        return {}

    def get_content(self):
        """Retourne le contenu HTML (None si pas de contenu)."""
        return None

    def get_raw_triggers(self):
        """Retourne une liste de triggers simples (sans data)."""
        return []

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

    Exemples:
        # Toast seul
        return ToastSuccess("Sauvegardé !")

        # Toast + fermeture de modal
        return ToastSuccess("OK !") + ModalClose("myModal")

        # Toast + contenu HTML pour swap
        return ToastSuccess("Supprimé !") + Content("")  # Supprime l'élément
        return ToastSuccess("Mis à jour !") + Content("<tr>...</tr>")

        # Toast + contenu depuis template
        return ToastSuccess("OK !") + Content("partials/row.html", {"item": item})

        # Avec triggers custom
        return ToastSuccess("OK !") + Content("") + Trigger("refreshList")
        return ToastSuccess("OK !") + Trigger(["refreshList", "updateCount"])
    """

    def __init__(self, actions=None, status=204, **kwargs):
        self.actions = actions or []

        # Collecter le contenu depuis les actions
        content = self._collect_content()

        # Utiliser status 200 dès qu'il y a du contenu OU des actions avec triggers
        # Le status 204 peut empêcher HTMX de traiter les headers HX-Trigger
        if status == 204 and (content is not None or self._has_triggers()):
            status = 200

        super().__init__(content or "", status=status, **kwargs)
        self._update_trigger_header()

        # Si pas de contenu explicite, dire à HTMX de ne pas faire de swap
        # Évite d'effacer le contenu de l'élément source (ex: formulaire)
        if content is None:
            self['HX-Reswap'] = 'none'

    def _has_triggers(self):
        """Vérifie si des actions génèrent des triggers."""
        for action in self.actions:
            if action.get_trigger_data() or action.get_raw_triggers():
                return True
        return False

    def _collect_content(self):
        """Récupère le contenu HTML depuis les actions."""
        for action in self.actions:
            content = action.get_content()
            if content is not None:
                return content
        return None

    def _update_trigger_header(self):
        """Met à jour le header HX-Trigger avec toutes les actions."""
        if not self.actions:
            return

        # Collecter les triggers avec data
        trigger_data = {}
        for action in self.actions:
            data = action.get_trigger_data()
            if data:
                trigger_data.update(data)

        # Collecter les triggers simples (sans data)
        raw_triggers = []
        for action in self.actions:
            raw_triggers.extend(action.get_raw_triggers())

        # Construire le header HX-Trigger
        if trigger_data or raw_triggers:
            # Si on a des triggers avec data, on doit utiliser le format JSON
            if trigger_data:
                # Ajouter les triggers simples avec une valeur vide
                for trigger in raw_triggers:
                    if trigger not in trigger_data:
                        trigger_data[trigger] = {}
                self['HX-Trigger'] = json.dumps(trigger_data)
            else:
                # Uniquement des triggers simples, format compact
                self['HX-Trigger'] = ", ".join(raw_triggers)

    def add(self, action):
        """Ajoute une action à la réponse."""
        self.actions.append(action)
        self._update_trigger_header()
        # Mettre à jour le contenu si nécessaire
        content = action.get_content()
        if content is not None:
            self.content = content
            if self.status_code == 204:
                self.status_code = 200
        return self

    def __add__(self, other):
        """Permet de combiner des réponses/actions avec l'opérateur +"""
        if isinstance(other, HtmxAction):
            return HtmxResponse(actions=self.actions + [other], status=self.status_code)
        elif isinstance(other, HtmxResponse):
            return HtmxResponse(actions=self.actions + other.actions, status=self.status_code)
        raise TypeError(f"Cannot add HtmxResponse with {type(other)}")


# =============================================================================
# Action Content (HTML pour swap)
# =============================================================================

class ContentAction(HtmxAction):
    """
    Action pour définir le contenu HTML de la réponse.
    Permet le swap HTMX (innerHTML, outerHTML, etc.)
    """

    def __init__(self, content_or_template, context=None):
        """
        Args:
            content_or_template: Soit une string HTML directe, soit un chemin de template
            context: Si fourni, content_or_template est traité comme un template Django
        """
        if context is not None:
            # C'est un template à rendre
            self._content = render_to_string(content_or_template, context)
        else:
            # C'est du HTML direct
            self._content = content_or_template

    def get_content(self):
        return self._content


# =============================================================================
# Action Trigger (événements HTMX custom)
# =============================================================================

class TriggerAction(HtmxAction):
    """
    Action pour déclencher des événements HTMX custom.
    Ces événements peuvent être écoutés avec hx-trigger="eventName from:body"
    """

    def __init__(self, triggers):
        """
        Args:
            triggers: Un nom d'événement (str) ou une liste de noms
        """
        if isinstance(triggers, str):
            self._triggers = [triggers]
        else:
            self._triggers = list(triggers)

    def get_raw_triggers(self):
        return self._triggers


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


class ModalOpenAction(HtmxAction):
    """Action pour ouvrir un modal."""

    def __init__(self, modal_id):
        self.modal_id = modal_id

    def get_trigger_data(self):
        return {"modalOpen": {"id": self.modal_id}}


# =============================================================================
# Fonctions de commodité (API simplifiée)
# =============================================================================

def Content(content_or_template, context=None):
    """
    Crée une action de contenu HTML pour le swap HTMX.

    Args:
        content_or_template: HTML direct ou chemin de template Django
        context: Contexte pour le template (si fourni, traite le premier arg comme template)

    Exemples:
        Content("")  # Supprime l'élément ciblé
        Content("<tr>...</tr>")  # Remplace par ce HTML
        Content("partials/row.html", {"item": item})  # Render un template
    """
    return ContentAction(content_or_template, context).to_response()


def Trigger(triggers):
    """
    Crée une action pour déclencher des événements HTMX custom.

    Args:
        triggers: Un nom d'événement ou une liste de noms

    Exemples:
        Trigger("refreshList")
        Trigger(["refreshList", "updateCount"])

    Côté client, écouter avec:
        hx-trigger="refreshList from:body"
    """
    return TriggerAction(triggers).to_response()


def Toast(content, variant="info", **kwargs):
    """
    Crée une réponse HTTP avec un toast HTMX.

    Args:
        content (str): Le contenu du message toast
        variant (str): Le type de toast ("success", "error", "warning", "info")
        **kwargs: Arguments supplémentaires pour le toast

    Exemple:
        return Toast("Opération réussie !", variant="success")
    """
    return ToastAction(content, variant, **kwargs).to_response()


def ToastSuccess(content, **kwargs):
    """
    Crée un toast de succès.

    Exemples:
        return ToastSuccess("Sauvegardé !")
        return ToastSuccess("OK !") + ModalClose("myModal")
        return ToastSuccess("Supprimé !") + Content("")
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

    Exemples:
        return ModalClose("myModal")
        return ModalClose("myModal", reset_form=True)
        return ToastSuccess("OK !") + ModalClose("myModal")
    """
    return ModalCloseAction(modal_id, reset_form=reset_form).to_response()


def ModalOpen(modal_id):
    """
    Crée une réponse HTTP pour ouvrir un modal.

    Args:
        modal_id (str): L'ID du modal à ouvrir

    Exemples:
        return ModalOpen("confirmModal")
        return ToastInfo("Veuillez confirmer") + ModalOpen("confirmModal")
    """
    return ModalOpenAction(modal_id).to_response()
