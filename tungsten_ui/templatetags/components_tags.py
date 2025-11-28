from django import template

register = template.Library()

@register.filter
def to_range(value):
    """
    Convertit un nombre en objet range pour pouvoir faire des boucles for dans les templates.
    
    Utilisation dans un template :
    {% load components_tags %}
    {% for i in max|to_range %}
        <!-- Code ici -->
    {% endfor %}
    """
    try:
        return range(int(value) + 1)
    except (ValueError, TypeError):
        return range(0) 
    
@register.filter
def to_dict(value):
    """
    Convertit un objet en dictionnaire pour pouvoir l'afficher dans le template.
    """
    return str(value.__dict__)